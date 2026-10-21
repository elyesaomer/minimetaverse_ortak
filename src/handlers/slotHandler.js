// src/handlers/slotHandler.js - ⚡ Dedenin Şimşek Slotu 777 ⚡ Sunucu Mantığı
const dataManager = require('../dataManager');
const { checkRateLimit } = require('../utils/securityUtils');

const SYMBOL_WEIGHTS = [
    { id: 'cherry', icon: '🍒', name: 'Kiraz', weight: 32 },
    { id: 'lemon', icon: '🍋', name: 'Limon', weight: 15 },
    { id: 'grape', icon: '🍇', name: 'Üzüm', weight: 18 },
    { id: 'watermelon', icon: '🍉', name: 'Karpuz', weight: 14 },
    { id: 'bell', icon: '🔔', name: 'Çan', weight: 9 },
    { id: 'diamond', icon: '💎', name: 'Elmas', weight: 6 },
    { id: 'seven', icon: '7️⃣', name: 'Yedi 777', weight: 6 }
];

const ALLOWED_BETS = [10, 25, 50, 100, 250, 500, 1000];

function getRandomSymbol() {
    let totalWeight = SYMBOL_WEIGHTS.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let s of SYMBOL_WEIGHTS) {
        if (rand < s.weight) return s.id;
        rand -= s.weight;
    }
    return SYMBOL_WEIGHTS[0].id;
}

function evaluateSlotSpin(reels, betAmount) {
    let [r1, r2, r3] = reels;
    let multiplier = 0;
    let isJackpot = false;
    let winType = '';

    // 1. Üçlü Eşleşmeler
    if (r1 === r2 && r2 === r3) {
        switch (r1) {
            case 'seven':
                multiplier = 50;
                isJackpot = true;
                winType = '⚡ MEGA 777 JACKPOT! ⚡';
                break;
            case 'diamond':
                multiplier = 25;
                winType = '💎 ELMAS ZAFERİ! 💎';
                break;
            case 'bell':
                multiplier = 15;
                winType = '🔔 ALTIN ÇANLAR! 🔔';
                break;
            case 'watermelon':
                multiplier = 10;
                winType = '🍉 TATLI KARPUZ! 🍉';
                break;
            case 'grape':
                multiplier = 7;
                winType = '🍇 TAZE ÜZÜM! 🍇';
                break;
            case 'lemon':
                multiplier = 5;
                winType = '🍋 EKŞİ LİMON! 🍋';
                break;
            case 'cherry':
                multiplier = 4;
                winType = '🍒 3x KİRAZ! 🍒';
                break;
        }
    } else {
        // 2. Kiraz Bonusları (Herhangi 2 veya 1 Kiraz)
        let cherryCount = reels.filter(r => r === 'cherry').length;
        if (cherryCount === 2) {
            multiplier = 2;
            winType = '🍒 2x Kiraz Tesellisi';
        } else if (cherryCount === 1) {
            multiplier = 1;
            winType = '🍒 1x Kiraz İadesi';
        }
    }

    let winAmount = betAmount * multiplier;
    return {
        multiplier,
        winAmount,
        netWin: winAmount - betAmount,
        isJackpot,
        winType
    };
}

function registerSlotHandlers(io, socket, players) {
    // 1. Slot Bilgisi
    socket.on('slot_init', () => {
        socket.emit('slot_info', {
            allowedBets: ALLOWED_BETS,
            symbols: SYMBOL_WEIGHTS.map(s => ({ id: s.id, icon: s.icon, name: s.name }))
        });
    });

    // 2. Çevirme (Spin)
    socket.on('slot_spin', (data) => {
        if (!players[socket.id] || !data) {
            socket.emit('slot_error', 'Geçersiz slot çevirme isteği.');
            return;
        }

        if (!checkRateLimit(socket, 'slot_spin', 1, 1000)) {
            socket.emit('slot_error', 'Lütfen çarkın durmasını bekleyin.');
            return;
        }

        let betAmount = parseInt(data.betAmount, 10);
        if (isNaN(betAmount) || betAmount < 1 || betAmount > 10000000) {
            socket.emit('slot_error', 'Geçersiz bahis miktarı. Lütfen geçerli bir miktar girin.');
            return;
        }

        let username = players[socket.id].name;
        let userData = dataManager.persistentData.users[username];
        if (!userData) {
            socket.emit('slot_error', 'Kullanıcı verisi bulunamadı.');
            return;
        }

        if (userData.money < betAmount) {
            socket.emit('slot_error', `Yetersiz bakiye! Bahis: ${betAmount.toLocaleString('tr-TR')} TL, Bakiyeniz: ${userData.money.toLocaleString('tr-TR')} TL.`);
            return;
        }

        // Bahsi düş
        userData.money -= betAmount;

        // 3 Çarkı Belirle
        let reels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
        let evalResult = evaluateSlotSpin(reels, betAmount);

        // Kazanç varsa ekle
        if (evalResult.winAmount > 0) {
            userData.money += evalResult.winAmount;
        }

        // Ev Sahibi %5 Komisyon Mantığı (Yalnızca oyuncu evindeki slot makinesinde ve başkası oynuyorsa)
        let curRoom = (players[socket.id] && players[socket.id].room) ? players[socket.id].room : 'dedenin_yeri';
        let parsed = dataManager.parseHouseRoom(curRoom);
        let houseOwnerKey = (parsed && parsed.owner) ? parsed.owner : null;

        let commission = 0;
        if (houseOwnerKey && houseOwnerKey.toLowerCase() !== username.toLowerCase()) {
            // Her çevirilen bahisten ev sahibine %5 kar
            commission = Math.max(1, Math.round(betAmount * 0.05));
            let ownerKeyClean = dataManager.findUserKey(houseOwnerKey) || houseOwnerKey;
            let ownerData = dataManager.persistentData.users[ownerKeyClean];
            if (ownerData) {
                ownerData.money = (ownerData.money || 0) + commission;
                // Ev sahibi online ise anlık bakiye güncelle ve bildirim gönder
                let ownerSocketId = Object.keys(players).find(sid => players[sid].name && players[sid].name.toLowerCase() === ownerKeyClean.toLowerCase());
                if (ownerSocketId) {
                    players[ownerSocketId].money = ownerData.money;
                    io.to(ownerSocketId).emit('moneyUpdate', ownerData.money);
                    io.to(ownerSocketId).emit('systemMessage', `🎰 Evindeki Slot Makinesinden +${commission.toLocaleString('tr-TR')} TL (%5 komisyon) kazandın! (Oynayan: ${username})`);
                    io.to(ownerSocketId).emit('toastNotification', {
                        icon: '🎰',
                        title: 'Slot Geliri!',
                        desc: `Evindeki Slot Makinesinden +${commission.toLocaleString('tr-TR')} TL (%5 komisyon) kazandın! (${username})`
                    });
                }
            }
        }

        players[socket.id].money = userData.money;
        dataManager.savePersistentData();

        // İstemciye sonucu gönder
        socket.emit('moneyUpdate', userData.money);
        socket.emit('slot_result', {
            reels,
            betAmount,
            winAmount: evalResult.winAmount,
            multiplier: evalResult.multiplier,
            netWin: evalResult.netWin,
            isJackpot: evalResult.isJackpot,
            winType: evalResult.winType,
            newBalance: userData.money,
            commissionPaid: commission,
            houseOwner: houseOwnerKey
        });

        // Jackpot kazanıldıysa mekandaki herkese (room) yayınla (broadcast)
        if (evalResult.isJackpot) {
            let currentRoom = (players[socket.id] && players[socket.id].room) ? players[socket.id].room : 'dedenin_yeri';
            let locText = houseOwnerKey ? `${houseOwnerKey}'in Evindeki Slot Makinesinde` : "777 Slotunda";
            io.to(currentRoom).emit('systemMessage', `⚡🎰 BÜYÜK JACKPOT! ${username} ${locText} tam ${evalResult.winAmount} TL KAZANDI! 🎰⚡`);
            io.to(currentRoom).emit('global_jackpot_win', {
                winner: username,
                winAmount: evalResult.winAmount,
                multiplier: evalResult.multiplier,
                room: currentRoom
            });
        }
    });

    // Geliştirici & Test Amaçlı Global Jackpot Test Tetikleyicisi
    socket.on('dev_test_slot_jackpot', (data) => {
        let username = (players[socket.id] && players[socket.id].name) || 'TestOyuncu';
        let currentRoom = (players[socket.id] && players[socket.id].room) || 'dedenin_yeri';
        let winAmount = (data && data.winAmount) || 50000;
        io.to(currentRoom).emit('systemMessage', `⚡🎰 BÜYÜK JACKPOT! ${username} 777 Slotunda tam ${winAmount} TL KAZANDI! 🎰⚡`);
        io.to(currentRoom).emit('global_jackpot_win', {
            winner: username,
            winAmount: winAmount,
            multiplier: 50,
            room: currentRoom
        });
    });
}

module.exports = {
    registerSlotHandlers,
    evaluateSlotSpin,
    getRandomSymbol,
    SYMBOL_WEIGHTS,
    ALLOWED_BETS
};

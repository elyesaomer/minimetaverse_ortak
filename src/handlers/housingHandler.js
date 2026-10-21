// src/handlers/housingHandler.js - Konut Satın Alma, Mobilya Alımı ve Dekorasyon Yöneticisi
const mongoose = require('mongoose');
const config = require('../config');
const dataManager = require('../dataManager');
const User = require('../models/User');
const { checkRateLimit } = require('../utils/securityUtils');

function registerHousingHandlers(io, socket, players) {
    // 1. EV SATIN ALMA
    socket.on('buyHouse', (houseType) => {
        if (!players[socket.id]) return;
        if (!checkRateLimit(socket, 'buyHouse', 3, 5000)) return;
        let username = players[socket.id].name;
        let uKey = dataManager.findUserKey(username) || username;
        let uData = dataManager.persistentData.users[uKey];
        if (!uData) return;

        let price = config.HOUSE_PRICES[houseType];
        if (!price) {
            socket.emit('gameError', "Geçersiz ev tipi!");
            return;
        }

        if (!uData.houses) uData.houses = {};
        if (uData.house && uData.house.type && !uData.houses[uData.house.type]) {
            uData.houses[uData.house.type] = uData.house;
        }

        if (uData.houses[houseType]) {
            socket.emit('gameError', "Zaten bu tip bir eve sahipsiniz!");
            return;
        }
        if (uData.money < price) {
            socket.emit('gameError', `Bu ev ${price} TL! Bakiyeniz: ${uData.money} TL.`);
            return;
        }

        uData.money -= price;
        players[socket.id].money = uData.money;
        uData.houses[houseType] = {
            type: houseType,
            furniture: []
        };
        uData.house = uData.houses[houseType];
        dataManager.savePersistentData();

        let houseName = config.HOUSE_NAMES[houseType] || houseType;
        socket.emit('moneyUpdate', uData.money);
        socket.emit('housesUpdate', uData.houses);
        socket.emit('houseDataUpdate', {
            ...uData.houses[houseType],
            owner: uKey,
            type: houseType,
            houseId: `${uKey}_${houseType}`
        });
        socket.emit('systemMessage', `🏠 Tebrikler! ${houseName} tipi yeni evinizi satın aldınız!`);
    });

    // 2. MOBİLYA SATIN ALMA
    socket.on('buyFurniture', (itemId) => {
        if (!players[socket.id]) return;
        if (!checkRateLimit(socket, 'buyFurniture', 10, 3000)) return;
        let username = players[socket.id].name;
        let uKey = dataManager.findUserKey(username) || username;
        let uData = dataManager.persistentData.users[uKey];
        if (!uData) return;

        let cost = config.FURNITURE_PRICES[itemId];
        if (!cost) {
            socket.emit('gameError', "Geçersiz mobilya!");
            return;
        }
        if (uData.money < cost) {
            socket.emit('gameError', `Bu mobilya ${cost} TL! Bakiyeniz: ${uData.money} TL.`);
            return;
        }

        uData.money -= cost;
        players[socket.id].money = uData.money;
        if (!uData.furnitureInventory) uData.furnitureInventory = [];
        uData.furnitureInventory.push(itemId);
        dataManager.savePersistentData();

        socket.emit('moneyUpdate', uData.money);
        socket.emit('furnitureInventoryUpdate', uData.furnitureInventory);
        socket.emit('furnitureBuySuccess', {
            itemId: itemId,
            cost: cost,
            remainingMoney: uData.money
        });
        socket.emit('systemMessage', `🛒 Mobilya satın alındı! Evinize gidip yerleştirebilirsiniz.`);
    });

    // 3. MOBİLYA YERLEŞTİRME
    socket.on('placeFurniture', (data) => {
        if (!players[socket.id] || !data || !data.itemId) return;
        if (!checkRateLimit(socket, 'placeFurniture', 10, 3000)) return;
        let username = players[socket.id].name;
        let uKey = dataManager.findUserKey(username) || username;
        let uData = dataManager.persistentData.users[uKey];
        if (!uData) return;

        let parsed = dataManager.parseHouseRoom(players[socket.id].room);
        if (!parsed || parsed.owner.toLowerCase() !== uKey.toLowerCase()) {
            socket.emit('gameError', "Mobilyaları sadece kendi evinizde yerleştirebilirsiniz!");
            return;
        }

        if (!uData.houses) uData.houses = {};
        let hType = parsed.houseType || (uData.house ? uData.house.type : 'standart');
        if (!uData.houses[hType]) {
            uData.houses[hType] = (uData.house && uData.house.type === hType) ? uData.house : { type: hType, furniture: [] };
        }
        let targetHouse = uData.houses[hType];

        let idx = (uData.furnitureInventory || []).indexOf(data.itemId);
        if (idx === -1) {
            socket.emit('gameError', "Envanterinizde bu mobilya kalmadı!");
            return;
        }

        uData.furnitureInventory.splice(idx, 1);
        if (!targetHouse.furniture) targetHouse.furniture = [];

        let safeX = Math.max(-500, Math.min(2500, Number.isFinite(Number(data.x)) ? Math.round(Number(data.x)) : 400));
        let safeY = Math.max(-500, Math.min(2500, Number.isFinite(Number(data.y)) ? Math.round(Number(data.y)) : 300));
        let safeRot = Number.isFinite(Number(data.rotation)) ? Math.round(Number(data.rotation)) % 4 : 0;

        targetHouse.furniture.push({
            id: String(data.itemId),
            x: safeX,
            y: safeY,
            rotation: safeRot
        });
        uData.house = targetHouse;
        dataManager.savePersistentData();

        socket.emit('furnitureInventoryUpdate', uData.furnitureInventory);
        io.to(players[socket.id].room).emit('houseFurnitureSync', targetHouse.furniture);
        socket.emit('systemMessage', `🛋️ Mobilya odaya yerleştirildi!`);
    });

    // 4. MOBİLYA TAŞIMA
    socket.on('moveFurniture', (data) => {
        if (!players[socket.id] || !data || data.index === undefined) return;
        if (!checkRateLimit(socket, 'moveFurniture', 25, 2000)) return;
        let username = players[socket.id].name;
        let uKey = dataManager.findUserKey(username) || username;
        let uData = dataManager.persistentData.users[uKey];
        if (!uData) return;

        let parsed = dataManager.parseHouseRoom(players[socket.id].room);
        if (!parsed || parsed.owner.toLowerCase() !== uKey.toLowerCase()) return;

        if (!uData.houses) uData.houses = {};
        let hType = parsed.houseType || (uData.house ? uData.house.type : 'standart');
        let targetHouse = uData.houses[hType] || uData.house;
        if (!targetHouse || !targetHouse.furniture) return;

        let index = parseInt(data.index, 10);
        if (index >= 0 && index < targetHouse.furniture.length) {
            let safeX = Math.max(-500, Math.min(2500, Number.isFinite(Number(data.x)) ? Math.round(Number(data.x)) : targetHouse.furniture[index].x));
            let safeY = Math.max(-500, Math.min(2500, Number.isFinite(Number(data.y)) ? Math.round(Number(data.y)) : targetHouse.furniture[index].y));
            targetHouse.furniture[index].x = safeX;
            targetHouse.furniture[index].y = safeY;
            if (data.rotation !== undefined && Number.isFinite(Number(data.rotation))) {
                targetHouse.furniture[index].rotation = parseInt(data.rotation, 10) % 4;
            }
            uData.house = targetHouse;
            dataManager.savePersistentData();

            io.to(players[socket.id].room).emit('houseFurnitureSync', targetHouse.furniture);
        }
    });

    // 4.1 MOBİLYA DÖNDÜRME (90 DERECE ÇEVİRME)
    socket.on('rotateFurniture', (data) => {
        if (!players[socket.id] || !data || data.index === undefined) return;
        if (!checkRateLimit(socket, 'rotateFurniture', 20, 2000)) return;
        let username = players[socket.id].name;
        let uKey = dataManager.findUserKey(username) || username;
        let uData = dataManager.persistentData.users[uKey];
        if (!uData) return;

        let parsed = dataManager.parseHouseRoom(players[socket.id].room);
        if (!parsed || parsed.owner.toLowerCase() !== uKey.toLowerCase()) return;

        if (!uData.houses) uData.houses = {};
        let hType = parsed.houseType || (uData.house ? uData.house.type : 'standart');
        let targetHouse = uData.houses[hType] || uData.house;
        if (!targetHouse || !targetHouse.furniture) return;

        let index = parseInt(data.index, 10);
        if (index >= 0 && index < targetHouse.furniture.length) {
            let curItem = targetHouse.furniture[index];
            let curRot = (typeof curItem.rotation === 'number') ? curItem.rotation : 0;
            let newRot = (data.rotation !== undefined && Number.isFinite(Number(data.rotation))) ? (parseInt(data.rotation, 10) % 4) : ((curRot + 1) % 4);
            if (newRot < 0) newRot += 4;
            let facingList = ['front-right', 'front-left', 'back-left', 'back-right'];
            let newFacing = (data.facing !== undefined) ? String(data.facing) : facingList[newRot];
            
            curItem.rotation = newRot;
            curItem.facing = newFacing;
            uData.house = targetHouse;
            dataManager.savePersistentData();

            io.to(players[socket.id].room).emit('houseFurnitureSync', targetHouse.furniture);
        }
    });

    // 5. MOBİLYA KALDIRMA
    socket.on('removeFurniture', (index) => {
        if (!players[socket.id]) return;
        if (!checkRateLimit(socket, 'removeFurniture', 15, 2000)) return;
        let username = players[socket.id].name;
        let uKey = dataManager.findUserKey(username) || username;
        let uData = dataManager.persistentData.users[uKey];
        if (!uData) return;

        let parsed = dataManager.parseHouseRoom(players[socket.id].room);
        if (!parsed || parsed.owner.toLowerCase() !== uKey.toLowerCase()) return;

        if (!uData.houses) uData.houses = {};
        let hType = parsed.houseType || (uData.house ? uData.house.type : 'standart');
        let targetHouse = uData.houses[hType] || uData.house;
        if (!targetHouse || !targetHouse.furniture) return;

        let idx = parseInt(index, 10);
        if (idx >= 0 && idx < targetHouse.furniture.length) {
            let removed = targetHouse.furniture.splice(idx, 1)[0];
            if (!uData.furnitureInventory) uData.furnitureInventory = [];
            uData.furnitureInventory.push(removed.id);
            uData.house = targetHouse;
            dataManager.savePersistentData();

            socket.emit('furnitureInventoryUpdate', uData.furnitureInventory);
            io.to(players[socket.id].room).emit('houseFurnitureSync', targetHouse.furniture);
            socket.emit('systemMessage', `📦 Mobilya kaldırılıp depoya geri alındı.`);
        }
    });

    // 6. EV VERİSİ SORGULAMA (KAPI KİLİDİ KONTROLLÜ)
    socket.on('getHouseData', (data) => {
        let rawTarget = typeof data === 'object' && data ? data.owner : data;
        rawTarget = (rawTarget || players[socket.id]?.name || "").trim();
        let targetUser = dataManager.findUserKey(rawTarget) || rawTarget;
        let tData = dataManager.persistentData.users[targetUser];
        let reqType = typeof data === 'object' && data ? data.type : null;

        let myName = players[socket.id]?.name || "";
        let isOwner = (myName.toLowerCase() === targetUser.toLowerCase());

        if (tData) {
            let targetHouse = null;
            if (tData.houses && reqType && tData.houses[reqType]) {
                targetHouse = tData.houses[reqType];
            } else if (tData.houses && Object.keys(tData.houses).length > 0) {
                reqType = reqType || Object.keys(tData.houses)[0];
                targetHouse = tData.houses[reqType] || Object.values(tData.houses)[0];
            } else if (tData.house) {
                targetHouse = tData.house;
                reqType = reqType || tData.house.type;
            }

            if (targetHouse) {
                let housePrivacy = targetHouse.privacy || 'public'; // Varsayılan: Herkese açık

                // Kapı Kilidi Kontrolü
                if (!isOwner) {
                    if (housePrivacy === 'locked') {
                        socket.emit('gameError', "🔒 Bu evin kapısı kilitli! Yalnızca ev sahibi girebilir.");
                        return;
                    }
                    if (housePrivacy === 'friends') {
                        let isFriend = (tData.friends || []).some(f => {
                            let fName = typeof f === 'string' ? f : (f ? f.username : '');
                            return fName.toLowerCase() === myName.toLowerCase();
                        });
                        if (!isFriend) {
                            socket.emit('gameError', "👥 Bu ev yalnızca arkadaşlara açık!");
                            return;
                        }
                    }
                }

                socket.emit('houseDataUpdate', {
                    ...targetHouse,
                    owner: targetUser,
                    type: reqType || targetHouse.type || 'standart',
                    privacy: housePrivacy,
                    houseId: `${targetUser}_${reqType || targetHouse.type}`
                });
                return;
            }
        }
        socket.emit('houseDataUpdate', null);
    });

    // 6.1 EV KAPI KİLİDİ AYARLAMA (HERKESE AÇIK / ARKADAŞLAR / KİLİTLİ)
    socket.on('setHousePrivacy', (data) => {
        if (!players[socket.id] || !data || !data.privacy) return;
        let username = players[socket.id].name;
        let uKey = dataManager.findUserKey(username) || username;
        let uData = dataManager.persistentData.users[uKey];
        if (!uData) return;

        let hType = data.type || (uData.house ? uData.house.type : 'standart');
        if (!uData.houses) uData.houses = {};
        let targetHouse = uData.houses[hType] || uData.house;
        if (!targetHouse) return;

        const allowed = ['public', 'friends', 'locked'];
        if (!allowed.includes(data.privacy)) return;

        targetHouse.privacy = data.privacy;
        uData.houses[hType] = targetHouse;
        uData.house = targetHouse;
        dataManager.savePersistentData();

        socket.emit('housePrivacyUpdated', { type: hType, privacy: data.privacy });
        let privLabel = data.privacy === 'public' ? '🌐 Herkese Açık (Mahalledeki herkes gelebilir)' : (data.privacy === 'locked' ? '🔒 Kilitli (Sadece Sen)' : '👥 Yalnızca Arkadaşlar');
        socket.emit('systemMessage', `🚪 Ev kapı kilidi güncellendi: ${privLabel}`);
        io.to(players[socket.id].room).emit('housePrivacySync', { privacy: data.privacy });
    });

    // 6.2 GRAMOFON MÜZİK ÇALARI (SADECE EV SAHİBİ ÇALABİLİR)
    let gramophonePlayingRooms = {};
    socket.on('toggleGramophone', () => {
        if (!players[socket.id]) return;
        let username = players[socket.id].name;
        let uKey = dataManager.findUserKey(username) || username;
        let curRoom = players[socket.id].room;
        let parsed = dataManager.parseHouseRoom(curRoom);
        if (!parsed) return;

        if (parsed.owner.toLowerCase() !== uKey.toLowerCase()) {
            socket.emit('gameError', "🎶 Gramofonu yalnızca ev sahibi açıp kapatabilir!");
            return;
        }

        let isPlaying = !gramophonePlayingRooms[curRoom];
        gramophonePlayingRooms[curRoom] = isPlaying;

        io.to(curRoom).emit('gramophoneStateUpdate', {
            isPlaying: isPlaying,
            owner: parsed.owner
        });

        socket.emit('systemMessage', isPlaying ? "🎶 Gramofon çalıştırıldı! Nostaljik melodiler çalıyor..." : "⏹️ Gramofon kapatıldı.");
    });

    // 6.1 LİMONATA STANDINDAN LİMONATA SATIN ALMA (15 TL)
    socket.on('buyLemonadeFromStand', (data) => {
        if (!players[socket.id] || !data) return;
        if (!checkRateLimit(socket, 'buyLemonade', 3, 2000)) return;
        let buyerName = players[socket.id].name;
        let buyerKey = (dataManager.findUserKey ? dataManager.findUserKey(buyerName) : null) || buyerName;
        let buyerData = dataManager.persistentData.users[buyerKey];
        if (!buyerData) return;

        let ownerName = data.owner;
        let ownerKey = (dataManager.findUserKey ? dataManager.findUserKey(ownerName) : null) || ownerName;
        if (!ownerKey || !dataManager.persistentData.users[ownerKey]) {
            socket.emit('gameError', "Stand sahibi bulunamadı!");
            return;
        }

        if (buyerKey.toLowerCase() === ownerKey.toLowerCase()) {
            socket.emit('gameError', "Kendi limonata standınızdan limonata satın alamazsınız!");
            return;
        }

        const LEMONADE_PRICE = 15;
        if ((buyerData.money || 0) < LEMONADE_PRICE) {
            socket.emit('gameError', "Limonata satın almak için yeterli paranız yok! (15 TL gerekli)");
            return;
        }

        let ownerData = dataManager.persistentData.users[ownerKey];

        // Alıcıdan 15 TL düş
        buyerData.money = Math.max(0, (buyerData.money || 0) - LEMONADE_PRICE);
        players[socket.id].money = buyerData.money;
        socket.emit('moneyUpdate', buyerData.money);

        // Ev sahibine 15 TL ekle (kullanıcı kuralı: "limonata satın aldıkça ev sahibine gitsin o para ve bir limonata sattınız bildirimiyle belirtsin bunu.")
        ownerData.money = (ownerData.money || 0) + LEMONADE_PRICE;

        // Eğer ev sahibi o an oyundaysa canlı bildirim ve bakiye güncellemesi gönder
        for (let sid in players) {
            if (players[sid] && players[sid].name && players[sid].name.toLowerCase() === ownerName.toLowerCase()) {
                players[sid].money = ownerData.money;
                io.to(sid).emit('moneyUpdate', ownerData.money);
                io.to(sid).emit('lemonadeSaleNotification', {
                    buyer: buyerName,
                    amount: LEMONADE_PRICE
                });
                io.to(sid).emit('systemMessage', `🍋 [${buyerName}] sizden 1 bardak taze limonata satın aldı! Hesabınıza +15 TL eklendi.`);
                break;
            }
        }

        // Alıcının eline taze limonata bardağı ver!
        buyerData.avatar = buyerData.avatar || {};
        buyerData.avatar.heldItem = 'limonata';
        players[socket.id].heldItem = 'limonata';

        dataManager.savePersistentData();

        let room = players[socket.id].room;
        io.to(room).emit('playerAvatarChange', { id: socket.id, avatar: buyerData.avatar, heldItem: 'limonata' });
        io.to(room).emit('chatUpdate', { id: socket.id, msg: '🍋 Buz gibi taze limonatamı yudumluyorum!' });

        // Alıcıya başarı mesajı
        socket.emit('lemonadePurchasedSuccess', { amount: LEMONADE_PRICE });
        socket.emit('systemMessage', `🍋 Buz gibi taze limonatayı afiyetle içtiniz! (-15 TL ev sahibine ödendi)`);
    });

    // 7. TÜM KULLANILABİLİR EVLERİ VE ARKADAŞ EVLERİNİ LİSTELEME (KONUTLAR PORTALI)
    socket.on('getAvailableHouses', async () => {
        if (!players[socket.id]) return;
        let username = players[socket.id].name;
        let uKey = (dataManager.findUserKey ? dataManager.findUserKey(username) : null) || username;
        let uData = dataManager.persistentData.users[uKey];
        if (!uData && mongoose.connection.readyState === 1) {
            const dbU = await User.findByUsername(username);
            if (dbU) uData = dbU.toObject ? dbU.toObject() : dbU;
        }
        if (!uData) return;

        let availableHouses = [];
        let hasSelfHouse = false;
        let myFriends = uData.friends || [];

        // 1. Kendi Evlerimiz
        let selfHouses = uData.houses || {};
        if (uData.house && uData.house.type && !selfHouses[uData.house.type]) {
            selfHouses[uData.house.type] = uData.house;
        }

        for (let hType in selfHouses) {
            let h = selfHouses[hType];
            if (h && (h.type || hType)) {
                hasSelfHouse = true;
                availableHouses.push({
                    owner: username,
                    type: h.type || hType,
                    furnitureCount: (h.furniture || []).length,
                    isSelf: true,
                    privacy: h.privacy || 'public'
                });
            }
        }

        // 2. Arkadaşlarımızın Evleri ve Mahalledeki Diğer Açık Evler (MongoDB Canlı Sorgu)
        let friendUsernames = new Set(myFriends.map(f => {
            let fn = typeof f === 'string' ? f : (f ? f.username : '');
            return fn.toLowerCase();
        }));

        let allUsers = {};
        if (mongoose.connection.readyState === 1) {
            try {
                const dbUsers = await User.find({
                    $or: [
                        { house: { $ne: null } },
                        { 'houses.standart': { $exists: true } },
                        { 'houses.garden': { $exists: true } },
                        { 'houses.pool': { $exists: true } }
                    ]
                }).lean();
                for (let u of dbUsers) {
                    allUsers[u.username] = u;
                }
            } catch (err) {
                console.error("MongoDB getAvailableHouses hatası:", err.message);
                allUsers = dataManager.persistentData.users || {};
            }
        } else {
            allUsers = dataManager.persistentData.users || {};
        }

        for (let otherKey in allUsers) {
            if (otherKey.toLowerCase() === uKey.toLowerCase()) continue;
            let otherData = allUsers[otherKey];
            if (!otherData) continue;

            let isFriend = friendUsernames.has(otherKey.toLowerCase());
            let otherHouses = otherData.houses || {};
            if (otherData.house && otherData.house.type && !otherHouses[otherData.house.type]) {
                otherHouses[otherData.house.type] = otherData.house;
            }

            for (let hType in otherHouses) {
                let oh = otherHouses[hType];
                if (!oh) continue;
                let priv = oh.privacy || 'public';

                // Eğer kilitliyse arkadaş da olsa listede kilitli görünür veya sadece açık olanlar gösterilir
                if (priv === 'locked') continue;

                // Eğer friends ise sadece arkadaşsa girebilir
                if (priv === 'friends' && !isFriend) continue;

                availableHouses.push({
                    owner: otherKey,
                    type: oh.type || hType,
                    furnitureCount: (oh.furniture || []).length,
                    isSelf: false,
                    isPublicCommunity: !isFriend,
                    privacy: priv
                });
            }
        }

        socket.emit('availableHousesList', {
            houses: availableHouses,
            hasSelfHouse: hasSelfHouse,
            friendCount: myFriends.length
        });
    });
}

module.exports = { registerHousingHandlers };

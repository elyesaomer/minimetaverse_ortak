// server.js - Mini Metaverse Ana Sunucusu & Modüler Soket Orkestratörü
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const config = require('./src/config');
const dataManager = require('./src/dataManager');
const tableManager = require('./src/tableManager');
const gameCoordinator = require('./src/gameCoordinator');
const fatherPetManager = require('./src/fatherPetManager');
const petManager = require('./src/petManager');
const { getRoomSpawn, getDemoHouseConfig } = require('./src/config/roomSpawns');

// Handler Modülleri
const { registerAuthHandlers } = require('./src/handlers/authHandler');
const { registerSocialHandlers } = require('./src/handlers/socialHandler');
const { registerHousingHandlers } = require('./src/handlers/housingHandler');
const { registerEconomyHandlers, playerSwanTimers, clearKiraathaneDrinkForPlayer } = require('./src/handlers/economyHandler');
const { registerAdminHandlers } = require('./src/handlers/adminHandler');
const { registerGameActionHandlers, handlePlayerLeaveTable } = require('./src/handlers/gameActionHandler');
const { registerVoiceHandlers, cleanupSocketVoice } = require('./src/handlers/voiceHandler');
const { registerBlackjackHandlers, removePlayerFromBlackjack } = require('./src/handlers/blackjackHandler');
const { registerRouletteHandlers } = require('./src/handlers/rouletteHandler');
const { registerSlotHandlers } = require('./src/handlers/slotHandler');
const { initGanyanEngine, registerGanyanHandlers } = require('./src/handlers/ganyanHandler');
const { initNargileLounge, registerNargileLoungeHandlers, handlePlayerDisconnect: handleNargileDisconnect } = require('./src/handlers/nargileLoungeHandler');
const { registerPetShopHandlers } = require('./src/handlers/petShopHandler');
const adManager = require('./src/adManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));

// Geliştirici Varlık Kaydetme Uç Noktası (Sprite Sheet PNG çıktısı için)
app.post('/api/dev/save-pet-asset', (req, res) => {
    try {
        const { filename, base64 } = req.body;
        if (!filename || !base64) return res.status(400).json({ error: 'Missing filename or base64' });
        const targetFolder = path.join(__dirname, 'public', 'assets', 'pets');
        if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });
        const filePath = path.join(targetFolder, path.basename(filename));
        const raw = base64.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(raw, 'base64'));
        console.log(`[PetAsset] Saved sprite asset to: ${filePath}`);
        return res.json({ success: true, filePath });
    } catch (err) {
        console.error('[PetAsset] Error saving asset:', err);
        return res.status(500).json({ error: err.message });
    }
});

// Çevrimiçi Oyuncular Havuzu
const players = {};

const {
    getPlayersInRoom,
    givePlayerTeaWithTimer,
    getPlayerDetailedLocation,
    getAdminOnlineUsers,
    getAdminSanctionsList,
    playerFishingTimers,
    playerTeaTimers
} = require('./src/utils/playerHelpers');

function getRoomPlayers(roomName) {
    return getPlayersInRoom(players, roomName);
}

function broadcastOnlineCount() {
    let count = Object.keys(players).filter(sid => {
        let p = players[sid];
        return p && p.name && !sid.startsWith('bot_') && !p.isBot && !p.name.startsWith('🤖');
    }).length;
    io.emit('onlineCountUpdate', count);
}

const helpers = {
    getPlayersInRoom: (room) => getPlayersInRoom(players, room),
    givePlayerTeaWithTimer: (sid, uname, dur) => givePlayerTeaWithTimer(io, players, sid, uname, dur),
    getPlayerDetailedLocation: (sid, p) => getPlayerDetailedLocation(sid, p),
    getAdminOnlineUsers: () => getAdminOnlineUsers(players),
    getAdminSanctionsList: () => getAdminSanctionsList(),
    broadcastOnlineCount: () => broadcastOnlineCount(),
    playerFishingTimers,
    playerTeaTimers
};

// Baba Peti (Denizden Babam Çıksa Yerim) Yöneticisini Başlat
fatherPetManager.init(io, players, dataManager);

// Sevimli Evcil Hayvan (Pet Shop) Yöneticisini Başlat
petManager.init(io, players, dataManager);

// Altılı Ganyan Hipodrom Yarış Motorunu Başlat
initGanyanEngine(io, players);

// Otantik Nargile Lounge Motorunu Başlat
initNargileLounge(io, players);

// Canlı Reklam Panoları ve TV Ağı Motorunu Başlat
adManager.init(io, players);

// --- MONGODB VERİTABANI BAĞLANTISI ---
const MONGO_URI = process.env.MONGO_URI;

async function connectToDatabase() {
    if (!MONGO_URI || MONGO_URI.includes('<kullanici_adi>') || MONGO_URI.includes('<username>') || MONGO_URI.includes('<password>') || MONGO_URI.includes('<sifre>')) {
        console.warn('\n⚠️ [MONGODB UYARI]: .env dosyasında henüz geçerli bir MONGO_URI tanımlanmamış.');
        console.warn('👉 Proje ana dizinindeki .env dosyasını açıp kendi MongoDB Atlas linkinizi yapıştırabilirsiniz:');
        console.warn('   MONGO_URI=mongodb+srv://kullanici:sifre@cluster0.mongodb.net/mini_metaverse?retryWrites=true&w=majority\n');
        return;
    }

    try {
        console.log('🍃 MongoDB veritabanına bağlanılıyor...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ [MONGODB]: MongoDB veritabanı bağlantısı başarıyla kuruldu!');
        
        // İlk bağlantıda verileri eşitle / aktar
        await dataManager.syncDataJsonToMongo();
    } catch (err) {
        console.error('❌ [MONGODB BAĞLANTI HATASI]:', err.message);
        console.warn('👉 .env dosyasındaki bağlantı adresinizi ve MongoDB Atlas ağ erişim (Network Access / IP Whitelist 0.0.0.0/0) ayarlarınızı kontrol edin.\n');
    }
}

connectToDatabase();

// --- SOKET BAĞLANTILARI ---
io.on('connection', (socket) => {
    // 1. Modüler Handler'ları Kaydet
    registerAuthHandlers(io, socket, players, helpers);
    registerPetShopHandlers(io, socket, players);
    registerSocialHandlers(io, socket, players, helpers);
    registerHousingHandlers(io, socket, players);
    registerEconomyHandlers(io, socket, players, helpers);
    registerAdminHandlers(io, socket, players, helpers);
    registerGameActionHandlers(io, socket, players);
    registerVoiceHandlers(io, socket, players);
    registerBlackjackHandlers(io, socket, players);
    registerRouletteHandlers(io, socket, players);
    registerSlotHandlers(io, socket, players);
    registerGanyanHandlers(io, socket, players);
    registerNargileLoungeHandlers(io, socket, players);

    // Çevrimiçi Oyuncu Sayısını Gönder (Botlar hariç)
    socket.emit('onlineCountUpdate', Object.keys(players).filter(sid => {
        let p = players[sid];
        return p && p.name && !sid.startsWith('bot_') && !p.isBot && !p.name.startsWith('🤖');
    }).length);

    // Reklam Ağı Soket Dinleyicileri
    adManager.handleClientConnect(socket);
    socket.on('submitBillboardAd', (data) => adManager.submitAd(socket, data ? data.text : ''));
    socket.on('getBillboardAdState', () => socket.emit('billboardAdUpdate', adManager.getState()));

    // 2. Oyuncu Hareketi (Akıcı Ağ Filtrelemesi)
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id] && movementData && typeof movementData.x === 'number' && typeof movementData.y === 'number' && !isNaN(movementData.x) && !isNaN(movementData.y)) {
            let prevX = players[socket.id].x;
            let prevY = players[socket.id].y;
            let hasMoved = (prevX === undefined || prevY === undefined || Math.abs(prevX - movementData.x) > 0.05 || Math.abs(prevY - movementData.y) > 0.05);

            if (players[socket.id].isFishing && hasMoved) {
                let dx = Math.abs(prevX - movementData.x);
                let dy = Math.abs(prevY - movementData.y);
                if (dx > 3 || dy > 3) {
                    players[socket.id].isFishing = false;
                    if (playerFishingTimers[socket.id]) {
                        clearTimeout(playerFishingTimers[socket.id]);
                        delete playerFishingTimers[socket.id];
                    }
                    io.to(players[socket.id].room).emit('playerFishingState', { id: socket.id, isFishing: false });
                    socket.emit('fishingCancelled');
                }
            }

            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            let stateChanged = (movementData.isMoving !== undefined && movementData.isMoving !== players[socket.id]._lastBroadcastMoving);
            if (movementData.isMoving !== undefined) {
                players[socket.id].isMoving = movementData.isMoving;
            }
            let facingChanged = (movementData.facing && movementData.facing !== players[socket.id].facing);
            if (movementData.facing) {
                players[socket.id].facing = movementData.facing;
            }

            if (hasMoved || stateChanged || facingChanged) {
                players[socket.id]._lastBroadcastMoving = movementData.isMoving;
                socket.to(players[socket.id].room).emit('playerMoved', { 
                    id: socket.id, 
                    x: movementData.x, 
                    y: movementData.y,
                    isMoving: movementData.isMoving,
                    facing: movementData.facing || players[socket.id].facing || 'down'
                });
                fatherPetManager.updateOwnerPosition(socket.id, movementData.x, movementData.y);
                petManager.updateOwnerPosition(socket.id, movementData.x, movementData.y);
            }
        }
    });

    // 3. Mekan Değiştirme
    socket.on('changeRoom', (newRoom) => {
        if (!players[socket.id] || !newRoom || typeof newRoom !== 'string') return;
        let oldRoom = players[socket.id].room;

        if (players[socket.id].isFishing) {
            players[socket.id].isFishing = false;
            if (playerFishingTimers[socket.id]) {
                clearTimeout(playerFishingTimers[socket.id]);
                delete playerFishingTimers[socket.id];
            }
        }
        if ((oldRoom === 'sahil' || oldRoom === 'sahilv2') && newRoom !== oldRoom) {
            players[socket.id].hasSwanBoat = false;
            if (playerSwanTimers && playerSwanTimers[socket.id]) {
                clearTimeout(playerSwanTimers[socket.id]);
                delete playerSwanTimers[socket.id];
            }
        }
        if (oldRoom === 'dostlar_kiraathanesi' && newRoom !== 'dostlar_kiraathanesi') {
            clearKiraathaneDrinkForPlayer(io, players, socket.id);
        }
        if ((oldRoom === 'kafe' || oldRoom === 'dostlar_kiraathanesi') && newRoom !== oldRoom) {
            handlePlayerLeaveTable(io, players, socket, true);
        }

        socket.leave(oldRoom);
        socket.to(oldRoom).emit('playerDisconnected', socket.id);

        socket.join(newRoom);
        players[socket.id].room = newRoom;

        const spawnPos = getRoomSpawn(newRoom, oldRoom);
        players[socket.id].x = spawnPos.x;
        players[socket.id].y = spawnPos.y;

        if (newRoom.startsWith("house_")) {
            let parsed = dataManager.parseHouseRoom(newRoom);
            if (parsed) {
                let isDemo = (parsed.owner === 'ornek' || parsed.owner === 'demo');
                if (isDemo) {
                    let demoType = parsed.houseType || 'standart';
                    let demoFurn = getDemoHouseConfig(demoType);
                    socket.emit('houseDataUpdate', {
                        owner: 'Örnek Daire',
                        type: demoType,
                        houseId: newRoom,
                        furniture: demoFurn,
                        isDemo: true
                    });
                } else {
                    let hData = dataManager.persistentData.users[parsed.owner];
                    if (hData) {
                        let targetHouse = null;
                        let targetType = parsed.houseType;
                        if (hData.houses && targetType && hData.houses[targetType]) {
                            targetHouse = hData.houses[targetType];
                        } else if (hData.houses && Object.keys(hData.houses).length > 0) {
                            targetType = targetType || Object.keys(hData.houses)[0];
                            targetHouse = hData.houses[targetType];
                        } else if (hData.house) {
                            targetHouse = hData.house;
                            targetType = targetType || hData.house.type || 'standart';
                        }

                        if (targetHouse) {
                            socket.emit('houseDataUpdate', {
                                ...targetHouse,
                                owner: parsed.owner,
                                type: targetType,
                                houseId: `${parsed.owner}_${targetType}`
                            });
                        }
                    }
                }
            }
        }

        fatherPetManager.handleRoomChange(socket.id, oldRoom, newRoom);
        petManager.handleRoomChange(socket.id, oldRoom, newRoom);
        if (oldRoom === 'nargile_cafe' && newRoom !== 'nargile_cafe') {
            handleNargileDisconnect(socket.id);
        }

        socket.emit('currentPlayers', getRoomPlayers(newRoom));
        socket.emit('activeFatherPets', fatherPetManager.getPetsInRoom(newRoom));
        socket.emit('activeCompanionPets', petManager.getPetsInRoom(newRoom));
        socket.to(newRoom).emit('newPlayer', { id: socket.id, player: players[socket.id] });
    });

    // 4. Bağlantı Kopması
    socket.on('disconnect', () => {
        handleNargileDisconnect(socket.id);
        fatherPetManager.handleDisconnect(socket.id);
        petManager.handleDisconnect(socket.id);
        if (playerFishingTimers[socket.id]) {
            clearTimeout(playerFishingTimers[socket.id]);
            delete playerFishingTimers[socket.id];
        }
        if (playerTeaTimers[socket.id]) {
            clearTimeout(playerTeaTimers[socket.id]);
            delete playerTeaTimers[socket.id];
        }
        if (playerSwanTimers && playerSwanTimers[socket.id]) {
            clearTimeout(playerSwanTimers[socket.id]);
            delete playerSwanTimers[socket.id];
        }

        cleanupSocketVoice(socket);

        if (players[socket.id]) {
            let pName = players[socket.id].name;
            let room = players[socket.id].room;
            console.log(`${pName} oyundan ayrıldı.`);

            handlePlayerLeaveTable(io, players, socket, true);
            removePlayerFromBlackjack(io, socket.id, players);

            delete players[socket.id];
            io.to(room).emit('playerDisconnected', socket.id);
            broadcastOnlineCount();
        } else {
            handlePlayerLeaveTable(io, players, socket, true);
            removePlayerFromBlackjack(io, socket.id, players);
        }
    });
});

// Bilardo Fizik Motorunu Başlat
gameCoordinator.startBilliardPhysicsLoop(io, players);

// Global Güvenlik Katmanı (Uncaught Exception & Unhandled Rejection Koruması)
process.on('uncaughtException', (err) => {
    console.error('⚠️ [KRİTİK GÜVENLİK KATMANI - UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [KRİTİK GÜVENLİK KATMANI - UNHANDLED REJECTION]:', reason);
});

// Güvenli Kapanma (Graceful Shutdown)
process.on('SIGINT', async () => {
    console.log('\nSunucu kapatılıyor, canlı veriler veritabanına kaydediliyor...');
    try {
        await dataManager.savePersistentData();
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('🍃 MongoDB bağlantısı kapatıldı.');
        }
    } catch (_) {}
    process.exit(0);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [BİLGİ]: Port ${config.PORT} zaten kullanımda! Sunucu zaten arka planda açık ve çalışıyor.`);
        console.error(`👉 Tarayıcınızdan http://localhost:${config.PORT} adresine girip oyunu hemen oynayabilirsiniz.\n`);
        process.exit(0);
    } else {
        console.error('Sunucu başlatma hatası:', err);
    }
});

server.listen(config.PORT, () => {
    console.log(`Mini Metaverse Sunucusu aktif: http://localhost:${config.PORT}`);
});
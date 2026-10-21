// src/handlers/petShopHandler.js - Pet Shop Satın Alma ve İletişim Soket Olayları Yöneticisi

const dataManager = require('../dataManager');
const petManager = require('../petManager');

function registerPetShopHandlers(io, socket, players) {
    socket.on('getPetShopCatalog', () => {
        socket.emit('petShopCatalog', {
            pets: petManager.PET_CONFIGS,
            durationMs: petManager.PET_DURATION_MS
        });
    });

    socket.on('getCompanionPetsInRoom', () => {
        const player = players[socket.id];
        if (!player) return;
        socket.emit('activeCompanionPets', petManager.getPetsInRoom(player.room || 'cadde'));
    });

    // 1. Evcil Hayvan Sahiplenme / Satın Alma İsteği
    socket.on('buyPet', (data) => {
        handleBuyPet(io, socket, players, data);
    });

    socket.on('requestBuyPet', (data) => {
        handleBuyPet(io, socket, players, data);
    });

    socket.on('buyCompanionPet', (data) => {
        handleBuyPet(io, socket, players, data, true);
    });

    // 2. Pet Shop Durumunu Sorgulama (Kullanıcının mevcut peti var mı?)
    socket.on('getPetShopStatus', () => {
        const player = players[socket.id];
        if (!player || !player.name) return;

        const uData = dataManager.persistentData.users[player.name] || {};
        const userMoney = uData.money !== undefined ? uData.money : (player.money || 0);

        const currentPet = petManager.getPetByUsername(player.name);
        const now = Date.now();
        let activePetInfo = null;

        if (currentPet && currentPet.expiresAt > now) {
            activePetInfo = {
                petType: currentPet.petType,
                name: currentPet.name,
                emoji: currentPet.emoji,
                remainingMs: currentPet.expiresAt - now
            };
        }

        socket.emit('petShopStatus', {
            money: userMoney,
            activePet: activePetInfo
        });
    });

    // 3. İsteğe Bağlı: Peti Serbest Bırakma / Yuvaya Gönderme
    socket.on('abandonPet', () => {
        const player = players[socket.id];
        if (!player || !player.name) return;

        const currentPet = petManager.getPetByUsername(player.name);
        if (currentPet) {
            petManager.despawnPet(player.name, 'abandoned');
            socket.emit('systemMessage', `🐾 ${currentPet.name} sevgiyle yuvasına uğurlandı.`);
        }
    });
}

function handleBuyPet(io, socket, players, data, legacyResponse = false) {
    if (!data || !data.petType) {
        socket.emit('gameError', "Geçersiz evcil hayvan seçimi!");
        return;
    }

    const petType = data.petType.toLowerCase().trim();
    const config = petManager.PET_CONFIGS[petType];
    if (!config) {
        socket.emit('gameError', "Böyle bir evcil hayvan Pet Shop'ta bulunmuyor!");
        return;
    }

    const player = players[socket.id];
    if (!player || !player.name) {
        socket.emit('gameError', "Oyuncu bilgisi bulunamadı!");
        return;
    }

    const username = player.name;
    const uData = dataManager.persistentData.users[username];
    if (!uData) {
        socket.emit('gameError', "Kullanıcı verisi yüklenemedi!");
        return;
    }

    const userMoney = uData.money !== undefined ? uData.money : (player.money || 0);
    const cost = config.price;

    // Bakiye kontrolü
    if (userMoney < cost) {
        socket.emit('gameError', `Yetersiz bakiye! ${config.name} sahiplenmek için ${cost.toLocaleString()} TL gerekiyor. (Mevcut: ${userMoney.toLocaleString()} TL)`);
        return;
    }

    // Parayı tahsil et
    uData.money = userMoney - cost;
    player.money = uData.money;
    dataManager.savePersistentData();

    // Bakiye güncellemesini istemciye bildir
    socket.emit('moneyUpdate', player.money);

    // Evcil hayvanı oluştur ve odaya sal
    const newPet = petManager.spawnPet(socket.id, petType);

    // Başarı bildirimi
    const pet = petManager.toPetDTO(newPet);
    if (legacyResponse) {
        socket.emit('petPurchaseSuccess', {
            petType,
            name: config.name,
            price: cost,
            emoji: config.emoji,
            balance: player.money,
            pet
        });
    } else {
        socket.emit('buyPetSuccess', {
            success: true,
            pet,
            message: `🎉 Tebrikler! ${config.name} (${config.emoji}) başarıyla sahiplenildi! 15 dakika boyunca yanından ayrılmayacak.`
        });
    }

    socket.emit('systemMessage', `🐾 ${config.name} sahiplendin! (-${cost.toLocaleString()} TL). 15 dakika boyunca seninle gezecek.`);
}

module.exports = {
    registerPetShopHandlers
};

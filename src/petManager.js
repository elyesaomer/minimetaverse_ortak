// src/petManager.js - Mini Metaverse Evcil Hayvan (Pet) Yöneticisi
// Kedi, Köpek ve Fare yoldaşlarının sunucu durumunu, 15 dakikalık sürelerini ve takibini yönetir.

const activeCompanionPets = {};   // username -> petObject
const petExpireTimers = {};       // username -> Timeout
const petTalkIntervals = {};      // username -> Interval

let ioRef = null;
let playersRef = null;
let dataManagerRef = null;

// Evcil Hayvan Özellikleri ve Fiyatları
const PET_CONFIGS = {
    cat: {
        type: 'cat',
        name: 'Kedi',
        price: 2000,
        emoji: '🐱',
        sayings: [
            "Miyavvv! 🐾",
            "Mırrrr... ❤️",
            "Süt var mı acaba? 🥛",
            "Tırmalarım ha! 😼",
            "Beni sevdin mi? ✨",
            "Güneşlenmek çok güzel... ☀️",
            "Miyav! Biraz başımı okşa."
        ]
    },
    dog: {
        type: 'dog',
        name: 'Köpek',
        price: 3000,
        emoji: '🐶',
        sayings: [
            "Hav hav! 🐶",
            "Seni çok seviyorum! ❤️",
            "Kemik nerede? 🦴",
            "Kurt gibi sadığım! 🐕",
            "Birlikte koşalım mı? 🎾",
            "Kuyruğumu yakalayamıyorum!",
            "Hav hav! Hep yanındayım!"
        ]
    },
    mouse: {
        type: 'mouse',
        name: 'Fare',
        price: 1500,
        emoji: '🐭',
        sayings: [
            "Peynirim nerede? 🧀",
            "Cik cik! Delik çok yakın! 🐭",
            "Şaman bir köprü atsana! ⚡",
            "Peyniri kaptım, kaçıyorum! 🧀💨",
            "Transformice hızım yerinde! 🚀",
            "Cik cik! Cebinde peynir var mı?",
            "Kulağımdaki peyniri sakın yeme! 🧀"
        ]
    }
};

const PET_DURATION_MS = 15 * 60 * 1000; // 15 Dakika

function init(io, players, dataManager) {
    ioRef = io;
    playersRef = players;
    dataManagerRef = dataManager;
}

/**
 * Socket.IO ile istemcilere gönderilmeden önce Timer/Döngüsel referanslardan
 * arındırılmış temiz DTO nesnesi döndürür.
 */
function toPetDTO(pet) {
    if (!pet) return null;
    const cfg = PET_CONFIGS[pet.petType];
    return {
        id: pet.id,
        ownerId: pet.ownerId,
        ownerName: pet.ownerName,
        petType: pet.petType,
        emoji: pet.emoji || (cfg ? cfg.emoji : '🐾'),
        name: pet.name,
        room: pet.room,
        x: pet.x,
        y: pet.y,
        facing: pet.facing || 'down',
        speech: pet.speech || null,
        speechUntil: pet.speechUntil || 0,
        expiresAt: pet.expiresAt,
        durationMs: pet.durationMs,
        createdAt: pet.createdAt
    };
}

function getActivePets() {
    return activeCompanionPets;
}

function getPetsInRoom(roomName) {
    const list = [];
    const now = Date.now();
    for (const u in activeCompanionPets) {
        const pet = activeCompanionPets[u];
        if (pet && pet.room === roomName && pet.expiresAt > now) {
            list.push(toPetDTO(pet));
        }
    }
    return list;
}

function getPetByOwnerId(ownerId) {
    for (const u in activeCompanionPets) {
        if (activeCompanionPets[u].ownerId === ownerId) {
            return activeCompanionPets[u];
        }
    }
    return null;
}

function getPetByUsername(username) {
    return activeCompanionPets[username] || null;
}

/**
 * Bir oyuncuya yeni evcil hayvan çağırır
 * (ownerId, petType) veya (ownerId, username, petType) şeklinde çağrılabilir
 */
function spawnPet(ownerId, arg2, arg3) {
    if (!playersRef || !playersRef[ownerId]) return null;
    const player = playersRef[ownerId];
    const username = player.name;
    const room = player.room || 'cadde';

    let petType = arg2;
    if (PET_CONFIGS[arg3]) {
        petType = arg3;
    } else if (PET_CONFIGS[arg2]) {
        petType = arg2;
    }
    if (typeof petType === 'string') petType = petType.toLowerCase().trim();

    const cfg = PET_CONFIGS[petType];
    if (!cfg) return null;

    // Eğer zaten bir evcil hayvanı varsa yenisi için eskisi temizlensin
    if (activeCompanionPets[username]) {
        despawnPet(username, "Yeni pet alındı");
    }

    const petId = `pet_${petType}_${ownerId}_${Date.now()}`;
    const petDisplayName = `${username}'in ${cfg.name}si`;
    const spawnX = (player.x || 400) + 26;
    const spawnY = (player.y || 300) + 6;

    const pet = {
        id: petId,
        ownerId: ownerId,
        ownerName: username,
        petType: petType,
        emoji: cfg.emoji,
        name: petDisplayName,
        room: room,
        x: spawnX,
        y: spawnY,
        facing: 'down',
        createdAt: Date.now(),
        durationMs: PET_DURATION_MS,
        expiresAt: Date.now() + PET_DURATION_MS,
        speech: `${cfg.emoji} Merhaba!`,
        speechUntil: Date.now() + 6000
    };

    activeCompanionPets[username] = pet;
    player.activePet = petType;

    const petDTO = toPetDTO(pet);

    // Odaya ve sahibine duyur
    if (ioRef) {
        if (room) {
            ioRef.to(room).emit('systemMessage', `🐾 ${username}, sevimli bir ${cfg.name} edindi!`);
            ioRef.to(room).emit('companionPetSpawned', {
                pet: petDTO
            });
        }
        if (ownerId) {
            ioRef.to(ownerId).emit('companionPetSpawned', {
                pet: petDTO
            });
        }
    }

    // 1. PERİYODİK PET SESLERİ (Her 45 saniyede bir sevimli miyav/hav/cik)
    petTalkIntervals[username] = setInterval(() => {
        triggerRandomPetTalk(username);
    }, 45000);

    // 2. 15 DAKİKA SONRA VEDA VE DESPAWN
    petExpireTimers[username] = setTimeout(() => {
        despawnPet(username, "15 dakikalık süre doldu");
    }, PET_DURATION_MS);

    return pet;
}

/**
 * Petin rastgele konuşması
 */
function triggerRandomPetTalk(username) {
    const pet = activeCompanionPets[username];
    if (!pet || Date.now() >= pet.expiresAt) return;

    const cfg = PET_CONFIGS[pet.petType];
    if (!cfg || !cfg.sayings || cfg.sayings.length === 0) return;

    const chosen = cfg.sayings[Math.floor(Math.random() * cfg.sayings.length)];
    pet.speech = chosen;
    pet.speechUntil = Date.now() + 7000;

    if (ioRef && pet.room) {
        ioRef.to(pet.room).emit('companionPetSpeak', {
            petId: pet.id,
            ownerId: pet.ownerId,
            speech: pet.speech
        });
    }
}

/**
 * Peti haritadan kaldırır
 */
function despawnPet(key, reason = "") {
    let pet = activeCompanionPets[key];
    let username = key;
    if (!pet) {
        pet = getPetByOwnerId(key);
        if (pet) username = pet.ownerName;
    }
    if (!pet) return;

    if (petTalkIntervals[username]) {
        clearInterval(petTalkIntervals[username]);
        delete petTalkIntervals[username];
    }
    if (petExpireTimers[username]) {
        clearTimeout(petExpireTimers[username]);
        delete petExpireTimers[username];
    }

    if (ioRef && pet.room) {
        ioRef.to(pet.room).emit('companionPetDespawned', {
            petId: pet.id,
            ownerId: pet.ownerId,
            reason: reason
        });
    }

    if (playersRef && pet.ownerId && playersRef[pet.ownerId]) {
        delete playersRef[pet.ownerId].activePet;
    }

    delete activeCompanionPets[username];
}

/**
 * Oyuncu oda değiştirdiğinde peti de onunla beraber her mekana gider
 */
function handleRoomChange(ownerId, oldRoom, newRoom) {
    const pet = getPetByOwnerId(ownerId);
    if (!pet) return;

    if (ioRef && oldRoom && oldRoom !== newRoom) {
        ioRef.to(oldRoom).emit('companionPetDespawned', {
            petId: pet.id,
            ownerId: ownerId,
            reason: 'room_change'
        });
    }

    pet.room = newRoom;
    const player = playersRef ? playersRef[ownerId] : null;
    if (player) {
        pet.x = player.x + 24;
        pet.y = player.y + 6;
    }

    if (ioRef && newRoom) {
        ioRef.to(newRoom).emit('companionPetSpawned', {
            pet: toPetDTO(pet)
        });
    }
}

/**
 * Sahip yürüdükçe pet koordinatını günceller
 */
function updateOwnerPosition(ownerId, x, y) {
    const pet = getPetByOwnerId(ownerId);
    if (!pet) return;
    pet.x = x + 24;
    pet.y = y + 6;
}

/**
 * Oyuncu yeniden bağlandığında süresi bitmemiş petini geri bağlar
 */
function handleLogin(socket, username) {
    if (!username) return;
    const pet = activeCompanionPets[username];
    if (pet && pet.expiresAt > Date.now()) {
        pet.ownerId = socket.id;
        const player = playersRef ? playersRef[socket.id] : null;
        if (player) {
            pet.room = player.room || 'cadde';
            pet.x = player.x + 24;
            pet.y = player.y + 6;
        }
        socket.emit('companionPetSpawned', { pet: toPetDTO(pet) });
        if (ioRef && pet.room) {
            ioRef.to(pet.room).emit('companionPetSpawned', { pet: toPetDTO(pet) });
        }
    }
}

/**
 * Oyuncu ayrıldığında
 */
function handleDisconnect(ownerId) {
    const pet = getPetByOwnerId(ownerId);
    if (!pet) return;

    if (ioRef && pet.room) {
        ioRef.to(pet.room).emit('companionPetDespawned', {
            petId: pet.id,
            ownerId: ownerId,
            reason: 'Oyuncu ayrıldı'
        });
    }
}

module.exports = {
    PET_CONFIGS,
    PET_DURATION_MS,
    init,
    toPetDTO,
    getActivePets,
    getPetsInRoom,
    getPetByOwnerId,
    getPetByUsername,
    spawnPet,
    despawnPet,
    handleRoomChange,
    updateOwnerPosition,
    handleLogin,
    handleDisconnect
};

const dataManager = require('../dataManager');
const tableManager = require('../tableManager');
const gameCoordinator = require('../gameCoordinator');
const fatherPetManager = require('../fatherPetManager');
const petManager = require('../petManager');

function registerAuthHandlers(io, socket, players, helpers) {
    const { getPlayersInRoom, givePlayerTeaWithTimer, broadcastOnlineCount } = helpers;

    // Ortak Giriş Başarılı İşlemi
    function onLoginSuccess(uData, username, isAdmin) {
        const previousModel = uData.avatar && uData.avatar.model;
        if (!uData.avatar) uData.avatar = {};
        if (uData.avatar.model !== 'sanalika_v2') {
            uData.avatar.model = 'classic_2';
        }
        if (previousModel !== uData.avatar.model) {
            dataManager.savePersistentData();
        }

        let hasValidTea = false;
        if (uData.teaExpiresAt) {
            if (Date.now() >= uData.teaExpiresAt) {
                uData.teaExpiresAt = null;
                if (uData.avatar.heldItem === 'cay') uData.avatar.heldItem = 'none';
                if (uData.propInventory) delete uData.propInventory['props_cay'];
                dataManager.savePersistentData();
            } else {
                hasValidTea = true;
            }
        }

        players[socket.id] = {
            name: username,
            x: 400, y: 400,
            model: uData.avatar.model,
            color: uData.avatar.shirtColor || '#3b82f6',
            shirt: (uData.avatar && uData.avatar.shirt) || (uData.avatar && uData.avatar.shirtColor) || '#3b82f6',
            pants: (uData.avatar && uData.avatar.pants) || 'pants_camo_cargo',
            outfit: (uData.avatar && uData.avatar.outfit) || null,
            skinColor: uData.avatar.skinColor || '#facc15',
            hat: uData.avatar.hat || 'bere',
            face: uData.avatar.face || 'none',
            heldItem: uData.avatar.heldItem || 'none',
            shoes: uData.avatar.shoes || 'none',
            watch: (uData.avatar && uData.avatar.watch) || 'none',
            gender: uData.gender || 'male',
            money: uData.money !== undefined ? uData.money : 1000,
            msg: "",
            room: "sokak",
            hasTea: hasValidTea,
            action: hasValidTea ? 'tea' : null,
            isFishing: false,
            hasSwanBoat: false,
            isAdmin: isAdmin || (username && username.toLowerCase() === 'elyesa'),
            isMod: !isAdmin && username && username.toLowerCase() !== 'elyesa' && (uData.role === 'mod' || uData.role === 'moderator' || uData.isMod === true),
            role: (isAdmin || (username && username.toLowerCase() === 'elyesa')) ? 'admin' : ((uData.role === 'mod' || uData.role === 'moderator' || uData.isMod === true) ? 'mod' : 'user'),
            isMuted: !!(uData.muteExpiresAt && Date.now() < uData.muteExpiresAt)
        };

        const isMod = players[socket.id].isMod;
        const userRole = players[socket.id].role;

        if (hasValidTea) {
            givePlayerTeaWithTimer(socket.id, username, uData.teaExpiresAt - Date.now());
        }

        socket.join("sokak");

        socket.emit('loginSuccess', {
            money: uData.money,
            avatar: uData.avatar,
            inventory: uData.inventory,
            propInventory: uData.propInventory || {},
            friendRequests: uData.friendRequests || [],
            isAdmin: isAdmin,
            isMod: isMod,
            role: userRole,
            username: username,
            friends: dataManager.getFriendListData(username, players),
            houses: uData.houses || (uData.house ? { [uData.house.type]: uData.house } : {}),
            house: uData.house,
            gender: uData.gender || 'male',
            furnitureInventory: uData.furnitureInventory || [],
            skinSets: uData.skinSets || {},
            isMuted: !!(uData.muteExpiresAt && Date.now() < uData.muteExpiresAt),
            muteExpiresAt: uData.muteExpiresAt || null,
            muteReason: uData.muteReason || null
        });

        fatherPetManager.handleLogin(socket, username);
        petManager.handleLogin(socket, username);
        socket.emit('currentPlayers', getPlayersInRoom("sokak"));
        socket.emit('activeFatherPets', fatherPetManager.getPetsInRoom("sokak"));
        socket.emit('activeCompanionPets', petManager.getPetsInRoom("sokak"));
        socket.to("sokak").emit('newPlayer', { id: socket.id, player: players[socket.id] });
        if (typeof broadcastOnlineCount === 'function') broadcastOnlineCount();

        console.log(`${username} oyuna girdi! Bakiye: ${uData.money} TL (Admin: ${isAdmin}, Mod: ${isMod})`);

        // Devam eden oyun kontrolü (Reconnect Teklifi)
        const activeGames = gameCoordinator.getActiveGames();
        let ongoingGame = null;
        for (let tid in activeGames) {
            let g = activeGames[tid];
            if (g && g.disconnectedPlayers) {
                for (let dPid in g.disconnectedPlayers) {
                    if (g.disconnectedPlayers[dPid].name.toLowerCase() === username.toLowerCase()) {
                        ongoingGame = { tableId: tid, game: g };
                        break;
                    }
                }
            }
            if (ongoingGame) break;
        }

        if (ongoingGame) {
            let table = tableManager.getTable(ongoingGame.tableId);
            let tName = table ? table.name : "Masa";
            socket.emit('promptReconnect', { tableId: ongoingGame.tableId, tableName: tName });
        }
    }

    // 1. MEVCUT HESAP İLE GİRİŞ
    socket.on('login', async (data) => {
        if (!data) {
            socket.emit('loginFailed', "Giriş bilgileri eksik!");
            return;
        }

        const inputName = dataManager.sanitizeString(data.name || "Oyuncu", 20);
        const pass = typeof data.pass === 'string' ? data.pass.trim() : "";

        const authResult = await dataManager.loginUser(inputName, pass, players);

        if (!authResult.success) {
            socket.emit('loginFailed', authResult.message || "Giriş başarısız!");
            return;
        }

        const username = authResult.username;
        const uData = authResult.userData;

        // Aktif Ban Kontrolü
        if (uData.banExpiresAt) {
            if (Date.now() < uData.banExpiresAt) {
                let remainingSec = Math.ceil((uData.banExpiresAt - Date.now()) / 1000);
                let remMin = Math.floor(remainingSec / 60);
                let remSec = remainingSec % 60;
                let timeStr = remMin > 0 ? `${remMin} dakika ${remSec} saniye` : `${remSec} saniye`;
                socket.emit('loginFailed', `⛔ Hesabınız geçici olarak uzaklaştırılmıştır (Ban)!\nSebep: ${uData.banReason || 'Yönetici kararı'}\nKalan Süre: ${timeStr}`);
                return;
            } else {
                uData.banExpiresAt = null;
                uData.banReason = null;
                uData.bannedBy = null;
                await dataManager.saveUserData(username, { banExpiresAt: null, banReason: null, bannedBy: null });
            }
        }

        const isAdmin = (uData.role === 'admin' || uData.isAdmin === true);

        onLoginSuccess(uData, username, isAdmin);
    });

    // 2. YENİ HESAP KAYIT (REGISTER)
    socket.on('register', async (data) => {
        if (!data) {
            socket.emit('registerFailed', "Kayıt bilgileri eksik!");
            return;
        }

        const inputName = dataManager.sanitizeString(data.name || "", 20);
        const pass = typeof data.pass === 'string' ? data.pass.trim() : "";
        const chosenGender = (data.gender === 'female') ? 'female' : 'male';

        const regResult = await dataManager.registerUser(inputName, pass, chosenGender);

        if (!regResult.success) {
            socket.emit('registerFailed', regResult.message || "Kayıt başarısız!");
            return;
        }

        const username = regResult.username;
        const uData = regResult.userData;
        const isAdmin = (uData.role === 'admin' || uData.isAdmin === true);

        onLoginSuccess(uData, username, isAdmin);
        socket.emit('systemMessage', `🎉 Hoş geldiniz ${username}! Hesabınız başarıyla oluşturuldu. Başlangıç hediyesi: 1000 TL!`);
    });

    // 3. OYUN İÇİ ŞİFRE DEĞİŞTİRME
    socket.on('changePassword', async (data) => {
        if (!players[socket.id] || !data) return;
        const username = players[socket.id].name;
        const oldPass = typeof data.oldPass === 'string' ? data.oldPass.trim() : "";
        const newPass = typeof data.newPass === 'string' ? data.newPass.trim() : "";

        const result = await dataManager.changeUserPassword(username, oldPass, newPass);

        if (result.success) {
            socket.emit('passwordChangeResult', { success: true, message: result.message });
            socket.emit('systemMessage', result.message);
        } else {
            socket.emit('passwordChangeResult', { success: false, message: result.message });
        }
    });

}

module.exports = { registerAuthHandlers };

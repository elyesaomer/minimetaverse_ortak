// public/js/main.js - Ana Oyun Orkestratörü, Game Loop & Soket Yöneticisi
// (Modüler mimariye ayrılmıştır: authUI.js, wardrobe.js, avatarRenderer.js, chatBubbles.js, worldRenderer.js, fishing.js, adminPanel.js, mobileControls.js)

// public/js/main.js

var socket = window.socket || (typeof io !== 'undefined' ? io() : null);
window.socket = socket;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

var myId = null;
var players = {};
var currentRoom = "sokak";

// WASD Hareket Değişkenleri (Akıcı Yürüyüş)
var keys = { w: false, a: false, s: false, d: false };


// --- 1. OTURUM & YÖNETİM DURUM DİNLENMESİ ---
let myUsername = "";

socket.on('loginSuccess', (data) => {
    try { const loginEl = document.getElementById('loginScreen'); if (loginEl) loginEl.style.display = 'none'; } catch(e) {}
    if (data) {
        if (data.username) {
            myUsername = data.username;
            window.myUsername = data.username;
        }
        if (data.gender) {
            window.myGender = data.gender;
        }
        if (data.money !== undefined) updateMoneyDisplay(data.money);
        if (data.inventory) myInventory = data.inventory;
        if (data.avatar) {
            myAvatar = data.avatar;
            if (!myAvatar.shoes) myAvatar.shoes = (window.myGender === 'female' ? 'flats' : 'sneakers');
            if (players[myId]) Object.assign(players[myId], myAvatar);
        }
        if (data.friends) {
            window.myFriendsList = data.friends;
            if (typeof renderFriendsListUI === 'function') renderFriendsListUI();
        }
        if (data.propInventory) {
            window.myPropInventory = data.propInventory;
            if (typeof updatePropsCountBadge === 'function') updatePropsCountBadge();
        }
        if (data.friendRequests) {
            window.myFriendRequests = data.friendRequests;
            if (typeof renderFriendRequestsUI === 'function') renderFriendRequestsUI();
        }
        if (typeof updateFriendshipBadges === 'function') updateFriendshipBadges();
        if (data.houses) {
            window.myHouses = data.houses;
        }
        if (data.house) {
            myHouseData = data.house;
            window.myHouseData = data.house;
        }
        if (data.skinSets) {
            window.mySkinSets = data.skinSets;
            if (typeof updateSkinSetsUI === 'function') updateSkinSetsUI();
        }
        if (data.furnitureInventory) {
            myFurnitureInventory = data.furnitureInventory;
            window.myFurnitureInventory = data.furnitureInventory;
        }
        if (typeof updateHouseEditButtonVisibility === 'function') {
            updateHouseEditButtonVisibility();
        }

        const ADMIN_NAMES = ['yasin', 'maltoroz'];
        const MOD_NAMES = ['elyesa'];
        const isUserAdmin = !!(data.isAdmin || data.role === 'admin' || (data.username && ADMIN_NAMES.includes(data.username.toLowerCase())));
        const isUserMod = !!(data.isMod || data.role === 'mod' || data.role === 'moderator' || (data.username && MOD_NAMES.includes(data.username.toLowerCase())));

        window.currentUserIsAdmin = isUserAdmin;
        window.currentUserIsMod = isUserMod;

        const adminBtn = document.getElementById('adminPanelNavBtn');
        if (adminBtn) {
            if (isUserAdmin) {
                adminBtn.style.display = 'flex';
                adminBtn.innerHTML = '👑 Admin Paneli';
                adminBtn.style.background = 'linear-gradient(135deg, #ef4444, #991b1b)';
                adminBtn.style.boxShadow = '0 4px 12px rgba(239,68,68,0.4)';
            } else if (isUserMod) {
                adminBtn.style.display = 'flex';
                adminBtn.innerHTML = '🛡️ Moderatör Paneli';
                adminBtn.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
                adminBtn.style.boxShadow = '0 4px 12px rgba(2,132,199,0.4)';
            }
        }

        // Yeni Güncellemeler (Beta v1.3) Panelini Aç
        setTimeout(() => {
            if (typeof openUpdatesModal === 'function') {
                openUpdatesModal();
            }
        }, 350);
    }
});

socket.on('moneyUpdate', (money) => {
    updateMoneyDisplay(money);
});


// --- 3. SÜRÜKLE BIRAK (DRAGGABLE) İŞLEMLERİ ---
document.addEventListener('DOMContentLoaded', () => {

    // A) CHAT PANELİNİ SÜRÜKLEME
    const chatPanel = document.getElementById('sideChatContainer');
    const chatHeader = document.getElementById('chatHeader');
    let isChatDragging = false, cStartX, cStartY, cInitialLeft, cInitialTop;

    if (chatHeader && chatPanel) {
        chatHeader.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            isChatDragging = true;
            cStartX = e.clientX; cStartY = e.clientY;
            cInitialLeft = chatPanel.offsetLeft; cInitialTop = chatPanel.offsetTop;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isChatDragging) return;
            chatPanel.style.left = (cInitialLeft + (e.clientX - cStartX)) + 'px';
            chatPanel.style.top = (cInitialTop + (e.clientY - cStartY)) + 'px';
            chatPanel.style.right = 'auto';
        });
        document.addEventListener('mouseup', () => { isChatDragging = false; });

        // Mobil Dokunmatik Desteği
        chatHeader.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            isChatDragging = true;
            cStartX = e.touches[0].clientX; cStartY = e.touches[0].clientY;
            cInitialLeft = chatPanel.offsetLeft; cInitialTop = chatPanel.offsetTop;
        });
        document.addEventListener('touchmove', (e) => {
            if (!isChatDragging) return;
            chatPanel.style.left = (cInitialLeft + (e.touches[0].clientX - cStartX)) + 'px';
            chatPanel.style.top = (cInitialTop + (e.touches[0].clientY - cStartY)) + 'px';
            chatPanel.style.right = 'auto';
        });
        document.addEventListener('touchend', () => { isChatDragging = false; });
    }

    // B) OYUN MASASINI (MODAL) SÜRÜKLEME
    const gameModal = document.getElementById('gameModal');
    const modalHeader = document.getElementById('modalHeader');
    let isModalDragging = false, mStartX = 0, mStartY = 0, mInitialLeft = 0, mInitialTop = 0;

    function startModalDrag(clientX, clientY) {
        if (!gameModal) return;
        isModalDragging = true;
        mStartX = clientX;
        mStartY = clientY;

        // CSS animasyonunu durdur ve tam ekran koordinatlarına kilitle
        gameModal.style.animation = 'none';
        const rect = gameModal.getBoundingClientRect();
        gameModal.style.transform = 'none';
        gameModal.style.margin = '0';
        gameModal.style.left = rect.left + 'px';
        gameModal.style.top = rect.top + 'px';

        mInitialLeft = rect.left;
        mInitialTop = rect.top;
    }

    function moveModalDrag(clientX, clientY) {
        if (!isModalDragging || !gameModal) return;
        const dx = clientX - mStartX;
        const dy = clientY - mStartY;
        let newLeft = mInitialLeft + dx;
        let newTop = mInitialTop + dy;

        // Ekran dışına kaçmasını engelle (Clamping)
        const modalW = gameModal.offsetWidth || 500;
        const maxL = Math.max(10, window.innerWidth - 60);
        const minL = Math.min(10, 10 - modalW + 100);
        const maxT = Math.max(10, window.innerHeight - 50);
        newLeft = Math.max(minL, Math.min(newLeft, maxL));
        newTop = Math.max(5, Math.min(newTop, maxT));

        gameModal.style.left = newLeft + 'px';
        gameModal.style.top = newTop + 'px';
    }

    function endModalDrag() {
        isModalDragging = false;
    }

    if (modalHeader && gameModal) {
        modalHeader.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            startModalDrag(e.clientX, e.clientY);
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            moveModalDrag(e.clientX, e.clientY);
        });
        document.addEventListener('mouseup', endModalDrag);

        // Dokunmatik (Mobil / Tablet) Sürükleme Desteği
        modalHeader.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            if (e.touches && e.touches.length === 1) {
                startModalDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });
        document.addEventListener('touchmove', (e) => {
            if (isModalDragging && e.touches && e.touches.length === 1) {
                moveModalDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });
        document.addEventListener('touchend', endModalDrag);
    }

    // Enter tuşu desteği ve Karakter Sayacı
    const sideInput = document.getElementById('sideChatInput');
    if (sideInput) {
        sideInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendSideChat();
            }
        });
        sideInput.addEventListener('input', updateChatCharCounter);
    }

    const passwordInput = document.getElementById('passwordInput');
    const usernameInput = document.getElementById('usernameInput');
    if (passwordInput) passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptLogin(); });
    if (usernameInput) usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptLogin(); });

    const regUserInput = document.getElementById('regUsernameInput');
    const regPassInput = document.getElementById('regPasswordInput');
    const regPassConfirmInput = document.getElementById('regPasswordConfirmInput');
    if (regUserInput) regUserInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptRegister(); });
    if (regPassInput) regPassInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptRegister(); });
    if (regPassConfirmInput) regPassConfirmInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptRegister(); });

    const cpOld = document.getElementById('cpOldPassword');
    const cpNew = document.getElementById('cpNewPassword');
    const cpConfirm = document.getElementById('cpNewPasswordConfirm');
    if (cpOld) cpOld.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitChangePassword(); });
    if (cpNew) cpNew.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitChangePassword(); });
    if (cpConfirm) cpConfirm.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitChangePassword(); });

    if (!window._isGameLoopRunning) {
        window._isGameLoopRunning = true;
        requestAnimationFrame(gameLoop);
    }
});

// --- 4. OYUNCU VE ODA BAĞLANTILARI ---
socket.on('currentPlayers', (serverPlayers) => {
    let oldMe = (typeof myId !== 'undefined' && players && players[myId]) ? players[myId] : null;
    players = serverPlayers || {};
    myId = socket.id;
    if (!players[myId] && oldMe) {
        players[myId] = oldMe;
    }
    if (players[myId]) {
        lastEmittedX = players[myId].x;
        lastEmittedY = players[myId].y;
    }
});

socket.on('newPlayer', (data) => { if (data && data.id) players[data.id] = data.player; });
socket.on('playerDisconnected', (id) => {
    if (id === myId) return;
    delete players[id];
    delete activeChatBubbles[id];
    delete activePlayerEmojis[id];
});
socket.on('playerMoved', (data) => {
    if (players[data.id]) {
        if (players[data.id].action === 'sitting' && (data.x !== players[data.id].x || data.y !== players[data.id].y)) {
            players[data.id].action = null;
        }
        if (data.id === myId) {
            players[data.id].x = data.x;
            players[data.id].y = data.y;
        } else {
            players[data.id].targetX = data.x;
            players[data.id].targetY = data.y;
            if (data.isMoving !== undefined) {
                players[data.id].serverMoving = data.isMoving;
            }
            if (data.facing) {
                players[data.id].facing = data.facing;
            }
            if (players[data.id].x === undefined) {
                players[data.id].x = data.x;
                players[data.id].y = data.y;
            }
        }
    }
});
socket.on('systemMessage', (msg) => { console.log("[Sistem]:", msg); });

socket.on('chatSpamWarning', (data) => {
    const banner = document.getElementById('chatSpamWarningBanner');
    if (banner) {
        banner.style.display = 'block';
        banner.textContent = (data && data.message) ? data.message : "⚠️ Çok hızlı mesaj atıyorsunuz! Lütfen 3 saniye bekleyin.";
        clearTimeout(window._chatSpamTimeout);
        window._chatSpamTimeout = setTimeout(() => {
            banner.style.display = 'none';
        }, ((data && data.cooldownRemaining) || 3) * 1000);
    }
});

socket.on('playerEmojiUpdate', (data) => {
    if (data && data.id && data.emoji) {
        activePlayerEmojis[data.id] = { emoji: data.emoji, start: Date.now() };
    }
});

const ROOM_TRANSITION_SPAWNS = {
    kafe: { default: { x: 400, y: 410 } },
    sokak: {
        sahil: { x: 85, y: 240 },
        cadde: { x: 720, y: 240 },
        kafe: { x: 400, y: 125 },
        nargile_cafe: { x: 670, y: 125 },
        market: { x: 730, y: 350 },
        emlakci: { x: 180, y: 130 },
        default: { x: 350, y: 230 }
    },
    cadde: {
        sokak: { x: 80, y: 230 },
        ganyan: { x: 240, y: 145 },
        dedenin_yeri: { x: 590, y: 145 },
        dostlar_kiraathanesi: { x: 650, y: 380 },
        default: { x: 400, y: 230 }
    },
    dostlar_kiraathanesi: {
        cadde: { x: 500, y: 530 },
        default: { x: 500, y: 530 }
    },
    emlakci: { default: { x: 400, y: 410 } },
    sahil: {
        sokak: { x: 680, y: 270 },
        default: { x: 420, y: 350 }
    },
    ganyan: { default: { x: 400, y: 410 } },
    dedenin_yeri: { default: { x: 400, y: 410 } },
    nargile_cafe: { default: { x: 400, y: 390 } },
    market: { default: { x: 400, y: 420 } },
    sanalika_cadde: { default: { x: 750, y: 520 } },
    star_caddesi: {
        sokak: { x: 120, y: 360 },
        default: { x: 500, y: 360 }
    },
    meydanv2: {
        sokak: { x: 500, y: 350 },
        cadde: { x: 920, y: 330 },
        sahil: { x: 500, y: 560 },
        kafe: { x: 380, y: 195 },
        emlakci: { x: 140, y: 195 },
        nargile_cafe: { x: 640, y: 195 },
        market: { x: 880, y: 195 },
        housing_portal: { x: 180, y: 560 },
        default: { x: 500, y: 350 }
    }
};
let sanalikaCamera = { x: 0, y: 0 };
window.sanalikaCamera = sanalikaCamera;
let roomTransitionCooldownUntil = 0;
let roomTransitionFadeAlpha = 0;

// --- 5. MEKAN DEĞİŞTİRME (Üst Butonlar ve Geçişler) ---
function warnHouseEditActive() {
    if (typeof showSocialNotificationToast === 'function') {
        showSocialNotificationToast('⚠️', 'Ev Düzenleme Açık', 'Lütfen önce ev düzenleme ekranını kapatın.');
    } else {
        alert('Lütfen önce ev düzenleme ekranını kapatın.');
    }
}
window.warnHouseEditActive = warnHouseEditActive;

function changeRoom(newRoom, targetSpawn) {
    if (currentRoom && currentRoom.startsWith("house_") && window.isHouseEditMode && newRoom !== currentRoom) {
        warnHouseEditActive();
        return;
    }
    let oldRoom = currentRoom;
    if (!newRoom.startsWith("house_") && typeof stopGramophoneMusic === 'function') {
        stopGramophoneMusic();
    }
    currentRoom = newRoom;
    roomTransitionFadeAlpha = 0.95; // Sinematik mekan geçiş kararması (Fade in)
    // Dinamik Ekran Büyütme (Star Caddesi, Meydan v2, Dostlar Kıraathanesi: 1000 x 625, Diğerleri: 800 x 500)
    if (canvas) {
        if (newRoom === 'star_caddesi' || newRoom === 'meydanv2' || newRoom === 'dostlar_kiraathanesi' || newRoom === 'sahilv2') {
            canvas.width = 1000;
            canvas.height = 625;
            canvas.style.width = '1000px';
            canvas.style.aspectRatio = '1000 / 625';
            canvas.classList.add('wide-screen');
        } else {
            canvas.width = 800;
            canvas.height = 500;
            canvas.style.width = '800px';
            canvas.style.aspectRatio = '800 / 500';
            canvas.classList.remove('wide-screen');
        }
        if (typeof updateCanvasRect === 'function') {
            updateCanvasRect();
        }
    }

    if (typeof bgCache !== 'undefined') bgCache.invalidate();

    if (newRoom === 'sanalika_cadde') {
        sanalikaCamera.x = Math.max(0, Math.min(1600 - canvas.width, 750 - canvas.width / 2));
        sanalikaCamera.y = Math.max(0, Math.min(960 - canvas.height, 520 - canvas.height / 2));
    } else {
        sanalikaCamera.x = 0;
        sanalikaCamera.y = 0;
    }
    if (typeof handleRoomChangedVoice === 'function') {
        handleRoomChangedVoice(newRoom);
    }
    // Kuğu Yalnızca Sahilv2 ve Sahil Haritasına Özeldir: Sahilv2'den başka odaya geçildiğinde anında iptal ve despawn edilir
    if (oldRoom === 'sahilv2' && newRoom !== 'sahilv2') {
        if (typeof myId !== 'undefined' && players[myId]) {
            players[myId].hasSwanBoat = false;
        }
        if (swanBoatCountdownInterval) {
            clearInterval(swanBoatCountdownInterval);
            swanBoatCountdownInterval = null;
        }
        swanBoatSecondsLeft = 0;
    } else if (newRoom !== 'sahil' && newRoom !== 'sahilv2') {
        if (typeof myId !== 'undefined' && players[myId]) {
            players[myId].hasSwanBoat = false;
        }
        if (swanBoatCountdownInterval) {
            clearInterval(swanBoatCountdownInterval);
            swanBoatCountdownInterval = null;
        }
        swanBoatSecondsLeft = 0;
    }

    roomTransitionCooldownUntil = Date.now() + 1500;

    if (typeof keys !== 'undefined') {
        keys.w = false;
        keys.a = false;
        keys.s = false;
        keys.d = false;
    }
    targetWalkPos = null;

    if (typeof myId !== 'undefined' && players[myId]) {
        let p = players[myId];
        p.isMoving = false;
        p.action = null;
        let spawnPos = targetSpawn;
        if (!spawnPos) {
            let roomMap = ROOM_TRANSITION_SPAWNS[newRoom];
            if (roomMap) {
                spawnPos = roomMap[oldRoom] || roomMap.default;
            } else if (newRoom.startsWith("house_")) {
                spawnPos = { x: 400, y: 400 };
            } else {
                spawnPos = { x: 400, y: 300 };
            }
        }
        if (spawnPos) {
            p.x = spawnPos.x;
            p.y = spawnPos.y;
            lastEmittedX = p.x;
            lastEmittedY = p.y;
            lastEmittedMoving = false;
            socket.emit('playerMovement', { x: p.x, y: p.y, isMoving: false });
        }

        // Baba Peti Varsa Oyuncuyla Beraber Anında Yeni Mekana Geçsin
        if (window.activeFatherPets && window.activeFatherPets[myId]) {
            let myPet = window.activeFatherPets[myId];
            myPet.room = newRoom;
            myPet.x = p.x + 32;
            myPet.y = p.y;
            myPet.isMoving = false;
        }

        // Sevimli Patiler Yoldaş Peti Varsa Oyuncuyla Beraber Yeni Mekana Geçsin
        if (window.activeCompanionPets && window.activeCompanionPets[myId]) {
            let myCompPet = window.activeCompanionPets[myId];
            myCompPet.room = newRoom;
            myCompPet.x = p.x + 24;
            myCompPet.y = p.y + 6;
            myCompPet.isMoving = false;
        }
        // Kıraathane İçecekleri Sadece O Mekana Özeldir
        if (currentRoom === 'dostlar_kiraathanesi' && newRoom !== 'dostlar_kiraathanesi') {
            if (p.heldItem && p.heldItem !== 'none') {
                p.heldItem = 'none';
            }
            if (typeof showFloatingToast === 'function') {
                showFloatingToast('☕ Kıraathane içeceği mekana özeldir, masada bırakıldı.');
            }
        }

        // Oyun Masalarından Ayrılma: Kafe veya Kıraathaneden çıkan oyuncu masadan temizce ayrılır
        if ((currentRoom === 'kafe' || currentRoom === 'dostlar_kiraathanesi') && newRoom !== currentRoom) {
            if (window.currentActiveTableId) {
                leaveCurrentTable();
            }
        }
    }

    socket.emit('changeRoom', newRoom);
    const fishBtn = document.getElementById('btnFishAction');
    if (fishBtn) {
        fishBtn.style.display = (newRoom === 'sahil' || newRoom === 'sahilv2') ? 'flex' : 'none';
    }



    updateSwanBoatButtonUI();

    const editBtn = document.getElementById('btnEditHouseFurniture');
    if (typeof updateHouseEditButtonVisibility === 'function') {
        updateHouseEditButtonVisibility();
    } else if (editBtn) {
        let isMyHouse = (newRoom && myUsername && newRoom === `house_${myUsername}`);
        editBtn.style.display = isMyHouse ? 'flex' : 'none';
    }
}

// 🗺️ MEKANLAR AÇILIR MENÜSÜ KONTROLLERİ
window.togglePlacesMenu = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const menu = document.getElementById('placesDropdownMenu');
    if (menu) {
        const isShown = menu.style.display === 'flex' || menu.classList.contains('active');
        if (isShown) {
            menu.style.display = 'none';
            menu.classList.remove('active');
        } else {
            menu.style.display = 'flex';
            menu.classList.add('active');
        }
        const arrow = document.getElementById('placesArrow');
        if (arrow) arrow.style.transform = (menu.style.display === 'flex') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
};

window.selectPlace = function(place) {
    const menu = document.getElementById('placesDropdownMenu');
    if (menu) {
        menu.style.display = 'none';
        menu.classList.remove('active');
    }
    const arrow = document.getElementById('placesArrow');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
    if (place === 'housing_portal') {
        if (typeof openHousingPortalModal === 'function') openHousingPortalModal();
        return;
    }
    if (typeof changeRoom === 'function') {
        changeRoom(place);
    }
};

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('placesDropdownMenu');
    const btn = document.getElementById('placesDropdownBtn');
    if (dropdown && (dropdown.style.display === 'flex' || dropdown.classList.contains('active'))) {
        if (!dropdown.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
            dropdown.style.display = 'none';
            dropdown.classList.remove('active');
            const arrow = document.getElementById('placesArrow');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }
    }
});

let swanBoatCountdownInterval = null;
let swanBoatSecondsLeft = 0;

function updateSwanBoatButtonUI() {
    const swanBtn = document.getElementById('btnSwanBoatAction');
    if (!swanBtn) return;
    swanBtn.style.display = (currentRoom === 'sahil' || currentRoom === 'sahilv2') ? 'flex' : 'none';
    if (players[myId] && players[myId].hasSwanBoat) {
        if (swanBoatSecondsLeft > 0) {
            let m = Math.floor(swanBoatSecondsLeft / 60);
            let s = swanBoatSecondsLeft % 60;
            swanBtn.innerText = `🦢 Kuğu Bisikletindesin (${m}:${s < 10 ? '0' : ''}${s})`;
        } else {
            swanBtn.innerText = "🦢 Kuğu Bisikletindesin (5 Dakika)";
        }
        swanBtn.style.background = "#059669";
    } else {
        swanBtn.innerText = "🦢 Kuğu Deniz Bisikleti Kirala (20 TL)";
        swanBtn.style.background = "linear-gradient(135deg, #f43f5e, #be123c)";
    }
}

function handleRentSwanBoat() {
    socket.emit('rentSwanBoat');
}

socket.on('playerSwanBoatUpdate', (data) => {
    if (players[data.id]) {
        players[data.id].hasSwanBoat = data.hasSwanBoat;
        if (data.id === myId) {
            if (!data.hasSwanBoat) {
                if (swanBoatCountdownInterval) {
                    clearInterval(swanBoatCountdownInterval);
                    swanBoatCountdownInterval = null;
                }
                swanBoatSecondsLeft = 0;
            }
            updateSwanBoatButtonUI();
        }
    }
});

socket.on('swanBoatRented', (data) => {
    swanBoatSecondsLeft = (data && data.duration) ? data.duration : 300;
    if (swanBoatCountdownInterval) clearInterval(swanBoatCountdownInterval);
    updateSwanBoatButtonUI();
    swanBoatCountdownInterval = setInterval(() => {
        swanBoatSecondsLeft--;
        if (swanBoatSecondsLeft <= 0) {
            clearInterval(swanBoatCountdownInterval);
            swanBoatCountdownInterval = null;
            if (players[myId]) players[myId].hasSwanBoat = false;
        }
        updateSwanBoatButtonUI();
    }, 1000);
});

socket.on('swanBoatExpired', () => {
    if (swanBoatCountdownInterval) {
        clearInterval(swanBoatCountdownInterval);
        swanBoatCountdownInterval = null;
    }
    swanBoatSecondsLeft = 0;
    if (players[myId]) players[myId].hasSwanBoat = false;
    updateSwanBoatButtonUI();
});

// --- 5.1 & 5.2 & 5.3 MASA SEÇİMİ, LOBİ, RECONNECT, LİDERLİK TABLOSU & GÜNLÜK GÖREVLER ---
// (Modüler mimariye taşınmıştır: public/js/tableLobbyUI.js ve public/js/gameMenusUI.js)


// --- 5.4 GECE / GÜNDÜZ MODU ---
let isNightMode = false;
function toggleNightMode() {
    isNightMode = !isNightMode;
    if (typeof bgCache !== 'undefined') bgCache.invalidate();
    const toast = document.getElementById('reactionToast');
    if (toast) {
        toast.innerText = isNightMode ? "🌙 Gece Modu Açıldı" : "☀️ Gündüz Modu Açıldı";
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 2000);
    }
}

// --- 5.5 MASA İÇİ REAKSİYONLAR & TEZAHÜRAT ---
function sendTableReaction(reactionText) {
    if (!window.currentActiveTableId) return;
    if (window.playSound) window.playSound('chatPop');
    socket.emit('tableReaction', { tableId: window.currentActiveTableId, reaction: reactionText });
}

socket.on('showReaction', (data) => {
    if (window.playSound) window.playSound('chatPop');
    const toast = document.getElementById('reactionToast');
    if (toast) {
        toast.innerText = `${data.sender}: ${data.text}`;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }
});

// --- 5.6 SOSYAL KARAKTER HAREKETLERİ (Çay, Dans, El Salla, Alkış) ---
function triggerPlayerAction(action) {
    socket.emit('playerAction', { action: action });
    if (action === 'tea' && window.playSound) window.playSound('chatPop');
    else if (action === 'clap' && window.playSound) window.playSound('card');
}

socket.on('playerActionUpdate', (data) => {
    if (players[data.id]) {
        players[data.id].action = data.action;
        players[data.id].hasTea = data.hasTea;
    }
});

// --- 5.7 TUR SÜRESİ GERİ SAYIM ÇUBUĞU ---
let turnTimerInterval = null;
function startTurnTimer(durationSec) {
    const container = document.getElementById('turnTimerContainer');
    const bar = document.getElementById('turnTimerBar');
    if (!container || !bar) return;

    container.style.display = 'block';
    bar.style.transition = 'none';
    bar.style.width = '100%';
    bar.style.backgroundColor = '#22c55e';
    bar.classList.remove('timer-urgent-pulse');

    if (turnTimerInterval) clearInterval(turnTimerInterval);

    let start = Date.now();
    let totalMs = (durationSec || 30) * 1000;
    let lastTickSec = -1;

    turnTimerInterval = setInterval(() => {
        let elapsed = Date.now() - start;
        let leftMs = Math.max(0, totalMs - elapsed);
        let leftRatio = Math.max(0, leftMs / totalMs);
        let leftSec = Math.ceil(leftMs / 1000);
        bar.style.width = (leftRatio * 100) + '%';

        if (leftSec <= 7 && leftSec > 0) {
            bar.style.backgroundColor = '#ef4444';
            bar.classList.add('timer-urgent-pulse');
            if (leftSec !== lastTickSec) {
                lastTickSec = leftSec;
                if (window.playSound) window.playSound('tick');
            }
        } else if (leftRatio > 0.5) {
            bar.style.backgroundColor = '#22c55e';
            bar.classList.remove('timer-urgent-pulse');
        } else if (leftRatio > 0.25) {
            bar.style.backgroundColor = '#f59e0b';
            bar.classList.remove('timer-urgent-pulse');
        } else {
            bar.style.backgroundColor = '#ef4444';
        }

        if (leftRatio <= 0) {
            bar.classList.remove('timer-urgent-pulse');
            clearInterval(turnTimerInterval);
            turnTimerInterval = null;
        }
    }, 100);
}

// --- 6. OYUN BAŞLATMA VE LOBİ ---
socket.on('startGame', (gameType) => {
    closeTableSelectModal();
    const statusEl = document.getElementById('modalStatus');
    if (statusEl) statusEl.innerText = 'Oyun başladı!';
    if (gameType === 'xox') {
        const gameModal = document.getElementById('gameModal');
        if (gameModal) gameModal.style.display = 'none';
        if (typeof openXoxModal === 'function') openXoxModal();
        return;
    }
    if (gameType === 'amiral') {
        const gameModal = document.getElementById('gameModal');
        if (gameModal) gameModal.style.display = 'none';
        if (typeof openAmiralBattiModal === 'function') openAmiralBattiModal();
        return;
    }

    const modal = document.getElementById('gameModal');
    modal.style.display = 'block';

    // Modalı her açıldığında tekrar ortaya hizala
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.left = '50%';
    modal.style.top = '50%';

    const bArea = document.getElementById('billiardArea');
    const batakArea = document.getElementById('batakArea');
    const tavlaArea = document.getElementById('tavlaArea');
    const dkArea = document.getElementById('dostKazigiArea');
    const okeyArea = document.getElementById('okey101Area');

    if (bArea) bArea.style.display = 'none';
    if (batakArea) batakArea.style.display = 'none';
    if (tavlaArea) tavlaArea.style.display = 'none';
    if (dkArea) dkArea.style.display = 'none';
    if (okeyArea) okeyArea.style.display = 'none';

    if (gameType === 'billiard') {
        if (bArea) bArea.style.display = 'block';
    } else if (gameType === 'batak' || gameType === 'batak4') {
        if (batakArea) batakArea.style.display = 'block';
    } else if (gameType === 'tavla') {
        if (tavlaArea) tavlaArea.style.display = 'block';
    } else if (gameType === 'dost_kazigi' || gameType === 'dost_kazigi_3p') {
        if (dkArea) dkArea.style.display = 'block';
    } else if (gameType === 'okey101' || gameType === 'okey101_tekli') {
        if (okeyArea) okeyArea.style.display = 'block';
    }
    const lobbyBotBtn = document.getElementById('lobbyAddBotBtn');
    if (lobbyBotBtn) lobbyBotBtn.style.display = 'none';
});

socket.on('updateTableLobby', (data) => {
    if (!data) return;
    window.currentActiveTableId = data.tableId;
    const modal = document.getElementById('gameModal');
    if (modal) {
        modal.style.display = 'block';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.left = '50%';
        modal.style.top = '50%';
    }
    const statusEl = document.getElementById('modalStatus');
    if (statusEl) {
        statusEl.innerText = `Lobi: ${data.name} (${data.count}/${data.min} Oyuncu Bekleniyor)`;
    }
    const lobbyBotBtn = document.getElementById('lobbyAddBotBtn');
    if (lobbyBotBtn) {
        lobbyBotBtn.style.display = (data.count < data.min) ? 'inline-block' : 'none';
    }
});

socket.on('gameError', (msg) => {
    const errToast = document.getElementById('errorToast');
    if (errToast) {
        errToast.innerText = msg;
        errToast.style.display = 'block';
        setTimeout(() => { errToast.style.display = 'none'; }, 3500);
    }
    if (typeof showSocialNotificationToast === 'function') {
        showSocialNotificationToast('⚠️', 'Uyarı', msg);
    }
});

function resetAllTableUIs() {
    window.isSpectating = false;
    window.currentActiveTableId = null;
    if (window.leaveTableVoiceChat) window.leaveTableVoiceChat();
    const lobbyBotBtn = document.getElementById('lobbyAddBotBtn');
    if (lobbyBotBtn) lobbyBotBtn.style.display = 'none';
    if (turnTimerInterval) { clearInterval(turnTimerInterval); turnTimerInterval = null; }
    const tContainer = document.getElementById('turnTimerContainer');
    if (tContainer) tContainer.style.display = 'none';
    const gModal = document.getElementById('gameModal');
    if (gModal) {
        gModal.style.display = 'none';
        gModal.style.transform = 'translate(-50%, -50%)';
        gModal.style.left = '50%';
        gModal.style.top = '50%';
        gModal.style.animation = '';
    }
    const xoxModal = document.getElementById('xoxModal');
    if (xoxModal) xoxModal.style.display = 'none';
    const amiralModal = document.getElementById('amiralBattiModal');
    if (amiralModal) amiralModal.style.display = 'none';
    const chessModal = document.getElementById('chessModal');
    if (chessModal) chessModal.style.display = 'none';
    const bArea = document.getElementById('billiardArea');
    if (bArea) bArea.style.display = 'none';
    const batakArea = document.getElementById('batakArea');
    if (batakArea) batakArea.style.display = 'none';
    const tavlaArea = document.getElementById('tavlaArea');
    if (tavlaArea) tavlaArea.style.display = 'none';
    const okeyArea = document.getElementById('okey101Area');
    if (okeyArea) okeyArea.style.display = 'none';
    const dkArea = document.getElementById('dostKazigiArea');
    if (dkArea) dkArea.style.display = 'none';
    const banner = document.getElementById('spectatorBanner');
    if (banner) banner.style.display = 'none';
    if (window.closeVoidHandModal) window.closeVoidHandModal();
    const bOverlay = document.getElementById('billiardRematchOverlay');
    if (bOverlay) bOverlay.style.display = 'none';
    const batakYazboz = document.getElementById('batakYazbozModal');
    if (batakYazboz) batakYazboz.style.display = 'none';
    const fundsModal = document.getElementById('insufficientFundsModal');
    if (fundsModal) fundsModal.style.display = 'none';
    const leaveModal = document.getElementById('gameLeaveConfirmModal');
    if (leaveModal) leaveModal.style.display = 'none';
    const dock = document.getElementById('minimizedGameDock');
    if (dock) dock.style.display = 'none';
    window.activeMinimizedGame = null;
}
window.resetAllTableUIs = resetAllTableUIs;

window.activeMinimizedGame = null;

function getOpenGameModal() {
    const xox = document.getElementById('xoxModal');
    if (xox && xox.style.display !== 'none' && xox.style.display !== '') {
        return { id: 'xoxModal', type: 'flex', name: '❌ XOX Düellosu' };
    }
    const amiral = document.getElementById('amiralBattiModal');
    if (amiral && amiral.style.display !== 'none' && amiral.style.display !== '') {
        return { id: 'amiralBattiModal', type: 'flex', name: '⚓ Amiral Battı' };
    }
    const chess = document.getElementById('chessModal');
    if (chess && chess.style.display !== 'none' && chess.style.display !== '') {
        return { id: 'chessModal', type: 'flex', name: '♟️ Satranç' };
    }
    const game = document.getElementById('gameModal');
    if (game && game.style.display !== 'none' && game.style.display !== '') {
        const titleEl = document.getElementById('modalTitle');
        const title = (titleEl && titleEl.innerText) ? titleEl.innerText.trim() : '🎮 Oyun Masası';
        return { id: 'gameModal', type: (game.style.display === 'flex' ? 'flex' : 'block'), name: title };
    }
    return null;
}
window.getOpenGameModal = getOpenGameModal;

function minimizeCurrentGame() {
    const openGame = getOpenGameModal();
    if (!openGame) return;

    window.activeMinimizedGame = openGame;
    const modalEl = document.getElementById(openGame.id);
    if (modalEl) modalEl.style.display = 'none';

    const dock = document.getElementById('minimizedGameDock');
    const dockTitle = document.getElementById('minimizedGameTitle');
    if (dockTitle) dockTitle.innerText = openGame.name;
    if (dock) dock.style.display = 'flex';

    if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎮 ${openGame.name} alta alındı.`);
    }
}
window.minimizeCurrentGame = minimizeCurrentGame;

function restoreMinimizedGame() {
    const dock = document.getElementById('minimizedGameDock');
    if (dock) dock.style.display = 'none';

    if (window.activeMinimizedGame) {
        const modalEl = document.getElementById(window.activeMinimizedGame.id);
        if (modalEl) {
            modalEl.style.display = window.activeMinimizedGame.type || 'flex';
        }
        window.activeMinimizedGame = null;
    } else {
        const gModal = document.getElementById('gameModal');
        if (gModal && window.currentActiveTableId) {
            gModal.style.display = 'block';
        }
    }
}
window.restoreMinimizedGame = restoreMinimizedGame;

function promptLeaveCurrentGame() {
    const leaveModal = document.getElementById('gameLeaveConfirmModal');
    if (leaveModal) {
        leaveModal.style.display = 'flex';
    }
}
window.promptLeaveCurrentGame = promptLeaveCurrentGame;

function closeLeaveConfirmModal() {
    const leaveModal = document.getElementById('gameLeaveConfirmModal');
    if (leaveModal) {
        leaveModal.style.display = 'none';
    }
}
window.closeLeaveConfirmModal = closeLeaveConfirmModal;

function confirmLeaveCurrentGame() {
    closeLeaveConfirmModal();

    if (window.activeMinimizedGame) {
        const modalEl = document.getElementById(window.activeMinimizedGame.id);
        if (modalEl) modalEl.style.display = 'none';
        window.activeMinimizedGame = null;
    }
    const dock = document.getElementById('minimizedGameDock');
    if (dock) dock.style.display = 'none';

    if (typeof closeXoxModal === 'function') closeXoxModal();
    if (typeof closeAmiralBattiModal === 'function') closeAmiralBattiModal();

    leaveCurrentTable();
}
window.confirmLeaveCurrentGame = confirmLeaveCurrentGame;

function closeTopmostGeneralModal() {
    const isVisible = (id) => {
        const el = document.getElementById(id);
        return el && el.style.display !== 'none' && el.style.display !== '';
    };

    if (isVisible('wardrobeModal')) { if (typeof closeWardrobe === 'function') closeWardrobe(); return true; }
    if (isVisible('itemInventoryModal')) { if (typeof closeItemInventoryModal === 'function') closeItemInventoryModal(); return true; }
    if (isVisible('playerInteractionModal')) { if (typeof closePlayerInteractionModal === 'function') closePlayerInteractionModal(); return true; }
    if (isVisible('sendMoneyModal')) { if (typeof closeSendMoneyModal === 'function') closeSendMoneyModal(); return true; }
    if (isVisible('giftItemModal')) { if (typeof closeGiftItemModal === 'function') closeGiftItemModal(); return true; }
    if (isVisible('onlinePlayersModal')) { if (typeof closeOnlinePlayersModal === 'function') closeOnlinePlayersModal(); return true; }
    if (isVisible('friendsListModal')) { if (typeof closeFriendsListModal === 'function') closeFriendsListModal(); return true; }
    if (isVisible('dailyQuestsModal')) { if (typeof closeDailyQuestsModal === 'function') closeDailyQuestsModal(); return true; }
    if (isVisible('realEstateModal')) { if (typeof closeRealEstateModal === 'function') closeRealEstateModal(); return true; }
    if (isVisible('maketInspectModal')) { if (typeof closeMaketInspectModal === 'function') closeMaketInspectModal(); return true; }
    if (isVisible('houseConfirmModal')) { if (typeof closeHouseConfirmModal === 'function') closeHouseConfirmModal(); return true; }
    if (isVisible('furnitureMarketModal')) { if (typeof closeFurnitureMarketModal === 'function') closeFurnitureMarketModal(); return true; }
    if (isVisible('housingPortalModal')) { if (typeof closeHousingPortalModal === 'function') closeHousingPortalModal(); return true; }
    if (isVisible('tableSelectModal')) { if (typeof closeTableSelectModal === 'function') closeTableSelectModal(); return true; }
    if (isVisible('leaderboardModal')) { if (typeof closeLeaderboardModal === 'function') closeLeaderboardModal(); return true; }
    if (isVisible('petShopModal')) { if (typeof closePetShopModal === 'function') closePetShopModal(); return true; }
    if (isVisible('adminPanelModal')) { if (typeof closeAdminPanelModal === 'function') closeAdminPanelModal(); return true; }
    if (isVisible('changePasswordModal')) { if (typeof closeChangePasswordModal === 'function') closeChangePasswordModal(); return true; }
    if (isVisible('settingsModal')) { if (typeof closeSettingsModal === 'function') closeSettingsModal(); return true; }
    if (isVisible('mysteryBoxRewardModal')) { if (typeof closeMysteryBoxRewardModal === 'function') closeMysteryBoxRewardModal(); return true; }
    if (isVisible('ganyanKuponModal')) { if (typeof closeGanyanKuponModal === 'function') closeGanyanKuponModal(); return true; }
    if (isVisible('blackjackModal')) { if (typeof closeBlackjackModal === 'function') closeBlackjackModal(); return true; }
    if (isVisible('rouletteModal')) { if (typeof closeRouletteModal === 'function') closeRouletteModal(); return true; }
    if (isVisible('slotModal')) { if (typeof closeSlotModal === 'function') closeSlotModal(); return true; }
    if (isVisible('kiraathaneBarModal')) { if (typeof closeKiraathaneBarModal === 'function') closeKiraathaneBarModal(); return true; }
    if (isVisible('cocktailBarModal')) { if (typeof closeCocktailBarModal === 'function') closeCocktailBarModal(); return true; }
    if (isVisible('nargileMenuModal')) { if (typeof closeNargileMenuModal === 'function') closeNargileMenuModal(); return true; }
    if (isVisible('nargileCoalsModal')) { if (typeof closeNargileCoalsModal === 'function') closeNargileCoalsModal(); return true; }
    if (isVisible('batakYazbozModal')) { if (typeof closeBatakYazbozModal === 'function') closeBatakYazbozModal(); return true; }
    if (isVisible('okey101YazbozModal')) { if (typeof closeYazbozModal === 'function') closeYazbozModal(); return true; }

    return false;
}
window.closeTopmostGeneralModal = closeTopmostGeneralModal;

function closeGameModalOnly() {
    minimizeCurrentGame();
}
window.closeGameModalOnly = closeGameModalOnly;

function leaveCurrentTable() {
    if (socket) {
        if (window.currentActiveTableId) {
            socket.emit('closeTable', { tableId: window.currentActiveTableId });
        }
        socket.emit('leaveTable');
    }
    window.currentActiveTableId = null;
    resetAllTableUIs();
    if (typeof showFloatingToast === 'function') {
        showFloatingToast('🚪 Masadan ayrıldınız.');
    }
}
window.leaveCurrentTable = leaveCurrentTable;

socket.on('opponentLeft', (data) => {
    let msg = (data && data.message) ? data.message : "Rakip masadan ayrıldı";
    if (typeof showSocialNotificationToast === 'function') {
        showSocialNotificationToast('⚠️', 'Masa Kapatıldı', msg);
    } else if (typeof showFloatingToast === 'function') {
        showFloatingToast(`⚠️ ${msg}`);
    }
    resetAllTableUIs();
});

socket.on('tableLeft', () => {
    window.currentActiveTableId = null;
    resetAllTableUIs();
});

socket.on('tableClosed', (data) => {
    let closedId = typeof data === 'object' ? data?.tableId : data;
    if (!closedId || (window.currentActiveTableId && window.currentActiveTableId === closedId)) {
        window.currentActiveTableId = null;
        resetAllTableUIs();
    }
    const tableSelectModal = document.getElementById('tableSelectModal');
    if (tableSelectModal && tableSelectModal.style.display === 'flex' && window.currentSelectedBaseType && socket) {
        socket.emit('requestTableOptions', window.currentSelectedBaseType);
    }
});

socket.on('kiraathaneDrinkCleared', () => {
    if (typeof players !== 'undefined' && typeof myId !== 'undefined' && players[myId]) {
        players[myId].heldItem = 'none';
    }
    if (typeof showFloatingToast === 'function') {
        showFloatingToast('☕ Kıraathane içecekleri sadece o mekana özeldir, masada bırakıldı.');
    }
});

socket.on('insufficientFundsWarning', (data) => {
    const modal = document.getElementById('insufficientFundsModal');
    const msgEl = document.getElementById('insufficientFundsMsg');
    if (msgEl && data && data.message) {
        msgEl.innerText = data.message;
    }
    if (modal) modal.style.display = 'flex';
    if (window.playSound) window.playSound('denied');
});

function closeInsufficientFundsModal() {
    const modal = document.getElementById('insufficientFundsModal');
    if (modal) modal.style.display = 'none';
    leaveCurrentTable();
}
window.closeInsufficientFundsModal = closeInsufficientFundsModal;

function goToFreeTables() {
    const modal = document.getElementById('insufficientFundsModal');
    if (modal) modal.style.display = 'none';
    leaveCurrentTable();
    if (typeof showSocialNotificationToast === 'function') {
        showSocialNotificationToast('🆓', 'Ücretsiz Masalar', 'Masa menüsünden 0 TL bahisli ücretsiz masaları seçebilirsiniz.');
    }
}
window.goToFreeTables = goToFreeTables;


// --- 7. MOUSE VE HOVER TAKİBİ (SIFIR LAYOUT THRASHING) ---
let canvasMouseX = -1, canvasMouseY = -1;
let hoveredTableId = null;
let cachedCanvasRect = null;

function updateCanvasRect() {
    if (canvas) cachedCanvasRect = canvas.getBoundingClientRect();
}
window.addEventListener('resize', updateCanvasRect);
window.addEventListener('scroll', updateCanvasRect, { passive: true });
window.addEventListener('orientationchange', updateCanvasRect);

canvas.addEventListener('mousemove', (e) => {
    if (!cachedCanvasRect) updateCanvasRect();
    let rect = cachedCanvasRect;
    canvasMouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    canvasMouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (currentRoom === 'sahil') {
        let isVendorHover = (canvasMouseX >= 90 && canvasMouseX <= 175 && canvasMouseY >= 145 && canvasMouseY <= 235);
        let isBarHover = (canvasMouseX >= 645 && canvasMouseX <= 785 && canvasMouseY >= 385 && canvasMouseY <= 475);
        let isWaterHover = (canvasMouseX < 560 || canvasMouseY < 320);
        let isExitHover = (canvasMouseX >= canvas.width - 66 && canvasMouseY >= 210 && canvasMouseY <= 310);
        if (isVendorHover || isBarHover || isWaterHover || isExitHover) {
            setGameCursor('pointer');
        } else {
            setGameCursor('default');
        }
    } else if (currentRoom === 'nargile_cafe') {
        let isOverTekli = (canvasMouseX >= 145 && canvasMouseX <= 365 && canvasMouseY >= 160 && canvasMouseY <= 360);
        let isOverEsli = (canvasMouseX >= 435 && canvasMouseX <= 655 && canvasMouseY >= 160 && canvasMouseY <= 360);
        let isOverExit = (canvasMouseX >= canvas.width / 2 - 45 && canvasMouseX <= canvas.width / 2 + 45 && canvasMouseY >= canvas.height - 75 && canvasMouseY <= canvas.height - 5);
        let isOverKitchen = (canvasMouseX >= canvas.width - 115 && canvasMouseX <= canvas.width - 10 && canvasMouseY >= canvas.height - 75 && canvasMouseY <= canvas.height - 5);
        let isOverSolLoca = (canvasMouseX >= 25 && canvasMouseX <= 215 && canvasMouseY >= 50 && canvasMouseY <= 175);
        let isOverSagLoca = (canvasMouseX >= 585 && canvasMouseX <= 775 && canvasMouseY >= 50 && canvasMouseY <= 175);
        if (isOverTekli || isOverEsli || isOverExit || isOverKitchen || isOverSolLoca || isOverSagLoca) {
            setGameCursor('pointer');
        } else {
            setGameCursor('default');
        }
    } else if (currentRoom === 'market') {
        setGameCursor('pointer');
    }
});

canvas.addEventListener('mouseleave', () => {
    canvasMouseX = -1;
    canvasMouseY = -1;
    setGameCursor('default');
});

// Kafedeki masaların koordinatları (VIP Ferah Salon & Genişletilmiş Açık Koridor Düzeni)
// (Batak ve Gömmeli Batak masaları Dostlar Kıraathanesi'ne taşınmıştır)
const cafeTables = [
    { id: 'billiard', x: 35, y: 110, w: 145, h: 78, name: '8-Ball Bilardo' },
    { id: 'tavla', x: 62, y: 300, w: 105, h: 74, name: 'Geleneksel Tavla' },
    { id: 'xox', x: 239, y: 120, w: 86, h: 74, name: 'XOX Düellosu' },
    { id: 'amiral', x: 476, y: 120, w: 92, h: 74, name: 'Amiral Battı' },
    { id: 'chess', x: 650, y: 220, w: 96, h: 74, name: 'Satranç Masası' }
];

// Dedenin Yeri Kumarhanesindeki Canlı Masalar
const casinoTables = [
    { id: 'blackjack', x: 310, y: 155, w: 180, h: 135, name: 'Canlı Blackjack 21' }
];

// Akıcı Tap-to-Walk ve Dokunma Efektleri
let targetWalkPos = null;
let tapRipples = [];
let lastCanvasTapTime = 0;

// --- 7.5 KOLTUĞA, SANDALYEYE, TABUREYE VE BANKA OTURMA MEKANİĞİ ---
function sitPlayerAt(seatX, seatY, facing = 'down') {
    if (!players[myId]) return;
    myFacing = facing;
    players[myId].x = seatX;
    players[myId].y = seatY;
    players[myId].facing = facing;
    players[myId].action = 'sitting';
    keys.w = false; keys.a = false; keys.s = false; keys.d = false;
    targetWalkPos = null;
    socket.emit('playerMovement', { x: seatX, y: seatY, facing: facing });
    socket.emit('playerAction', { action: 'sitting' });
    if (typeof showFloatingIcon === 'function') {
        showFloatingIcon(myId, '🛋️');
    }

    // Nargile mekanında koltuğa oturunca sunucuya bildir ve menüyü aç
    if (currentRoom === 'nargile_cafe') {
        let tId = null, sIdx = 0;
        // Sol Üst Loca Koltukları (x: 30..220, y: 55..170)
        if (seatX <= 220 && seatY <= 170) {
            tId = 'lounge_sol';
            sIdx = (seatY < 100 ? (seatX < 135 ? 0 : 1) : (seatY < 135 ? 2 : 3));
            socket.emit('nargile_sit_table', { tableId: tId, seatIndex: sIdx });
            if (typeof window.checkAndOpenNargileMenu === 'function') {
                window.checkAndOpenNargileMenu(tId);
            }
        }
        // Sağ Üst Loca Koltukları (x: 585..775, y: 55..170)
        else if (seatX >= 585 && seatY <= 170) {
            tId = 'lounge_sag';
            sIdx = (seatY < 100 ? (seatX < 670 ? 0 : 1) : (seatY < 135 ? 2 : 3));
            socket.emit('nargile_sit_table', { tableId: tId, seatIndex: sIdx });
            if (typeof window.checkAndOpenNargileMenu === 'function') {
                window.checkAndOpenNargileMenu(tId);
            }
        }
        // NOT: 101 Okey masalarına oturunca nargile menüsü AÇILMAZ! 101 masaları sadece oyun içindir.
    }
}

function standUpIfSitting(intendedDir = null) {
    if (!players[myId]) return;
    let p = players[myId];
    if (p.action === 'sitting') {
        p.action = null;
        socket.emit('playerAction', { action: 'stand' });
        if (currentRoom === 'nargile_cafe') {
            socket.emit('nargile_stand_table');
        }

        // Koltuktan/sandalyeden kalkarken katı çarpışma kutusunun dışına güvenli adım at
        let stepDist = 32;
        let testDirs = [];
        if (intendedDir === 'up') testDirs = [{ dx: 0, dy: -stepDist }, { dx: 0, dy: stepDist }, { dx: -stepDist, dy: 0 }, { dx: stepDist, dy: 0 }];
        else if (intendedDir === 'left') testDirs = [{ dx: -stepDist, dy: 0 }, { dx: 0, dy: stepDist }, { dx: stepDist, dy: 0 }, { dx: 0, dy: -stepDist }];
        else if (intendedDir === 'right') testDirs = [{ dx: stepDist, dy: 0 }, { dx: 0, dy: stepDist }, { dx: -stepDist, dy: 0 }, { dx: 0, dy: -stepDist }];
        else if (intendedDir === 'down') testDirs = [{ dx: 0, dy: stepDist }, { dx: -stepDist, dy: 0 }, { dx: stepDist, dy: 0 }, { dx: 0, dy: -stepDist }];
        else testDirs = [{ dx: 0, dy: stepDist }, { dx: 0, dy: -stepDist }, { dx: -stepDist, dy: 0 }, { dx: stepDist, dy: 0 }];

        let foundSafe = false;
        for (let td of testDirs) {
            let tx = p.x + td.dx;
            let ty = p.y + td.dy;
            if (!checkWorldCollision(tx, ty)) {
                p.x = tx;
                p.y = ty;
                foundSafe = true;
                break;
            }
        }
        if (!foundSafe) {
            for (let d of [24, 38, 48, 58]) {
                for (let td of testDirs) {
                    let scale = d / stepDist;
                    let tx = Math.round(p.x + td.dx * scale);
                    let ty = Math.round(p.y + td.dy * scale);
                    if (!checkWorldCollision(tx, ty)) {
                        p.x = tx;
                        p.y = ty;
                        foundSafe = true;
                        break;
                    }
                }
                if (foundSafe) break;
            }
        }

        socket.emit('playerMovement', { x: p.x, y: p.y, facing: myFacing });
    }
}

// --- 7.6 YAKINDAKİ KOLTUK, SANDALYE VEYA BANKI TESPİT ETME VE E TUŞU İLE OTURMA ---
// Fonksiyonlar ve koltuk listeleri modüler public/js/seatRegistry.js dosyasında yüksek performanslı ve sıfır-tahsisli olarak çalışır.
// Geriye dönük uyumluluk güvencesi:
var findNearestSittableSeat = (typeof window.findNearestSittableSeat === 'function') 
    ? window.findNearestSittableSeat 
    : function() { return null; };

var checkAndSitOnNearestFurnitureOrChair = (typeof window.checkAndSitOnNearestFurnitureOrChair === 'function') 
    ? window.checkAndSitOnNearestFurnitureOrChair 
    : function() { return false; };


// Eski click fonksiyonu geriye dönük uyumluluk için güvenli no-op / kontrol
function checkAndSitOnFurnitureOrChair(clickX, clickY) {
    return false;
}

function handleCanvasTapOrClick(clickX, clickY) {
    if (window.wasFurnitureDragged) {
        window.wasFurnitureDragged = false;
        return;
    }
    let now = Date.now();
    if (now - lastCanvasTapTime < 140) return;
    lastCanvasTapTime = now;

    // Dünya koordinatlarına çevir (Eğer kamera aktifse)
    let camX = (currentRoom === 'sanalika_cadde' && window.sanalikaCamera) ? window.sanalikaCamera.x : 0;
    let camY = (currentRoom === 'sanalika_cadde' && window.sanalikaCamera) ? window.sanalikaCamera.y : 0;
    let worldX = clickX + camX;
    let worldY = clickY + camY;

    // 1. ÖNCELİK: Başka bir oyuncunun üzerine tıklama kontrolü (Sosyal Etkileşim Menüsü)
    let clickedOtherPlayer = null;
    for (let id in players) {
        if (id === myId) continue;
        let p = players[id];
        let dist = Math.hypot(worldX - p.x, worldY - p.y);
        if (dist <= 26) {
            clickedOtherPlayer = { id, player: p };
            break;
        }
    }
    if (clickedOtherPlayer) {
        if (typeof openPlayerInteractionModal === 'function') {
            openPlayerInteractionModal(clickedOtherPlayer.id, clickedOtherPlayer.player);
        }
        return;
    }

    // 2. ÖNCELİK: Kendi üzerine tıklayarak oturuyorsa ayağa kalkma
    if (players[myId] && players[myId].action === 'sitting') {
        let myDist = Math.hypot(worldX - players[myId].x, worldY - players[myId].y);
        if (myDist <= 28) {
            standUpIfSitting();
            return;
        }
    }

    // 3. Modüler Mekan Etkileşim Motoru (public/js/roomInteractions.js)
    if (typeof handleRoomInteractionClick === 'function') {
        let handled = handleRoomInteractionClick(worldX, worldY, currentRoom, players[myId], (currentRoom === 'sanalika_cadde' ? 1600 : canvas.width), (currentRoom === 'sanalika_cadde' ? 960 : canvas.height));
        if (handled) return;
    }

    // Geriye Dönük Uyumluluk ve Test Güvencesi:
    // (openXoxModal(), openAmiralBattiModal(), openBlackjackModal() referansları)
    if (currentRoom === 'kafe' && typeof cafeTables !== 'undefined') {
        cafeTables.forEach(obj => {
            if (clickX >= obj.x && clickX <= obj.x + obj.w && clickY >= obj.y && clickY <= obj.y + obj.h) {
                if (obj.id === 'xox' && typeof openXoxModal === 'function') openXoxModal();
                else if (obj.id === 'amiral' && typeof openAmiralBattiModal === 'function') openAmiralBattiModal();
                else if (obj.id === 'blackjack' && typeof openBlackjackModal === 'function') openBlackjackModal();
            }
        });
    }

    // 4. ZEMİNE TIKLAYARAK / DOKUNARAK YÜRÜME (TAP-TO-WALK)
    let clickAllowed = !window.movementSettings || window.movementSettings.clickEnabled !== false;
    if (!clickAllowed) {
        targetWalkPos = null;
        return;
    }

    if (players[myId]) {
        if (players[myId].action === 'sitting') {
            standUpIfSitting();
        }
        let targetX, targetY;
        if (currentRoom === 'sanalika_cadde') {
            targetX = Math.max(30, Math.min(1570, worldX));
            targetY = Math.max(45, Math.min(925, worldY));
        } else {
            targetX = Math.max(16, Math.min(canvas.width - 16, clickX));
            targetY = Math.max(38, Math.min(canvas.height - 20, clickY));
        }

        targetWalkPos = { x: targetX, y: targetY };
        if (!tapRipples) tapRipples = [];
        tapRipples.push({ x: targetX, y: targetY, radius: 4, alpha: 1.0 });
        if (tapRipples.length > 5) tapRipples.shift();
    }
}

canvas.addEventListener('click', (e) => {
    if (!cachedCanvasRect) updateCanvasRect();
    let rect = cachedCanvasRect;
    let clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    let clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
    handleCanvasTapOrClick(clickX, clickY);
});

canvas.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
        let t = e.touches[0];
        if (!cachedCanvasRect) updateCanvasRect();
        let rect = cachedCanvasRect;
        let clickX = (t.clientX - rect.left) * (canvas.width / rect.width);
        let clickY = (t.clientY - rect.top) * (canvas.height / rect.height);
        handleCanvasTapOrClick(clickX, clickY);
    }
}, { passive: true });

// Mekana / Kapıya / Koridora Tıklayınca Yürüyüp Öyle Geçiş Yapma Motoru
function navigatePlayerToDoor(targetDoorX, targetDoorY, targetRoom, onReachAction) {
    if (typeof myId === 'undefined' || !players[myId]) {
        if (onReachAction) onReachAction();
        else if (targetRoom && typeof changeRoom === 'function') changeRoom(targetRoom);
        return;
    }
    let p = players[myId];
    if (p.action === 'sitting' && typeof standUpIfSitting === 'function') {
        standUpIfSitting();
    }
    let dist = Math.hypot(p.x - targetDoorX, p.y - targetDoorY);
    // Zaten kapının hemen yanındaysa beklemeden geç
    if (dist <= 28) {
        if (onReachAction) onReachAction();
        else if (targetRoom && typeof changeRoom === 'function') changeRoom(targetRoom);
        return;
    }

    targetWalkPos = {
        x: targetDoorX,
        y: targetDoorY,
        targetRoom: targetRoom,
        onReach: onReachAction,
        isVenueDoor: true
    };

    if (!tapRipples) tapRipples = [];
    tapRipples.push({ x: targetDoorX, y: targetDoorY, radius: 4, alpha: 1.0 });
    if (tapRipples.length > 5) tapRipples.shift();
}
window.navigatePlayerToDoor = navigatePlayerToDoor;


// --- 8. WASD VE 8 AÇILI İZOMETRİK YÖN KONTROLLERİ ---
let myFacing = 'down';
let walkCycle = 0;

function calculate8WayFacing(dx, dy) {
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return null;
    let angle = Math.atan2(dy, dx);
    let octant = Math.round(angle / (Math.PI / 4));
    if (octant < 0) octant += 8;
    octant = octant % 8;
    const directions = [
        'right',        // 0: 0 deg (E)   - Sağa
        'down-right',   // 1: 45 deg (SE) - Sağ İleri
        'down',         // 2: 90 deg (S)  - Öne
        'down-left',    // 3: 135 deg (SW) - Sol İleri
        'left',         // 4: 180 deg (W)  - Sola
        'up-left',      // 5: 225 deg (NW) - Sol Geri
        'up',           // 6: 270 deg (N)  - Arkaya
        'up-right'      // 7: 315 deg (NE) - Sağ Geri
    ];
    return directions[octant] || 'down';
}
window.calculate8WayFacing = calculate8WayFacing;

function update8WayFacingFromKeys() {
    let kx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    let ky = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    if (kx !== 0 || ky !== 0) {
        let p = (typeof players !== 'undefined') ? players[myId] : null;
        let curModel = (p && p.model) || (typeof myAvatar !== 'undefined' && myAvatar.model) || 'classic_2';
        let isClassic = (curModel !== 'classic_2' && curModel !== 'sanalika_v2');
        let newFacing;
        if (isClassic) {
            // Nostaljik Klasik Model: 8'li dönme yok, sadece 4 ana yön
            if (kx !== 0 && ky === 0) newFacing = kx > 0 ? 'right' : 'left';
            else if (ky !== 0 && kx === 0) newFacing = ky > 0 ? 'down' : 'up';
            else {
                // Çapraz basıldığında klasik nostaljik yön: yatay yön (sağ / sol)
                newFacing = kx > 0 ? 'right' : 'left';
            }
        } else {
            newFacing = calculate8WayFacing(kx, ky);
        }
        if (newFacing) {
            myFacing = newFacing;
            if (p) {
                p.facing = newFacing;
            }
            standUpIfSitting(newFacing);
        }
    }
}

// Alt+Tab veya pencere odak kaybında tuş takılmasını (Sticky Keys) önleme
window.addEventListener('blur', () => {
    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;
    targetWalkPos = null;
});

window.addEventListener('keydown', (e) => {
    // 1. ENTER TUŞU YÖNETİMİ
    if (e.key === 'Enter') {
        // Masadan ayrılma onay modalı açıksa Enter ile onayla
        const leaveConfirmModal = document.getElementById('gameLeaveConfirmModal');
        if (leaveConfirmModal && leaveConfirmModal.style.display === 'flex') {
            e.preventDefault();
            confirmLeaveCurrentGame();
            return;
        }

        // Eğer kullanıcı bir yazı inputundaysa normal input davranışını bozma
        let activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || document.activeElement?.isContentEditable) {
            return;
        }

        // Gardırop açıksa Enter ile Kaydet & Kapat
        const wardrobeModal = document.getElementById('wardrobeModal');
        if (wardrobeModal && wardrobeModal.style.display === 'flex') {
            e.preventDefault();
            if (typeof closeWardrobe === 'function') closeWardrobe();
            return;
        }

        // Şanslı kutu ödül modalı açıksa Enter ile kapat
        const mysteryBox = document.getElementById('mysteryBoxRewardModal');
        if (mysteryBox && mysteryBox.style.display === 'flex') {
            e.preventDefault();
            if (typeof closeMysteryBoxRewardModal === 'function') closeMysteryBoxRewardModal();
            return;
        }
    }

    // 2. ESCAPE (ESC) TUŞU YÖNETİMİ
    if (e.key === 'Escape' || e.key === 'Esc') {
        // Masadan ayrılma onay modalı açıksa Esc ile iptal et / kapat
        const leaveConfirmModal = document.getElementById('gameLeaveConfirmModal');
        if (leaveConfirmModal && leaveConfirmModal.style.display === 'flex') {
            e.preventDefault();
            closeLeaveConfirmModal();
            return;
        }

        // Açık oyun masası/düellosu varsa ESC ile hiçbir şey sormadan oyunu alta al
        const openGame = getOpenGameModal();
        if (openGame) {
            e.preventDefault();
            minimizeCurrentGame();
            return;
        }

        // Genel pencereler/sekmeler açıksa (gardırop, eşya, vb.) sekmeyi kapat
        let closedAny = closeTopmostGeneralModal();
        if (closedAny) {
            e.preventDefault();
            return;
        }

        // Eğer bir input içerisindeyse odağı kaldır (blur)
        let activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (['INPUT', 'TEXTAREA'].includes(activeTag)) {
            document.activeElement.blur();
            return;
        }
    }

    let activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || document.activeElement?.isContentEditable) return;

    // 'C' Tuşu ile Oyun İçi veya Oyun Dışı Sesli Sohbeti Aç / Kapat / Konuş
    if (e.key === 'c' || e.key === 'C') {
        if (typeof toggleGlobalVoiceChat === 'function') {
            toggleGlobalVoiceChat();
        }
        return;
    }

    // Aktif oyun masası veya tam ekran pencereler açıkken arka planda karakterin yürümesini engelle
    let gameModal = document.getElementById('gameModal');
    if (gameModal && gameModal.style.display === 'flex') return;
    let wardrobeModal = document.getElementById('wardrobeModal');
    if (wardrobeModal && wardrobeModal.style.display === 'flex') return;
    let ganyanModal = document.getElementById('ganyanKuponModal');
    if (ganyanModal && ganyanModal.style.display === 'flex') return;
    let bjModal = document.getElementById('blackjackModal');
    if (bjModal && bjModal.style.display === 'flex') return;
    let rouletteModal = document.getElementById('rouletteModal');
    if (rouletteModal && rouletteModal.style.display === 'flex') return;
    let slotModal = document.getElementById('slotModal');
    if (slotModal && slotModal.style.display === 'flex') return;

    let wasdAllowed = !window.movementSettings || window.movementSettings.wasdEnabled !== false;
    if (wasdAllowed) {
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') { keys.w = true; targetWalkPos = null; }
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { keys.a = true; targetWalkPos = null; }
        if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') { keys.s = true; targetWalkPos = null; }
        if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { keys.d = true; targetWalkPos = null; }
        update8WayFacingFromKeys();
    }

    if (e.key === 'e' || e.key === 'E') { triggerMobileInteract(); }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.w = false;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.s = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.d = false;
    update8WayFacingFromKeys();
});

function setKey(dir, isPressed) {
    let wasdAllowed = !window.movementSettings || window.movementSettings.wasdEnabled !== false;
    if (isPressed && !wasdAllowed) {
        keys[dir] = false;
        return;
    }
    keys[dir] = isPressed;
    update8WayFacingFromKeys();
    if (isPressed) targetWalkPos = null;
}

function handleTouchKey(dir, isPressed, event) {
    if (event && event.cancelable) event.preventDefault();
    if (isPressed && typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(10); } catch (e) { }
    }
    setKey(dir, isPressed);
}

// Mobil Etkileşim ("E" Tuşu) İşlevi
function triggerMobileInteract() {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(20); } catch (e) { }
    }
    if (!players[myId]) return;
    let p = players[myId];

    // 1. Zaten oturuyorsa E tuşuna basınca AYAĞA KALK
    if (p.action === 'sitting') {
        standUpIfSitting();
        return;
    }

    // 2. Bir koltuk/sandalye/sedir/bank yakınındaysa E tuşu ile OTUR
    if (checkAndSitOnNearestFurnitureOrChair()) {
        return;
    }

    // 3. Modüler Yakınlık Etkileşim Yöneticisi (public/js/roomInteractions.js)
    if (typeof handleRoomMobileInteract === 'function') {
        let handled = handleRoomMobileInteract(p, currentRoom, canvas.width, canvas.height);
        if (handled) return;
    }

    // Geriye Dönük Uyumluluk ve Test Güvencesi:
    if (currentRoom === 'kafe' && typeof cafeTables !== 'undefined') {
        let nearest = null;
        let minDist = 120;
        cafeTables.forEach(t => {
            let cx = t.x + t.w / 2;
            let cy = t.y + t.h / 2;
            let dist = Math.hypot(p.x - cx, p.y - cy);
            if (dist < minDist) { minDist = dist; nearest = t; }
        });
        if (nearest) {
            if (nearest.id === 'xox' && typeof openXoxModal === 'function') openXoxModal();
            else if (nearest.id === 'amiral' && typeof openAmiralBattiModal === 'function') openAmiralBattiModal();
            else if (nearest.id === 'blackjack' && typeof openBlackjackModal === 'function') openBlackjackModal();
        }
    }
}

// Mobil Sanal Kumanda Aç/Kapat Butonu
function toggleMobileDpad() {
    let dpad = document.getElementById('mobileControlsOverlay');
    let actionBtn = document.getElementById('mobileActionBtn');
    if (!dpad) return;
    let isHidden = (dpad.style.display === 'none' || dpad.style.display === '');
    dpad.style.display = isHidden ? 'block' : 'none';
    if (actionBtn) actionBtn.style.display = isHidden ? 'flex' : 'none';
}


// --- 2. ANA OYUN VE ÇİZİM DÖNGÜSÜ (GAME LOOP) ---
// --- 10. ANA OYUN VE ÇİZİM DÖNGÜSÜ (GAME LOOP & AKICI HAREKET SENKRONU) ---
let lastMovementEmitTime = 0;
let lastEmittedX = -9999;
let lastEmittedY = -9999;
let lastEmittedMoving = false;
let lastGameLoopTime = 0;
const MOVEMENT_EMIT_INTERVAL_MS = 38; // ~26 Hz (Ağı şişirmeyen, mükemmel pürüzsüz ağ güncelleme sıklığı)
const _playerSortPool = []; // Sıfır Garbage Collection (GC) derinlik sıralama havuzu

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);
    let now = performance.now();
    let dt = lastGameLoopTime ? Math.min((now - lastGameLoopTime) / 1000, 0.1) : 0.016;
    lastGameLoopTime = now;

    // Kamera Takibi ve Yumuşak Enterpolasyon (Lerp)
    if (currentRoom === 'sanalika_cadde' && players[myId]) {
        let p = players[myId];
        let targetCamX = p.x - canvas.width / 2;
        let targetCamY = p.y - canvas.height / 2;
        targetCamX = Math.max(0, Math.min(1600 - canvas.width, targetCamX));
        targetCamY = Math.max(0, Math.min(960 - canvas.height, targetCamY));
        sanalikaCamera.x += (targetCamX - sanalikaCamera.x) * Math.min(1, 14 * dt);
        sanalikaCamera.y += (targetCamY - sanalikaCamera.y) * Math.min(1, 14 * dt);
    } else {
        sanalikaCamera.x = 0;
        sanalikaCamera.y = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let isCamActive = (currentRoom === 'sanalika_cadde' && (sanalikaCamera.x !== 0 || sanalikaCamera.y !== 0));
    if (isCamActive) {
        ctx.save();
        ctx.translate(-Math.round(sanalikaCamera.x), -Math.round(sanalikaCamera.y));
    }

    // 1. Ortamı Çiz
    if (currentRoom === "kafe") {
        drawCafeEnvironment();
    } else if (currentRoom === "sahil") {
        drawBeachEnvironment();
    } else if (currentRoom === "nargile_cafe") {
        drawNargileCafeEnvironment();
    } else if (currentRoom === "market") {
        drawMarketEnvironment();
    } else if (currentRoom === "ganyan") {
        if (typeof drawGanyanEnvironment === 'function') drawGanyanEnvironment();
    } else if (currentRoom === "cadde") {
        if (typeof drawCaddeEnvironment === 'function') drawCaddeEnvironment();
    } else if (currentRoom === "dedenin_yeri") {
        if (typeof drawDedeninYeriEnvironment === 'function') drawDedeninYeriEnvironment();
    } else if (currentRoom === "emlakci") {
        if (typeof drawEmlakciEnvironment === 'function') drawEmlakciEnvironment();
    } else if (currentRoom === "dostlar_kiraathanesi") {
        if (typeof drawDostlarKiraathanesiEnvironment === 'function') drawDostlarKiraathanesiEnvironment();
    } else if (currentRoom === "sanalika_cadde") {
        if (typeof drawSanalikaCaddeEnvironment === 'function') drawSanalikaCaddeEnvironment();
    } else if (currentRoom === "star_caddesi") {
        if (typeof drawStarCaddesiEnvironment === 'function') drawStarCaddesiEnvironment();
    } else if (currentRoom === "meydanv2") {
        if (typeof drawMeydanV2Environment === 'function') drawMeydanV2Environment();
    } else if (currentRoom === "sahilv2") {
        if (typeof drawSahilV2Environment === 'function') drawSahilV2Environment();
    } else if (currentRoom.startsWith("house_")) {
        if (typeof drawHouseEnvironment === 'function') drawHouseEnvironment();
    } else {
        drawStreetEnvironment();
    }

    // 1.1 Tıklayarak Yürüme Efekti (Expanding Tap Ripples FX)
    if (tapRipples && tapRipples.length > 0) {
        ctx.save();
        for (let i = tapRipples.length - 1; i >= 0; i--) {
            let r = tapRipples[i];
            r.radius += 38 * dt;
            r.alpha -= 2.4 * dt;
            if (r.alpha <= 0) {
                tapRipples.splice(i, 1);
                continue;
            }
            // Dış yumuşak cyan aura (Sıfır Gaussian blur maliyeti, %100 GPU dostu 60-120 FPS)
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, r.alpha * 0.35)})`;
            ctx.lineWidth = 4.8;
            ctx.stroke();

            // Orta net cyan halka
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, r.alpha)})`;
            ctx.lineWidth = 2.0;
            ctx.stroke();

            // İç altın sarısı halka
            ctx.beginPath();
            ctx.arc(r.x, r.y, Math.max(1, r.radius * 0.45), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(251, 191, 36, ${Math.max(0, r.alpha * 0.85)})`;
            ctx.lineWidth = 1.4;
            ctx.stroke();
        }
        ctx.restore();
    }

    // 2. Kendi Oyuncumuzu Hareket Ettir (Normal hız: 2.6; Atlı hız: 6.5 - Kullanıcı isteği: %30 artırıldı)
    if (players[myId]) {
        let isMounted = !!(players[myId] && players[myId].hasHorse);
        let myPet = (typeof window.activeCompanionPets !== 'undefined' && players[myId])
            ? (window.activeCompanionPets[myId] || Object.values(window.activeCompanionPets).find(pet => pet && (pet.ownerId === myId || pet.ownerName === players[myId].name)))
            : null;
        let hasCat = !!(myPet && myPet.petType === 'cat');
        let speed = isMounted ? 6.5 : (hasCat ? 2.6 * 1.3 : 2.6);

        // Kuğu Hız Kuralları (Sahil & Sahil V2): Kumsal/İskele 1x (2.6), Deniz/Su 2x (5.2)
        let isSwanInWater = false;
        if ((currentRoom === 'sahil' || currentRoom === 'sahilv2') && players[myId] && players[myId].hasSwanBoat) {
            if (currentRoom === 'sahilv2' && typeof isSahilV2Water === 'function') {
                isSwanInWater = isSahilV2Water(players[myId].x, players[myId].y);
            } else if (currentRoom === 'sahil') {
                let onPier = (players[myId].x >= 70 && players[myId].x <= 555 && players[myId].y >= 150 && players[myId].y <= 235);
                let shoreX = (typeof getBeachShoreX === 'function') ? getBeachShoreX(players[myId].y) : 300;
                isSwanInWater = (players[myId].x < shoreX && !onPier);
            }
            speed = isSwanInWater ? 5.2 : 2.6;
        }
        let p = players[myId];
        let isMoving = false;
        let moveDx = 0;
        let moveDy = 0;

        let wasdAllowed = !window.movementSettings || window.movementSettings.wasdEnabled !== false;
        let clickAllowed = !window.movementSettings || window.movementSettings.clickEnabled !== false;

        let hasKeyInput = wasdAllowed && (keys.w || keys.s || keys.a || keys.d);
        if (hasKeyInput) {
            targetWalkPos = null; // Klavye yön tuşuna basıldığı an tıklama rotasını iptal et
            if (keys.w) moveDy -= speed;
            if (keys.s) moveDy += speed;
            if (keys.a) moveDx -= speed;
            if (keys.d) moveDx += speed;

            // Çapraz yürüyüş hız normalizasyonu (%41 hız fazlalığını eşitler)
            if (moveDx !== 0 && moveDy !== 0) {
                moveDx *= 0.70710678;
                moveDy *= 0.70710678;
            }
        } else if ((clickAllowed || (targetWalkPos && targetWalkPos.isVenueDoor)) && targetWalkPos) {
            let tdx = targetWalkPos.x - p.x;
            let tdy = targetWalkPos.y - p.y;
            let dist = Math.hypot(tdx, tdy);
            if (dist < 4.5) {
                let pendingRoom = targetWalkPos.targetRoom;
                let pendingAction = targetWalkPos.onReach;
                targetWalkPos = null;
                moveDx = 0;
                moveDy = 0;
                p.vx = 0;
                p.vy = 0;
                if (pendingAction) {
                    pendingAction();
                } else if (pendingRoom && typeof changeRoom === 'function') {
                    changeRoom(pendingRoom);
                }
            } else {
                let stepDist = Math.min(speed, dist);
                moveDx = (tdx / dist) * stepDist;
                moveDy = (tdy / dist) * stepDist;
            }
        }

        // Yürüyüş İvmelenmesi / Yumuşatması (Momentum & Velocity Easing)
        if (p.vx === undefined) p.vx = 0;
        if (p.vy === undefined) p.vy = 0;
        const accelFactor = 1 - Math.exp(-24 * dt); // Hızlı, tatmin edici ve organik ivmelenme
        p.vx += (moveDx - p.vx) * accelFactor;
        p.vy += (moveDy - p.vy) * accelFactor;
        if (Math.abs(p.vx) < 0.04 && moveDx === 0) p.vx = 0;
        if (Math.abs(p.vy) < 0.04 && moveDy === 0) p.vy = 0;

        const TARGET_DT = 0.016667;
        const timeScale = Math.min(dt / TARGET_DT, 2.5);

        let activeVx = p.vx;
        let activeVy = p.vy;

        if (Math.abs(activeVx) > 0.01 || Math.abs(activeVy) > 0.01) {
            let curModel = (p && p.model) || (typeof myAvatar !== 'undefined' && myAvatar.model) || 'classic_2';
            let isClassic = (curModel !== 'classic_2' && curModel !== 'sanalika_v2');
            let curDir;
            if ((p && p.hasSwanBoat) || isMounted) {
                // Kuğu ve binek atı her zaman 8 yönlü pürüzsüz dönüş kullanır
                curDir = calculate8WayFacing(activeVx, activeVy) || myFacing;
            } else if (isClassic) {
                // Nostaljik klasik model: 8'li dönme yok, 4 ana yön
                if (Math.abs(activeVx) >= Math.abs(activeVy)) {
                    curDir = activeVx > 0 ? 'right' : 'left';
                } else {
                    curDir = activeVy > 0 ? 'down' : 'up';
                }
            } else {
                curDir = calculate8WayFacing(activeVx, activeVy) || myFacing;
            }
            myFacing = curDir;
            if (p) {
                p.facing = curDir;
                p.isMoving = true;
                p.walkCycle = walkCycle;
            }
            standUpIfSitting(curDir);
            isMoving = true;
            let prevWalkCycle = walkCycle;
            walkCycle += (isMounted ? 0.45 : 0.21) * timeScale;

            // Ritmik doğal adım, at toynak sesi veya su pedalı sesi
            if (Math.floor(walkCycle / Math.PI) !== Math.floor(prevWalkCycle / Math.PI)) {
                if (window.playSound) {
                    if (isMounted) {
                        window.playSound('hoofbeat');
                    } else if (isSwanInWater) {
                        window.playSound('waterPaddle');
                    } else {
                        window.playSound('footstep');
                    }
                }
            }

            let nextX = p.x + activeVx * timeScale;
            let nextY = p.y + activeVy * timeScale;

            let colX = checkWorldCollision(nextX, p.y);
            let colY = checkWorldCollision(p.x, nextY);

            // Akıllı Köşe Kayması (Corner Nudging & Sliding)
            // Bir engele (masa, sandalye, duvar köşesi) takıldığında karakterin köşeden yumuşakça sıyrılmasını sağla
            const nudgeScan = 6;
            const nudgeAmount = 1.7 * timeScale;
            if (colX && Math.abs(activeVx) > 0.1) {
                let upOpen = !checkWorldCollision(nextX, p.y - nudgeScan) && !checkWorldCollision(p.x, p.y - nudgeScan);
                let downOpen = !checkWorldCollision(nextX, p.y + nudgeScan) && !checkWorldCollision(p.x, p.y + nudgeScan);
                if (upOpen && !downOpen) {
                    p.y -= nudgeAmount;
                } else if (downOpen && !upOpen) {
                    p.y += nudgeAmount;
                }
            }
            if (colY && Math.abs(activeVy) > 0.1) {
                let leftOpen = !checkWorldCollision(p.x - nudgeScan, nextY) && !checkWorldCollision(p.x - nudgeScan, p.y);
                let rightOpen = !checkWorldCollision(p.x + nudgeScan, nextY) && !checkWorldCollision(p.x + nudgeScan, p.y);
                if (leftOpen && !rightOpen) {
                    p.x -= nudgeAmount;
                } else if (rightOpen && !leftOpen) {
                    p.x += nudgeAmount;
                }
            }

            // Eğer tıklayarak yürüme sırasında tam duvara veya köşeye çarpıp iki eksende de ilerleyemiyorsa rotayı sonlandır
            if (targetWalkPos && colX && colY) {
                targetWalkPos = null;
                p.vx = 0;
                p.vy = 0;
            }

            // Eğer oyuncu halihazırda bir mobilya/engel içindeyse (örneğin sandalyeden yeni kalktıysa):
            // Çıkış adımına izin vererek kitlenmeyi tamamen önle
            let isStuckInObstacle = checkWorldCollision(p.x, p.y);
            if (isStuckInObstacle) {
                p.x = nextX;
                p.y = nextY;
            } else {
                if (!colX) p.x = nextX;
                if (!colY) p.y = nextY;
            }
        } else {
            walkCycle = 0; // Durduğunda adım döngüsünü sıfırla (idle netliği)
            if (p) {
                p.isMoving = false;
                p.walkCycle = 0;
            }
        }

        // Mekanlar Arası Kesintisiz Yürüyerek Geçiş Koridorları (Modüler public/js/roomInteractions.js)
        if (Date.now() >= roomTransitionCooldownUntil) {
            if (typeof checkRoomWalkPortals === 'function') {
                let targetRoom = checkRoomWalkPortals(p, currentRoom, canvas.width, canvas.height);
                if (targetRoom) {
                    targetWalkPos = null;
                    p.vx = 0;
                    p.vy = 0;
                    changeRoom(targetRoom);
                    return;
                }
            }
        }

        let minBoundX = (currentRoom === "sanalika_cadde") ? 30 : ((currentRoom === "sokak" || currentRoom === "cadde") ? 12 : 18);
        let maxBoundX = (currentRoom === "sanalika_cadde") ? 1570 : ((currentRoom === "sokak" || currentRoom === "sahil") ? canvas.width - 12 : canvas.width - 18);
        let minBoundY = (currentRoom === "sanalika_cadde") ? 45 : 38;
        let maxBoundY = (currentRoom === "sanalika_cadde") ? 920 : canvas.height - 20;
        p.x = Math.max(minBoundX, Math.min(maxBoundX, p.x));
        p.y = Math.max(minBoundY, Math.min(maxBoundY, p.y));

        // Ağ Trafiği Throttling & Hassas Sayı Sıkıştırması (Bant Genişliği %40 Tasarruf)
        let posChanged = (Math.abs(p.x - lastEmittedX) > 0.3 || Math.abs(p.y - lastEmittedY) > 0.3);
        if (isMoving) {
            if (posChanged && (now - lastMovementEmitTime >= MOVEMENT_EMIT_INTERVAL_MS)) {
                lastMovementEmitTime = now;
                lastEmittedX = p.x;
                lastEmittedY = p.y;
                lastEmittedMoving = true;
                let emitX = Math.round(p.x * 10) / 10;
                let emitY = Math.round(p.y * 10) / 10;
                socket.emit('playerMovement', { x: emitX, y: emitY, isMoving: true, facing: myFacing });
            }
        } else if (lastEmittedMoving) {
            // Oyuncu yeni durdu! Son net pozisyonu kesinleştirici paket olarak gönder
            lastMovementEmitTime = now;
            lastEmittedX = p.x;
            lastEmittedY = p.y;
            lastEmittedMoving = false;
            let emitX = Math.round(p.x * 10) / 10;
            let emitY = Math.round(p.y * 10) / 10;
            socket.emit('playerMovement', { x: emitX, y: emitY, isMoving: false, facing: myFacing });
        }
    }

    // 3. Uzaktaki (Remote) Oyuncuların Yumuşak Delta-Time Lerp Hareketi ve Adım Senkronizasyonu
    let lerpFactor = 1 - Math.exp(-22 * dt); // 60-120Hz monitörlerde pürüzsüz ve mikro-gecikmesiz enterpolasyon
    for (let id in players) {
        if (id !== myId) {
            let p = players[id];
            if (p.targetX !== undefined && p.targetY !== undefined) {
                let dx = p.targetX - p.x;
                let dy = p.targetY - p.y;
                let dist = Math.hypot(dx, dy);
                if (dist > 85 || p.action === 'sitting') {
                    // Işınlanma, kapıdan geçiş veya oturma anında duvarlardan kaymayı engelle
                    p.x = p.targetX;
                    p.y = p.targetY;
                    p.isMoving = (p.serverMoving === true);
                    p.walkCycle = 0;
                } else if (!p.serverMoving && dist <= 2.5) {
                    // Stop Snapping: Oyuncu durdu ve hedef noktaya çok yakın: anında sabitle ve hayalet adımları kes
                    p.x = p.targetX;
                    p.y = p.targetY;
                    p.isMoving = false;
                    p.walkCycle = 0;
                } else if (dist > 0.8) {
                    p.x += dx * lerpFactor;
                    p.y += dy * lerpFactor;
                    p.isMoving = true;
                    p.walkCycle = (p.walkCycle || 0) + (17 * dt);
                    // 2.2 Yön Geçişlerinde Yumuşak Dönüş (Facing Lerp / Turn Smoothing)
                    let isClassic = (p && p.model !== 'classic_2' && p.model !== 'sanalika_v2');
                    if (isClassic) {
                        if (Math.abs(dx) >= Math.abs(dy)) {
                            p.facing = dx > 0 ? 'right' : 'left';
                        } else {
                            p.facing = dy > 0 ? 'down' : 'up';
                        }
                    } else {
                        let cur8 = calculate8WayFacing(dx, dy);
                        if (cur8) p.facing = cur8;
                    }
                } else {
                    p.x = p.targetX;
                    p.y = p.targetY;
                    p.isMoving = (p.serverMoving === true);
                    if (!p.isMoving) p.walkCycle = 0;
                }
            }
        }
    }

    // 4. Tüm Oyuncuları Derinlik (Y) Sırasına Göre Çiz (Sıfır-Tahsis / Zero-GC Havuzlama)
    let poolIdx = 0;
    for (let id in players) {
        let pObj = players[id];
        if (pObj) {
            let entry = _playerSortPool[poolIdx];
            if (!entry) {
                entry = { id: id, p: pObj, y: pObj.y || 0 };
                _playerSortPool[poolIdx] = entry;
            } else {
                entry.id = id;
                entry.p = pObj;
                entry.y = pObj.y || 0;
            }
            poolIdx++;
        }
    }
    _playerSortPool.length = poolIdx;
    _playerSortPool.sort((a, b) => a.y - b.y);
    for (let i = 0; i < _playerSortPool.length; i++) {
        let item = _playerSortPool[i];
        drawAnimatedPlayer(item.p, item.id);
    }

    if (typeof updateAndRenderFatherPets === 'function') {
        updateAndRenderFatherPets(ctx, dt);
    }

    if (typeof updateAndRenderCompanionPets === 'function') {
        updateAndRenderCompanionPets(ctx, dt);
    }

    // 5. Nargile Cafe Yoğun Ekran Dumanı (20. Fırt Felaketi: Tüm ekranı 5 sn kaplayıp kimseyi göstermez)
    if (currentRoom === 'nargile_cafe' && typeof window.drawNargileScreenSmoke === 'function') {
        window.drawNargileScreenSmoke(ctx);
    }

    // Kamera koordinat matrisini geri yükle
    if (isCamActive) {
        ctx.restore();
    }

    // 5.1 Sanalika 1. Cadde HUD Sokak İsimliği ve Koordinat Göstergesi
    if (currentRoom === 'sanalika_cadde') {
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.beginPath();
        ctx.roundRect(14, 14, 205, 34, 10);
        ctx.fill();
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("📍 1. CADDE (İzometrik)", 24, 34);

        if (players[myId]) {
            let px = Math.round(players[myId].x);
            let py = Math.round(players[myId].y);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "10px monospace";
            ctx.textAlign = "right";
            ctx.fillText(`${px}, ${py}`, 206, 34);
        }
        ctx.restore();
    }

    // 6. Sinematik Mekan Geçiş Kararması / Açılması (Fade Transition)
    if (roomTransitionFadeAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(15, 23, 42, ${roomTransitionFadeAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        roomTransitionFadeAlpha = Math.max(0, roomTransitionFadeAlpha - dt * 4.5);
    }
}


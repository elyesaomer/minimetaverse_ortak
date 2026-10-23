// public/js/petShop.js - Sevimli Patiler Pet Shop İstemci ve Evcil Hayvan Çizim Motoru

window.activeCompanionPets = window.activeCompanionPets || {};
window.activePetSpawnEffects = window.activePetSpawnEffects || [];

// 1. PET SHOP MODAL KONTROLLERİ
function openPetShopModal() {
    if (window.playSound) window.playSound('uiClick');

    const modal = document.getElementById('petShopModal');
    if (!modal) return;

    // Bakiye göstergesini güncelle
    const moneyDisplay = document.getElementById('userMoneyDisplay');
    const petMoneyEl = document.getElementById('petShopUserMoney');
    if (petMoneyEl && moneyDisplay) {
        petMoneyEl.innerText = `${moneyDisplay.innerText} TL`;
    }

    // Sunucudan güncel durumu iste
    if (window.socket && window.socket.connected) {
        window.socket.emit('getPetShopStatus');
    }

    modal.style.display = 'flex';
}
window.openPetShopModal = openPetShopModal;

function closePetShopModal() {
    const modal = document.getElementById('petShopModal');
    if (modal) modal.style.display = 'none';
}
window.closePetShopModal = closePetShopModal;

function requestBuyPet(petType) {
    if (window.playSound) window.playSound('uiClick');

    if (window.socket && window.socket.connected) {
        window.socket.emit('requestBuyPet', { petType: petType });
    }
}
window.requestBuyPet = requestBuyPet;


// 2. SOKET DİNLEYİCİLERİ
(function initPetShopSockets() {
    const s = window.socket || (typeof io !== 'undefined' ? io() : null);
    if (!s) return;

    // Odadaki tüm aktif yoldaşlar listesi geldiğinde
    s.on('activeCompanionPets', (petsList) => {
        if (!Array.isArray(petsList)) return;
        let oldPets = Object.assign({}, window.activeCompanionPets);
        window.activeCompanionPets = {};
        petsList.forEach(pet => {
            if (pet) {
                let key = pet.ownerId || pet.id;
                let existing = oldPets[key];
                if (existing) {
                    pet.curX = existing.curX !== undefined ? existing.curX : pet.x;
                    pet.curY = existing.curY !== undefined ? existing.curY : pet.y;
                    pet.walkCycle = existing.walkCycle || 0;
                    pet.facing = existing.facing || pet.facing || 'down';
                } else {
                    pet.curX = pet.x;
                    pet.curY = pet.y;
                    pet.walkCycle = 0;
                }
                window.activeCompanionPets[key] = pet;
            }
        });
        if (typeof myId !== 'undefined' && oldPets[myId] && !window.activeCompanionPets[myId]) {
            window.activeCompanionPets[myId] = oldPets[myId];
        }
    });

    // Yeni bir yoldaş odaya girdiğinde / sahiplenildiğinde
    s.on('companionPetSpawned', (data) => {
        if (!data || !data.pet) return;
        const pet = data.pet;
        let key = pet.ownerId || pet.id;
        let existing = window.activeCompanionPets[key];
        if (existing) {
            pet.curX = existing.curX !== undefined ? existing.curX : pet.x;
            pet.curY = existing.curY !== undefined ? existing.curY : pet.y;
            pet.walkCycle = existing.walkCycle || 0;
        } else {
            pet.curX = pet.x;
            pet.curY = pet.y;
            pet.walkCycle = 0;
        }
        window.activeCompanionPets[key] = pet;

        // Kendi evcil hayvanımızsa modalı kapat
        if (typeof myId !== 'undefined' && pet.ownerId === myId) {
            closePetShopModal();
        }
    });

    // Yoldaş odadan ayrıldığında veya süresi bittiğinde
    s.on('companionPetDespawned', (data) => {
        if (!data) return;
        if (data.ownerId && window.activeCompanionPets[data.ownerId]) {
            delete window.activeCompanionPets[data.ownerId];
        }
        if (data.petId && window.activeCompanionPets[data.petId]) {
            delete window.activeCompanionPets[data.petId];
        }
    });

    // Yoldaş konuştuğunda
    s.on('companionPetSpeak', (data) => {
        if (!data) return;
        const pet = (data.ownerId && window.activeCompanionPets[data.ownerId]) || (data.petId && window.activeCompanionPets[data.petId]);
        if (pet) {
            pet.speech = data.speech;
            pet.speechUntil = Date.now() + 6000;
        }
    });

    // Pet süresi dolduğunda
    s.on('companionPetExpired', (data) => {
        if (typeof showSocialNotificationToast === 'function') {
            showSocialNotificationToast('⏳', 'Yoldaşının Süresi Doldu', data.message || 'Evcil hayvanın yuvasına döndü.');
        }
    });

    // Satın alma başarılı yanıtı (YALNIZCA BURADA BİLDİRİM GÖSTER)
    s.on('buyPetSuccess', (data) => {
        closePetShopModal();
        if (window.playSound) window.playSound('win');
        if (data && data.pet) {
            let pet = data.pet;
            let key = pet.ownerId || pet.id;
            let existing = window.activeCompanionPets[key];
            if (existing) {
                pet.curX = existing.curX !== undefined ? existing.curX : pet.x;
                pet.curY = existing.curY !== undefined ? existing.curY : pet.y;
                pet.walkCycle = existing.walkCycle || 0;
            } else {
                pet.curX = pet.x;
                pet.curY = pet.y;
                pet.walkCycle = 0;
            }
            window.activeCompanionPets[key] = pet;

            // Sadece satın alma anında bildirim çıksın
            if (typeof showSocialNotificationToast === 'function') {
                showSocialNotificationToast('🐾', 'Yeni Yoldaş!', `${pet.name} (${pet.emoji || '🐾'}) artık seninle geziyor!`);
            }
        }
    });

    // Pet Shop durum bilgisi geldiğinde
    s.on('petShopStatus', (data) => {
        if (!data) return;
        const noticeEl = document.getElementById('petShopActivePetNotice');
        if (noticeEl) {
            if (data.activePet) {
                const mins = Math.ceil(data.activePet.remainingMs / 60000);
                noticeEl.style.display = 'block';
                noticeEl.innerHTML = `⏳ Şu anda aktif bir yoldaşın var: <b>${data.activePet.name} (${data.activePet.emoji})</b> (${mins} dk kaldı). Yeni bir pet alırsan eskisinin yerini alır.`;
            } else {
                noticeEl.style.display = 'none';
            }
        }
        const moneyEl = document.getElementById('petShopUserMoney');
        if (moneyEl && data.money !== undefined) {
            moneyEl.innerText = `${data.money.toLocaleString()} TL`;
        }
    });
})();


// Pet Animasyon Durumları Enum Yapısı
const PetAnimState = Object.freeze({
    IDLE: 'idle',
    WALK: 'walk',
    SPECIAL_IDLE: 'special_idle'
});
window.PetAnimState = PetAnimState;

// 3. ANİMASYON VE ÇİZİM DÖNGÜSÜ (GAME LOOP HOOK)
function calculatePet8WayFacing(dx, dy) {
    if (typeof window.calculate8WayFacing === 'function') {
        return window.calculate8WayFacing(dx, dy);
    }
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return null;

    const octant = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
    return ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'][octant];
}

function drawSingleCompanionPet(ctx, pet, x, y, now) {
    ctx.save();
    const hasDetailedRenderer = ['mouse', 'cat', 'dog'].includes(pet.petType) && window.TfmMouseRenderer;
    if (hasDetailedRenderer) {
        ctx.translate(x, y);

        let animToPlay = PetAnimState.IDLE;
        let frameToPlay = 0;

        if (pet.animState === PetAnimState.SPECIAL_IDLE) {
            animToPlay = 'special_idle';
            const elapsed = Math.max(0, now - (pet.specialIdleStart || now));
            const duration = pet.specialIdleDuration || 2500;
            const progress = Math.min(0.999, elapsed / duration);
            frameToPlay = Math.floor(progress * 4);
        } else if (pet.isMoving || pet.animState === PetAnimState.WALK) {
            animToPlay = 'walk';
            frameToPlay = Math.floor(pet.walkCycle || 0) % 4;
        } else {
            animToPlay = 'idle';
            // Kedi dururken arkasını dönüp dönüp durmasın, sabit kalsın (frame 0).
            // Sadece animasyona (special_idle veya walk) girince hareket etsin.
            if (pet.petType === 'cat') {
                frameToPlay = 0;
            } else {
                frameToPlay = Math.floor(now / 450) % 4;
            }
        }

        window.TfmMouseRenderer.draw(ctx, {
            direction: pet.facing || 'down',
            animation: animToPlay,
            frame: frameToPlay,
            scale: pet.petType === 'mouse' ? 0.80 : 0.75,
            showShadow: true,
            species: pet.petType
        });
    } else {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '30px sans-serif';
        ctx.fillText(pet.emoji || '🐾', x, y - 12);
    }

    if (pet.speech && pet.speechUntil > now) {
        ctx.font = '12px sans-serif';
        const text = String(pet.speech).slice(0, 60);
        const width = Math.min(220, Math.max(70, ctx.measureText(text).width + 20));
        const bubbleX = hasDetailedRenderer ? -width / 2 : x - width / 2;
        const bubbleY = hasDetailedRenderer ? -44 : y - 52;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, width, 28, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, hasDetailedRenderer ? 0 : x, bubbleY + 14, width - 12);
    }
    ctx.restore();
}

function updateAndRenderCompanionPets(ctx, dt) {
    if (!window.activeCompanionPets) return;
    const now = Date.now();
    const curR = (typeof currentRoom !== 'undefined') ? currentRoom : window.currentRoom;

    for (const id in window.activeCompanionPets) {
        const pet = window.activeCompanionPets[id];
        if (!pet) continue;

        // Sahibinin konumunu bul
        let owner = null;
        if (typeof players !== 'undefined') {
            owner = players[pet.ownerId];
        }
        if (owner && owner.room) {
            pet.room = owner.room;
        }

        // Yalnızca şu anki odadaysa çiz
        if (curR && pet.room && pet.room !== curR) continue;

        if (pet.curX === undefined) pet.curX = pet.x || 400;
        if (pet.curY === undefined) pet.curY = pet.y || 400;
        if (!pet.animState) pet.animState = PetAnimState.IDLE;

        // Karakterin ayak hizası (owner.y + 21) ve dip dibe girmeyecek şekilde yan konumu (36px)
        let targetX = pet.x;
        let targetY = pet.y;
        let ownerIsMoving = false;

        if (owner) {
            let isFacingLeft = (owner.facing === 'left' || owner.facing === 'up-left' || owner.facing === 'down-left');
            let offsetSide = isFacingLeft ? 36 : -36;
            let offsetY = 21; // Karakterin ayakkabılarının zemin temas seviyesi
            targetX = owner.x + offsetSide;
            targetY = owner.y + offsetY;

            // Karakterin yürüyüş tespiti (hangi yöne yürürse yürüsün)
            if (owner.isMoving || owner.moving || owner.serverMoving) {
                ownerIsMoving = true;
            } else if (pet.ownerId === (typeof myId !== 'undefined' ? myId : null)) {
                if (typeof keys !== 'undefined' && (keys.w || keys.a || keys.s || keys.d || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight)) {
                    ownerIsMoving = true;
                } else if (Math.abs(owner.vx || 0) > 0.08 || Math.abs(owner.vy || 0) > 0.08) {
                    ownerIsMoving = true;
                }
            }
        }

        let dx = targetX - pet.curX;
        let dy = targetY - pet.curY;
        let dist = Math.hypot(dx, dy);

        // Petin yürüme durumu: Karakter hangi yöne yürürse yürüsün pet hemen yürümeye başlar
        if (dist > 300) {
            // Oda değişimi veya ışınlanma durumunda anında hedefe gel
            pet.curX = targetX;
            pet.curY = targetY;
            pet.isMoving = false;
            pet.animState = PetAnimState.IDLE;
            pet.specialIdleStart = 0;
            pet.idleTimer = 0;
        } else if (ownerIsMoving || dist > 3.0) {
            // Karakter hareket ediyorsa veya pet hedef noktasına doğru yürüyorsa
            pet.isMoving = true;
            pet.animState = PetAnimState.WALK;
            pet.specialIdleStart = 0; // Eğer özel pati animasyonundaysa anında kes
            pet.idleTimer = 0;

            let followSpeed = ownerIsMoving ? Math.min(1, 14 * dt) : Math.min(1, 12 * dt);
            pet.curX += dx * followSpeed;
            pet.curY += dy * followSpeed;
            pet.walkCycle = (pet.walkCycle || 0) + (14 * dt);

            // 8 Yönlü Yön Hesabı
            if (dist > 2.0) {
                let newDir = calculatePet8WayFacing(dx, dy);
                if (newDir) {
                    pet.facing = newDir;
                    pet.direction = newDir;
                }
            } else if (owner && owner.facing) {
                pet.facing = owner.facing;
                pet.direction = owner.facing;
            }
        } else {
            // Karakter ve pet tamamen durdu (sabit duruş)
            pet.curX = targetX;
            pet.curY = targetY;
            pet.isMoving = false;
            pet.walkCycle = 0;

            // Kedi dururken sürekli arkasını dönmesin, yönünü korusun
            if (pet.petType !== 'cat') {
                if (owner && owner.facing) {
                    pet.facing = owner.facing;
                    pet.direction = owner.facing;
                }
            } else {
                // Kedi için: Dururken arkaya dönmesin
                if (owner && owner.facing && owner.facing !== 'up') {
                    pet.facing = owner.facing;
                    pet.direction = owner.facing;
                }
            }

            // Kediye Özel 25 Saniyelik Bekleme (Special Idle) Mantığı
            if (pet.petType === 'cat') {
                if (pet.animState === PetAnimState.SPECIAL_IDLE) {
                    const elapsed = now - (pet.specialIdleStart || now);
                    const duration = pet.specialIdleDuration || 2500;
                    if (elapsed >= duration) {
                        // Pati animasyonu (2.5 sn) tamamlandıktan sonra tekrar sabit durma moduna döner
                        pet.animState = PetAnimState.IDLE;
                        pet.idleTimer = 0;
                        pet.specialIdleStart = 0;
                    }
                } else {
                    pet.animState = PetAnimState.IDLE;
                    pet.idleTimer = (pet.idleTimer || 0) + (dt * 1000);
                    if (pet.idleTimer >= 25000) { // 25 saniye
                        pet.animState = PetAnimState.SPECIAL_IDLE;
                        pet.specialIdleStart = now;
                        pet.specialIdleDuration = 2500;
                        pet.idleTimer = 0;
                    }
                }
            } else {
                pet.animState = PetAnimState.IDLE;
                pet.idleTimer = 0;
            }
        }

        drawSingleCompanionPet(ctx, pet, pet.curX, pet.curY, now);
    }
}

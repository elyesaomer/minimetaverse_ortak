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
        window.TfmMouseRenderer.draw(ctx, {
            direction: pet.facing || 'right',
            animation: pet.isMoving ? 'walk' : 'idle',
            frame: pet.isMoving ? Math.floor(pet.walkCycle || 0) : Math.floor(now / 450),
            scale: pet.petType === 'mouse' ? 0.65 : 0.75,
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

        let targetX = pet.x;
        let targetY = pet.y;

        if (owner) {
            // Sahibin yönüne göre yanında ve hafif arkasında yürü
            let offsetSide = (owner.facing === 'left') ? 22 : -22;
            let offsetY = 8;
            targetX = owner.x + offsetSide;
            targetY = owner.y + offsetY;
        }

        let dx = targetX - pet.curX;
        let dy = targetY - pet.curY;
        let dist = Math.hypot(dx, dy);

        // Yoldaş Yürüyüş Enterpolasyonu (Lerp) & 8 Yönlü Hareket Tespiti
        if (dist > 120) {
            pet.curX = targetX;
            pet.curY = targetY;
            pet.isMoving = false;
        } else if (dist > 3.5) {
            let speed = Math.min(1, 14 * dt);
            pet.curX += dx * speed;
            pet.curY += dy * speed;
            pet.isMoving = true;
            pet.walkCycle = (pet.walkCycle || 0) + (14 * dt);

            // 8 Yönlü Yön Hesabı (N, NE, E, SE, S, SW, W, NW)
            let newDir = calculatePet8WayFacing(dx, dy);
            if (newDir) {
                pet.facing = newDir;
                pet.direction = newDir;
            }
        } else {
            pet.curX = targetX;
            pet.curY = targetY;
            pet.isMoving = false;
            pet.walkCycle = 0;
            // Durduğunda sahibin baktığı yöne uyum sağlasın
            if (owner && owner.facing) {
                pet.facing = owner.facing;
                pet.direction = owner.facing;
            }
        }

        drawSingleCompanionPet(ctx, pet, pet.curX, pet.curY, now);
    }
}

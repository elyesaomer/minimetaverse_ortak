// public/js/mobileControls.js - Mobil Dokunmatik Ekran & 360° Analog Sanal Joystick

function checkMobileDeviceHUD() {
    let ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    let maxTouch = (typeof navigator !== 'undefined' && navigator.maxTouchPoints) ? navigator.maxTouchPoints : 0;
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
        (typeof window !== 'undefined' && window.innerWidth <= 860) ||
        (typeof window !== 'undefined' && 'ontouchstart' in window) ||
        (maxTouch > 0);
    let joy = document.getElementById('mobileControlsOverlay');
    let actionBtn = document.getElementById('mobileActionBtn');
    if (joy) joy.style.display = isMobile ? 'block' : 'none';
    if (actionBtn) actionBtn.style.display = isMobile ? 'flex' : 'none';
    if (isMobile) updateMobileControlsPosition();
}

function updateMobileControlsPosition() {
    const joy = document.getElementById('mobileControlsOverlay');
    const canvas = document.getElementById('gameCanvas');
    if (!joy || !canvas) return;

    // Joystick'i oyun ekranına (Canvas'a) ergonomik olarak yaklaştır
    const cRect = canvas.getBoundingClientRect();
    const vh = window.innerHeight;

    // Eğer dikey ekranda canvas altındaki boşluk uygunsa, canvas'ın hemen sol alt köşesinin 10px altına yerleştir
    if (cRect.bottom > 80 && (cRect.bottom + 145) <= vh) {
        joy.style.top = (cRect.bottom + 8) + 'px';
        joy.style.bottom = 'auto';
        let targetLeft = Math.max(16, cRect.left + 12);
        joy.style.left = targetLeft + 'px';
    } else {
        // Yatay modda veya tam ekran canvas durumunda sol alta oyun içine yakın sabitle
        joy.style.top = 'auto';
        joy.style.bottom = 'clamp(35px, 9vh, 85px)';
        joy.style.left = 'clamp(16px, 3.5vw, 40px)';
    }
}

function initMobileDpadTracking() {
    const joy = document.getElementById('mobileControlsOverlay');
    const base = document.getElementById('joystickBase');
    const knob = document.getElementById('joystickKnob');
    if (!joy || !base || !knob) return;

    let touchId = null;
    const maxRadius = 42; // Joystick topuzunun merkezden maksimum uzaklaşma yarıçapı

    function handleTouchMove(clientX, clientY) {
        if (typeof targetWalkPos !== 'undefined') targetWalkPos = null;
        let rect = base.getBoundingClientRect();
        let centerX = rect.left + rect.width / 2;
        let centerY = rect.top + rect.height / 2;
        let dx = clientX - centerX;
        let dy = clientY - centerY;
        let dist = Math.hypot(dx, dy);

        // Topuz konumunu sınırla
        let angle = Math.atan2(dy, dx);
        let clampedDist = Math.min(dist, maxRadius);
        let knobX = Math.cos(angle) * clampedDist;
        let knobY = Math.sin(angle) * clampedDist;

        knob.classList.remove('returning');
        knob.style.transform = `translate(${knobX}px, ${knobY}px)`;
        base.classList.add('active');

        // Ölü bölge (deadzone)
        if (dist < 10) {
            if (typeof keys !== 'undefined') {
                keys.w = false; keys.a = false; keys.s = false; keys.d = false;
            }
            return;
        }

        if (typeof standUpIfSitting === 'function') {
            standUpIfSitting();
        }

        // 360 derece analog yön ayrıştırma
        let nx = Math.cos(angle);
        let ny = Math.sin(angle);

        if (typeof keys !== 'undefined') {
            keys.d = (nx > 0.35);
            keys.a = (nx < -0.35);
            keys.s = (ny > 0.35);
            keys.w = (ny < -0.35);
        }

        if (typeof calculate8WayFacing === 'function') {
            let f = calculate8WayFacing(nx, ny);
            if (f && typeof myFacing !== 'undefined') myFacing = f;
        } else {
            if (Math.abs(nx) > Math.abs(ny)) {
                if (typeof myFacing !== 'undefined') myFacing = nx > 0 ? 'right' : 'left';
            } else {
                if (typeof myFacing !== 'undefined') myFacing = ny > 0 ? 'down' : 'up';
            }
        }
    }

    function resetJoystick() {
        touchId = null;
        knob.classList.add('returning');
        knob.style.transform = 'translate(0px, 0px)';
        base.classList.remove('active');
        if (typeof keys !== 'undefined') {
            keys.w = false;
            keys.a = false;
            keys.s = false;
            keys.d = false;
        }
    }

    joy.addEventListener('touchstart', (e) => {
        if (e.changedTouches.length > 0) {
            let t = e.changedTouches[0];
            touchId = t.identifier;
            handleTouchMove(t.clientX, t.clientY);
        }
    }, { passive: false });

    joy.addEventListener('touchmove', (e) => {
        if (e.cancelable) e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            let t = e.changedTouches[i];
            if (t.identifier === touchId) {
                handleTouchMove(t.clientX, t.clientY);
                break;
            }
        }
    }, { passive: false });

    const endTouch = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                resetJoystick();
                break;
            }
        }
    };

    joy.addEventListener('touchend', endTouch);
    joy.addEventListener('touchcancel', endTouch);
}

// Global Dinleyiciler
window.addEventListener('resize', () => {
    checkMobileDeviceHUD();
    updateMobileControlsPosition();
    if (typeof bgCache !== 'undefined') bgCache.invalidate();
});
window.addEventListener('orientationchange', () => {
    checkMobileDeviceHUD();
    updateMobileControlsPosition();
    if (typeof bgCache !== 'undefined') bgCache.invalidate();
});
window.addEventListener('scroll', () => {
    updateMobileControlsPosition();
}, { passive: true });
document.addEventListener('DOMContentLoaded', () => {
    checkMobileDeviceHUD();
    initMobileDpadTracking();
    updateMobileControlsPosition();
});
setTimeout(() => {
    checkMobileDeviceHUD();
    initMobileDpadTracking();
    updateMobileControlsPosition();
}, 500);

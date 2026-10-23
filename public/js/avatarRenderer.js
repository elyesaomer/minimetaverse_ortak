// public/js/avatarRenderer.js - Karakter, Kıyafet, Saç, Oturma Pozu ve Aksesuar Çizim Motoru (8 Açılı İzometrik & Gerçekçi Anatomi)

// --- 8 AÇILI İZOMETRİK YÖN YARDIMCISI VE NORMALİZASYON ---
function normalize8WayFacing(facing) {
    if (!facing) return 'down';
    let f = String(facing).toLowerCase().replace('_', '-').trim();
    if (f === 's' || f === 'south' || f === 'down' || f === 'front' || f === 'on') return 'down';
    if (f === 'n' || f === 'north' || f === 'up' || f === 'back' || f === 'arka') return 'up';
    if (f === 'e' || f === 'east' || f === 'right' || f === 'sag') return 'right';
    if (f === 'w' || f === 'west' || f === 'left' || f === 'sol') return 'left';
    if (f === 'se' || f === 'southeast' || f === 'down-right' || f === 'right-down' || f === 'sag-ileri') return 'down-right';
    if (f === 'sw' || f === 'southwest' || f === 'down-left' || f === 'left-down' || f === 'sol-ileri') return 'down-left';
    if (f === 'ne' || f === 'northeast' || f === 'up-right' || f === 'right-up' || f === 'sag-geri') return 'up-right';
    if (f === 'nw' || f === 'northwest' || f === 'up-left' || f === 'left-up' || f === 'sol-geri') return 'up-left';
    return f;
}
if (typeof window !== 'undefined') {
    window.normalize8WayFacing = normalize8WayFacing;
}

// Kadın Anatomisi Tespiti (Bel inceltme, zarif bacaklar ve göğüs hatları için)
function isFemaleAvatar(p, shirtColor, hatType, shoeType) {
    if (p && (p.gender === 'female' || p.isFemale)) return true;
    if (typeof window !== 'undefined' && (window.myGender === 'female' || window.selectedGender === 'female')) {
        if (!p || p.id === window.myId) return true;
    }
    let col = shirtColor || (p && p.color) || '';
    if (col.startsWith('dress_') || col.startsWith('skirt_') || col.startsWith('outfit_')) return true;
    let hat = hatType || (p && p.hat) || '';
    if (['hair_long', 'hair_wavy', 'hair_ponytail', 'hair_braids', 'hair_bob', 'hair_hijab', 'beret_pink', 'crown', 'hair_blonde_curls', 'hair_bun_chopsticks', 'hair_redhead_wavy', 'hair_pigtails_ribbon', 'hair_curly_brown'].includes(hat)) return true;
    let shoe = shoeType || (p && p.shoes) || '';
    if (['heels', 'flats', 'heels_gold', 'boots_thigh_high', 'sandals_gladiator'].includes(shoe)) return true;
    return false;
}
if (typeof window !== 'undefined') {
    window.isFemaleAvatar = isFemaleAvatar;
}

// Renk tonlama yardımcısı (Kumaş ışık ve gölge derinliği için sıfır-tahsisli önbellek)
const _colorBrightnessCache = new Map();
function adjustColorBrightness(col, percent) {
    if (!col || !col.startsWith('#')) return col;
    let key = col + percent;
    let cached = _colorBrightnessCache.get(key);
    if (cached !== undefined) return cached;
    let num = parseInt(col.slice(1), 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    let res = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    if (_colorBrightnessCache.size > 500) _colorBrightnessCache.clear();
    _colorBrightnessCache.set(key, res);
    return res;
}

// --- 1. AYAKKABI ÇİZİMİ (8 AÇILI İZOMETRİK TABAN & TOPUK) ---
function drawSingleShoe(targetCtx, x, y, shoeType, skinColor, angle = 0, isCrossed = false, facing = 'down', isFemale = false) {
    targetCtx.save();
    targetCtx.translate(x + 3.5, y + 2.5);
    if (angle !== 0) targetCtx.rotate(angle);
    targetCtx.translate(-(x + 3.5), -(y + 2.5));

    let f = normalize8WayFacing(facing);
    let isBack = (f === 'up' || f === 'up-right' || f === 'up-left');

    if (shoeType === 'classic') {
        // Cilalı Kösele Klasik Ayakkabı (Dikişli taban ve ışık parıltısı)
        targetCtx.fillStyle = "#18181b";
        targetCtx.beginPath();
        targetCtx.roundRect(x, y, 8, 4.5, [2, 3, 1, 1]);
        targetCtx.fill();
        targetCtx.fillStyle = isBack ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.45)";
        targetCtx.fillRect(x + 2, y + 1, 3, 1);
        targetCtx.fillStyle = "#78350f";
        targetCtx.fillRect(x, y + 3.8, 8, 1);
    } else if (shoeType === 'boots') {
        // Kışlık Deri Bot (Tırtıklı taban & dikişli burun)
        targetCtx.fillStyle = "#78350f";
        targetCtx.beginPath();
        targetCtx.roundRect(x, y - 1, 8, 5.5, 2);
        targetCtx.fill();
        targetCtx.fillStyle = "#1c1917";
        targetCtx.fillRect(x, y + 3.5, 8.5, 2);
        if (isBack) {
            targetCtx.fillStyle = "#451a03";
            targetCtx.fillRect(x + 3, y - 2, 2, 2);
        } else {
            targetCtx.strokeStyle = "rgba(255,255,255,0.2)";
            targetCtx.lineWidth = 0.8;
            targetCtx.strokeRect(x + 1, y, 6, 3);
        }
    } else if (shoeType === 'heels') {
        // Şık Topuklu Stiletto (Zarif kavisli burun ve ince topuk)
        targetCtx.fillStyle = "#e11d48";
        targetCtx.beginPath();
        targetCtx.ellipse(x + 4, y + 2, 4, 2.3, 0, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = "#9f1239";
        targetCtx.fillRect(x, y + 1.8, 1.4, 4.8);
        targetCtx.fillStyle = "rgba(255,255,255,0.3)";
        targetCtx.fillRect(x + 2.5, y + 1, 2, 0.8);
    } else if (shoeType === 'flats') {
        // Zarif Babet
        targetCtx.fillStyle = "#ec4899";
        targetCtx.beginPath();
        targetCtx.ellipse(x + 3.5, y + 2, 3.8, 1.9, 0, 0, Math.PI * 2);
        targetCtx.fill();
        if (!isBack) {
            targetCtx.fillStyle = "#ffffff";
            targetCtx.beginPath(); targetCtx.arc(x + 4, y + 1.5, 1.1, 0, Math.PI * 2); targetCtx.fill();
        }
    } else if (shoeType === 'heels_gold') {
        // Altın Simli Abiye Stiletto
        targetCtx.fillStyle = "#facc15";
        targetCtx.beginPath();
        targetCtx.ellipse(x + 4, y + 2, 4, 2.3, 0, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = "#d97706";
        targetCtx.fillRect(x, y + 1.8, 1.4, 4.8);
        targetCtx.fillStyle = "#ef4444";
        targetCtx.fillRect(x + 1.5, y + 4.5, 4, 0.8);
    } else if (shoeType === 'boots_thigh_high') {
        // Diz Üstü Süet Çizme (Zarif bacak saran hat)
        targetCtx.fillStyle = "#18181b";
        targetCtx.beginPath();
        targetCtx.roundRect(x - 0.5, y - 5, 8, 10, [3, 3, 1, 1]);
        targetCtx.fill();
        targetCtx.fillStyle = "#475569";
        targetCtx.fillRect(x + 3.2, y - 5, 0.9, 9);
    } else if (shoeType === 'sandals_gladiator') {
        // İncili Gladyatör Sandalet
        targetCtx.fillStyle = skinColor || "#ffd1a4";
        targetCtx.fillRect(x, y, 7.5, 4);
        targetCtx.fillStyle = "#d97706";
        targetCtx.fillRect(x, y + 3.5, 7.5, 1);
        if (!isBack) {
            targetCtx.fillStyle = "#ffffff";
            targetCtx.beginPath(); targetCtx.arc(x + 2, y + 1.5, 1, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.beginPath(); targetCtx.arc(x + 5, y + 1.5, 1, 0, Math.PI * 2); targetCtx.fill();
        }
    } else if (shoeType === 'none') {
        // Çıplak Ayak
        targetCtx.fillStyle = skinColor || "#ffd1a4";
        targetCtx.beginPath();
        targetCtx.ellipse(x + 3.5, y + 2, 3.5, 2, 0, 0, Math.PI * 2);
        targetCtx.fill();
    } else {
        // Varsayılan: Beyaz Tabanlı Sneaker
        targetCtx.fillStyle = "#ffffff";
        targetCtx.beginPath();
        targetCtx.roundRect(x, y + 2, 8, 2.8, 1);
        targetCtx.fill();
        targetCtx.fillStyle = "#0284c7";
        targetCtx.beginPath();
        targetCtx.roundRect(x, y, 7.5, 2.8, [2, 2, 0, 0]);
        targetCtx.fill();
        targetCtx.fillStyle = "#ffffff";
        targetCtx.fillRect(x + 2, y + 1, 3.5, 1);
    }

    targetCtx.restore();
}

// --- 2. BACAKLAR VE AYAKKABILAR (8 AÇILI İZOMETRİK & KADIN/ERKEK ANATOMİSİ) ---
function drawAvatarLegsAndShoes(targetCtx, pX, pY, legSwing = 0, skinColor = "#ffd1a4", shoeType = "sneakers", isSkirt = false, isSitting = false, facing = "down", isFemale = false, pantsColor = null) {
    let f = normalize8WayFacing(facing);
    let legColor = pantsColor || (isSkirt ? (skinColor || "#ffd1a4") : "#1e293b");
    let shadowColor = "rgba(0, 0, 0, 0.28)";
    let legW = isFemale ? 4.2 : 5; // Kadın karakterlerde daha zarif ve ince bacak kalınlığı

    if (isSitting) {
        targetCtx.save();

        if (f === 'right') {
            // SAĞA DÖNÜK PROFİL OTURMA
            targetCtx.fillStyle = legColor;
            targetCtx.fillRect(pX - 4, pY + 8, legW, 12);
            drawSingleShoe(targetCtx, pX - 5, pY + 19, shoeType, skinColor, 0, false, f, isFemale);

            targetCtx.fillStyle = legColor;
            targetCtx.beginPath();
            targetCtx.roundRect(pX - 5, pY + 6, 12, 6, [3, 4, 2, 2]);
            targetCtx.fill();
            targetCtx.fillRect(pX + 4, pY + 10, legW, 7);
            drawSingleShoe(targetCtx, pX + 4, pY + 16, shoeType, skinColor, 0.22, true, f, isFemale);

        } else if (f === 'left') {
            // SOLA DÖNÜK PROFİL OTURMA
            targetCtx.fillStyle = legColor;
            targetCtx.fillRect(pX - 1, pY + 8, legW, 12);
            drawSingleShoe(targetCtx, pX - 2, pY + 19, shoeType, skinColor, 0, false, f, isFemale);

            targetCtx.fillStyle = legColor;
            targetCtx.beginPath();
            targetCtx.roundRect(pX - 7, pY + 6, 12, 6, [4, 3, 2, 2]);
            targetCtx.fill();
            targetCtx.fillRect(pX - 9, pY + 10, legW, 7);
            drawSingleShoe(targetCtx, pX - 11, pY + 16, shoeType, skinColor, -0.22, true, f, isFemale);

        } else if (f === 'up') {
            // TAM ARKAYA DÖNÜK OTURMA
            targetCtx.fillStyle = legColor;
            targetCtx.fillRect(pX - 7, pY + 8, legW, 8);
            targetCtx.fillRect(pX + 2, pY + 8, legW, 8);
            targetCtx.fillStyle = "#1e1e1e";
            targetCtx.fillRect(pX - 7, pY + 16, legW, 4);
            targetCtx.fillRect(pX + 2, pY + 16, legW, 4);

        } else if (f === 'down-right') {
            // 3/4 SAĞ İLERİ OTURMA
            targetCtx.fillStyle = shadowColor;
            targetCtx.beginPath(); targetCtx.ellipse(pX + 2, pY + 10, 13, 5, 0.3, 0, Math.PI * 2); targetCtx.fill();

            targetCtx.fillStyle = legColor;
            targetCtx.fillRect(pX - 4, pY + 8, legW, 11);
            drawSingleShoe(targetCtx, pX - 4, pY + 18, shoeType, skinColor, 0.15, false, f, isFemale);

            targetCtx.beginPath();
            targetCtx.roundRect(pX - 2, pY + 6, 13, 7, [3, 4, 2, 2]);
            targetCtx.fill();
            drawSingleShoe(targetCtx, pX + 5, pY + 15, shoeType, skinColor, 0.35, true, f, isFemale);

        } else if (f === 'down-left') {
            // 3/4 SOL İLERİ OTURMA
            targetCtx.fillStyle = shadowColor;
            targetCtx.beginPath(); targetCtx.ellipse(pX - 2, pY + 10, 13, 5, -0.3, 0, Math.PI * 2); targetCtx.fill();

            targetCtx.fillStyle = legColor;
            targetCtx.fillRect(pX - 1, pY + 8, legW, 11);
            drawSingleShoe(targetCtx, pX - 2, pY + 18, shoeType, skinColor, -0.15, false, f, isFemale);

            targetCtx.beginPath();
            targetCtx.roundRect(pX - 11, pY + 6, 13, 7, [4, 3, 2, 2]);
            targetCtx.fill();
            drawSingleShoe(targetCtx, pX - 12, pY + 15, shoeType, skinColor, -0.35, true, f, isFemale);

        } else if (f === 'up-right') {
            // 3/4 SAĞ GERİ OTURMA
            targetCtx.fillStyle = legColor;
            targetCtx.fillRect(pX - 6, pY + 8, legW, 8);
            targetCtx.fillRect(pX + 1, pY + 7, legW + 1, 9);
            drawSingleShoe(targetCtx, pX + 2, pY + 15, shoeType, skinColor, 0.6, false, f, isFemale);

        } else if (f === 'up-left') {
            // 3/4 SOL GERİ OTURMA
            targetCtx.fillStyle = legColor;
            targetCtx.fillRect(pX + 1, pY + 8, legW, 8);
            targetCtx.fillRect(pX - 7, pY + 7, legW + 1, 9);
            drawSingleShoe(targetCtx, pX - 8, pY + 15, shoeType, skinColor, -0.6, false, f, isFemale);

        } else {
            // TAM ÖNE DÖNÜK OTURMA - ZARİF AYAK AYAK ÜSTÜNE ATMA
            targetCtx.fillStyle = shadowColor;
            targetCtx.beginPath();
            targetCtx.ellipse(pX - 1, pY + 9, 12, 4, 0, 0, Math.PI * 2);
            targetCtx.fill();

            targetCtx.fillStyle = legColor;
            targetCtx.beginPath();
            targetCtx.roundRect(pX - 9, pY + 7, legW + 1, 8, [2, 2, 0, 0]);
            targetCtx.fill();
            targetCtx.fillRect(pX - 9, pY + 14, legW, 7);
            drawSingleShoe(targetCtx, pX - 10, pY + 20, shoeType, skinColor, 0, false, f, isFemale);

            targetCtx.fillStyle = legColor;
            targetCtx.beginPath();
            targetCtx.moveTo(pX + 4, pY + 7);
            targetCtx.lineTo(pX - 7, pY + 9);
            targetCtx.quadraticCurveTo(pX - 10, pY + 11, pX - 7, pY + 14);
            targetCtx.lineTo(pX + 1, pY + 12);
            targetCtx.closePath();
            targetCtx.fill();

            targetCtx.strokeStyle = "rgba(0, 0, 0, 0.35)";
            targetCtx.lineWidth = 1;
            targetCtx.beginPath();
            targetCtx.arc(pX - 5, pY + 11, 3.5, Math.PI * 0.6, Math.PI * 1.6);
            targetCtx.stroke();

            targetCtx.fillStyle = legColor;
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 6, pY + 12);
            targetCtx.lineTo(pX + 3, pY + 15);
            targetCtx.lineTo(pX + 2, pY + 19);
            targetCtx.lineTo(pX - 5, pY + 16);
            targetCtx.closePath();
            targetCtx.fill();

            targetCtx.strokeStyle = "rgba(255, 255, 255, 0.22)";
            targetCtx.lineWidth = 1;
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 4, pY + 13);
            targetCtx.lineTo(pX + 2, pY + 16);
            targetCtx.stroke();

            drawSingleShoe(targetCtx, pX + 2, pY + 16, shoeType, skinColor, 0.24, true, f, isFemale);

            if (isSkirt) {
                targetCtx.fillStyle = legColor;
                targetCtx.beginPath();
                targetCtx.roundRect(pX - 11, pY + 6, 22, 6, [3, 3, 5, 5]);
                targetCtx.fill();
                targetCtx.strokeStyle = "rgba(0,0,0,0.15)";
                targetCtx.lineWidth = 0.8;
                targetCtx.stroke();
            }
        }

        targetCtx.restore();
        return;
    }

    // AYAKTA YÜRÜME / DURMA (8 AÇILI İZOMETRİK & ANATOMİK BACAK VE AYAKKABI)
    targetCtx.save();
    targetCtx.fillStyle = legColor;

    if (f === 'down') {
        // Tam Öne (Güney)
        targetCtx.fillRect(pX - 8, pY + 12 - legSwing, legW, 8 + legSwing);
        targetCtx.fillRect(pX + 3, pY + 12 + legSwing, legW, 8 - legSwing);
        drawSingleShoe(targetCtx, pX - 9, pY + 18 - legSwing, shoeType, skinColor, 0, false, f, isFemale);
        drawSingleShoe(targetCtx, pX + 2, pY + 18 + legSwing, shoeType, skinColor, 0, false, f, isFemale);

    } else if (f === 'up') {
        // Tam Arkaya (Kuzey)
        targetCtx.fillRect(pX - 7, pY + 12 + legSwing, legW, 8 - legSwing);
        targetCtx.fillRect(pX + 2, pY + 12 - legSwing, legW, 8 + legSwing);
        drawSingleShoe(targetCtx, pX - 8, pY + 18 + legSwing, shoeType, skinColor, Math.PI, false, f, isFemale);
        drawSingleShoe(targetCtx, pX + 1, pY + 18 - legSwing, shoeType, skinColor, Math.PI, false, f, isFemale);

    } else if (f === 'right') {
        // Sağa Profil (Doğu)
        let farX = pX - 5 - legSwing * 1.2;
        let nearX = pX - 1 + legSwing * 1.2;
        targetCtx.fillStyle = "rgba(0,0,0,0.2)";
        targetCtx.fillRect(farX, pY + 12, legW, 8);
        drawSingleShoe(targetCtx, farX - 1, pY + 18, shoeType, skinColor, Math.PI * 0.5, false, f, isFemale);

        targetCtx.fillStyle = legColor;
        targetCtx.fillRect(nearX, pY + 12, legW, 8);
        drawSingleShoe(targetCtx, nearX - 1, pY + 18, shoeType, skinColor, Math.PI * 0.5, false, f, isFemale);

    } else if (f === 'left') {
        // Sola Profil (Batı)
        let farX = pX + 0 + legSwing * 1.2;
        let nearX = pX - 4 - legSwing * 1.2;
        targetCtx.fillStyle = "rgba(0,0,0,0.2)";
        targetCtx.fillRect(farX, pY + 12, legW, 8);
        drawSingleShoe(targetCtx, farX - 2, pY + 18, shoeType, skinColor, -Math.PI * 0.5, false, f, isFemale);

        targetCtx.fillStyle = legColor;
        targetCtx.fillRect(nearX, pY + 12, legW, 8);
        drawSingleShoe(targetCtx, nearX - 2, pY + 18, shoeType, skinColor, -Math.PI * 0.5, false, f, isFemale);

    } else if (f === 'down-right') {
        // Sağ İleri (Güneydoğu - 3/4 İzometrik)
        let farX = pX - 8 - legSwing * 0.8;
        let nearX = pX + 1 + legSwing * 0.8;
        targetCtx.fillStyle = "rgba(0,0,0,0.18)";
        targetCtx.fillRect(farX, pY + 12 - legSwing * 0.4, legW, 8);
        drawSingleShoe(targetCtx, farX - 1, pY + 18 - legSwing * 0.4, shoeType, skinColor, Math.PI * 0.25, false, f, isFemale);

        targetCtx.fillStyle = legColor;
        targetCtx.fillRect(nearX, pY + 12 + legSwing * 0.4, legW, 8);
        drawSingleShoe(targetCtx, nearX - 1, pY + 18 + legSwing * 0.4, shoeType, skinColor, Math.PI * 0.25, false, f, isFemale);

    } else if (f === 'down-left') {
        // Sol İleri (Güneybatı - 3/4 İzometrik)
        let farX = pX + 3 + legSwing * 0.8;
        let nearX = pX - 6 - legSwing * 0.8;
        targetCtx.fillStyle = "rgba(0,0,0,0.18)";
        targetCtx.fillRect(farX, pY + 12 - legSwing * 0.4, legW, 8);
        drawSingleShoe(targetCtx, farX - 1, pY + 18 - legSwing * 0.4, shoeType, skinColor, -Math.PI * 0.25, false, f, isFemale);

        targetCtx.fillStyle = legColor;
        targetCtx.fillRect(nearX, pY + 12 + legSwing * 0.4, legW, 8);
        drawSingleShoe(targetCtx, nearX - 1, pY + 18 + legSwing * 0.4, shoeType, skinColor, -Math.PI * 0.25, false, f, isFemale);

    } else if (f === 'up-right') {
        // Sağ Geri (Kuzeydoğu - 3/4 İzometrik)
        let farX = pX - 7 - legSwing * 0.8;
        let nearX = pX + 1 + legSwing * 0.8;
        targetCtx.fillRect(farX, pY + 12 + legSwing * 0.4, legW, 8);
        drawSingleShoe(targetCtx, farX - 1, pY + 18 + legSwing * 0.4, shoeType, skinColor, Math.PI * 0.75, false, f, isFemale);

        targetCtx.fillRect(nearX, pY + 12 - legSwing * 0.4, legW, 8);
        drawSingleShoe(targetCtx, nearX - 1, pY + 18 - legSwing * 0.4, shoeType, skinColor, Math.PI * 0.75, false, f, isFemale);

    } else if (f === 'up-left') {
        // Sol Geri (Kuzeybatı - 3/4 İzometrik)
        let farX = pX + 2 + legSwing * 0.8;
        let nearX = pX - 6 - legSwing * 0.8;
        targetCtx.fillRect(farX, pY + 12 + legSwing * 0.4, legW, 8);
        drawSingleShoe(targetCtx, farX - 1, pY + 18 + legSwing * 0.4, shoeType, skinColor, -Math.PI * 0.75, false, f, isFemale);

        targetCtx.fillRect(nearX, pY + 12 - legSwing * 0.4, legW, 8);
        drawSingleShoe(targetCtx, nearX - 1, pY + 18 - legSwing * 0.4, shoeType, skinColor, -Math.PI * 0.75, false, f, isFemale);
    }

    targetCtx.restore();
}

// --- 3. GÖVDE VE KIYAFETLER (8 AÇILI İZOMETRİK & İNCELTİLMİŞ KADIN BELİ VE GERÇEKÇİ KUMAŞ) ---
function drawAvatarBodyAndClothes(targetCtx, pX, pY, shirtColor = "#3b82f6", skinColor = "#ffd1a4", facing = "down", isFemale = undefined) {
    let f = normalize8WayFacing(facing);
    let isBack = (f === 'up' || f === 'up-right' || f === 'up-left');
    let isDiagonal = (f === 'down-right' || f === 'down-left' || f === 'up-right' || f === 'up-left');
    let isLeft = (f === 'left' || f === 'down-left' || f === 'up-left');

    if (isFemale === undefined || isFemale === null) {
        isFemale = isFemaleAvatar(null, shirtColor);
    }

    targetCtx.save();
    // Simetri kuralı: Sol açılar sağ açıların pX ekseninde aynalanmışıdır
    if (isLeft) {
        targetCtx.translate(pX, 0);
        targetCtx.scale(-1, 1);
        targetCtx.translate(-pX, 0);
    }

    let effFacing = f;
    if (f === 'left') effFacing = 'right';
    else if (f === 'down-left') effFacing = 'down-right';
    else if (f === 'up-left') effFacing = 'up-right';

    // 0. Gerçekçi Anatomik Boyun (Kafayı ve Gövdeyi Doğal Bağlayan Kavisli Boyun)
    targetCtx.fillStyle = skinColor || "#ffd1a4";
    let neckW = isFemale ? 5.5 : 7.5;
    targetCtx.fillRect(pX - neckW / 2, pY - 13, neckW, 5.5);
    // Boyun altı hafif çene gölgesi
    targetCtx.fillStyle = "rgba(0, 0, 0, 0.14)";
    targetCtx.fillRect(pX - neckW / 2, pY - 13, neckW, 1.8);

    // --- KADIN VEYA ERKEK İÇİN İNCELTİLMİŞ VE KAVİSLİ GÖVDE ÇİZİM YARDIMCISI ---
    function drawShapedTorso(fillCol, strokeCol = null, isCrop = false) {
        targetCtx.fillStyle = fillCol;
        targetCtx.beginPath();

        if (effFacing === 'right') {
            // Profil Görünüm: Göğüs kıvrımı, inceltilmiş zarif bel oyuntusu ve kalça kavisleri
            if (isFemale) {
                targetCtx.moveTo(pX - 4, pY - 10);
                targetCtx.lineTo(pX + 5.5, pY - 7); // Göğüs üstü
                targetCtx.quadraticCurveTo(pX + 7, pY - 3, pX + 4.5, pY); // Göğüs kavisinden ince bele geçiş
                targetCtx.lineTo(pX + 2.5, pY + 2); // İnce bel (Profilde de inceltilmiş)
                targetCtx.quadraticCurveTo(pX + 3.5, pY + 7, pX + 5, isCrop ? pY + 1 : pY + 11); // Kalçaya iniş
                targetCtx.lineTo(pX - 5, isCrop ? pY + 1 : pY + 11);
                targetCtx.quadraticCurveTo(pX - 6, pY + 2, pX - 4, pY - 10); // Sırt kavisi
            } else {
                targetCtx.roundRect(pX - 5, pY - 10, 11, isCrop ? 11 : 21, [3, 3, 2, 2]);
            }
        } else {
            // Ön, 3/4 ve Arka Görünümler: Belin zarif şekilde inceldiği kum saati / atletik silüet
            if (isFemale) {
                // KADIN KARAKTER: İncelen bel (pY civarında genişlik 12px'e iner), omuzlar 16px, kalça 17.5px
                let shoulderL = pX - 8.2;
                let shoulderR = pX + 8.2;
                let waistL = pX - 5.8; // İNCELTİLMİŞ KADIN BELİ SOL
                let waistR = pX + 5.8; // İNCELTİLMİŞ KADIN BELİ SAĞ
                let hipL = pX - 8.8;
                let hipR = pX + 8.8;
                let bottomY = isCrop ? (pY + 1) : (pY + 11);

                if (effFacing === 'down-right' || effFacing === 'up-right') {
                    // 3/4 İzometrik Açı: Sağ taraf dönükken bel oyuntusunun derinleşmesi
                    shoulderL = pX - 7.5; shoulderR = pX + 8.8;
                    waistL = pX - 5.2; waistR = pX + 6.2;
                    hipL = pX - 8.2; hipR = pX + 9.2;
                }

                targetCtx.moveTo(shoulderL, pY - 10);
                targetCtx.quadraticCurveTo(pX - 8.8, pY - 4, waistL, pY + 1); // Sol bel incelmesi
                targetCtx.quadraticCurveTo(pX - 6.2, pY + 6, hipL, bottomY); // Kalçaya kavisli açılma
                targetCtx.lineTo(hipR, bottomY);
                targetCtx.quadraticCurveTo(pX + 6.2, pY + 6, waistR, pY + 1); // Sağ bel kavisli incelmesi
                targetCtx.quadraticCurveTo(pX + 8.8, pY - 4, shoulderR, pY - 10); // Sağ omuza çıkış
            } else {
                // ERKEK KARAKTER: Güçlü omuzlar (20px), hafif V-taper (17px bel)
                targetCtx.roundRect(pX - 10, pY - 10, 20, isCrop ? 11 : 21, [4, 4, 3, 3]);
            }
        }

        targetCtx.closePath();
        targetCtx.fill();

        // Kumaş Işık & Gölgelendirmesi (Ambient Isometric Lighting)
        targetCtx.fillStyle = "rgba(255, 255, 255, 0.12)";
        targetCtx.fillRect(pX - 7, pY - 9, 4, isCrop ? 8 : 16); // Sol omuzdan gelen ışık çizgisi
        targetCtx.fillStyle = "rgba(0, 0, 0, 0.12)";
        targetCtx.fillRect(pX + 3.5, pY - 9, 4, isCrop ? 8 : 16); // Sağ gölge derinliği

        if (strokeCol) {
            targetCtx.strokeStyle = strokeCol;
            targetCtx.lineWidth = 1;
            targetCtx.stroke();
        }
    }

    // --- ÖZEL KIYAFETLER VE ELBİSELER (GERÇEKÇİ KUMAŞ, BEL VE DETAYLAR) ---
    if (shirtColor === 'dress_pink') {
        // Pembe Çiçekli Elbise (İnceltilmiş bel, saten kuşak ve fırfırlı etek)
        drawShapedTorso("#f472b6", "rgba(0,0,0,0.1)");

        // Saten Bel Kuşağı (İnce beli vurgulayan kurdele)
        targetCtx.fillStyle = "#db2777";
        let sashW = isFemale ? 13 : 16;
        targetCtx.roundRect(pX - sashW / 2, pY - 1, sashW, 3, 1);
        targetCtx.fill();

        // Flared A-Line Etek
        targetCtx.fillStyle = "#ec4899";
        targetCtx.beginPath();
        let skirtTopL = pX - (isFemale ? 6.5 : 8.5);
        let skirtTopR = pX + (isFemale ? 6.5 : 8.5);
        targetCtx.moveTo(skirtTopL, pY + 2);
        targetCtx.lineTo(pX - 14, pY + 14);
        targetCtx.quadraticCurveTo(pX, pY + (isBack ? 15 : 16.5), pX + 14, pY + 14);
        targetCtx.lineTo(skirtTopR, pY + 2);
        targetCtx.closePath();
        targetCtx.fill();

        // Beyaz Dantel Fırfır Hem
        targetCtx.fillStyle = "#ffffff";
        targetCtx.fillRect(pX - 13, pY + 13, 26, 1.6);
        // Etek Pile Gölgeleri
        targetCtx.strokeStyle = "rgba(0,0,0,0.14)";
        targetCtx.lineWidth = 0.8;
        [-6, 0, 6].forEach(sx => {
            targetCtx.beginPath(); targetCtx.moveTo(pX + sx * 0.6, pY + 3); targetCtx.lineTo(pX + sx * 1.5, pY + 14); targetCtx.stroke();
        });

        if (isBack) {
            targetCtx.strokeStyle = "#be185d"; targetCtx.lineWidth = 1;
            targetCtx.beginPath(); targetCtx.moveTo(pX, pY - 8); targetCtx.lineTo(pX, pY + 1); targetCtx.stroke();
        }

    } else if (shirtColor === 'dress_black') {
        // Zarif Gece Elbisesi (İnce bel, parıldayan altın toka ve sırt dekoltesi)
        drawShapedTorso("#18181b", "rgba(255,255,255,0.08)");

        // Etek Kısmı (Dökümlü zarif abiye)
        targetCtx.fillStyle = "#18181b";
        targetCtx.beginPath();
        let skirtTopL = pX - (isFemale ? 6.5 : 8.5);
        let skirtTopR = pX + (isFemale ? 6.5 : 8.5);
        targetCtx.moveTo(skirtTopL, pY + 2);
        targetCtx.lineTo(pX - 13, pY + 14);
        targetCtx.quadraticCurveTo(pX, pY + 16, pX + 13, pY + 14);
        targetCtx.lineTo(skirtTopR, pY + 2);
        targetCtx.closePath();
        targetCtx.fill();

        // Altın Metal Kemer & Şık Toka
        let beltW = isFemale ? 13 : 17;
        targetCtx.fillStyle = "#facc15";
        targetCtx.fillRect(pX - beltW / 2, pY, beltW, 2.2);
        if (!isBack) {
            targetCtx.fillStyle = "#ffffff";
            targetCtx.fillRect(pX - 2, pY - 0.5, 4, 3.2); // Parlak toka
            targetCtx.fillStyle = "#d97706";
            targetCtx.fillRect(pX - 1, pY + 0.5, 2, 1.2);
        } else {
            // Sırtta zarif V-dekolte penceresi
            targetCtx.fillStyle = skinColor || "#ffd1a4";
            targetCtx.beginPath(); targetCtx.arc(pX, pY - 5, 3.8, 0, Math.PI * 2); targetCtx.fill();
        }

    } else if (shirtColor === 'dress_red') {
        // Kırmızı Kokteyl Elbisesi (Sweetheart yaka ve inceltilmiş bel)
        drawShapedTorso("#e11d48", "rgba(0,0,0,0.15)");

        if (!isBack) {
            // Sweetheart Yaka Dekolte Hattı
            targetCtx.fillStyle = skinColor || "#ffd1a4";
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 5, pY - 10);
            targetCtx.quadraticCurveTo(pX - 2.5, pY - 7, pX, pY - 8.5);
            targetCtx.quadraticCurveTo(pX + 2.5, pY - 7, pX + 5, pY - 10);
            targetCtx.closePath();
            targetCtx.fill();
        }

        // Dökümlü Kokteyl Etek
        targetCtx.fillStyle = "#be123c";
        targetCtx.beginPath();
        let skirtTopL = pX - (isFemale ? 6.5 : 8.5);
        let skirtTopR = pX + (isFemale ? 6.5 : 8.5);
        targetCtx.moveTo(skirtTopL, pY + 2);
        targetCtx.lineTo(pX - 14, pY + 14);
        targetCtx.quadraticCurveTo(pX, pY + 16, pX + 14, pY + 14);
        targetCtx.lineTo(skirtTopR, pY + 2);
        targetCtx.closePath();
        targetCtx.fill();

    } else if (shirtColor === 'skirt_crop') {
        // Beyaz Crop Top + Pileli Pembe Mini Etek & Göbek Teni
        drawShapedTorso("#f8fafc", "rgba(0,0,0,0.1)", true);

        // İnce bel ve açık göbek teni
        targetCtx.fillStyle = skinColor || "#ffd1a4";
        let midriffW = isFemale ? 12 : 16;
        targetCtx.fillRect(pX - midriffW / 2, pY + 1, midriffW, 3.2);
        if (!isBack) {
            // Şirin göbek deliği detayı
            targetCtx.fillStyle = "rgba(180, 83, 9, 0.4)";
            targetCtx.beginPath(); targetCtx.arc(pX, pY + 2.5, 0.8, 0, Math.PI * 2); targetCtx.fill();
        }

        // Yüksek Bel Pileli Etek (Tenis eteği)
        targetCtx.fillStyle = "#f43f5e";
        targetCtx.beginPath();
        let sTop = isFemale ? 6.5 : 8.5;
        targetCtx.moveTo(pX - sTop, pY + 4);
        targetCtx.lineTo(pX - 13, pY + 13);
        targetCtx.lineTo(pX + 13, pY + 13);
        targetCtx.lineTo(pX + sTop, pY + 4);
        targetCtx.closePath();
        targetCtx.fill();

        // Keskin pile gölgeleri
        targetCtx.strokeStyle = "rgba(0,0,0,0.2)"; targetCtx.lineWidth = 0.8;
        [-8, -4, 0, 4, 8].forEach(pxOffset => {
            targetCtx.beginPath(); targetCtx.moveTo(pX + pxOffset * 0.7, pY + 4); targetCtx.lineTo(pX + pxOffset * 1.3, pY + 13); targetCtx.stroke();
        });

    } else if (shirtColor === 'skirt_denim') {
        // Kot Etek & Üst (Fit beyaz bluz ve yüksek bel denim etek)
        drawShapedTorso("#f1f5f9", "rgba(0,0,0,0.08)", true);

        // Denim Etek
        targetCtx.fillStyle = "#2563eb";
        targetCtx.beginPath();
        let sTop = isFemale ? 6.5 : 8.5;
        targetCtx.moveTo(pX - sTop, pY + 1);
        targetCtx.lineTo(pX - 12, pY + 13);
        targetCtx.lineTo(pX + 12, pY + 13);
        targetCtx.lineTo(pX + sTop, pY + 1);
        targetCtx.closePath();
        targetCtx.fill();

        // Denim Kemer Köprüleri & Bronz Düğme
        targetCtx.fillStyle = "#1d4ed8";
        targetCtx.fillRect(pX - sTop, pY + 1, sTop * 2, 2.2);
        if (!isBack) {
            targetCtx.fillStyle = "#facc15";
            targetCtx.beginPath(); targetCtx.arc(pX, pY + 2.2, 1, 0, Math.PI * 2); targetCtx.fill();
        } else {
            // Arka cepler ve sarı dikişler
            targetCtx.strokeStyle = "#facc15"; targetCtx.lineWidth = 0.7;
            targetCtx.strokeRect(pX - 6.5, pY + 4, 3.8, 4);
            targetCtx.strokeRect(pX + 2.7, pY + 4, 3.8, 4);
        }

    } else if (shirtColor === 'dress_emerald') {
        // Zümrüt Yeşil İpek Gece Elbisesi & Altın Kolye
        drawShapedTorso("#059669", "rgba(0,0,0,0.15)");
        if (!isBack) {
            targetCtx.strokeStyle = "#facc15"; targetCtx.lineWidth = 1;
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 6, pY - 10); targetCtx.lineTo(pX, pY - 6.5); targetCtx.lineTo(pX + 6, pY - 10);
            targetCtx.stroke();
            targetCtx.fillStyle = "#10b981";
            targetCtx.beginPath(); targetCtx.arc(pX, pY - 5.5, 1.2, 0, Math.PI * 2); targetCtx.fill();
        }
        targetCtx.fillStyle = "#047857";
        targetCtx.beginPath();
        let sTop = isFemale ? 6.5 : 8.5;
        targetCtx.moveTo(pX - sTop, pY + 1);
        targetCtx.lineTo(pX - 14, pY + 15);
        targetCtx.quadraticCurveTo(pX, pY + 17, pX + 14, pY + 15);
        targetCtx.lineTo(pX + sTop, pY + 1);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.fillStyle = "#facc15";
        targetCtx.fillRect(pX - sTop, pY, sTop * 2, 2);

    } else if (shirtColor === 'dress_lavender') {
        // Lavanta Çiçeği Bahar Elbisesi & İnce Askılar
        drawShapedTorso("#c084fc", "rgba(0,0,0,0.1)");
        targetCtx.fillStyle = "#f8fafc";
        targetCtx.fillRect(pX - 6, pY - 10, 1.5, 6);
        targetCtx.fillRect(pX + 4.5, pY - 10, 1.5, 6);
        targetCtx.fillStyle = "#a855f7";
        targetCtx.beginPath();
        let sTop = isFemale ? 6.5 : 8.5;
        targetCtx.moveTo(pX - sTop, pY + 1);
        targetCtx.lineTo(pX - 13, pY + 14);
        targetCtx.quadraticCurveTo(pX, pY + 16, pX + 13, pY + 14);
        targetCtx.lineTo(pX + sTop, pY + 1);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.fillStyle = "#ffffff";
        targetCtx.fillRect(pX - 12, pY + 13, 24, 1.5);

    } else if (shirtColor === 'dress_bridal') {
        // Masalsı Beyaz Gelinlik & Balo Elbisesi
        drawShapedTorso("#ffffff", "#e2e8f0");
        targetCtx.fillStyle = "#f8fafc";
        targetCtx.beginPath();
        let sTop = isFemale ? 6.5 : 8.5;
        targetCtx.moveTo(pX - sTop, pY + 1);
        targetCtx.lineTo(pX - 16, pY + 15);
        targetCtx.quadraticCurveTo(pX, pY + 18, pX + 16, pY + 15);
        targetCtx.lineTo(pX + sTop, pY + 1);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.strokeStyle = "#e2e8f0"; targetCtx.lineWidth = 1; targetCtx.stroke();
        if (!isBack) {
            targetCtx.fillStyle = "#38bdf8"; targetCtx.fillRect(pX - 1.5, pY, 3, 2.5);
        } else {
            targetCtx.fillStyle = "#cbd5e1";
            for (let b = -8; b <= 6; b += 3) {
                targetCtx.beginPath(); targetCtx.arc(pX, pY + b, 1, 0, Math.PI * 2); targetCtx.fill();
            }
        }

    } else if (shirtColor === 'outfit_goth') {
        // Korseli Gotik Lolita Elbisesi (Bel inceltici korsaj ve mor saten bağcıklar)
        drawShapedTorso("#18181b", "rgba(192, 132, 252, 0.4)");
        targetCtx.strokeStyle = "#c084fc"; targetCtx.lineWidth = 1;
        targetCtx.beginPath();
        targetCtx.moveTo(pX - 3.5, pY - 8); targetCtx.lineTo(pX + 3.5, pY - 4);
        targetCtx.moveTo(pX + 3.5, pY - 8); targetCtx.lineTo(pX - 3.5, pY - 4);
        targetCtx.moveTo(pX - 3.5, pY - 4); targetCtx.lineTo(pX + 3.5, pY);
        targetCtx.moveTo(pX + 3.5, pY - 4); targetCtx.lineTo(pX - 3.5, pY);
        targetCtx.stroke();
        targetCtx.fillStyle = "#09090b";
        targetCtx.beginPath();
        let sTop = isFemale ? 6.5 : 8.5;
        targetCtx.moveTo(pX - sTop, pY + 1);
        targetCtx.lineTo(pX - 14, pY + 14);
        targetCtx.quadraticCurveTo(pX, pY + 16, pX + 14, pY + 14);
        targetCtx.lineTo(pX + sTop, pY + 1);
        targetCtx.closePath(); targetCtx.fill();
        if (!isBack) {
            targetCtx.fillStyle = "#ef4444";
            targetCtx.beginPath(); targetCtx.arc(pX, pY + 1, 2, 0, Math.PI * 2); targetCtx.fill();
        }
        targetCtx.fillStyle = "#ffffff";
        targetCtx.fillRect(pX - 13, pY + 13, 26, 1.2);

    } else if (shirtColor === 'outfit_business') {
        // Pudra Şık Kadın Takım Elbisesi (Belden oturan blazer & kalem etek)
        drawShapedTorso("#fb7185", "rgba(0,0,0,0.1)");
        if (!isBack) {
            targetCtx.fillStyle = "#ffffff";
            targetCtx.fillRect(pX - 3, pY - 10, 6, 8); // İç gömlek
            targetCtx.fillStyle = "#facc15";
            targetCtx.beginPath(); targetCtx.arc(pX, pY + 1, 1.5, 0, Math.PI * 2); targetCtx.fill(); // Altın düğme
        }
        targetCtx.fillStyle = "#fda4af";
        let sTop = isFemale ? 6.5 : 8.5;
        targetCtx.fillRect(pX - sTop, pY + 3, sTop * 2, 9); // Kalem etek

    } else if (shirtColor === 'outfit_boho') {
        // Bohem Şifon Elbise & Yelek
        drawShapedTorso("#ea580c", "rgba(0,0,0,0.15)");
        targetCtx.fillStyle = "#78350f";
        targetCtx.fillRect(pX - 8, pY - 10, 3.5, 12);
        targetCtx.fillRect(pX + 4.5, pY - 10, 3.5, 12);
        if (isBack) targetCtx.fillRect(pX - 8, pY - 10, 16, 12);
        targetCtx.fillStyle = "#c2410c";
        targetCtx.beginPath();
        let sTop = isFemale ? 6.5 : 8.5;
        targetCtx.moveTo(pX - sTop, pY + 1);
        targetCtx.lineTo(pX - 14, pY + 15);
        targetCtx.quadraticCurveTo(pX, pY + 17, pX + 14, pY + 15);
        targetCtx.lineTo(pX + sTop, pY + 1);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.fillStyle = "#fde047";
        targetCtx.fillRect(pX - 12, pY + 11, 24, 2);

    } else if (shirtColor === 'outfit_sporty') {
        // Pastel Fitness Takımı & Crop Top
        drawShapedTorso("#38bdf8", "rgba(0,0,0,0.1)", true);
        targetCtx.fillStyle = skinColor || "#ffd1a4";
        let midriffW = isFemale ? 12 : 16;
        targetCtx.fillRect(pX - midriffW / 2, pY + 1, midriffW, 3);
        targetCtx.fillStyle = "#818cf8";
        targetCtx.beginPath(); targetCtx.roundRect(pX - 8.5, pY + 4, 17, 8, [2, 2, 0, 0]); targetCtx.fill();
        targetCtx.fillStyle = "#ffffff";
        targetCtx.fillRect(pX - 8.5, pY + 4, 1.5, 8);
        targetCtx.fillRect(pX + 7, pY + 4, 1.5, 8);

    } else if (shirtColor === 'dress_vintage_polka') {
        // Vintage Puantiyeli Kırmızı Elbise
        drawShapedTorso("#dc2626", "rgba(0,0,0,0.15)");
        targetCtx.fillStyle = "#ffffff";
        targetCtx.beginPath();
        if (!isBack) {
            targetCtx.moveTo(pX - 5, pY - 10); targetCtx.lineTo(pX, pY - 6.5); targetCtx.lineTo(pX + 5, pY - 10);
            targetCtx.lineTo(pX + 7, pY - 10); targetCtx.lineTo(pX - 7, pY - 10);
        } else {
            targetCtx.roundRect(pX - 6, pY - 10, 12, 3, [0, 0, 2, 2]);
        }
        targetCtx.closePath(); targetCtx.fill();

        targetCtx.fillStyle = "#b91c1c";
        targetCtx.beginPath();
        let sTop = isFemale ? 6.5 : 8.5;
        targetCtx.moveTo(pX - sTop, pY + 1);
        targetCtx.lineTo(pX - 15, pY + 14);
        targetCtx.quadraticCurveTo(pX, pY + 16, pX + 15, pY + 14);
        targetCtx.lineTo(pX + sTop, pY + 1);
        targetCtx.closePath(); targetCtx.fill();

        targetCtx.fillStyle = "#ffffff";
        [[-8, 6], [-2, 8], [4, 5], [9, 9], [-11, 11], [-5, 12], [2, 12], [9, 13]].forEach(([dx, dy]) => {
            targetCtx.beginPath(); targetCtx.arc(pX + dx, pY + dy, 1.1, 0, Math.PI * 2); targetCtx.fill();
        });
        targetCtx.fillStyle = "#18181b"; targetCtx.fillRect(pX - sTop, pY, sTop * 2, 2.2);
        if (!isBack) {
            targetCtx.fillStyle = "#e2e8f0"; targetCtx.fillRect(pX - 2, pY - 0.5, 4, 3);
        }

    } else if (shirtColor === 'dress_ocean_blue') {
        // Okyanus Mavisi Yazlık Askılı Elbise
        drawShapedTorso("#06b6d4", "rgba(0,0,0,0.12)");
        targetCtx.fillStyle = "#0891b2";
        targetCtx.fillRect(pX - 6, pY - 10, 1.5, 6);
        targetCtx.fillRect(pX + 4.5, pY - 10, 1.5, 6);
        targetCtx.fillStyle = "#0284c7";
        targetCtx.beginPath();
        let sTop = isFemale ? 6.5 : 8.5;
        targetCtx.moveTo(pX - sTop, pY + 1);
        targetCtx.lineTo(pX - 14, pY + 14);
        targetCtx.quadraticCurveTo(pX, pY + 16, pX + 14, pY + 14);
        targetCtx.lineTo(pX + sTop, pY + 1);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.fillStyle = "#38bdf8";
        targetCtx.fillRect(pX - 13, pY + 13, 26, 1.2);

    } else if (shirtColor === 'outfit_turtleneck_skirt') {
        // Krem Balıkçı Yaka Kazak & Ekose Tartan Etek
        drawShapedTorso("#fef3c7", "rgba(217, 119, 6, 0.2)");
        targetCtx.fillStyle = "#fde68a";
        targetCtx.beginPath(); targetCtx.roundRect(pX - 5.5, pY - 12, 11, 4, 2); targetCtx.fill();
        targetCtx.fillStyle = "#991b1b";
        targetCtx.beginPath();
        let sTop = isFemale ? 6.5 : 8.5;
        targetCtx.moveTo(pX - sTop, pY + 2);
        targetCtx.lineTo(pX - 13, pY + 13);
        targetCtx.lineTo(pX + 13, pY + 13);
        targetCtx.lineTo(pX + sTop, pY + 2);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.strokeStyle = "rgba(250, 204, 21, 0.4)"; targetCtx.lineWidth = 1;
        targetCtx.beginPath();
        targetCtx.moveTo(pX - 5, pY + 2); targetCtx.lineTo(pX - 7, pY + 13);
        targetCtx.moveTo(pX + 5, pY + 2); targetCtx.lineTo(pX + 7, pY + 13);
        targetCtx.moveTo(pX - 11, pY + 7); targetCtx.lineTo(pX + 11, pY + 7);
        targetCtx.stroke();

    } else if (shirtColor === 'polo') {
        // Polo Yaka (Pike kumaş, 3D yaka kanatları ve düğmeler)
        drawShapedTorso("#f8fafc", "rgba(0,0,0,0.1)");
        if (!isBack) {
            targetCtx.fillStyle = "#3b82f6";
            targetCtx.beginPath();
            let shift = (effFacing === 'right') ? 2.5 : (effFacing === 'down-right') ? 1.5 : 0;
            targetCtx.moveTo(pX - 4.5 + shift, pY - 10);
            targetCtx.lineTo(pX + shift, pY - 3.5);
            targetCtx.lineTo(pX + 4.5 + shift, pY - 10);
            targetCtx.stroke();
            // Düğmeler
            targetCtx.fillStyle = "#94a3b8";
            targetCtx.beginPath(); targetCtx.arc(pX + shift, pY - 7, 0.9, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.beginPath(); targetCtx.arc(pX + shift, pY - 4.5, 0.9, 0, Math.PI * 2); targetCtx.fill();
        } else {
            targetCtx.fillStyle = "#e2e8f0";
            targetCtx.beginPath(); targetCtx.roundRect(pX - 5.5, pY - 11, 11, 3, 1.5); targetCtx.fill();
        }

    } else if (shirtColor === 'hoodie') {
        // Kapüşonlu Sweat (Kalın polar doku, 3D kanguru cep, sarkan ipler ve ribana)
        drawShapedTorso("#6366f1", "rgba(0,0,0,0.15)");
        if (!isBack) {
            targetCtx.fillStyle = "#4f46e5";
            let pShift = (effFacing === 'right') ? 2.5 : (effFacing === 'down-right') ? 1.5 : 0;
            targetCtx.beginPath(); targetCtx.roundRect(pX - 5.5 + pShift, pY + 3, 11, 6, 2); targetCtx.fill();
            // İpler ve uçlarında parıldayan agletler
            targetCtx.strokeStyle = "#ffffff"; targetCtx.lineWidth = 1;
            targetCtx.beginPath(); targetCtx.moveTo(pX - 2.5 + pShift, pY - 8); targetCtx.lineTo(pX - 2.5 + pShift, pY - 1.5); targetCtx.stroke();
            targetCtx.beginPath(); targetCtx.moveTo(pX + 2.5 + pShift, pY - 8); targetCtx.lineTo(pX + 2.5 + pShift, pY - 1.5); targetCtx.stroke();
            targetCtx.fillStyle = "#e2e8f0";
            targetCtx.fillRect(pX - 3 + pShift, pY - 1.5, 1.2, 1.8);
            targetCtx.fillRect(pX + 2 + pShift, pY - 1.5, 1.2, 1.8);
        } else {
            targetCtx.fillStyle = "#4f46e5";
            targetCtx.beginPath(); targetCtx.roundRect(pX - 6.5, pY - 9, 13, 9.5, [3, 3, 5, 5]); targetCtx.fill();
            targetCtx.strokeStyle = "#4338ca"; targetCtx.lineWidth = 1; targetCtx.stroke();
        }

    } else if (shirtColor === 'leather') {
        // Deri Ceket (Asimetrik gümüş fermuar, motorcu yakaları ve deri parlaklığı)
        drawShapedTorso("#18181b", "rgba(255,255,255,0.1)");
        if (!isBack) {
            targetCtx.strokeStyle = "#cbd5e1"; targetCtx.lineWidth = 1.3;
            let zShift = (effFacing === 'right') ? 2 : (effFacing === 'down-right') ? 1 : 0;
            targetCtx.beginPath(); targetCtx.moveTo(pX - 2 + zShift, pY - 9); targetCtx.lineTo(pX + 3 + zShift, pY + 11); targetCtx.stroke();
            // Metalik çıtçıtlar
            targetCtx.fillStyle = "#f8fafc";
            targetCtx.beginPath(); targetCtx.arc(pX - 4 + zShift, pY - 5, 0.9, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.beginPath(); targetCtx.arc(pX + 4 + zShift, pY - 5, 0.9, 0, Math.PI * 2); targetCtx.fill();
        } else {
            targetCtx.strokeStyle = "#334155"; targetCtx.lineWidth = 1;
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 4.5, pY - 9); targetCtx.lineTo(pX - 4.5, pY + 11);
            targetCtx.moveTo(pX + 4.5, pY - 9); targetCtx.lineTo(pX + 4.5, pY + 11);
            targetCtx.stroke();
        }

    } else if (shirtColor === 'overalls_blue') {
        // Mavi İşçi Tulumu (Klasik Denim / Kot Kumaş, Göğüs Önlüğü, Metal Tokalı Askılar ve Cepler)
        let denimBlue = "#2563eb";
        let darkDenim = "#1d4ed8";
        let lightDenim = "#3b82f6";
        let innerShirt = "#f8fafc"; // Tulumun altındaki beyaz pamuklu tişört
        let brassColor = "#facc15"; // Metal ayar tokaları ve çıtçıtlar

        // 1. Tulumun altındaki beyaz tişört tabanı (Kollara ve yakaya uzanan ferah içlik)
        drawShapedTorso(innerShirt, "rgba(0,0,0,0.1)");

        // 2. İşçi Tulumu Ön / Arka Gövdesi (Kot önlük)
        targetCtx.fillStyle = denimBlue;
        let bibW = isFemale ? 11 : 13;
        let waistW = isFemale ? 12 : 15;

        targetCtx.beginPath();
        targetCtx.moveTo(pX - bibW / 2, pY - 7);
        targetCtx.lineTo(pX + bibW / 2, pY - 7);
        targetCtx.lineTo(pX + waistW / 2, pY + 2);
        targetCtx.lineTo(pX + (isFemale ? 7 : 8.5), pY + 9);
        targetCtx.lineTo(pX - (isFemale ? 7 : 8.5), pY + 9);
        targetCtx.lineTo(pX - waistW / 2, pY + 2);
        targetCtx.closePath();
        targetCtx.fill();

        // Yan bel derinlik dikişleri / kumaş gölgesi
        targetCtx.fillStyle = darkDenim;
        targetCtx.fillRect(pX - waistW / 2, pY + 2, 2.5, 7);
        targetCtx.fillRect(pX + waistW / 2 - 2.5, pY + 2, 2.5, 7);

        // 3. Omuz Askıları (Metal tokalarla önlüğe bağlanan denim askılar)
        targetCtx.fillStyle = darkDenim;
        let strapL = pX - (isFemale ? 5 : 6);
        let strapR = pX + (isFemale ? 3 : 4);
        targetCtx.fillRect(strapL, pY - 11, 2.4, 5);
        targetCtx.fillRect(strapR, pY - 11, 2.4, 5);

        // Metal ayar tokaları (Brass buckles)
        targetCtx.fillStyle = brassColor;
        targetCtx.fillRect(strapL - 0.5, pY - 7.5, 3.4, 2);
        targetCtx.fillRect(strapR - 0.5, pY - 7.5, 3.4, 2);

        if (!isBack) {
            // 4. Göğüs Cebi (İşçi Tulumunun İkonik Ön Cebi)
            targetCtx.fillStyle = darkDenim;
            let pocketW = isFemale ? 6 : 7.5;
            targetCtx.beginPath();
            targetCtx.roundRect(pX - pocketW / 2, pY - 4.5, pocketW, 5, [1, 1, 2, 2]);
            targetCtx.fill();

            // Cep Dikişi & Sarı Kalem / Tornavida Vurgusu
            targetCtx.strokeStyle = "rgba(250, 204, 21, 0.4)";
            targetCtx.lineWidth = 0.6;
            targetCtx.stroke();
            // Cepte sarı iş kalemi detayı
            targetCtx.fillStyle = "#eab308";
            targetCtx.fillRect(pX + pocketW / 2 - 2, pY - 6.5, 1.2, 3);

            // Bel Metal Perçinleri (Yan düğmeler)
            targetCtx.fillStyle = "#cbd5e1";
            targetCtx.beginPath();
            targetCtx.arc(pX - waistW / 2 + 1.2, pY + 3, 1, 0, Math.PI * 2);
            targetCtx.arc(pX + waistW / 2 - 1.2, pY + 3, 1, 0, Math.PI * 2);
            targetCtx.fill();
        } else {
            // Arkadan görünüm: Çapraz askılar (Cross-Back suspenders)
            targetCtx.strokeStyle = darkDenim;
            targetCtx.lineWidth = 2.4;
            targetCtx.beginPath();
            targetCtx.moveTo(strapL + 1, pY - 11);
            targetCtx.lineTo(pX, pY - 3);
            targetCtx.lineTo(strapR + 1, pY - 11);
            targetCtx.stroke();
            // Arka deri etiket
            targetCtx.fillStyle = "#b45309";
            targetCtx.fillRect(pX - 2.5, pY - 4, 5, 2.5);
        }

    } else {
        // Klasik Tişört (Gerçekçi omuz manşetleri, yaka ribanası ve bel kıvrımı)
        let mainCol = shirtColor || "#3b82f6";
        drawShapedTorso(mainCol, "rgba(255,255,255,0.4)");

        if (!isBack) {
            // Yaka Ribanası ve Boyun Açıklığı
            targetCtx.strokeStyle = "rgba(0,0,0,0.2)"; targetCtx.lineWidth = 1;
            targetCtx.beginPath(); targetCtx.arc(pX, pY - 9, 4, 0, Math.PI); targetCtx.stroke();
            // Kumaş Dikiş ve Katlanma İpuçları
            targetCtx.strokeStyle = "rgba(0,0,0,0.12)"; targetCtx.lineWidth = 0.8;
            targetCtx.beginPath(); targetCtx.moveTo(pX - 5, pY + 3); targetCtx.quadraticCurveTo(pX, pY + 5, pX + 5, pY + 2); targetCtx.stroke();
        } else {
            // Arka ense dikişi
            targetCtx.strokeStyle = "rgba(0,0,0,0.18)"; targetCtx.lineWidth = 1;
            targetCtx.beginPath(); targetCtx.arc(pX, pY - 9, 4.5, 0, Math.PI); targetCtx.stroke();
        }
    }

    targetCtx.restore();
}

// --- 4. ŞAPKALAR VE SAÇ MODELLERİ (8 AÇILI İZOMETRİK TÜM SAÇLAR VE ŞAPKALAR) ---
function drawAvatarHairAndHats(targetCtx, pX, pY, hatType = "none", facing = "down") {
    let f = normalize8WayFacing(facing);
    let isBack = (f === 'up' || f === 'up-right' || f === 'up-left');
    let isLeft = (f === 'left' || f === 'down-left' || f === 'up-left');

    targetCtx.save();
    if (isLeft) {
        targetCtx.translate(pX, 0);
        targetCtx.scale(-1, 1);
        targetCtx.translate(-pX, 0);
    }

    let effFacing = f;
    if (f === 'left') effFacing = 'right';
    else if (f === 'down-left') effFacing = 'down-right';
    else if (f === 'up-left') effFacing = 'up-right';

    if (hatType === 'bere') {
        // Kırmızı Bere & Ponpon
        targetCtx.fillStyle = "#e11d48";
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 24, 8, Math.PI, 0); targetCtx.fill();
        let pomX = (effFacing === 'right') ? pX - 4 : (effFacing === 'down-right') ? pX + 2 : pX;
        let pomY = (effFacing === 'right') ? pY - 26 : pY - 26;
        targetCtx.fillStyle = "#ffffff";
        targetCtx.beginPath(); targetCtx.arc(pomX, pomY, 3, 0, Math.PI * 2); targetCtx.fill();

    } else if (hatType === 'fes') {
        // Osmanlı Fesi
        targetCtx.fillStyle = "#991b1b";
        targetCtx.beginPath();
        targetCtx.moveTo(pX - 7, pY - 20); targetCtx.lineTo(-5 + pX, pY - 30);
        targetCtx.lineTo(5 + pX, pY - 30); targetCtx.lineTo(7 + pX, pY - 20);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.strokeStyle = "#0f172a"; targetCtx.lineWidth = 1.5;
        let tEnd = (effFacing === 'right') ? -4 : (effFacing === 'up') ? 0 : 8;
        targetCtx.beginPath(); targetCtx.moveTo(pX, pY - 30); targetCtx.quadraticCurveTo(pX + tEnd * 0.8, pY - 28, pX + tEnd, pY - 21); targetCtx.stroke();
        targetCtx.fillStyle = "#0f172a"; targetCtx.beginPath(); targetCtx.arc(pX + tEnd, pY - 21, 2, 0, Math.PI * 2); targetCtx.fill();

    } else if (hatType === 'kasket') {
        // Kasket (8 Açılı Siperlik)
        targetCtx.fillStyle = "#334155";
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 23, 9, Math.PI, 0); targetCtx.fill();
        let vDir = (effFacing === 'right') ? 6 : (effFacing === 'down-right') ? 4 : (effFacing === 'up') ? 0 : 0;
        let vWidth = (effFacing === 'up') ? 6 : 9;
        targetCtx.fillStyle = "#1e293b";
        targetCtx.beginPath(); targetCtx.ellipse(pX + vDir, pY - 23, vWidth, 3, 0, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.fillStyle = "#64748b";
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 26, 2, 0, Math.PI * 2); targetCtx.fill();

    } else if (hatType === 'cowboy') {
        // Kovboy Şapkası
        targetCtx.fillStyle = "#78350f";
        let brimTilt = (effFacing === 'right') ? 0.2 : (effFacing === 'down-right') ? 0.1 : 0;
        targetCtx.beginPath(); targetCtx.ellipse(pX, pY - 22, 14, 4, brimTilt, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.beginPath(); targetCtx.roundRect(pX - 6, pY - 31, 12, 10, [4, 4, 0, 0]); targetCtx.fill();
        targetCtx.fillStyle = "#f59e0b"; targetCtx.fillRect(pX - 6, pY - 23, 12, 2);

    } else if (hatType === 'hair_long') {
        // Uzun Düz Saç
        targetCtx.fillStyle = "#451a03";
        if (isBack) {
            targetCtx.beginPath();
            targetCtx.roundRect(pX - 10, pY - 22, 20, 30, [8, 8, 4, 4]);
            targetCtx.fill();
        } else {
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 9, pY - 20); targetCtx.quadraticCurveTo(pX - 13, pY - 2, pX - 10, pY + 8);
            targetCtx.lineTo(pX - 6, pY + 8); targetCtx.quadraticCurveTo(pX - 7, pY - 2, pX - 5, pY - 14);
            targetCtx.closePath(); targetCtx.fill();

            targetCtx.beginPath();
            targetCtx.moveTo(pX + 9, pY - 20); targetCtx.quadraticCurveTo(pX + 13, pY - 2, pX + 10, pY + 8);
            targetCtx.lineTo(pX + 6, pY + 8); targetCtx.quadraticCurveTo(pX + 7, pY - 2, pX + 5, pY - 14);
            targetCtx.closePath(); targetCtx.fill();

            targetCtx.beginPath(); targetCtx.arc(pX, pY - 19, 10.5, Math.PI * 0.95, Math.PI * 2.05); targetCtx.fill();
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 9, pY - 21); targetCtx.quadraticCurveTo(pX - 2, pY - 17, pX, pY - 22);
            targetCtx.quadraticCurveTo(pX + 3, pY - 17, pX + 9, pY - 21);
            targetCtx.lineTo(pX + 8, pY - 24); targetCtx.lineTo(pX - 8, pY - 24);
            targetCtx.closePath(); targetCtx.fill();
        }

    } else if (hatType === 'hair_wavy') {
        // Dalgalı Saç
        targetCtx.fillStyle = "#78350f";
        if (isBack) {
            targetCtx.beginPath();
            targetCtx.roundRect(pX - 11, pY - 22, 22, 28, [8, 8, 5, 5]);
            targetCtx.fill();
        } else {
            targetCtx.beginPath();
            targetCtx.arc(pX - 10, pY - 12, 4, 0, Math.PI * 2);
            targetCtx.arc(pX - 11, pY - 5, 4.5, 0, Math.PI * 2);
            targetCtx.arc(pX - 9, pY + 3, 4, 0, Math.PI * 2);
            targetCtx.fill();
            targetCtx.beginPath();
            targetCtx.arc(pX + 10, pY - 12, 4, 0, Math.PI * 2);
            targetCtx.arc(pX + 11, pY - 5, 4.5, 0, Math.PI * 2);
            targetCtx.arc(pX + 9, pY + 3, 4, 0, Math.PI * 2);
            targetCtx.fill();
            targetCtx.beginPath(); targetCtx.arc(pX, pY - 19, 10.5, Math.PI * 0.95, Math.PI * 2.05); targetCtx.fill();
        }

    } else if (hatType === 'hair_ponytail') {
        // At Kuyruğu Saç
        targetCtx.fillStyle = "#292524";
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 19, 10.5, Math.PI * 0.95, Math.PI * 2.05); targetCtx.fill();
        let ptX = (effFacing === 'right') ? pX - 7 : (effFacing === 'up') ? pX : pX + 8;
        let ptY = pY - 25;
        targetCtx.fillStyle = "#ec4899";
        targetCtx.beginPath(); targetCtx.arc(ptX, ptY, 3, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.fillStyle = "#292524";
        targetCtx.beginPath();
        targetCtx.moveTo(ptX, ptY);
        targetCtx.quadraticCurveTo(ptX + ((effFacing === 'right') ? -10 : 8), ptY + 6, ptX + ((effFacing === 'right') ? -5 : 5), ptY + 16);
        targetCtx.quadraticCurveTo(ptX + 2, ptY + 8, ptX, ptY + 2);
        targetCtx.closePath(); targetCtx.fill();

    } else if (hatType === 'hair_braids') {
        // İki Yandan Örgülü Saç
        targetCtx.fillStyle = "#b45309";
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 19, 10.5, Math.PI * 0.95, Math.PI * 2.05); targetCtx.fill();
        [-1, 1].forEach(side => {
            let bx = pX + side * 10;
            targetCtx.fillStyle = "#b45309";
            targetCtx.beginPath(); targetCtx.arc(bx, pY - 12, 3, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.beginPath(); targetCtx.arc(bx, pY - 7, 2.7, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.beginPath(); targetCtx.arc(bx, pY - 2, 2.4, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.fillStyle = "#38bdf8";
            targetCtx.beginPath(); targetCtx.arc(bx, pY + 1, 2, 0, Math.PI * 2); targetCtx.fill();
        });

    } else if (hatType === 'hair_bob') {
        // Küt Kesim Bob Saç
        targetCtx.fillStyle = "#1e1b4b";
        targetCtx.beginPath();
        targetCtx.arc(pX, pY - 19, 11, Math.PI * 0.85, Math.PI * 2.15);
        targetCtx.lineTo(pX + 10, pY - 10);
        targetCtx.lineTo(pX - 10, pY - 10);
        targetCtx.closePath(); targetCtx.fill();

    } else if (hatType === 'hair_hijab') {
        // Şık Başörtüsü
        targetCtx.fillStyle = "#0284c7";
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 19, 11.5, Math.PI * 0.85, Math.PI * 2.15); targetCtx.fill();
        targetCtx.fillStyle = "#38bdf8";
        targetCtx.beginPath();
        targetCtx.moveTo(pX - 11, pY - 14);
        targetCtx.quadraticCurveTo(pX - 13, pY - 2, pX - 9, pY + 5);
        targetCtx.lineTo(pX + 9, pY + 5);
        targetCtx.quadraticCurveTo(pX + 13, pY - 2, pX + 11, pY - 14);
        targetCtx.closePath(); targetCtx.fill();

    } else if (hatType === 'beret_pink') {
        // Pembe Fransız Bere
        targetCtx.fillStyle = "#f472b6";
        targetCtx.beginPath(); targetCtx.ellipse(pX - 1, pY - 24, 11, 5, -0.2, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.fillStyle = "#facc15";
        targetCtx.beginPath(); targetCtx.arc(pX + 1, pY - 27, 2, 0, Math.PI * 2); targetCtx.fill();

    } else if (hatType === 'crown') {
        // Prenses Altın Tacı
        targetCtx.fillStyle = "#f59e0b";
        targetCtx.beginPath();
        targetCtx.moveTo(pX - 7, pY - 23);
        targetCtx.lineTo(pX - 7, pY - 29);
        targetCtx.lineTo(pX - 3, pY - 25);
        targetCtx.lineTo(pX, pY - 31);
        targetCtx.lineTo(pX + 3, pY - 25);
        targetCtx.lineTo(pX + 7, pY - 29);
        targetCtx.lineTo(pX + 7, pY - 23);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.fillStyle = "#ef4444"; targetCtx.fillRect(pX - 1, pY - 29, 2, 2);
        targetCtx.fillStyle = "#38bdf8"; targetCtx.fillRect(pX - 6, pY - 27, 1.5, 1.5);
        targetCtx.fillRect(pX + 4.5, pY - 27, 1.5, 1.5);

    } else if (hatType === 'hair_blonde_curls') {
        // Altın Bukleli Uzun Saç
        targetCtx.fillStyle = "#eab308";
        [-1, 1].forEach(side => {
            let cx = pX + side * 10;
            targetCtx.beginPath();
            targetCtx.arc(cx, pY - 14, 4, 0, Math.PI * 2);
            targetCtx.arc(cx + side * 1, pY - 7, 4.5, 0, Math.PI * 2);
            targetCtx.arc(cx, pY, 4, 0, Math.PI * 2);
            targetCtx.arc(cx - side * 1, pY + 7, 3.5, 0, Math.PI * 2);
            targetCtx.fill();
        });
        targetCtx.fillStyle = "#facc15";
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 19, 11, Math.PI * 0.95, Math.PI * 2.05); targetCtx.fill();
        if (isBack) {
            targetCtx.fillRect(pX - 10, pY - 19, 20, 24);
        }

    } else if (hatType === 'hair_bun_chopsticks') {
        // Zarif Topuz & Çiçekli Toka
        targetCtx.fillStyle = "#1c1917";
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 26, 6.5, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 19, 10.5, Math.PI * 0.95, Math.PI * 2.05); targetCtx.fill();
        targetCtx.strokeStyle = "#facc15"; targetCtx.lineWidth = 1.5;
        targetCtx.beginPath();
        targetCtx.moveTo(pX - 9, pY - 23); targetCtx.lineTo(pX + 9, pY - 29);
        targetCtx.stroke();
        targetCtx.fillStyle = "#f472b6";
        targetCtx.beginPath(); targetCtx.arc(pX + 6, pY - 27, 3, 0, Math.PI * 2); targetCtx.fill();

    } else if (hatType === 'hair_redhead_wavy') {
        // Kızıl Dalgalı Romantik Saç
        targetCtx.fillStyle = "#c2410c";
        if (isBack) {
            targetCtx.beginPath();
            targetCtx.roundRect(pX - 11, pY - 22, 22, 28, 6);
            targetCtx.fill();
        } else {
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 9, pY - 20); targetCtx.quadraticCurveTo(pX - 14, pY - 4, pX - 11, pY + 7);
            targetCtx.lineTo(pX - 6, pY + 7); targetCtx.quadraticCurveTo(pX - 8, pY - 4, pX - 5, pY - 14);
            targetCtx.closePath(); targetCtx.fill();
            targetCtx.beginPath();
            targetCtx.moveTo(pX + 9, pY - 20); targetCtx.quadraticCurveTo(pX + 15, pY - 2, pX + 12, pY + 9);
            targetCtx.lineTo(pX + 6, pY + 9); targetCtx.quadraticCurveTo(pX + 8, pY - 2, pX + 5, pY - 14);
            targetCtx.closePath(); targetCtx.fill();
            targetCtx.fillStyle = "#ea580c";
            targetCtx.beginPath(); targetCtx.arc(pX, pY - 19, 11, Math.PI * 0.95, Math.PI * 2.05); targetCtx.fill();
        }

    } else if (hatType === 'hair_pigtails_ribbon') {
        // Kurdeleli İkili Yan Saç
        targetCtx.fillStyle = "#78350f";
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 19, 10.5, Math.PI * 0.95, Math.PI * 2.05); targetCtx.fill();
        [-1, 1].forEach(side => {
            let px = pX + side * 9;
            targetCtx.fillStyle = "#ec4899";
            targetCtx.beginPath(); targetCtx.arc(px, pY - 21, 2.5, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.fillStyle = "#78350f";
            targetCtx.beginPath();
            targetCtx.moveTo(px, pY - 21);
            targetCtx.quadraticCurveTo(px + side * 6, pY - 14, px + side * 4, pY - 4);
            targetCtx.quadraticCurveTo(px + side * 2, pY - 14, px, pY - 21);
            targetCtx.closePath(); targetCtx.fill();
        });

    } else if (hatType === 'hair_curly_brown') {
        // Kıvırcık Kahverengi Saç (Zengin Çikolata Tonları, Hacimli Bukleler & Doğal Kıvrımlar)
        let baseBrown = "#451a03"; // Koyu çikolata taban
        let midBrown = "#78350f";  // Sıcak kahve hacim
        let lightBrown = "#92400e"; // Güneş ışığı ışıltısı

        if (isBack) {
            // Arkadan görünüm: Başı saran ve omuzlara dökülen hacimli dalgalı kıvırcık saçlar
            targetCtx.fillStyle = baseBrown;
            targetCtx.beginPath();
            targetCtx.roundRect(pX - 12, pY - 24, 24, 28, 8);
            targetCtx.fill();

            // Kıvırcık bukle dokuları (arka)
            targetCtx.fillStyle = midBrown;
            [
                [-8, -18, 4.5], [0, -20, 5], [8, -18, 4.5],
                [-9, -10, 4], [-3, -11, 4.5], [4, -10, 4], [9, -9, 3.8],
                [-7, -2, 4.2], [0, -3, 4.8], [7, -2, 4.2],
                [-5, 3, 3.5], [2, 4, 3.8]
            ].forEach(([cx, cy, r]) => {
                targetCtx.beginPath();
                targetCtx.arc(pX + cx, pY + cy, r, 0, Math.PI * 2);
                targetCtx.fill();
            });

            // Parlama vurguları
            targetCtx.fillStyle = lightBrown;
            [-5, 2, 6].forEach(sx => {
                targetCtx.beginPath();
                targetCtx.arc(pX + sx, pY - 14, 2.5, 0, Math.PI * 2);
                targetCtx.fill();
            });
        } else {
            // Önden ve yandan görünüm: Yüzü çevreleyen hacimli kıvırcık bukleler
            targetCtx.fillStyle = baseBrown;
            // Sol ve sağ omuzlara dökülen bukle kuleleri
            [-1, 1].forEach(side => {
                let bx = pX + side * 10;
                targetCtx.fillStyle = baseBrown;
                [
                    [0, -18, 5],
                    [side * 1.5, -12, 5],
                    [side * 0.5, -6, 4.8],
                    [-side * 0.5, 0, 4.5],
                    [side * 0.5, 5, 4],
                    [-side * 0.5, 9, 3.2]
                ].forEach(([ox, oy, r]) => {
                    targetCtx.beginPath();
                    targetCtx.arc(bx + ox, pY + oy, r, 0, Math.PI * 2);
                    targetCtx.fill();
                });

                // Bukle katmanları ve gölgelendirmeleri
                targetCtx.fillStyle = midBrown;
                [
                    [side * 0.5, -15, 3.8],
                    [side * 1.8, -9, 3.8],
                    [0, -3, 3.5],
                    [side * 0.8, 3, 3.2]
                ].forEach(([ox, oy, r]) => {
                    targetCtx.beginPath();
                    targetCtx.arc(bx + ox, pY + oy, r, 0, Math.PI * 2);
                    targetCtx.fill();
                });

                // Işıltı noktacıkları
                targetCtx.fillStyle = lightBrown;
                targetCtx.beginPath();
                targetCtx.arc(bx + side * 0.5, pY - 12, 1.8, 0, Math.PI * 2);
                targetCtx.fill();
            });

            // Tepe saç kubbesi (Kıvırcık kabarık tepe)
            targetCtx.fillStyle = midBrown;
            targetCtx.beginPath();
            targetCtx.arc(pX, pY - 20, 11.5, Math.PI * 0.92, Math.PI * 2.08);
            targetCtx.fill();

            // Alındaki tatlı kıvırcık kakül / perçem bukleleri
            targetCtx.fillStyle = baseBrown;
            [-5, -1, 3, 6].forEach(kx => {
                targetCtx.beginPath();
                targetCtx.arc(pX + kx, pY - 20, 3, 0, Math.PI * 2);
                targetCtx.fill();
            });
            targetCtx.fillStyle = lightBrown;
            [-3, 2].forEach(kx => {
                targetCtx.beginPath();
                targetCtx.arc(pX + kx, pY - 22, 1.6, 0, Math.PI * 2);
                targetCtx.fill();
            });
        }

    } else if (hatType === 'korsan') {
        // Korsan Kaptanı Şapkası
        targetCtx.fillStyle = "#0f172a";
        targetCtx.beginPath();
        targetCtx.moveTo(pX - 15, pY - 21);
        targetCtx.quadraticCurveTo(pX - 8, pY - 33, pX, pY - 35);
        targetCtx.quadraticCurveTo(pX + 8, pY - 33, pX + 15, pY - 21);
        targetCtx.quadraticCurveTo(pX, pY - 24, pX - 15, pY - 21);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.strokeStyle = "#f59e0b"; targetCtx.lineWidth = 1.5; targetCtx.stroke();
        if (!isBack) {
            targetCtx.fillStyle = "#ffffff";
            targetCtx.beginPath(); targetCtx.arc(pX, pY - 28, 2.5, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.fillRect(pX - 3.5, pY - 25.5, 7, 1.2);
        }

    } else if (hatType === 'sihirbaz') {
        // Sihirbaz Silindiri
        targetCtx.fillStyle = "#09090b";
        targetCtx.beginPath(); targetCtx.ellipse(pX, pY - 22, 13, 3.8, 0, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.fillStyle = "#18181b";
        targetCtx.beginPath(); targetCtx.roundRect(pX - 7, pY - 37, 14, 16, [2, 2, 0, 0]); targetCtx.fill();
        targetCtx.fillStyle = "#9333ea";
        targetCtx.fillRect(pX - 7, pY - 25, 14, 3);
        if (!isBack) {
            targetCtx.fillStyle = "#facc15"; targetCtx.fillRect(pX - 2, pY - 25.5, 4, 4);
        }

    } else if (hatType === 'kulaklik') {
        // DJ Kulaklığı
        targetCtx.strokeStyle = "#334155"; targetCtx.lineWidth = 3;
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 18, 11, Math.PI * 1.05, Math.PI * 1.95); targetCtx.stroke();
        [-1, 1].forEach(side => {
            let cx = pX + side * 11;
            let cy = pY - 18;
            targetCtx.fillStyle = "#06b6d4";
            targetCtx.beginPath(); targetCtx.ellipse(cx, cy, 3, 5, 0, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.strokeStyle = "#0891b2"; targetCtx.lineWidth = 1; targetCtx.stroke();
        });

    } else {
        // Sade Kısa Saç
        targetCtx.strokeStyle = "#451a03"; targetCtx.lineWidth = 2.5;
        targetCtx.beginPath(); targetCtx.arc(pX, pY - 23, 8, Math.PI * 1.15, Math.PI * 1.85); targetCtx.stroke();
        if (isBack) {
            targetCtx.fillStyle = "#451a03";
            targetCtx.fillRect(pX - 7, pY - 22, 14, 6);
        }
    }

    targetCtx.restore();
}

// --- 5. GÖZLER VE YÜZ AKSESUARLARI (8 AÇILI İZOMETRİK GÖZ, SUNGASSES, SAKAL, BIYIK) ---
function drawAvatarFaceAndEyes(targetCtx, pX, pY, faceType = "none", eyeOffsetX = 0, eyeOffsetY = 0, facing = "down") {
    let f = normalize8WayFacing(facing);
    if (f === 'up' || f === 'up-right' || f === 'up-left') {
        return;
    }

    targetCtx.save();
    if (f === 'right') {
        targetCtx.fillStyle = "#0f172a";
        targetCtx.fillRect(pX + 4, pY - 20, 2.5, 3);
        if (faceType === 'sunglasses') {
            targetCtx.fillStyle = "#0f172a";
            targetCtx.fillRect(pX + 2, pY - 21, 6, 4.5);
            targetCtx.strokeStyle = "#0f172a"; targetCtx.lineWidth = 1;
            targetCtx.beginPath(); targetCtx.moveTo(pX + 2, pY - 19); targetCtx.lineTo(pX - 5, pY - 18); targetCtx.stroke();
        } else if (faceType === 'mustache') {
            targetCtx.fillStyle = "#1e1e1e";
            targetCtx.beginPath(); targetCtx.ellipse(pX + 4, pY - 14, 4, 1.5, 0.2, 0, Math.PI * 2); targetCtx.fill();
        } else if (faceType === 'beard') {
            targetCtx.fillStyle = "rgba(30, 20, 10, 0.45)";
            targetCtx.beginPath(); targetCtx.arc(pX + 2, pY - 16, 7.5, 0, Math.PI * 0.5); targetCtx.fill();
        }

    } else if (f === 'left') {
        targetCtx.fillStyle = "#0f172a";
        targetCtx.fillRect(pX - 6.5, pY - 20, 2.5, 3);
        if (faceType === 'sunglasses') {
            targetCtx.fillStyle = "#0f172a";
            targetCtx.fillRect(pX - 8, pY - 21, 6, 4.5);
            targetCtx.strokeStyle = "#0f172a"; targetCtx.lineWidth = 1;
            targetCtx.beginPath(); targetCtx.moveTo(pX - 2, pY - 19); targetCtx.lineTo(pX + 5, pY - 18); targetCtx.stroke();
        } else if (faceType === 'mustache') {
            targetCtx.fillStyle = "#1e1e1e";
            targetCtx.beginPath(); targetCtx.ellipse(pX - 4, pY - 14, 4, 1.5, -0.2, 0, Math.PI * 2); targetCtx.fill();
        } else if (faceType === 'beard') {
            targetCtx.fillStyle = "rgba(30, 20, 10, 0.45)";
            targetCtx.beginPath(); targetCtx.arc(pX - 2, pY - 16, 7.5, Math.PI * 0.5, Math.PI); targetCtx.fill();
        }

    } else if (f === 'down-right') {
        targetCtx.fillStyle = "#0f172a";
        targetCtx.fillRect(pX - 1, pY - 20, 2.5, 3);
        targetCtx.fillRect(pX + 5, pY - 20, 2.5, 3);
        if (faceType === 'sunglasses') {
            targetCtx.fillStyle = "#0f172a";
            targetCtx.fillRect(pX - 3, pY - 21, 5, 4.5);
            targetCtx.fillRect(pX + 3.5, pY - 21, 5, 4.5);
            targetCtx.strokeStyle = "#0f172a"; targetCtx.lineWidth = 1;
            targetCtx.beginPath(); targetCtx.moveTo(pX + 2, pY - 19); targetCtx.lineTo(pX + 3.5, pY - 19); targetCtx.stroke();
        } else if (faceType === 'mustache') {
            targetCtx.fillStyle = "#1e1e1e";
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 3, pY - 14); targetCtx.quadraticCurveTo(pX + 2, pY - 12, pX + 8, pY - 14);
            targetCtx.quadraticCurveTo(pX + 2, pY - 16, pX - 3, pY - 14); targetCtx.fill();
        } else if (faceType === 'beard') {
            targetCtx.fillStyle = "rgba(30, 20, 10, 0.45)";
            targetCtx.beginPath(); targetCtx.arc(pX + 1, pY - 16, 7.5, 0, Math.PI); targetCtx.fill();
        }

    } else if (f === 'down-left') {
        targetCtx.fillStyle = "#0f172a";
        targetCtx.fillRect(pX - 7.5, pY - 20, 2.5, 3);
        targetCtx.fillRect(pX - 1.5, pY - 20, 2.5, 3);
        if (faceType === 'sunglasses') {
            targetCtx.fillStyle = "#0f172a";
            targetCtx.fillRect(pX - 8.5, pY - 21, 5, 4.5);
            targetCtx.fillRect(pX - 2, pY - 21, 5, 4.5);
            targetCtx.strokeStyle = "#0f172a"; targetCtx.lineWidth = 1;
            targetCtx.beginPath(); targetCtx.moveTo(pX - 3.5, pY - 19); targetCtx.lineTo(pX - 2, pY - 19); targetCtx.stroke();
        } else if (faceType === 'mustache') {
            targetCtx.fillStyle = "#1e1e1e";
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 8, pY - 14); targetCtx.quadraticCurveTo(pX - 2, pY - 12, pX + 3, pY - 14);
            targetCtx.quadraticCurveTo(pX - 2, pY - 16, pX - 8, pY - 14); targetCtx.fill();
        } else if (faceType === 'beard') {
            targetCtx.fillStyle = "rgba(30, 20, 10, 0.45)";
            targetCtx.beginPath(); targetCtx.arc(pX - 1, pY - 16, 7.5, 0, Math.PI); targetCtx.fill();
        }

    } else {
        // Tam Öne Dönük
        targetCtx.fillStyle = "#0f172a";
        targetCtx.fillRect(pX - 4 + eyeOffsetX, pY - 20 + eyeOffsetY, 2.5, 3);
        targetCtx.fillRect(pX + 2 + eyeOffsetX, pY - 20 + eyeOffsetY, 2.5, 3);

        if (faceType === 'mustache') {
            targetCtx.fillStyle = "#1e1e1e";
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 6, pY - 14);
            targetCtx.quadraticCurveTo(pX, pY - 12, pX + 6, pY - 14);
            targetCtx.quadraticCurveTo(pX, pY - 16, pX - 6, pY - 14);
            targetCtx.fill();
        } else if (faceType === 'sunglasses') {
            targetCtx.fillStyle = "#0f172a";
            targetCtx.fillRect(pX - 6 + eyeOffsetX, pY - 21 + eyeOffsetY, 5, 4.5);
            targetCtx.fillRect(pX + 1 + eyeOffsetX, pY - 21 + eyeOffsetY, 5, 4.5);
            targetCtx.strokeStyle = "#0f172a";
            targetCtx.lineWidth = 1;
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 1 + eyeOffsetX, pY - 19 + eyeOffsetY);
            targetCtx.lineTo(pX + 1 + eyeOffsetX, pY - 19 + eyeOffsetY);
            targetCtx.stroke();
            targetCtx.fillStyle = "rgba(255,255,255,0.7)";
            targetCtx.fillRect(pX - 5 + eyeOffsetX, pY - 20 + eyeOffsetY, 1.5, 1.5);
            targetCtx.fillRect(pX + 2 + eyeOffsetX, pY - 20 + eyeOffsetY, 1.5, 1.5);
        } else if (faceType === 'beard') {
            targetCtx.fillStyle = "rgba(30, 20, 10, 0.45)";
            targetCtx.beginPath();
            targetCtx.arc(pX, pY - 16, 7.5, 0, Math.PI);
            targetCtx.fill();
        }
    }

    targetCtx.restore();
}

// --- 5.9 SİGARA İÇME & DUMAN ÜFLEME MEKANİĞİ MOTORU (40s - 2dk RNG DÖNGÜSÜ) ---
function getAvatarMouthPos(pX, pY, facing = 'down', model = 'classic_2') {
    let f = normalize8WayFacing(facing);
    let mY = pY - 13.8;
    let mX = pX;
    if (f === 'right') mX = pX + 4.5;
    else if (f === 'down-right') mX = pX + 3.0;
    else if (f === 'left') mX = pX - 4.5;
    else if (f === 'down-left') mX = pX - 3.0;
    else if (f === 'up-right') mX = pX + 2.5;
    else if (f === 'up-left') mX = pX - 2.5;
    else if (f === 'up') mX = pX;
    return { x: mX, y: mY };
}

function getAvatarSmokingState(p, isPreview = false) {
    if (!p) return null;
    let heldItem = p.heldItem || (p.hasTea ? 'cay' : 'none');
    if (heldItem !== 'sigara') {
        p._smokeAnimStart = null;
        return null;
    }

    let now = Date.now();
    if (!p._nextSmokeTime) {
        // Dümdüz 35 saniye bekleme süresi
        let delay = isPreview ? 8000 : 35000;
        p._nextSmokeTime = now + delay;
    }

    if (now >= p._nextSmokeTime && !p._smokeAnimStart) {
        p._smokeAnimStart = now;
    }

    if (!p._smokeAnimStart) return null;

    let elapsed = now - p._smokeAnimStart;
    let totalDuration = 4200; // 4.2 saniye toplam animasyon süresi

    if (elapsed >= totalDuration) {
        p._smokeAnimStart = null;
        p._nextSmokeTime = now + (isPreview ? 8000 : 35000);
        return null;
    }

    let liftProgress = 0;
    if (elapsed < 900) {
        // 1. Faz: Sigarayı ağza götürme (0 -> 1)
        let t = elapsed / 900;
        liftProgress = 0.5 - 0.5 * Math.cos(Math.PI * t);
    } else if (elapsed < 2000) {
        // 2. Faz: Ağızda tutma & derin nefes çekme (köz alevlenir)
        liftProgress = 1.0;
    } else if (elapsed < 2800) {
        // 3. Faz: Kolu yavaşça eski yerine indirme (1 -> 0)
        let t = (elapsed - 2000) / 800;
        liftProgress = 0.5 + 0.5 * Math.cos(Math.PI * t);
    } else {
        liftProgress = 0;
    }

    let isInhaling = (elapsed >= 900 && elapsed < 2000);
    let isExhaling = (elapsed >= 2100 && elapsed < 4200);
    let exhaleProgress = isExhaling ? (elapsed - 2100) / 2100 : 0;

    return {
        active: true,
        elapsed,
        liftProgress,
        isInhaling,
        isExhaling,
        exhaleProgress
    };
}

function drawExhaleSmoke(ctx, pX, pY, facing, model, progress) {
    let mouth = getAvatarMouthPos(pX, pY, facing, model);
    let f = normalize8WayFacing(facing);
    let isBack = (f === 'up' || f === 'up-right' || f === 'up-left');

    ctx.save();

    // 1. Ağızda hafif "O" şeklinde üfleme ifadesi (eğer arkası dönük değilse)
    if (!isBack && progress < 0.8) {
        ctx.fillStyle = "rgba(40, 25, 20, 0.75)";
        ctx.beginPath();
        ctx.ellipse(mouth.x, mouth.y, 1.2, 1.6, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. 3 Dalga Halinde Genişleyen ve Yükselen Zarif Duman Bulutları / Halkaları
    let puffOffsets = [0.0, 0.22, 0.45];
    for (let i = 0; i < puffOffsets.length; i++) {
        let offset = puffOffsets[i];
        if (progress < offset) continue;

        let pLocal = (progress - offset) / (1.0 - offset);
        if (pLocal < 0 || pLocal > 1) continue;

        // Yöne göre üfleme yönü
        let dirX = 0, dirY = 0;
        if (f === 'right') { dirX = 1.0; dirY = -0.3; }
        else if (f === 'down-right') { dirX = 0.8; dirY = 0.15; }
        else if (f === 'down') { dirX = (i % 2 === 0 ? 0.3 : -0.3); dirY = 0.4; }
        else if (f === 'down-left') { dirX = -0.8; dirY = 0.15; }
        else if (f === 'left') { dirX = -1.0; dirY = -0.3; }
        else if (f === 'up-right') { dirX = 0.7; dirY = -0.7; }
        else if (f === 'up-left') { dirX = -0.7; dirY = -0.7; }
        else if (f === 'up') { dirX = (i % 2 === 0 ? 0.25 : -0.25); dirY = -0.8; }

        let dist = pLocal * 26.0;
        let rise = pLocal * 18.0;
        let wave = Math.sin(pLocal * 5.0 + i * 1.8) * 2.5;

        let puffX = mouth.x + (dirX * dist) + wave;
        let puffY = mouth.y + (dirY * dist * 0.35) - rise;
        let radius = 2.0 + pLocal * 7.5;

        // Opasite: Başta hızla yoğunlaşır, sonra havada yavaşça dağılır
        let alpha = Math.sin(pLocal * Math.PI) * 0.58;

        // Dış yumuşak duman sisi
        ctx.fillStyle = `rgba(226, 232, 240, ${alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(puffX, puffY, radius * 1.35, 0, Math.PI * 2);
        ctx.fill();

        // Ana duman gövdesi
        ctx.fillStyle = `rgba(241, 245, 249, ${alpha})`;
        ctx.beginPath();
        ctx.arc(puffX, puffY, radius, 0, Math.PI * 2);
        ctx.fill();

        // 2. dalgada karizmatik duman halkası (smoke ring)
        if (i === 1 && pLocal > 0.15 && pLocal < 0.85) {
            let ringAlpha = Math.sin((pLocal - 0.15) / 0.7 * Math.PI) * 0.65;
            ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.ellipse(puffX, puffY, radius * 0.95, radius * 0.5, dirX * 0.35, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    ctx.restore();
}

// Konsoldan veya testlerden anında sigara dumanı animasyonunu tetikleme fonksiyonu
window.triggerSmokeAnimation = function(targetPlayer) {
    let p = targetPlayer || (typeof myAvatar !== 'undefined' ? myAvatar : null);
    if (!p) return;
    p._smokeAnimStart = Date.now();
    p._nextSmokeTime = Date.now() + 4200 + 40000 + Math.random() * 80000;
};

// --- 6. EL EŞYALARI (8 AÇILI İZOMETRİK TÜM EL EŞYALARI VE SIRTKAPLAMA) ---
function drawHeldItem(targetCtx, pX, pY, heldItem, isPreview = false, facing = 'down', is25d = false, model = 'classic', p = null) {
    if (!heldItem || heldItem === 'none') return;

    let f = normalize8WayFacing(facing);
    let isBack = (f === 'up' || f === 'up-right' || f === 'up-left');
    let isLeft = (f === 'left' || f === 'down-left' || f === 'up-left');

    targetCtx.save();

    // Dinamik El Pozisyonu Çapaları (2.5D Gerçekçi Model vs Klasik 2 vs Klasik Chibi)
    let handX, handY;
    if (is25d || model === 'sanalika_v2') {
        // 2.5D İzometrik Vücut Modeline (sY + handY) Tam Milimetrik Senkron El Koordinatları
        if (f === 'down') {
            handX = pX + 7.8; handY = pY - 1.2;
        } else if (f === 'down-right') {
            handX = pX + 7.2; handY = pY - 1.0;
        } else if (f === 'right') {
            handX = pX + 2.8; handY = pY - 1.2;
        } else if (f === 'up-right') {
            handX = pX + 6.0; handY = pY - 1.5;
        } else if (f === 'up') {
            handX = pX + 7.0; handY = pY - 1.5;
        } else if (f === 'up-left') {
            handX = pX - 6.0; handY = pY - 1.5;
        } else if (f === 'left') {
            handX = pX - 2.8; handY = pY - 1.2;
        } else if (f === 'down-left') {
            handX = pX - 7.2; handY = pY - 1.0;
        } else {
            handX = pX + 7.8; handY = pY - 1.2;
        }
    } else if (model === 'classic_2') {
        // Klasik 2 Modeline (Sabit El Pozisyonu) Tam Milimetrik Senkron El Koordinatları
        if (f === 'down') {
            handX = pX + 9.0; handY = pY + 6.2;
        } else if (f === 'down-right') {
            handX = pX + 7.0; handY = pY + 7.2;
        } else if (f === 'right') {
            handX = pX + 2.0; handY = pY + 6.2;
        } else if (f === 'up-right') {
            handX = pX + 5.0; handY = pY + 6.2;
        } else if (f === 'up') {
            handX = pX + 8.0; handY = pY + 6.2;
        } else if (f === 'up-left') {
            handX = pX - 5.0; handY = pY + 6.2;
        } else if (f === 'left') {
            handX = pX - 2.0; handY = pY + 6.2;
        } else if (f === 'down-left') {
            handX = pX - 7.0; handY = pY + 7.2;
        } else {
            handX = pX + 9.0; handY = pY + 6.2;
        }
    } else {
        if (f === 'down') {
            handX = pX + (isPreview ? 12 : 11); handY = pY + 2;
        } else if (f === 'down-right') {
            handX = pX + 13; handY = pY + 4;
        } else if (f === 'right') {
            handX = pX + 12; handY = pY + 1;
        } else if (f === 'up-right') {
            handX = pX + 8; handY = pY - 3;
        } else if (f === 'up') {
            handX = pX + 8; handY = pY - 2;
        } else if (f === 'up-left') {
            handX = pX - 8; handY = pY - 3;
        } else if (f === 'left') {
            handX = pX - 12; handY = pY + 1;
        } else if (f === 'down-left') {
            handX = pX - 13; handY = pY + 4;
        } else {
            handX = pX + 11; handY = pY + 2;
        }
    }

    // Sigara İçme / Duman Çekme Mekaniği: Eli ağza doğru yumuşakça götür
    let smokeState = (heldItem === 'sigara') ? getAvatarSmokingState(p, isPreview) : null;
    if (smokeState && smokeState.liftProgress > 0) {
        let mouth = getAvatarMouthPos(pX, pY, f, model);
        handX = handX + (mouth.x - handX) * smokeState.liftProgress;
        handY = handY + (mouth.y - handY) * smokeState.liftProgress;
    }

    // 1. GEZGİN SIRT ÇANTASI
    if (heldItem === 'sirtcantasi') {
        let scale = is25d ? 0.88 : (isPreview ? 1.1 : 0.95);
        let bpYOffset = is25d ? -7.0 : -2;

        if (f === 'up') {
            let bpX = pX;
            let bpY = pY + bpYOffset;
            targetCtx.fillStyle = "#854d0e";
            targetCtx.beginPath(); targetCtx.roundRect(bpX - 7 * scale, bpY - 8 * scale, 14 * scale, 18 * scale, 4); targetCtx.fill();
            targetCtx.strokeStyle = "#532e08"; targetCtx.lineWidth = 1.2; targetCtx.stroke();
            targetCtx.fillStyle = "#a16207";
            targetCtx.beginPath(); targetCtx.roundRect(bpX - 7.5 * scale, bpY - 9 * scale, 15 * scale, 8 * scale, [4, 4, 1, 1]); targetCtx.fill();
            [-3 * scale, 3 * scale].forEach(sx => {
                targetCtx.fillStyle = "#451a03"; targetCtx.fillRect(bpX + sx - 1, bpY - 9 * scale, 2, 14 * scale);
                targetCtx.fillStyle = "#facc15"; targetCtx.fillRect(bpX + sx - 1.5, bpY - 2 * scale, 3, 2.5);
            });
            targetCtx.fillStyle = "#713f12";
            targetCtx.beginPath(); targetCtx.roundRect(bpX - 5 * scale, bpY + 2 * scale, 10 * scale, 7 * scale, 2); targetCtx.fill();
            targetCtx.strokeStyle = "#451a03"; targetCtx.lineWidth = 1.5;
            targetCtx.beginPath(); targetCtx.arc(bpX, bpY - 9 * scale, 3 * scale, Math.PI, 0); targetCtx.stroke();

        } else if (f === 'up-right' || f === 'up-left') {
            let bpX = (f === 'up-right') ? (pX - 3.5 * scale) : (pX + 3.5 * scale);
            let bpY = pY + bpYOffset - 1;
            targetCtx.fillStyle = "#854d0e";
            targetCtx.beginPath(); targetCtx.roundRect(bpX - 6 * scale, bpY - 8 * scale, 12 * scale, 17 * scale, 4); targetCtx.fill();
            targetCtx.strokeStyle = "#532e08"; targetCtx.lineWidth = 1.2; targetCtx.stroke();
            targetCtx.fillStyle = "#a16207";
            targetCtx.beginPath(); targetCtx.roundRect(bpX - 6.5 * scale, bpY - 9 * scale, 13 * scale, 7 * scale, 3); targetCtx.fill();
            targetCtx.fillStyle = "#451a03"; targetCtx.fillRect(bpX - 1, bpY - 9 * scale, 2, 14 * scale);
            targetCtx.fillStyle = "#facc15"; targetCtx.fillRect(bpX - 1.5, bpY - 2 * scale, 3, 2.5);

        } else if (f === 'right' || f === 'left') {
            let bpX = (f === 'right') ? (pX - (is25d ? 6.5 : 9)) : (pX + (is25d ? 6.5 : 9));
            let bpY = pY + bpYOffset;
            targetCtx.fillStyle = "#854d0e";
            targetCtx.beginPath(); targetCtx.roundRect(bpX - 4 * scale, bpY - 7 * scale, 8 * scale, 16 * scale, 3); targetCtx.fill();
            targetCtx.strokeStyle = "#532e08"; targetCtx.lineWidth = 1.2; targetCtx.stroke();
            targetCtx.fillStyle = "#a16207"; targetCtx.fillRect(bpX - 2 * scale, bpY - 3 * scale, 5 * scale, 6 * scale);
            targetCtx.strokeStyle = "#facc15"; targetCtx.lineWidth = 1;
            targetCtx.beginPath(); targetCtx.moveTo(bpX - 4 * scale, bpY); targetCtx.lineTo(bpX + 4 * scale, bpY); targetCtx.stroke();

        } else {
            // Önden görünüm omuz askıları (Omuz başlarından bele doğru oturur)
            let strapShift = is25d ? 5.8 : 7;
            let strapTopY = is25d ? (pY - 13.5) : (pY - 9);
            let strapHeight = is25d ? 11.5 : 14;
            targetCtx.fillStyle = "#854d0e";
            targetCtx.fillRect(pX - strapShift, strapTopY, 2.4, strapHeight);
            targetCtx.fillRect(pX + strapShift - 2.4, strapTopY, 2.4, strapHeight);
            targetCtx.fillStyle = "#451a03";
            targetCtx.fillRect(pX - strapShift, pY - 3, strapShift * 2, 1.8);
            targetCtx.fillStyle = "#facc15";
            targetCtx.fillRect(pX - 1.2, pY - 3.5, 2.4, 2.8);
        }

        targetCtx.restore();
        return;
    }

    // 2. NOSTALJİK AKUSTİK GİTAR
    if (heldItem === 'gitar') {
        let scale = is25d ? 0.75 : (isPreview ? 1.15 : 1.0);

        if (isBack) {
            targetCtx.translate(pX + 1.5, is25d ? (pY - 7.0) : pY);
            let gAngle = (f === 'up-right') ? 0.55 : (f === 'up-left') ? -0.55 : 0.45;
            targetCtx.rotate(gAngle);

            targetCtx.strokeStyle = "#451a03"; targetCtx.lineWidth = 2.0;
            targetCtx.beginPath(); targetCtx.moveTo(-11 * scale, -13 * scale); targetCtx.lineTo(11 * scale, 13 * scale); targetCtx.stroke();

            targetCtx.fillStyle = "#9a3412";
            targetCtx.beginPath(); targetCtx.ellipse(0, 4 * scale, 8 * scale, 11 * scale, 0, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.strokeStyle = "#78350f"; targetCtx.lineWidth = 1.2; targetCtx.stroke();
            targetCtx.fillStyle = "#78350f";
            targetCtx.fillRect(-2 * scale, -22 * scale, 4 * scale, 16 * scale);

        } else {
            let gAnchorX = is25d ? (isLeft ? pX - 3.8 : pX + 3.8) : handX;
            let gAnchorY = is25d ? (pY - 5.0) : handY;
            targetCtx.translate(gAnchorX, gAnchorY);
            let gRot = (isLeft) ? 0.55 : -0.55;
            targetCtx.rotate(gRot);

            targetCtx.fillStyle = "#b45309";
            targetCtx.beginPath(); targetCtx.ellipse(0, 8 * scale, 8.5 * scale, 10.5 * scale, 0, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.beginPath(); targetCtx.ellipse(0, 0, 6.5 * scale, 6.5 * scale, 0, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.strokeStyle = "#78350f"; targetCtx.lineWidth = 1.0; targetCtx.stroke();

            targetCtx.fillStyle = "#1e1b4b";
            targetCtx.beginPath(); targetCtx.arc(0, 2.5 * scale, 2.8 * scale, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.strokeStyle = "#fde047"; targetCtx.lineWidth = 0.8; targetCtx.stroke();

            targetCtx.fillStyle = "#78350f"; targetCtx.fillRect(-1.8 * scale, -20 * scale, 3.6 * scale, 20 * scale);
            targetCtx.fillStyle = "#b45309"; targetCtx.fillRect(-2.5 * scale, -24 * scale, 5 * scale, 5 * scale);
            targetCtx.strokeStyle = "rgba(255, 255, 255, 0.8)"; targetCtx.lineWidth = 0.6;
            targetCtx.beginPath();
            targetCtx.moveTo(-1, 9 * scale); targetCtx.lineTo(-1, -22 * scale);
            targetCtx.moveTo(1, 9 * scale); targetCtx.lineTo(1, -22 * scale);
            targetCtx.stroke();
        }

        targetCtx.restore();
        return;
    }

    // 3. ANADOLU BAĞLAMASI / SAZ (2.5D & KLASİK KAPSAMLI UYARLAMA)
    if (heldItem === 'baglama') {
        if (is25d) {
            // =========================================================================
            // 2.5D İZOMETRİK ANADOLU BAĞLAMASI (OYMA DUT TEKNE & LADİN GÖĞÜS & İNCE SAP)
            // =========================================================================
            if (isBack) {
                // Arkadan görünüm: Sırtta çapraz asılı duran bağlama
                targetCtx.translate(pX + 2.0, pY - 6.5);
                let sAngle = (f === 'up-right') ? 0.45 : (f === 'up-left') ? -0.45 : 0.40;
                targetCtx.rotate(sAngle);

                // Hakiki deri omuz askısı (sol omuzdan sağ bele)
                targetCtx.strokeStyle = "#451a03"; targetCtx.lineWidth = 1.6;
                targetCtx.beginPath(); targetCtx.moveTo(-10, -11); targetCtx.lineTo(10, 11); targetCtx.stroke();

                // Oyma tekne gövdesi (Dut ağacı dilimli arka kavis)
                let bGrad = targetCtx.createLinearGradient(-4, -4, 4, 8);
                bGrad.addColorStop(0, "#78350f");
                bGrad.addColorStop(0.5, "#9a3412");
                bGrad.addColorStop(1, "#451a03");
                targetCtx.fillStyle = bGrad;
                targetCtx.beginPath();
                targetCtx.ellipse(0, 3.0, 4.4, 6.8, 0, 0, Math.PI * 2);
                targetCtx.fill();
                targetCtx.strokeStyle = "#451a03"; targetCtx.lineWidth = 0.8; targetCtx.stroke();

                // Tekne dilimleri dikiş çizgileri
                targetCtx.strokeStyle = "rgba(0,0,0,0.35)"; targetCtx.lineWidth = 0.5;
                targetCtx.beginPath();
                targetCtx.moveTo(0, -3.8); targetCtx.lineTo(0, 9.8);
                targetCtx.moveTo(-2.0, -2.5); targetCtx.quadraticCurveTo(-2.8, 3, -1.5, 8.5);
                targetCtx.moveTo(2.0, -2.5); targetCtx.quadraticCurveTo(2.8, 3, 1.5, 8.5);
                targetCtx.stroke();

                // İnce uzun sap (Omuz üstünden yukarı uzanır)
                targetCtx.strokeStyle = "#532e08"; targetCtx.lineWidth = 1.8;
                targetCtx.beginPath(); targetCtx.moveTo(0, -3.8); targetCtx.lineTo(0, -16.5); targetCtx.stroke();

                // Burguluk ve fildişi burgular
                targetCtx.fillStyle = "#78350f"; targetCtx.fillRect(-1.4, -19.5, 2.8, 3.2);
                targetCtx.fillStyle = "#ffffff";
                targetCtx.fillRect(-2.2, -19.0, 0.9, 0.7); targetCtx.fillRect(1.3, -19.0, 0.9, 0.7);
                targetCtx.fillRect(-2.2, -17.8, 0.9, 0.7); targetCtx.fillRect(1.3, -17.8, 0.9, 0.7);

            } else if (f === 'right' || f === 'left') {
                // Tam profil görünüm: Göğüste/kucakta tutulan saz
                let bagX = (f === 'right') ? (pX - 1.5) : (pX + 1.5);
                let bagY = pY - 4.5;
                targetCtx.translate(bagX, bagY);
                let pRot = (f === 'right') ? -0.55 : 0.55;
                targetCtx.rotate(pRot);

                // Profilde derin oyma tekne silueti
                let bGrad = targetCtx.createLinearGradient(-3, 0, 3, 6);
                bGrad.addColorStop(0, "#b45309");
                bGrad.addColorStop(1, "#451a03");
                targetCtx.fillStyle = bGrad;
                targetCtx.beginPath();
                targetCtx.ellipse(f === 'right' ? -1.0 : 1.0, 2.5, 3.4, 6.2, f === 'right' ? -0.15 : 0.15, 0, Math.PI * 2);
                targetCtx.fill();
                targetCtx.strokeStyle = "#451a03"; targetCtx.lineWidth = 0.8; targetCtx.stroke();

                // Ladin ön kapak profili
                targetCtx.strokeStyle = "#fde68a"; targetCtx.lineWidth = 1.0;
                targetCtx.beginPath();
                targetCtx.moveTo(f === 'right' ? 1.2 : -1.2, -3.0);
                targetCtx.lineTo(f === 'right' ? 1.2 : -1.2, 7.0);
                targetCtx.stroke();

                // İnce sap
                targetCtx.strokeStyle = "#532e08"; targetCtx.lineWidth = 1.8;
                targetCtx.beginPath(); targetCtx.moveTo(0, -3.0); targetCtx.lineTo(0, -15.5); targetCtx.stroke();

                // Burguluk
                targetCtx.fillStyle = "#78350f"; targetCtx.fillRect(-1.3, -18.8, 2.6, 3.4);
                targetCtx.fillStyle = "#ffffff";
                targetCtx.fillRect(f === 'right' ? 1.3 : -2.2, -18.0, 0.9, 0.7);
                targetCtx.fillRect(f === 'right' ? 1.3 : -2.2, -16.8, 0.9, 0.7);

            } else {
                // Önden & 3/4 İzometrik Görünüm: Karakter göğsünde çapraz çalınır pozisyonda
                // Tekne sağ böbrek/karın hizasında, sap sol omuza doğru uzanır
                let bagX = isLeft ? (pX - 3.8) : (pX + 3.8);
                let bagY = pY - 5.0;
                targetCtx.translate(bagX, bagY);
                let rot = isLeft ? 0.62 : -0.62;
                targetCtx.rotate(rot);

                // 0. Deri Omuz Askısı
                targetCtx.strokeStyle = "#451a03"; targetCtx.lineWidth = 1.4;
                targetCtx.beginPath();
                targetCtx.moveTo(0, 3.0);
                targetCtx.lineTo(isLeft ? 8 : -8, -10);
                targetCtx.stroke();

                // 1. Tekne Gövdesi (Oyma Dut/Ceviz Ağacı)
                let bGrad = targetCtx.createLinearGradient(-4, 0, 4, 8);
                bGrad.addColorStop(0, "#b45309");
                bGrad.addColorStop(0.5, "#9a3412");
                bGrad.addColorStop(1, "#451a03");
                targetCtx.fillStyle = bGrad;
                targetCtx.beginPath();
                targetCtx.ellipse(0, 2.8, 4.4, 6.8, 0, 0, Math.PI * 2);
                targetCtx.fill();
                targetCtx.strokeStyle = "#451a03"; targetCtx.lineWidth = 0.8; targetCtx.stroke();

                // 2. Ladin Ağacı Ses Tahtası (Göğüs)
                let soundGrad = targetCtx.createLinearGradient(0, -3.0, 0, 8.5);
                soundGrad.addColorStop(0, "#fef08a");
                soundGrad.addColorStop(0.6, "#f59e0b");
                soundGrad.addColorStop(1, "#d97706");
                targetCtx.fillStyle = soundGrad;
                targetCtx.beginPath();
                targetCtx.ellipse(0, 2.8, 3.6, 5.8, 0, 0, Math.PI * 2);
                targetCtx.fill();

                // 3. Ses Deliği & Sedef Kakma Rozet
                targetCtx.fillStyle = "#271206";
                targetCtx.beginPath(); targetCtx.arc(0, 2.2, 1.3, 0, Math.PI * 2); targetCtx.fill();
                targetCtx.strokeStyle = "#facc15"; targetCtx.lineWidth = 0.5; targetCtx.stroke();

                // 4. Alt Eşik (Bridge)
                targetCtx.fillStyle = "#1e1b4b";
                targetCtx.fillRect(-1.8, 6.2, 3.6, 1.0);

                // 5. İnce Uzun Sap (Uzun Sap Bağlama Anatomisi)
                let neckH = 15.5;
                targetCtx.strokeStyle = "#532e08"; targetCtx.lineWidth = 1.8;
                targetCtx.beginPath(); targetCtx.moveTo(0, -3.0); targetCtx.lineTo(0, -neckH); targetCtx.stroke();

                // 6. Perdeler (Tied Frets)
                targetCtx.strokeStyle = "rgba(255, 255, 255, 0.75)"; targetCtx.lineWidth = 0.5;
                for (let fy = -4.0; fy >= -neckH + 2; fy -= 2.2) {
                    targetCtx.beginPath(); targetCtx.moveTo(-0.9, fy); targetCtx.lineTo(0.9, fy); targetCtx.stroke();
                }

                // 7. Burguluk & Fildişi Burgular
                targetCtx.fillStyle = "#78350f";
                targetCtx.fillRect(-1.3, -neckH - 4.0, 2.6, 4.0);
                targetCtx.fillStyle = "#f8fafc";
                [-neckH - 3.4, -neckH - 2.0, -neckH - 0.7].forEach(py => {
                    targetCtx.fillRect(-2.2, py, 1.0, 0.7);
                    targetCtx.fillRect(1.3, py, 1.0, 0.7);
                });

                // 8. Parlayan Çelik Teller
                targetCtx.strokeStyle = "rgba(255, 255, 255, 0.9)"; targetCtx.lineWidth = 0.5;
                targetCtx.beginPath();
                targetCtx.moveTo(-0.6, 6.2); targetCtx.lineTo(-0.6, -neckH - 1);
                targetCtx.moveTo(0, 6.2); targetCtx.lineTo(0, -neckH - 1);
                targetCtx.moveTo(0.6, 6.2); targetCtx.lineTo(0.6, -neckH - 1);
                targetCtx.stroke();
            }

        } else {
            // KLASİK CHİBİ MODEL İÇİN UYUMLU BAĞLAMA ÇİZİMİ
            let bodyW = isPreview ? 8.5 : 7.5;
            let bodyH = isPreview ? 12 : 11;
            let neckH = isPreview ? 20 : 18;

            if (isBack) {
                targetCtx.translate(pX, pY);
                let sAngle = (f === 'up-right') ? 0.45 : (f === 'up-left') ? -0.45 : 0.40;
                targetCtx.rotate(sAngle);

                targetCtx.strokeStyle = "#78350f"; targetCtx.lineWidth = 1.8;
                targetCtx.beginPath(); targetCtx.moveTo(-9, -11); targetCtx.lineTo(9, 11); targetCtx.stroke();

                targetCtx.fillStyle = "#b45309";
                targetCtx.beginPath(); targetCtx.ellipse(0, 4, bodyW, bodyH, 0, 0, Math.PI * 2); targetCtx.fill();
                targetCtx.strokeStyle = "#78350f"; targetCtx.lineWidth = 1; targetCtx.stroke();
                targetCtx.strokeStyle = "#78350f"; targetCtx.lineWidth = 2.6;
                targetCtx.beginPath(); targetCtx.moveTo(0, -bodyH + 5); targetCtx.lineTo(0, -neckH); targetCtx.stroke();

            } else {
                targetCtx.translate(handX, handY);
                let rot = isLeft ? 0.50 : -0.50;
                targetCtx.rotate(rot);

                targetCtx.fillStyle = "#b45309";
                targetCtx.beginPath(); targetCtx.ellipse(0, 4, bodyW, bodyH, 0, 0, Math.PI * 2); targetCtx.fill();
                targetCtx.strokeStyle = "#78350f"; targetCtx.lineWidth = 1; targetCtx.stroke();

                targetCtx.fillStyle = "#451a03";
                targetCtx.beginPath(); targetCtx.arc(0, 4, isPreview ? 2.5 : 2.0, 0, Math.PI * 2); targetCtx.fill();

                targetCtx.strokeStyle = "#78350f"; targetCtx.lineWidth = 2.4;
                targetCtx.beginPath(); targetCtx.moveTo(0, -bodyH + 5); targetCtx.lineTo(0, -neckH); targetCtx.stroke();
                targetCtx.fillStyle = "#f8fafc"; targetCtx.fillRect(-2.5, -neckH - 3, 5, 3.5);

                targetCtx.strokeStyle = "rgba(255,255,255,0.8)"; targetCtx.lineWidth = 0.6;
                targetCtx.beginPath();
                targetCtx.moveTo(-0.8, 8); targetCtx.lineTo(-0.8, -neckH);
                targetCtx.moveTo(0.8, 8); targetCtx.lineTo(0.8, -neckH);
                targetCtx.stroke();
            }
        }

        targetCtx.restore();
        return;
    }

    // 4. BALIKÇI OLTASI
    if (heldItem === 'olta') {
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);

        let rodAngle = 0.35;
        if (f === 'right') rodAngle = 0.45;
        else if (f === 'left') rodAngle = -0.45;
        else if (f === 'up') rodAngle = 0.28;
        else if (f === 'up-right') rodAngle = 0.38;
        else if (f === 'up-left') rodAngle = -0.38;
        else if (f === 'down-right') rodAngle = 0.40;
        else if (f === 'down-left') rodAngle = -0.40;
        else if (f === 'down') rodAngle = 0.35;

        targetCtx.rotate(rodAngle);
        targetCtx.fillStyle = "#d97706"; targetCtx.fillRect(-1.5, -2, 3, 9); // Mantar sap
        targetCtx.fillStyle = "#64748b"; targetCtx.fillRect(-2.5, 3, 5, 3.5); // Makine
        targetCtx.strokeStyle = "#1e293b"; targetCtx.lineWidth = 1.8;
        let rodLen = (is25d || isPreview) ? -28 : -26;
        targetCtx.beginPath(); targetCtx.moveTo(0, -2); targetCtx.lineTo(0, rodLen); targetCtx.stroke();
        targetCtx.strokeStyle = "rgba(255, 255, 255, 0.75)"; targetCtx.lineWidth = 0.8;
        targetCtx.beginPath();
        targetCtx.moveTo(0, rodLen);
        targetCtx.lineTo(isLeft ? -5 : 5, -8);
        targetCtx.stroke();

        targetCtx.restore();
        return;
    }

    // 5. KEHRİBAR TESPİH
    if (heldItem === 'tespih') {
        let swing = Math.sin(Date.now() / 170) * 0.30;
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);
        targetCtx.rotate(swing);

        targetCtx.strokeStyle = "#b45309"; targetCtx.lineWidth = 0.6; targetCtx.fillStyle = "#f59e0b";
        let beadRadius = is25d ? 1.2 : 1.6;
        let ringR = is25d ? 3.2 : 4.8;
        for (let i = 0; i < 9; i++) {
            let angle = (i * 2 * Math.PI) / 9;
            let bx = Math.cos(angle) * ringR;
            let by = Math.sin(angle) * ringR + (is25d ? 3.2 : 5);
            targetCtx.beginPath(); targetCtx.arc(bx, by, beadRadius, 0, Math.PI * 2); targetCtx.fill(); targetCtx.stroke();
        }
        targetCtx.strokeStyle = "#94a3b8"; targetCtx.lineWidth = 1.0;
        targetCtx.beginPath();
        targetCtx.moveTo(0, ringR + (is25d ? 3.2 : 5) + beadRadius);
        targetCtx.lineTo(0, ringR + (is25d ? 7.0 : 11));
        targetCtx.stroke();
        targetCtx.fillStyle = "#cbd5e1";
        targetCtx.beginPath(); targetCtx.arc(0, ringR + (is25d ? 7.8 : 12), is25d ? 1.2 : 1.5, 0, Math.PI * 2); targetCtx.fill();

        targetCtx.restore();
        return;
    }
    // 5b. ÇİFT KATMANLI TESPİH 2
    if (heldItem === 'tespih2') {
        let swing = Math.sin(Date.now() / 120) * 0.45; // Hızlı ve dinamik kehribar salınımı
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);
        targetCtx.rotate(swing);

        targetCtx.strokeStyle = "#b45309"; targetCtx.lineWidth = 0.6; targetCtx.fillStyle = "#f59e0b";
        let beadRadius = is25d ? 1.2 : 1.6;
        let ringR = is25d ? 3.2 : 4.8;
        // Dış katman kehribar taneleri
        for (let i = 0; i < 9; i++) {
            let angle = (i * 2 * Math.PI) / 9;
            let bx = Math.cos(angle) * ringR;
            let by = Math.sin(angle) * ringR + (is25d ? 3.2 : 5);
            targetCtx.beginPath(); targetCtx.arc(bx, by, beadRadius, 0, Math.PI * 2); targetCtx.fill(); targetCtx.stroke();
            // İç katman parlak gümüş/inci taneleri
            targetCtx.beginPath(); targetCtx.arc(bx, by, beadRadius * 0.55, 0, Math.PI * 2); targetCtx.fillStyle = "#f8fafc"; targetCtx.fill();
            targetCtx.fillStyle = "#f59e0b";
        }
        // Gümüş imame & püskül
        targetCtx.strokeStyle = "#cbd5e1"; targetCtx.lineWidth = 1.0;
        targetCtx.beginPath();
        targetCtx.moveTo(0, ringR + (is25d ? 3.2 : 5) + beadRadius);
        targetCtx.lineTo(0, ringR + (is25d ? 7.2 : 11));
        targetCtx.stroke();
        targetCtx.fillStyle = "#94a3b8";
        targetCtx.beginPath(); targetCtx.arc(0, ringR + (is25d ? 8.0 : 12), is25d ? 1.3 : 1.7, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.restore();
        return;
    }

    // 6. UÇAN KIRMIZI BALON
    if (heldItem === 'balon') {
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);

        let balloonSway = Math.sin(Date.now() / 320) * 3.8;
        let stringEndX = balloonSway;
        let stringEndY = is25d ? -38 : (isPreview ? -36 : -32);

        // İp
        targetCtx.strokeStyle = "rgba(255, 255, 255, 0.85)"; targetCtx.lineWidth = 1.0;
        targetCtx.beginPath();
        targetCtx.moveTo(0, 0);
        targetCtx.quadraticCurveTo(balloonSway * 0.4, stringEndY * 0.5, stringEndX, stringEndY);
        targetCtx.stroke();

        let bW = is25d ? 7.5 : (isPreview ? 9 : 8);
        let bH = is25d ? 9.5 : (isPreview ? 12 : 10);
        // Balon gövdesi
        targetCtx.fillStyle = "#ef4444";
        targetCtx.beginPath(); targetCtx.ellipse(stringEndX, stringEndY - bH, bW, bH, 0, 0, Math.PI * 2); targetCtx.fill();

        // Düğüm
        targetCtx.fillStyle = "#b91c1c";
        targetCtx.beginPath();
        targetCtx.moveTo(stringEndX - 2, stringEndY);
        targetCtx.lineTo(stringEndX + 2, stringEndY);
        targetCtx.lineTo(stringEndX, stringEndY - 2.5);
        targetCtx.closePath(); targetCtx.fill();

        // Işık yansıması (Parlaklık)
        targetCtx.fillStyle = "rgba(255, 255, 255, 0.65)";
        targetCtx.beginPath();
        targetCtx.ellipse(stringEndX - bW * 0.35, stringEndY - bH * 1.35, bW * 0.3, bH * 0.35, -0.2, 0, Math.PI * 2);
        targetCtx.fill();

        targetCtx.restore();
        return;
    }

    // 12. KILIÇ (Orta Çağ Şövalye Kılıcı)
    if (heldItem === 'kilic') {
        targetCtx.translate(handX, handY);
        let rot = isLeft ? -0.25 : 0.25;
        if (isBack) rot += (isLeft ? 0.35 : -0.35);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);
        targetCtx.rotate(rot);

        // Deri kabza
        targetCtx.fillStyle = "#475569";
        targetCtx.fillRect(-1.0, -7, 2.0, 7);
        // Altın topuz (Pommel)
        targetCtx.fillStyle = "#eab308";
        targetCtx.beginPath(); targetCtx.arc(0, 0.5, 1.6, 0, Math.PI * 2); targetCtx.fill();
        // Altın balçak (Crossguard)
        targetCtx.fillStyle = "#facc15";
        targetCtx.fillRect(-4.5, -8, 9, 2.0);
        targetCtx.strokeStyle = "#ca8a04"; targetCtx.lineWidth = 0.6; targetCtx.strokeRect(-4.5, -8, 9, 2.0);
        // Çelik namlu (Blade)
        targetCtx.fillStyle = "#f8fafc";
        targetCtx.beginPath();
        targetCtx.moveTo(-2.2, -8);
        targetCtx.lineTo(-1.8, -22);
        targetCtx.lineTo(0, -25);
        targetCtx.lineTo(1.8, -22);
        targetCtx.lineTo(2.2, -8);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.strokeStyle = "#94a3b8"; targetCtx.lineWidth = 0.7; targetCtx.stroke();
        // Namlu ortası oluk (Fuller)
        targetCtx.strokeStyle = "#cbd5e1"; targetCtx.lineWidth = 0.8;
        targetCtx.beginPath(); targetCtx.moveTo(0, -9); targetCtx.lineTo(0, -21); targetCtx.stroke();

        targetCtx.restore();
        return;
    }

    // 13. OYUNCAK ARABA (Spor Araba)
    if (heldItem === 'oyuncak_araba') {
        targetCtx.translate(handX, handY);
        let rotCar = isLeft ? -0.25 : 0.25;
        if (isBack) rotCar += (isLeft ? 0.35 : -0.35);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.90 : 1.0);
        targetCtx.scale(scale, scale);
        targetCtx.rotate(rotCar);

        // Kırmızı araba gövdesi
        targetCtx.fillStyle = "#dc2626";
        targetCtx.beginPath(); targetCtx.roundRect(-5.5, -3, 11, 5.5, 1.8); targetCtx.fill();
        targetCtx.strokeStyle = "#991b1b"; targetCtx.lineWidth = 0.6; targetCtx.stroke();
        // Tavan & Camlar
        targetCtx.fillStyle = "#38bdf8";
        targetCtx.beginPath(); targetCtx.roundRect(-3.0, -5.5, 6, 3.2, [1.5, 1.5, 0.5, 0.5]); targetCtx.fill();
        targetCtx.strokeStyle = "#0284c7"; targetCtx.lineWidth = 0.5; targetCtx.stroke();
        // Ön Farlar
        targetCtx.fillStyle = "#fef08a";
        let frontX = isLeft ? -5.5 : 4.5;
        targetCtx.fillRect(frontX, -1.5, 1.2, 1.4);
        // Tekerlekler
        targetCtx.fillStyle = "#1e293b";
        targetCtx.beginPath(); targetCtx.arc(-3.8, 2.5, 1.6, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.beginPath(); targetCtx.arc(3.8, 2.5, 1.6, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.fillStyle = "#94a3b8";
        targetCtx.beginPath(); targetCtx.arc(-3.8, 2.5, 0.7, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.beginPath(); targetCtx.arc(3.8, 2.5, 0.7, 0, Math.PI * 2); targetCtx.fill();

        targetCtx.restore();
        return;
    }

    // 7. İNCE BELLİ ÇAY BARDAĞI
    if (heldItem === 'cay') {
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);

        // Altın/kırmızı porselen çay tabağı
        targetCtx.fillStyle = "#ef4444";
        targetCtx.beginPath(); targetCtx.ellipse(0, 3.8, 4.5, 1.4, 0, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.strokeStyle = "#facc15"; targetCtx.lineWidth = 0.8; targetCtx.stroke();

        // İnce belli kıvrımlı cam bardak silueti
        targetCtx.fillStyle = "rgba(255, 255, 255, 0.45)";
        targetCtx.beginPath();
        targetCtx.moveTo(-2.4, -4.5);
        targetCtx.lineTo(2.4, -4.5);
        targetCtx.quadraticCurveTo(1.2, -0.5, 2.2, 3.2);
        targetCtx.lineTo(-2.2, 3.2);
        targetCtx.quadraticCurveTo(-1.2, -0.5, -2.4, -4.5);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.strokeStyle = "rgba(255, 255, 255, 0.8)"; targetCtx.lineWidth = 0.6; targetCtx.stroke();

        // Tavşan kanı taze demli çay
        targetCtx.fillStyle = "#b91c1c";
        targetCtx.beginPath();
        targetCtx.moveTo(-1.8, -1.5);
        targetCtx.lineTo(1.8, -1.5);
        targetCtx.quadraticCurveTo(1.0, 0.5, 1.8, 2.8);
        targetCtx.lineTo(-1.8, 2.8);
        targetCtx.quadraticCurveTo(-1.0, 0.5, -1.8, -1.5);
        targetCtx.closePath();
        targetCtx.fill();

        // Bardaktan yükselen narin sıcak buhar
        let steamY = -7 - ((Date.now() / 40) % 8);
        targetCtx.strokeStyle = "rgba(255,255,255,0.65)"; targetCtx.lineWidth = 0.8;
        targetCtx.beginPath(); targetCtx.moveTo(-0.5, steamY + 4); targetCtx.quadraticCurveTo(isLeft ? -1.5 : 1.5, steamY + 2, 0, steamY); targetCtx.stroke();

        targetCtx.restore();
        return;
    }

    // 7.1 SICAK ORALET KUPASI
    if (heldItem === 'oralet') {
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);

        targetCtx.fillStyle = '#b45309';
        targetCtx.beginPath();
        targetCtx.ellipse(0, 4, 5.2, 1.5, 0, 0, Math.PI * 2);
        targetCtx.fill();

        targetCtx.fillStyle = '#fff7ed';
        targetCtx.beginPath();
        targetCtx.roundRect(-3.4, -4.2, 6.8, 7.5, [1.2, 1.2, 2.2, 2.2]);
        targetCtx.fill();
        targetCtx.strokeStyle = '#c2410c';
        targetCtx.lineWidth = 0.8;
        targetCtx.stroke();

        targetCtx.fillStyle = '#ea580c';
        targetCtx.beginPath();
        targetCtx.ellipse(0, -3.8, 3.15, 1.1, 0, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.strokeStyle = '#ffedd5';
        targetCtx.lineWidth = 0.55;
        targetCtx.beginPath();
        targetCtx.ellipse(0, -4.1, 2.3, 0.55, 0, Math.PI, Math.PI * 2);
        targetCtx.stroke();

        const handleX = isLeft ? -4 : 4;
        targetCtx.strokeStyle = '#fff7ed';
        targetCtx.lineWidth = 1.2;
        targetCtx.beginPath();
        targetCtx.arc(handleX, -0.5, 2.0, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
        targetCtx.stroke();
        targetCtx.strokeStyle = '#c2410c';
        targetCtx.lineWidth = 0.55;
        targetCtx.beginPath();
        targetCtx.arc(handleX, -0.5, 2.0, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
        targetCtx.stroke();

        targetCtx.fillStyle = '#f97316';
        targetCtx.beginPath();
        targetCtx.arc(0, -0.4, 0.8, 0, Math.PI * 2);
        targetCtx.fill();

        let steamY = -7 - ((Date.now() / 48) % 7);
        targetCtx.strokeStyle = 'rgba(255, 237, 213, 0.8)';
        targetCtx.lineWidth = 0.8;
        targetCtx.beginPath();
        targetCtx.moveTo(-1.8, steamY + 3);
        targetCtx.quadraticCurveTo(isLeft ? -3 : -0.5, steamY + 1.5, -1.3, steamY);
        targetCtx.moveTo(1.2, steamY + 4);
        targetCtx.quadraticCurveTo(isLeft ? 0 : 2.8, steamY + 2, 1.6, steamY - 1);
        targetCtx.stroke();

        targetCtx.restore();
        return;
    }

    // 7.1. TÜTEN SİGARA (10.000 TL Özel Karizmatik El Eşyası & Periyodik Duman Çekme/Üfleme)
    if (heldItem === 'sigara') {
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.95 : 1.0);
        targetCtx.scale(scale, scale);

        // Parmakların arasından hafif yukarı/öne doğru karizmatik açı
        let rot = isLeft ? -0.35 : 0.35;
        if (isBack) rot = isLeft ? 0.30 : -0.30;
        if (smokeState && smokeState.liftProgress > 0) {
            let targetRot = isLeft ? -0.15 : 0.15;
            rot = rot + (targetRot - rot) * smokeState.liftProgress;
        }
        targetCtx.rotate(rot);

        let dir = isLeft ? -1 : 1;

        // 1. Sigara Filtresi (Turuncu/Kahve filtre kağıdı)
        targetCtx.fillStyle = "#d97706";
        targetCtx.beginPath();
        targetCtx.roundRect(dir > 0 ? -3 : 0, -1.2, 3, 2.4, 0.5);
        targetCtx.fill();
        targetCtx.strokeStyle = "#92400e";
        targetCtx.lineWidth = 0.4;
        targetCtx.stroke();

        // 2. Sigara Gövdesi (Beyaz kaliteli tütün kağıdı)
        targetCtx.fillStyle = "#f8fafc";
        targetCtx.beginPath();
        targetCtx.roundRect(dir > 0 ? 0 : -8, -1.1, 8, 2.2, [0, 0.5, 0.5, 0]);
        targetCtx.fill();
        targetCtx.strokeStyle = "rgba(148, 163, 184, 0.6)";
        targetCtx.lineWidth = 0.4;
        targetCtx.stroke();

        // 3. Sigaranın Ucu ve Külü (Hafif gri kül çizgisi)
        let tipX = dir > 0 ? 8 : -8;
        targetCtx.fillStyle = "#64748b";
        targetCtx.beginPath();
        targetCtx.arc(tipX, 0, 1.1, 0, Math.PI * 2);
        targetCtx.fill();

        // 4. Yanan Kor Köz (Nefes alan canlı kızıllık / Nefes çekerken parlayan akkor)
        let pulse = (Math.sin(Date.now() / 280) + 1) * 0.5; // 0..1
        let isInhaling = (smokeState && smokeState.isInhaling);

        if (isInhaling) {
            // İçeri derin nefes çekilirken köz akkor alev gibi parlar!
            let inhalePulse = (Math.sin(Date.now() / 90) + 1) * 0.5;
            targetCtx.fillStyle = "#ffffff";
            targetCtx.beginPath();
            targetCtx.arc(tipX + (dir > 0 ? 0.4 : -0.4), 0, 1.4 + inhalePulse * 0.3, 0, Math.PI * 2);
            targetCtx.fill();

            targetCtx.save();
            targetCtx.shadowColor = "#ff2200";
            targetCtx.shadowBlur = 12 + inhalePulse * 4;
            targetCtx.fillStyle = "rgba(255, 45, 0, 0.95)";
            targetCtx.beginPath();
            targetCtx.arc(tipX + (dir > 0 ? 0.4 : -0.4), 0, 1.2, 0, Math.PI * 2);
            targetCtx.fill();
            targetCtx.restore();
        } else {
            targetCtx.fillStyle = pulse > 0.6 ? "#ff3700" : "#f97316";
            targetCtx.beginPath();
            targetCtx.arc(tipX + (dir > 0 ? 0.4 : -0.4), 0, 0.9 + pulse * 0.3, 0, Math.PI * 2);
            targetCtx.fill();

            // Kor közün etrafındaki hafif sıcak ışıma (radial glow)
            targetCtx.save();
            targetCtx.shadowColor = "#ff4500";
            targetCtx.shadowBlur = 4 + pulse * 3;
            targetCtx.fillStyle = "rgba(255, 69, 0, 0.8)";
            targetCtx.beginPath();
            targetCtx.arc(tipX + (dir > 0 ? 0.4 : -0.4), 0, 0.6, 0, Math.PI * 2);
            targetCtx.fill();
            targetCtx.restore();
        }

        // 5. Hafif Tüten Duman Partikülleri (Nefes çekmiyorken uçtan tüter)
        if (!isInhaling) {
            targetCtx.save();
            targetCtx.translate(tipX, 0);
            targetCtx.rotate(-rot);

            let now = Date.now();
            for (let i = 0; i < 4; i++) {
                let progress = ((now / 1100) + (i * 0.25)) % 1.0;
                let smokeY = -progress * 15;
                let wave = Math.sin((now / 350) + i * 1.5) * (2.2 * progress);
                let smokeX = wave + (dir > 0 ? 1 : -1) * (progress * 2);
                let smokeRadius = 0.9 + (progress * 2.6);
                let alpha = Math.sin(progress * Math.PI) * 0.32;

                targetCtx.fillStyle = `rgba(226, 232, 240, ${alpha})`;
                targetCtx.beginPath();
                targetCtx.arc(smokeX, smokeY, smokeRadius, 0, Math.PI * 2);
                targetCtx.fill();
            }
            targetCtx.restore();
        }

        targetCtx.restore();

        // 6. Duman Üfleme (Exhale) Efekti - Ağızdan çıkan duman halkaları ve bulutlar
        if (smokeState && smokeState.isExhaling) {
            drawExhaleSmoke(targetCtx, pX, pY, facing, model, smokeState.exhaleProgress);
        }

        return;
    }

    // 8. NOSTALJİK YEŞİL CAM GAZOZ
    if (heldItem === 'gazoz') {
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);
        let rot = isLeft ? -0.16 : 0.16;
        if (isBack) rot = isLeft ? 0.14 : -0.14;
        targetCtx.rotate(rot);

        targetCtx.fillStyle = "#16a34a";
        targetCtx.beginPath(); targetCtx.roundRect(-2.2, -3, 4.4, 8.5, 2); targetCtx.fill();
        targetCtx.fillStyle = "#15803d"; targetCtx.fillRect(-1.2, -7.5, 2.4, 4.5); // Şişe boynu
        targetCtx.fillStyle = "#facc15"; targetCtx.fillRect(-1.8, -9, 3.6, 1.4); // Taç kapak
        targetCtx.fillStyle = "#ffffff"; targetCtx.fillRect(-1.8, -0.5, 3.6, 3.5); // Etiket
        targetCtx.strokeStyle = "#14532d"; targetCtx.lineWidth = 0.5; targetCtx.strokeRect(-2.2, -3, 4.4, 8.5);

        targetCtx.restore();
        return;
    }

    // 9. KÖZDE TÜRK KAHVESİ
    if (heldItem === 'kahve') {
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);

        // Altın tepsi / fincan tabağı
        targetCtx.fillStyle = "#ca8a04";
        targetCtx.beginPath(); targetCtx.ellipse(0, 3.5, 5.8, 1.8, 0, 0, Math.PI * 2); targetCtx.fill();
        // Beyaz porselen fincan
        targetCtx.fillStyle = "#ffffff";
        targetCtx.beginPath(); targetCtx.roundRect(-3.2, -3.5, 6.4, 6.0, 2); targetCtx.fill();
        targetCtx.strokeStyle = "#d97706"; targetCtx.lineWidth = 0.8; targetCtx.stroke();
        // Bol köpük
        targetCtx.fillStyle = "#451a03"; targetCtx.fillRect(-2.5, -2.5, 5.0, 1.8);
        // Altın kulp (Kulp dışa doğru yönlenir)
        let handleX = isLeft ? -3.8 : 3.8;
        let handleStartAngle = isLeft ? Math.PI * 0.5 : -Math.PI * 0.5;
        let handleEndAngle = isLeft ? Math.PI * 1.5 : Math.PI * 0.5;
        targetCtx.strokeStyle = "#ca8a04"; targetCtx.lineWidth = 1.0;
        targetCtx.beginPath(); targetCtx.arc(handleX, -0.5, 1.8, handleStartAngle, handleEndAngle); targetCtx.stroke();
        // Kahve dumanı
        let steamY = -6 - ((Date.now() / 40) % 8);
        targetCtx.strokeStyle = "rgba(255,255,255,0.65)"; targetCtx.lineWidth = 0.8;
        targetCtx.beginPath(); targetCtx.moveTo(-1, steamY + 4); targetCtx.quadraticCurveTo(isLeft ? -2 : 2, steamY + 2, 0, steamY); targetCtx.stroke();

        targetCtx.restore();
        return;
    }

    // 10. ŞAMPİYONLUK ALTIN KUPASI
    if (heldItem === 'kupa') {
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);

        // Siyah mermer kaide
        targetCtx.fillStyle = "#1e293b"; targetCtx.fillRect(-4.0, 2.5, 8.0, 2.5);
        // Altın boyun
        targetCtx.fillStyle = "#eab308"; targetCtx.fillRect(-1.4, -0.5, 2.8, 3.0);
        // Kupa gövdesi
        let cupW = 5.2;
        let cupH = 6.8;
        targetCtx.fillStyle = "#facc15";
        targetCtx.beginPath();
        targetCtx.moveTo(-cupW, -cupH); targetCtx.lineTo(cupW, -cupH);
        targetCtx.lineTo(cupW * 0.5, -0.5); targetCtx.lineTo(-cupW * 0.5, -0.5);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.strokeStyle = "#b45309"; targetCtx.lineWidth = 0.8; targetCtx.stroke();
        // Kulplar
        targetCtx.strokeStyle = "#ca8a04"; targetCtx.lineWidth = 1.2;
        targetCtx.beginPath(); targetCtx.arc(-cupW - 1.0, -cupH * 0.5, 2.4, Math.PI * 0.5, Math.PI * 1.5); targetCtx.stroke();
        targetCtx.beginPath(); targetCtx.arc(cupW + 1.0, -cupH * 0.5, 2.4, -Math.PI * 0.5, Math.PI * 0.5); targetCtx.stroke();
        // Işıltı
        targetCtx.fillStyle = "rgba(255, 255, 255, 0.75)";
        targetCtx.beginPath(); targetCtx.arc(-1.6, -cupH * 0.6, 1.2, 0, Math.PI * 2); targetCtx.fill();

        targetCtx.restore();
        return;
    }

    // 11. YILDIZLI BÜYÜ ASASI (ASAGOLD)
    if (heldItem === 'asagold') {
        let now = Date.now();
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);
        let aRot = isLeft ? 0.25 : -0.25;
        if (isBack) aRot = isLeft ? 0.18 : -0.18;
        targetCtx.rotate(aRot);

        let staffH = is25d ? 24 : (isPreview ? 32 : 27);
        targetCtx.strokeStyle = "#d97706"; targetCtx.lineWidth = is25d ? 2.0 : (isPreview ? 3.5 : 2.8);
        targetCtx.beginPath(); targetCtx.moveTo(0, 5); targetCtx.lineTo(0, -staffH); targetCtx.stroke();

        let starGlow = Math.sin(now / 140) * 0.2 + 0.8;
        targetCtx.fillStyle = `rgba(56, 189, 248, ${starGlow})`;
        targetCtx.beginPath(); targetCtx.arc(0, -staffH, is25d ? 4.5 : (isPreview ? 6.5 : 5.5), 0, Math.PI * 2); targetCtx.fill();
        targetCtx.fillStyle = "#ffffff";
        targetCtx.beginPath(); targetCtx.arc(0, -staffH, is25d ? 2.0 : (isPreview ? 3 : 2.5), 0, Math.PI * 2); targetCtx.fill();

        for (let s = 0; s < 3; s++) {
            let sAngle = (now / 200) + (s * (Math.PI * 2 / 3));
            let sDist = is25d ? 6.0 : (isPreview ? 9 : 7.5);
            let spX = Math.cos(sAngle) * sDist;
            let spY = -staffH + Math.sin(sAngle) * sDist;
            targetCtx.fillStyle = "#facc15";
            targetCtx.beginPath(); targetCtx.arc(spX, spY, 1.2, 0, Math.PI * 2); targetCtx.fill();
        }

        targetCtx.restore();
        return;
    }

    // 12. GELENEKSEL DUMANLI NARGİLE
    if (heldItem === 'nargile') {
        let now = Date.now();
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        let nX = is25d ? (handX + (isLeft ? -7.5 : 7.5)) : (model === 'classic_2' ? (pX + (isLeft ? -11 : 11)) : (handX + (isLeft ? -7 : 7)));
        let nY = is25d ? (pY + 20.0) : (model === 'classic_2' ? (pY + 18.0) : (handY + (isPreview ? 12 : 10)));
        let vaseR = (is25d ? 5.8 : (isPreview ? 8.5 : 7)) * scale;

        // Zemin gölgesi
        targetCtx.fillStyle = "rgba(0, 0, 0, 0.35)";
        targetCtx.beginPath(); targetCtx.ellipse(nX, nY + 1.5, vaseR * 1.1, vaseR * 0.45, 0, 0, Math.PI * 2); targetCtx.fill();

        // Cam ser/şişe gövdesi
        targetCtx.fillStyle = "rgba(14, 165, 233, 0.55)";
        targetCtx.beginPath(); targetCtx.arc(nX, nY - vaseR * 0.7, vaseR, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.strokeStyle = "rgba(255, 255, 255, 0.75)"; targetCtx.lineWidth = 1.0; targetCtx.stroke();

        let stemTopY = (nY - vaseR * 0.7) - ((is25d ? 15 : (isPreview ? 24 : 20)) * scale);
        targetCtx.strokeStyle = "#eab308"; targetCtx.lineWidth = (is25d ? 2.0 : (isPreview ? 3 : 2.5)) * scale;
        targetCtx.beginPath(); targetCtx.moveTo(nX, nY - vaseR * 1.5); targetCtx.lineTo(nX, stemTopY); targetCtx.stroke();

        targetCtx.fillStyle = "#ca8a04";
        targetCtx.beginPath(); targetCtx.ellipse(nX, stemTopY, (is25d ? 5.5 : (isPreview ? 8.5 : 7)) * scale, (is25d ? 1.8 : (isPreview ? 2.8 : 2.2)) * scale, 0, 0, Math.PI * 2); targetCtx.fill();

        let headH = (is25d ? 4.5 : (isPreview ? 6.5 : 5.5)) * scale;
        targetCtx.fillStyle = "#9a3412";
        targetCtx.fillRect(nX - (is25d ? 2.5 : (isPreview ? 4 : 3.5)) * scale, stemTopY - headH, (is25d ? 5.0 : (isPreview ? 8 : 7)) * scale, headH);

        let coalGlow = Math.sin(now / 150) * 0.25 + 0.75;
        targetCtx.fillStyle = `rgba(239, 68, 68, ${coalGlow})`;
        targetCtx.beginPath(); targetCtx.arc(nX - 1.2 * scale, stemTopY - headH - 1, 1.5 * scale, 0, Math.PI * 2); targetCtx.fill();

        // Hortum bağlantısı (şişenin üst boğazından ele doğru zarif kavisle yükselir)
        targetCtx.strokeStyle = "#991b1b"; targetCtx.lineWidth = (is25d ? 1.5 : (isPreview ? 2.2 : 1.8)) * scale;
        targetCtx.beginPath();
        let hoseStartX = nX - (isLeft ? -vaseR * 0.6 : vaseR * 0.6);
        let hoseStartY = nY - vaseR * 1.2;
        targetCtx.moveTo(hoseStartX, hoseStartY);
        targetCtx.quadraticCurveTo(nX + (isLeft ? -3 : 3), (hoseStartY + handY) / 2 + 3, handX, handY);
        targetCtx.stroke();

        // Elde tutulan altın marpuç
        targetCtx.fillStyle = "#facc15";
        targetCtx.beginPath(); targetCtx.arc(handX, handY, (is25d ? 2.0 : (isPreview ? 3 : 2.5)) * scale, 0, Math.PI * 2); targetCtx.fill();

        // Közden yükselen duman bulutları
        for (let i = 0; i < 4; i++) {
            let cycle = ((now / (650 + i * 160)) + (i * 0.25)) % 1;
            let smX = nX + Math.sin((now / 260) + i * 1.5) * (2.0 + cycle * 4);
            let smY = (stemTopY - headH - 3) - (cycle * ((is25d ? 18 : (isPreview ? 28 : 22)) * scale));
            let smR = ((is25d ? 1.6 : 2.2) + cycle * (is25d ? 4.5 : 6.0)) * scale;
            let smA = Math.sin(cycle * Math.PI) * 0.40;
            targetCtx.fillStyle = `rgba(241, 245, 249, ${smA})`;
            targetCtx.beginPath(); targetCtx.arc(smX, smY, smR, 0, Math.PI * 2); targetCtx.fill();
        }

        targetCtx.restore();
        return;
    }

    // 13. LİMONATA & SAHİL KOKTEYLLERİ
    if (heldItem === 'limonata' || heldItem === 'lemonade' || heldItem.startsWith('cocktail_')) {
        targetCtx.translate(handX, handY);
        let scale = isBack ? 0.85 : (is25d || model === 'classic_2' ? 0.92 : 1.0);
        targetCtx.scale(scale, scale);
        let rot = isLeft ? -0.12 : 0.12;
        if (isBack) rot = isLeft ? 0.10 : -0.10;
        targetCtx.rotate(rot);

        let cType = (heldItem === 'limonata' || heldItem === 'lemonade') ? 'lemonade' : heldItem.replace('cocktail_', '');

        if (cType === 'coconut') {
            targetCtx.fillStyle = "#5c3317";
            targetCtx.beginPath(); targetCtx.arc(0, 0.5, is25d ? 4.5 : (isPreview ? 6.5 : 5.5), 0, Math.PI * 2); targetCtx.fill();
            targetCtx.strokeStyle = "#38200f"; targetCtx.lineWidth = 1; targetCtx.stroke();
            targetCtx.fillStyle = "#f8fafc";
            targetCtx.beginPath(); targetCtx.ellipse(0, -2.5, is25d ? 3.2 : (isPreview ? 4.5 : 3.8), is25d ? 1.5 : (isPreview ? 2.2 : 1.8), 0, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.strokeStyle = "#ef4444"; targetCtx.lineWidth = 1.2;
            targetCtx.beginPath(); targetCtx.moveTo(0, -2.5); targetCtx.lineTo(is25d ? 3 : 3.5, -(is25d ? 7.5 : 8.5)); targetCtx.stroke();
            targetCtx.fillStyle = "#ec4899";
            targetCtx.beginPath(); targetCtx.arc(-2, -4.5, 2.5, Math.PI, 0); targetCtx.fill();
        } else {
            let liquidColor = "#facc15";
            let strawColor = "#10b981";
            let fruitColor = "#eab308";

            if (cType === 'pineapple') {
                liquidColor = "#f59e0b"; strawColor = "#3b82f6"; fruitColor = "#facc15";
            } else if (cType === 'mojito') {
                liquidColor = "#f43f5e"; strawColor = "#22c55e"; fruitColor = "#84cc16";
            } else if (cType === 'sunset') {
                liquidColor = "#f97316"; strawColor = "#a855f7"; fruitColor = "#dc2626";
            }

            let gW = is25d ? 3.0 : (isPreview ? 4.5 : 3.8);
            let gH = is25d ? 6.5 : (isPreview ? 9 : 7.5);
            targetCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
            targetCtx.beginPath();
            targetCtx.moveTo(-gW, -gH);
            targetCtx.lineTo(gW, -gH);
            targetCtx.lineTo(gW * 0.7, 2);
            targetCtx.lineTo(-gW * 0.7, 2);
            targetCtx.closePath(); targetCtx.fill();
            targetCtx.strokeStyle = "rgba(255, 255, 255, 0.85)"; targetCtx.lineWidth = 0.8; targetCtx.stroke();

            targetCtx.fillStyle = liquidColor;
            targetCtx.beginPath();
            targetCtx.moveTo(-gW * 0.9, -gH + 2);
            targetCtx.lineTo(gW * 0.9, -gH + 2);
            targetCtx.lineTo(gW * 0.65, 1.2);
            targetCtx.lineTo(-gW * 0.65, 1.2);
            targetCtx.closePath(); targetCtx.fill();

            // Pipet
            targetCtx.strokeStyle = strawColor; targetCtx.lineWidth = 1.0;
            targetCtx.beginPath();
            targetCtx.moveTo(0.5, 0);
            targetCtx.lineTo(1.8, -gH - 3);
            targetCtx.stroke();

            // Meyve dilimi
            targetCtx.fillStyle = fruitColor;
            targetCtx.beginPath();
            targetCtx.arc(-gW * 0.6, -gH, 1.8, 0, Math.PI * 2);
            targetCtx.fill();
        }

        targetCtx.restore();
        return;
    }

    targetCtx.restore();
}

// =========================================================================
// === 6.9 YENİ 2.5D İZOMETRİK GERÇEKÇİ KARAKTER MOTORU ===
// =========================================================================

function getRealisticSkinPalette(colorStr) {
    if (colorStr === '#ffd1a4' || !colorStr) {
        return {
            base: '#ffd1a4',
            light: '#ffe9d6',
            shadow: '#e2a374',
            darkShadow: '#b06f40',
            blush: 'rgba(244, 114, 182, 0.28)'
        };
    } else if (colorStr === '#d2996c') {
        return {
            base: '#d2996c',
            light: '#e2b38b',
            shadow: '#b37648',
            darkShadow: '#844c26',
            blush: 'rgba(225, 29, 72, 0.22)'
        };
    } else if (colorStr === '#8d5524') {
        return {
            base: '#8d5524',
            light: '#a96b34',
            shadow: '#6a3c14',
            darkShadow: '#442208',
            blush: 'rgba(190, 24, 93, 0.20)'
        };
    } else if (colorStr === '#facc15') {
        // Klasik sarı seçilmişse daha doğal ve sıcak bir ten rengi tonu ver
        return {
            base: '#f5c596',
            light: '#ffe4c4',
            shadow: '#d49660',
            darkShadow: '#a46535',
            blush: 'rgba(251, 146, 60, 0.26)'
        };
    }
    return {
        base: colorStr,
        light: '#ffffff',
        shadow: '#888888',
        darkShadow: '#444444',
        blush: 'rgba(244, 114, 182, 0.2)'
    };
}

// 1. Ayakkabılar (2.5D Beyaz Sokak Sneaker & Kalın Taban)
function drawRealisticSneaker(ctx, fX, fY, angle, isLeft, facing, shoeId) {
    ctx.save();
    ctx.translate(fX, fY);
    ctx.rotate(angle);

    let isBack = (facing === 'up' || facing === 'up-left' || facing === 'up-right');
    let isSkate = (shoeId === 'sanalika_skate_shoes');
    let baseColor = isSkate ? '#dc2626' : '#ffffff';
    let soleColor = '#f8fafc';
    let soleLine = '#94a3b8';

    if (isBack) {
        // Tam arkadan görünüm (Fotoğraf 2'deki gibi)
        // Taban
        ctx.fillStyle = soleColor;
        ctx.beginPath();
        ctx.roundRect(-4, -1, 8, 3.8, 1.5);
        ctx.fill();
        ctx.strokeStyle = soleLine; ctx.lineWidth = 0.8; ctx.stroke();

        // Topuk arkası (Heel counter)
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.roundRect(-3.5, -4.5, 7, 4.2, [2, 2, 0, 0]);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 0.8; ctx.stroke();

        // Arka dikey şerit ve çekme dili
        ctx.fillStyle = isSkate ? '#18181b' : '#cbd5e1';
        ctx.fillRect(-0.8, -5.2, 1.6, 4.5);
    } else {
        // Ön ve 3/4 izometrik görünüm (Fotoğraf 1'deki gibi)
        let dir = (facing === 'left' || facing === 'down-left') ? -1 : 1;
        if (facing === 'down') dir = isLeft ? -0.4 : 0.4;

        // 3D Kalın Kauçuk Taban
        ctx.fillStyle = soleColor;
        ctx.beginPath();
        ctx.roundRect(-4.5, 0.2, 9, 3.2, 1.4);
        ctx.fill();
        ctx.strokeStyle = soleLine; ctx.lineWidth = 0.8; ctx.stroke();
        // Alt taban diş çizgisi
        ctx.fillStyle = "#64748b";
        ctx.fillRect(-3.8, 2.6, 7.6, 0.7);

        // Sneaker Gövdesi & Burun
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.roundRect(-4, -3.8, 8, 4.2, [2, 3, 1, 1]);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 0.8; ctx.stroke();

        // Ön burun yuvarlak kavis
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(dir * 2.2, -0.6, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Bağcıklar (Çapraz detay)
        ctx.strokeStyle = isSkate ? '#18181b' : '#94a3b8';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-1.8, -2.8); ctx.lineTo(1.8, -2.2);
        ctx.moveTo(-1.8, -1.8); ctx.lineTo(1.8, -1.2);
        ctx.stroke();

        // Ayakkabı dili (Tongue)
        ctx.fillStyle = isSkate ? '#991b1b' : '#e2e8f0';
        ctx.beginPath();
        ctx.ellipse(0, -3.8, 1.8, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// 2. Bacaklar, Pantolon / Şort / Etek ve Ayakkabılar
function drawRealistic25dLegs(ctx, pX, pY, p, facing, isSitting, legSwing, skin) {
    let isBack = (facing === 'up' || facing === 'up-left' || facing === 'up-right');
    let swingL = isSitting ? 0 : legSwing;
    let swingR = isSitting ? 0 : -legSwing;

    let leftLegX = pX - 4.2;
    let rightLegX = pX + 4.2;
    let hipY = pY - 2;

    // Pantolon / Kıyafet Tipi
    let pantsId = (p.outfit) ? p.outfit : (p.pants || 'pants_camo_cargo');

    let isCamo = (pantsId === 'pants_camo_cargo' || pantsId === 'sanalika_camo_cargo' || pantsId === 'outfit_camo_set');
    let isStreetJeans = (pantsId === 'pants_jeans_street');
    let isChino = (pantsId === 'pants_chino_beige');
    let isJogger = (pantsId === 'pants_jogger_black');
    let isSkirt = (pantsId === 'pants_skirt_crop' || pantsId === 'pants_skirt_denim' || pantsId === 'skirt_crop' || pantsId === 'skirt_denim');
    let isDress = (pantsId.startsWith('dress_') || pantsId === 'outfit_goth' || pantsId === 'outfit_bridal');

    let pantsBase = '#4d6b2c'; // Zeytin yeşili varsayılan
    let camo1 = '#384c20';
    let camo2 = '#658332';
    let camo3 = '#7d8a4f';

    if (isStreetJeans) {
        pantsBase = '#2563eb'; // Sokak Denim Mavisi
    } else if (isChino) {
        pantsBase = '#d4b483'; // Bej Chino
    } else if (isJogger) {
        pantsBase = '#18181b'; // Siyah Jogger
    } else if (isSkirt) {
        pantsBase = pantsId.includes('denim') ? '#38bdf8' : '#f43f5e';
    } else if (isDress) {
        pantsBase = (pantsId === 'dress_pink') ? '#ec4899' : (pantsId === 'outfit_goth' ? '#581c87' : '#18181b');
    }

    // --- BEL VE KALÇA BÖLGESİ ---
    ctx.save();
    ctx.fillStyle = pantsBase;
    ctx.beginPath();
    ctx.roundRect(pX - 7.5, hipY, 15, isSkirt ? 8 : 6, [2, 2, 0, 0]);
    ctx.fill();

    // Kemer & Bel Dikişi
    ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(pX - 7.5, hipY + 1.5); ctx.lineTo(pX + 7.5, hipY + 1.5); ctx.stroke();

    if (isBack) {
        // Arkadan Görünüm Cepler & Orta Dikiş
        ctx.fillStyle = isCamo ? camo1 : "rgba(0,0,0,0.2)";
        ctx.fillRect(pX - 6.2, hipY + 2.5, 4.2, 3.5);
        ctx.strokeRect(pX - 6.2, hipY + 2.5, 4.2, 3.5);
        ctx.fillRect(pX + 2, hipY + 2.5, 4.2, 3.5);
        ctx.strokeRect(pX + 2, hipY + 2.5, 4.2, 3.5);
        ctx.beginPath(); ctx.moveTo(pX, hipY); ctx.lineTo(pX, hipY + 7); ctx.stroke();
    } else {
        // Önden Fermuar Patı & Metal Düğme
        ctx.beginPath(); ctx.moveTo(pX, hipY + 1.5); ctx.lineTo(pX, hipY + 5.5); ctx.stroke();
        ctx.fillStyle = isStreetJeans ? "#f59e0b" : "#cbd5e1";
        ctx.beginPath(); ctx.arc(pX, hipY + 1.5, 0.9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // --- BACAKLAR VE PAÇALAR ---
    const drawSingleLeg = (isLeft, legX, swing) => {
        let ankleY = isSitting ? hipY + 13 : hipY + 19;
        let footX = legX + (isSitting ? (isLeft ? -1 : 1) : swing * 0.45);
        let footY = ankleY + 1.5;

        let paçaY = hipY + 4;
        let paçaH = isSitting ? 5 : 7;
        let paçaW = 6.2;
        let paçaOffset = isLeft ? -paçaW + 1.2 : -1.2;

        if (isStreetJeans || isChino || isJogger) {
            // UZUN PANTOLON: Bele kadar inen tam bacak formu
            ctx.save();
            let pantLegTopY = hipY + 4;
            let pantLegBottomY = ankleY;

            let legGrad = ctx.createLinearGradient(legX - 3, pantLegTopY, legX + 3, pantLegBottomY);
            if (isStreetJeans) {
                legGrad.addColorStop(0, '#1d4ed8');
                legGrad.addColorStop(0.4, '#3b82f6');
                legGrad.addColorStop(0.7, '#60a5fa'); // Yıkanmış denim parlaması
                legGrad.addColorStop(1, '#1e40af');
            } else if (isChino) {
                legGrad.addColorStop(0, '#d4b483');
                legGrad.addColorStop(0.5, '#e2c69b');
                legGrad.addColorStop(1, '#b08e5a');
            } else {
                legGrad.addColorStop(0, '#27272a');
                legGrad.addColorStop(0.7, '#18181b');
                legGrad.addColorStop(1, '#09090b');
            }

            ctx.fillStyle = legGrad;
            ctx.beginPath();
            ctx.moveTo(legX + paçaOffset, pantLegTopY);
            ctx.lineTo(legX + paçaOffset + (isLeft ? -0.5 : 0.5), pantLegBottomY);
            ctx.lineTo(legX + paçaOffset + paçaW, pantLegBottomY);
            ctx.lineTo(legX + paçaOffset + paçaW, pantLegTopY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 0.7; ctx.stroke();

            // Yırtık Jean Detayları (Diz yırtığı ve ten görünümü)
            if (isStreetJeans && !isBack) {
                let ripY = pantLegTopY + 7;
                ctx.fillStyle = skin.base;
                ctx.fillRect(legX - 1.6, ripY, 3.2, 1.6);
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(legX - 2.0, ripY); ctx.lineTo(legX + 2.0, ripY);
                ctx.moveTo(legX - 2.0, ripY + 1.6); ctx.lineTo(legX + 2.0, ripY + 1.6);
                ctx.stroke();
            }

            // Siyah Jogger Beyaz Yan Şeridi
            if (isJogger) {
                let stripeX = isLeft ? legX + paçaOffset + 0.6 : legX + paçaOffset + paçaW - 0.6;
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.0;
                ctx.beginPath();
                ctx.moveTo(stripeX, pantLegTopY);
                ctx.lineTo(stripeX, pantLegBottomY);
                ctx.stroke();
            }

            // Paça kıvrımı / Manşet dikişi
            ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(legX + paçaOffset, pantLegBottomY - 1);
            ctx.lineTo(legX + paçaOffset + paçaW, pantLegBottomY - 1);
            ctx.stroke();

            ctx.restore();
        } else {
            // ŞORT VEYA ETEK: Şort paçası + açıkta kalan baldır & ten
            ctx.save();
            ctx.fillStyle = pantsBase;
            ctx.beginPath();
            ctx.roundRect(legX + paçaOffset, paçaY, paçaW, paçaH, [1, 1, 2, 2]);
            ctx.fill();
            ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 0.8; ctx.stroke();

            // Kamuflaj Desenleri
            if (isCamo) {
                ctx.fillStyle = camo1;
                ctx.beginPath(); ctx.arc(legX + paçaOffset + 2, paçaY + 2.5, 1.4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = camo2;
                ctx.beginPath(); ctx.arc(legX + paçaOffset + 4.2, paçaY + 5, 1.6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = camo3;
                ctx.beginPath(); ctx.arc(legX + paçaOffset + 1.8, paçaY + 5.2, 1.1, 0, Math.PI * 2); ctx.fill();

                // Dış körüklü kapaklı kargo cep
                let pocketX = isLeft ? legX + paçaOffset - 1.2 : legX + paçaOffset + paçaW - 0.6;
                ctx.fillStyle = camo1;
                ctx.fillRect(pocketX, paçaY + 2, 1.8, 3.6);
                ctx.fillStyle = pantsBase;
                ctx.fillRect(pocketX - 0.2, paçaY + 1.5, 2.2, 1.2);
            }
            ctx.restore();

            // Açıkta kalan kaslı baldır ve diz
            ctx.save();
            let calfTopY = paçaY + paçaH - 0.5;
            let calfBottomY = ankleY;

            let legGrad = ctx.createLinearGradient(legX - 2.5, calfTopY, legX + 2.5, calfBottomY);
            legGrad.addColorStop(0, skin.light);
            legGrad.addColorStop(0.7, skin.base);
            legGrad.addColorStop(1, skin.shadow);

            ctx.fillStyle = legGrad;
            ctx.beginPath();
            ctx.moveTo(legX - 2.2, calfTopY);
            ctx.quadraticCurveTo(legX - 3.2, (calfTopY + calfBottomY) / 2, legX - 1.8, calfBottomY);
            ctx.lineTo(legX + 1.8, calfBottomY);
            ctx.quadraticCurveTo(legX + 3.0, (calfTopY + calfBottomY) / 2, legX + 2.2, calfTopY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = skin.darkShadow; ctx.lineWidth = 0.6; ctx.stroke();

            if (!isBack && !isSitting) {
                // Diz kapağı ışığı & gölgesi
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.beginPath();
                ctx.ellipse(legX, calfTopY + 1.2, 1.4, 1.0, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = skin.shadow; ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.arc(legX, calfTopY + 2.2, 1.5, 0.2, Math.PI - 0.2);
                ctx.stroke();
            } else if (isBack) {
                // Aşil tendonu kavis çizgisi
                ctx.strokeStyle = skin.shadow; ctx.lineWidth = 0.7;
                ctx.beginPath();
                ctx.moveTo(legX, calfTopY + 3);
                ctx.lineTo(legX, calfBottomY - 1);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Ayakkabı / Sneaker
        let footAngle = isSitting ? 0 : (swing * 0.05);
        drawRealisticSneaker(ctx, footX, footY, footAngle, isLeft, facing, p.shoes);
    };

    if (swingL < swingR) {
        drawSingleLeg(true, leftLegX, swingL);
        drawSingleLeg(false, rightLegX, swingR);
    } else {
        drawSingleLeg(false, rightLegX, swingR);
        drawSingleLeg(true, leftLegX, swingL);
    }
}

// 3. Gövde & Üst Kıyafet (Tişört / Hoodie / Polo / Divalar Baskısı)
function drawRealistic25dTorsoAndArms(ctx, pX, pY, p, facing, isSitting, legSwing, skin) {
    let isBack = (facing === 'up' || facing === 'up-left' || facing === 'up-right');
    let shoulderY = pY - 13.5;
    let waistY = pY - 2;

    let shirtId = (p.outfit) ? p.outfit : (p.shirt || p.color || 'tshirt_divalar');

    let isDivalar = (shirtId === 'tshirt_divalar');
    let isHoodie = (shirtId === 'tshirt_hoodie_purple' || shirtId === 'sanalika_hoodie_street');
    let isPolo = (shirtId === 'tshirt_polo_striped' || shirtId === 'sanalika_striped_polo');
    let isLeather = (shirtId === 'tshirt_leather_jacket' || shirtId === 'leather');
    let isTracksuit = (shirtId === 'outfit_street_tracksuit');

    let shirtBase = '#18181b'; // Standart Fitted Siyah
    let shirtHighlight = '#27272a';
    let shirtShadow = '#09090b';

    if (isDivalar) {
        shirtBase = '#ffffff'; shirtHighlight = '#f8fafc'; shirtShadow = '#cbd5e1';
    } else if (isHoodie) {
        shirtBase = '#581c87'; shirtHighlight = '#7e22ce'; shirtShadow = '#3b0764';
    } else if (isPolo) {
        shirtBase = '#f8fafc'; shirtHighlight = '#ffffff'; shirtShadow = '#cbd5e1';
    } else if (isLeather) {
        shirtBase = '#09090b'; shirtHighlight = '#27272a'; shirtShadow = '#000000';
    } else if (isTracksuit) {
        shirtBase = '#312e81'; shirtHighlight = '#4338ca'; shirtShadow = '#1e1b4b';
    } else if (p.color && p.color.startsWith('#') && p.color !== '#0f172a') {
        shirtBase = p.color; shirtHighlight = '#ffffff'; shirtShadow = 'rgba(0,0,0,0.35)';
    }

    // --- KOLLAR ---
    let armSwingL = isSitting ? 0 : -legSwing * 0.4;
    let armSwingR = isSitting ? 0 : legSwing * 0.4;

    const drawRealisticArm = (isLeft, swing) => {
        let shoulderX = isLeft ? pX - 6.5 : pX + 6.5;
        let sY = shoulderY + 1.5;

        ctx.save();
        ctx.translate(shoulderX, sY);

        let armAngle = isSitting ? 0.4 : swing * 0.08;
        if (isSitting) armAngle = isLeft ? 0.35 : -0.35;
        ctx.rotate(armAngle);

        // 1. Tişört Kolu
        ctx.fillStyle = shirtBase;
        ctx.beginPath();
        ctx.roundRect(isLeft ? -3.2 : -0.8, -1, 4.0, 5.5, [2, 2, 1, 1]);
        ctx.fill();
        ctx.strokeStyle = shirtShadow; ctx.lineWidth = 0.7; ctx.stroke();

        ctx.strokeStyle = shirtHighlight; ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(isLeft ? -3.2 : -0.8, 4.2);
        ctx.lineTo(isLeft ? 0.8 : 3.2, 4.2);
        ctx.stroke();

        // 2. Önkol & Dirsek (Kaslı ten anatomisi)
        let forearmGrad = ctx.createLinearGradient(0, 4.5, 0, 11);
        forearmGrad.addColorStop(0, skin.light);
        forearmGrad.addColorStop(0.7, skin.base);
        forearmGrad.addColorStop(1, skin.shadow);

        ctx.fillStyle = forearmGrad;
        ctx.beginPath();
        ctx.moveTo(isLeft ? -2.2 : -0.4, 4.5);
        ctx.lineTo(isLeft ? -1.8 : 0.2, 10.5);
        ctx.lineTo(isLeft ? 0.4 : 2.4, 10.5);
        ctx.lineTo(isLeft ? 1.4 : 2.8, 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = skin.darkShadow; ctx.lineWidth = 0.6; ctx.stroke();

        ctx.strokeStyle = skin.shadow; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.arc(isLeft ? -0.5 : 1.2, 5.5, 1.2, 0.4, Math.PI - 0.4); ctx.stroke();

        // 3. Parmakları Belirgin 3D El
        let handY = 10.8;
        let handX = isLeft ? -0.7 : 1.3;

        ctx.fillStyle = skin.base;
        ctx.beginPath();
        ctx.ellipse(handX, handY + 1.4, 1.8, 2.2, isLeft ? -0.15 : 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = skin.darkShadow; ctx.lineWidth = 0.5; ctx.stroke();

        ctx.fillStyle = skin.light;
        let thumbDir = isLeft ? 1 : -1;
        ctx.beginPath();
        ctx.arc(handX + thumbDir * 1.5, handY + 1.2, 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = skin.shadow; ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(handX - 0.8, handY + 2.4); ctx.lineTo(handX - 0.8, handY + 3.4);
        ctx.moveTo(handX, handY + 2.5); ctx.lineTo(handX, handY + 3.6);
        ctx.moveTo(handX + 0.8, handY + 2.4); ctx.lineTo(handX + 0.8, handY + 3.4);
        ctx.stroke();

        ctx.restore();
    };

    drawRealisticArm(true, armSwingL);

    // --- GÖVDE & TİŞÖRT GÖĞÜS ---
    ctx.save();
    ctx.fillStyle = shirtBase;
    ctx.beginPath();
    ctx.moveTo(pX - 7.2, shoulderY);
    ctx.lineTo(pX + 7.2, shoulderY);
    ctx.lineTo(pX + 6.2, waistY);
    ctx.lineTo(pX - 6.2, waistY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = shirtShadow; ctx.lineWidth = 0.8; ctx.stroke();

    if (isBack) {
        // Arkadan Görünüm Sırt Çizgileri
        ctx.strokeStyle = isDivalar ? "rgba(0,0,0,0.12)" : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1.0;
        ctx.beginPath(); ctx.arc(pX - 3.2, shoulderY + 4, 3, 0.2, Math.PI * 0.7); ctx.stroke();
        ctx.beginPath(); ctx.arc(pX + 3.2, shoulderY + 4, 3, Math.PI * 0.3, Math.PI * 0.8); ctx.stroke();

        if (isDivalar) {
            // Sırtta minik pembe taç amblemi
            ctx.fillStyle = "#e11d48";
            ctx.beginPath();
            ctx.arc(pX, shoulderY + 3.5, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Önden Görünüm: Yaka ribana ve göğüs ışığı
        ctx.fillStyle = isDivalar ? "rgba(0,0,0,0.03)" : "rgba(255, 255, 255, 0.06)";
        ctx.beginPath();
        ctx.ellipse(pX, shoulderY + 4.5, 4.5, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isDivalar ? "#cbd5e1" : "#3f3f46";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(pX, shoulderY, 3.2, 0.1, Math.PI - 0.1);
        ctx.stroke();

        // Boyun köprücük kemiği açıklığı
        ctx.fillStyle = skin.base;
        ctx.beginPath();
        ctx.arc(pX, shoulderY - 0.5, 2.6, 0.2, Math.PI - 0.2);
        ctx.fill();

        // =========================================================================
        // "DİVALAR YEMEK YAPMAZ" ÖZEL BASKILI BEYAZ TİŞÖRT GRAFİĞİ
        // =========================================================================
        if (isDivalar) {
            let isProfile = (facing === 'right' || facing === 'left');
            let graphicX = pX + (facing === 'right' ? 2.6 : (facing === 'left' ? -2.6 : (facing === 'down-right' ? 1.6 : (facing === 'down-left' ? -1.6 : 0))));
            let graphicY = shoulderY + 5.0;
            let graphicScaleX = isProfile ? 0.65 : (facing === 'down-right' || facing === 'down-left' ? 0.85 : 1.0);

            ctx.save();
            ctx.translate(graphicX, graphicY);
            ctx.scale(graphicScaleX, 1.0);

            // 1. Minik Altın Taç İkonu
            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.moveTo(-3.2, -3.2);
            ctx.lineTo(-4.0, -5.2);
            ctx.lineTo(-1.8, -4.2);
            ctx.lineTo(0, -6.0);
            ctx.lineTo(1.8, -4.2);
            ctx.lineTo(4.0, -5.2);
            ctx.lineTo(3.2, -3.2);
            ctx.closePath();
            ctx.fill();

            // Taç sivri uçlarındaki elmas ışıltıları
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-0.4, -6.0, 0.8, 0.8);
            ctx.fillRect(-4.2, -5.2, 0.7, 0.7);
            ctx.fillRect(3.5, -5.2, 0.7, 0.7);

            // 2. "DİVALAR" Başlığı (Canlı Fuşya Pembe)
            ctx.font = "bold 3.8px 'Segoe UI', Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#e11d48";
            ctx.fillText("DİVALAR", 0, -0.6);

            // 3. "YEMEK YAPMAZ" Sloganı (Zarif Koyu Füme)
            ctx.font = "800 2.5px 'Segoe UI', Arial, sans-serif";
            ctx.fillStyle = "#0f172a";
            ctx.fillText("YEMEK YAPMAZ", 0, 3.2);

            // 4. Yıldız Parıltıları ✨
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(-5.2, -1.0, 0.8, 0.8);
            ctx.fillRect(4.4, 1.8, 0.8, 0.8);

            ctx.restore();
        }
    }

    if (isPolo) {
        // Çizgili polo çizgileri
        ctx.strokeStyle = "#1e3a8a"; ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(pX - 6.8, shoulderY + 3); ctx.lineTo(pX + 6.8, shoulderY + 3);
        ctx.moveTo(pX - 6.5, shoulderY + 6); ctx.lineTo(pX + 6.5, shoulderY + 6);
        ctx.moveTo(pX - 6.3, shoulderY + 9); ctx.lineTo(pX + 6.3, shoulderY + 9);
        ctx.stroke();
    }

    ctx.restore();
    drawRealisticArm(false, armSwingR);
}

// 4. Kafa, Boyun, Kulaklar ve Gerçekçi Yüz Hatları (8 Açılı İyileştirilmiş Sistem)
function drawRealistic25dHeadAndFace(ctx, pX, pY, p, facing, skin) {
    let isBack = (facing === 'up' || facing === 'up-left' || facing === 'up-right');
    let headCenterY = pY - 19;
    let neckY = pY - 13.5;

    // --- 1. BOYUN & KÖPRÜCÜK KEMİĞİ ---
    ctx.save();
    let neckGrad = ctx.createLinearGradient(pX - 3, headCenterY + 4, pX + 3, neckY);
    neckGrad.addColorStop(0, skin.shadow);
    neckGrad.addColorStop(0.6, skin.base);
    neckGrad.addColorStop(1, skin.light);

    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.moveTo(pX - 3.0, headCenterY + 4);
    ctx.lineTo(pX - 3.8, neckY);
    ctx.lineTo(pX + 3.8, neckY);
    ctx.lineTo(pX + 3.0, headCenterY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = skin.darkShadow; ctx.lineWidth = 0.6; ctx.stroke();

    ctx.fillStyle = skin.shadow;
    ctx.beginPath();
    ctx.ellipse(pX, headCenterY + 5.2, 3.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- 2. KAFA KAFATASI TABANI ---
    ctx.save();
    let headGrad = ctx.createRadialGradient(pX - 2.5, headCenterY - 2.5, 2, pX, headCenterY, 10.5);
    headGrad.addColorStop(0, skin.light);
    headGrad.addColorStop(0.7, skin.base);
    headGrad.addColorStop(1, skin.shadow);

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(pX, headCenterY, 9.2, 10.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = skin.darkShadow; ctx.lineWidth = 0.8; ctx.stroke();

    // --- 3. KULAKLAR (8 AÇIYA GÖRE TAM ANATOMİK KONUMLANDIRMA) ---
    const drawRealisticEar = (earX, earY, rx, ry, angle, isBackView) => {
        ctx.save();
        ctx.fillStyle = skin.base;
        ctx.beginPath();
        ctx.ellipse(earX, earY, rx, ry, angle, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = skin.darkShadow; ctx.lineWidth = 0.55; ctx.stroke();

        if (!isBackView) {
            ctx.strokeStyle = skin.shadow; ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.arc(earX, earY - 0.3, rx * 0.55, 0.3, Math.PI * 1.5);
            ctx.stroke();

            ctx.fillStyle = skin.light;
            ctx.beginPath();
            ctx.arc(earX, earY + ry * 0.55, rx * 0.45, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = skin.shadow; ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.arc(earX, earY, rx * 0.6, Math.PI * 0.4, Math.PI * 1.6);
            ctx.stroke();
        }
        ctx.restore();
    };

    let hairId = p.hat || 'hair_sanalika_dreadlocks';
    let hairCoversEars = (hairId === 'hair_sanalika_dreadlocks' || hairId === 'hair_sanalika_street' || hairId === 'hair_sanalika_wavy');

    if (!hairCoversEars) {
        if (facing === 'down') {
            // Önden tam görünüm: İki kulak da dengeli ve kafatasının yanında
            drawRealisticEar(pX - 7.6, headCenterY + 0.5, 1.5, 2.3, -0.1, false);
            drawRealisticEar(pX + 7.6, headCenterY + 0.5, 1.5, 2.3, 0.1, false);
        } else if (facing === 'down-right') {
            // 3/4 Sağ Ön: Sol kulak arkada görünür, sağ kulak perspektifle daralır
            drawRealisticEar(pX - 6.6, headCenterY + 0.5, 1.3, 2.2, -0.15, false);
            drawRealisticEar(pX + 5.2, headCenterY + 0.5, 1.1, 2.0, 0.1, false);
        } else if (facing === 'down-left') {
            // 3/4 Sol Ön: Sağ kulak arkada görünür, sol kulak perspektifle daralır
            drawRealisticEar(pX + 6.6, headCenterY + 0.5, 1.3, 2.2, 0.15, false);
            drawRealisticEar(pX - 5.2, headCenterY + 0.5, 1.1, 2.0, -0.1, false);
        } else if (facing === 'right') {
            // Tam Sağ Profil
            drawRealisticEar(pX - 1.2, headCenterY + 0.5, 1.8, 2.6, 0.05, false);
        } else if (facing === 'left') {
            // Tam Sol Profil
            drawRealisticEar(pX + 1.2, headCenterY + 0.5, 1.8, 2.6, -0.05, false);
        } else if (facing === 'up-right') {
            // 3/4 Sağ Arka
            drawRealisticEar(pX + 5.8, headCenterY + 0.5, 1.3, 2.2, 0.15, true);
        } else if (facing === 'up-left') {
            // 3/4 Sol Arka
            drawRealisticEar(pX - 5.8, headCenterY + 0.5, 1.3, 2.2, -0.15, true);
        } else if (facing === 'up') {
            // Tam Arka: İki kulağın da arkası
            drawRealisticEar(pX - 7.5, headCenterY + 0.5, 1.4, 2.2, -0.1, true);
            drawRealisticEar(pX + 7.5, headCenterY + 0.5, 1.4, 2.2, 0.1, true);
        }
    }

    // --- 4. YÜZ DETAYLARI: GÖZLER, KAŞLAR, BURUN, DUDAKLAR ---
    if (!isBack) {
        let isRightProfile = (facing === 'right');
        let isLeftProfile = (facing === 'left');
        let is34Right = (facing === 'down-right');
        let is34Left = (facing === 'down-left');

        const drawRealisticEye = (eyeX, eyeY, width, height) => {
            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.ellipse(eyeX, eyeY, width, height, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 0.6; ctx.stroke();

            ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
            ctx.beginPath();
            ctx.arc(eyeX, eyeY - 0.4, width * 0.85, Math.PI, 0);
            ctx.fill();

            // İris: Bal köpüğü ela gradyan
            let irisGrad = ctx.createRadialGradient(eyeX, eyeY, 0.4, eyeX, eyeY, width * 0.65);
            irisGrad.addColorStop(0, "#d97706");
            irisGrad.addColorStop(0.6, "#92400e");
            irisGrad.addColorStop(1, "#451a03");

            ctx.fillStyle = irisGrad;
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, width * 0.62, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#09090b";
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, width * 0.32, 0, Math.PI * 2);
            ctx.fill();

            // Çifte Işık Parıltısı
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(eyeX - width * 0.22, eyeY - height * 0.25, width * 0.24, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
            ctx.beginPath();
            ctx.arc(eyeX + width * 0.24, eyeY + height * 0.26, width * 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Üst kirpik çizgisi
            ctx.strokeStyle = "#18181b"; ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, width, Math.PI + 0.3, -0.3);
            ctx.stroke();
            ctx.restore();
        };

        if (isRightProfile) {
            // =====================================================================
            // TAM SAĞ PROFİL YÜZ ÇİZİMİ (Fotoğraf 1: Sevimli kalkık burun & tebessüm)
            // =====================================================================
            let pEyeX = pX + 3.2;
            let eyeY = headCenterY - 0.4;

            // Tek göz
            drawRealisticEye(pEyeX, eyeY, 2.4, 2.0);

            // Tek kaş
            ctx.strokeStyle = "#7f1d1d"; ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(pEyeX - 2.0, eyeY - 3.2);
            ctx.quadraticCurveTo(pEyeX + 0.5, eyeY - 4.2, pEyeX + 3.0, eyeY - 3.0);
            ctx.stroke();

            // Yanak allığı
            ctx.fillStyle = skin.blush;
            ctx.beginPath();
            ctx.ellipse(pX + 2.5, headCenterY + 2.2, 2.2, 1.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Profil Burun (Fotoğraf 1'deki kalkık sevimli üçgen burun)
            ctx.strokeStyle = skin.shadow; ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(pX + 5.5, headCenterY - 1.0);
            ctx.lineTo(pX + 8.2, headCenterY + 1.8);
            ctx.lineTo(pX + 6.2, headCenterY + 2.8);
            ctx.stroke();

            // Burun ucu parlama ışığı
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(pX + 7.8, headCenterY + 1.6, 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Profil Dudak (Yukarı kavisli gülüş)
            ctx.fillStyle = "#b9554d";
            ctx.beginPath();
            ctx.moveTo(pX + 5.8, headCenterY + 4.8);
            ctx.lineTo(pX + 7.6, headCenterY + 5.1);
            ctx.lineTo(pX + 5.8, headCenterY + 5.8);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.fillRect(pX + 5.8, headCenterY + 4.9, 1.3, 0.8);

            ctx.fillStyle = "#d97067";
            ctx.beginPath();
            ctx.moveTo(pX + 5.8, headCenterY + 5.8);
            ctx.lineTo(pX + 7.2, headCenterY + 6.2);
            ctx.lineTo(pX + 5.8, headCenterY + 6.7);
            ctx.closePath();
            ctx.fill();

            if (p.face === 'sunglasses') {
                ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
                ctx.beginPath();
                ctx.roundRect(pEyeX - 2.0, eyeY - 2.2, 6.0, 4.4, 2);
                ctx.fill();
                ctx.strokeStyle = "#facc15"; ctx.lineWidth = 0.8; ctx.stroke();
                ctx.strokeStyle = "#facc15"; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(pEyeX - 2.0, eyeY - 0.5); ctx.lineTo(pX - 1.2, headCenterY + 0.5); ctx.stroke();
            }
        } else if (isLeftProfile) {
            // =====================================================================
            // TAM SOL PROFİL YÜZ ÇİZİMİ (Fotoğraf 4: Sevimli kalkık burun & tebessüm)
            // =====================================================================
            let pEyeX = pX - 3.2;
            let eyeY = headCenterY - 0.4;

            drawRealisticEye(pEyeX, eyeY, 2.4, 2.0);

            ctx.strokeStyle = "#7f1d1d"; ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(pEyeX + 2.0, eyeY - 3.2);
            ctx.quadraticCurveTo(pEyeX - 0.5, eyeY - 4.2, pEyeX - 3.0, eyeY - 3.0);
            ctx.stroke();

            ctx.fillStyle = skin.blush;
            ctx.beginPath();
            ctx.ellipse(pX - 2.5, headCenterY + 2.2, 2.2, 1.4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = skin.shadow; ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(pX - 5.5, headCenterY - 1.0);
            ctx.lineTo(pX - 8.2, headCenterY + 1.8);
            ctx.lineTo(pX - 6.2, headCenterY + 2.8);
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(pX - 7.8, headCenterY + 1.6, 0.7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#b9554d";
            ctx.beginPath();
            ctx.moveTo(pX - 5.8, headCenterY + 4.8);
            ctx.lineTo(pX - 7.6, headCenterY + 5.1);
            ctx.lineTo(pX - 5.8, headCenterY + 5.8);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.fillRect(pX - 7.1, headCenterY + 4.9, 1.3, 0.8);

            ctx.fillStyle = "#d97067";
            ctx.beginPath();
            ctx.moveTo(pX - 5.8, headCenterY + 5.8);
            ctx.lineTo(pX - 7.2, headCenterY + 6.2);
            ctx.lineTo(pX - 5.8, headCenterY + 6.7);
            ctx.closePath();
            ctx.fill();

            if (p.face === 'sunglasses') {
                ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
                ctx.beginPath();
                ctx.roundRect(pEyeX - 4.0, eyeY - 2.2, 6.0, 4.4, 2);
                ctx.fill();
                ctx.strokeStyle = "#facc15"; ctx.lineWidth = 0.8; ctx.stroke();
                ctx.strokeStyle = "#facc15"; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(pEyeX + 2.0, eyeY - 0.5); ctx.lineTo(pX + 1.2, headCenterY + 0.5); ctx.stroke();
            }
        } else {
            // =====================================================================
            // ÖN VE 3/4 AÇILI ÇİZİM (down, down-right, down-left)
            // =====================================================================
            let eyeShiftX = is34Right ? 1.6 : (is34Left ? -1.6 : 0);

            ctx.fillStyle = skin.blush;
            ctx.beginPath();
            ctx.ellipse(pX - 4.5 + eyeShiftX * 0.5, headCenterY + 2.2, 2.6, 1.6, 0, 0, Math.PI * 2);
            ctx.ellipse(pX + 4.5 + eyeShiftX * 0.5, headCenterY + 2.2, 2.6, 1.6, 0, 0, Math.PI * 2);
            ctx.fill();

            let leftEyeX = pX - 3.4 + eyeShiftX;
            let rightEyeX = pX + 3.4 + eyeShiftX;
            let eyeY = headCenterY - 0.4;

            if (is34Right) {
                drawRealisticEye(leftEyeX, eyeY, 2.8, 2.2);
                drawRealisticEye(rightEyeX, eyeY, 2.3, 1.9);
            } else if (is34Left) {
                drawRealisticEye(leftEyeX, eyeY, 2.3, 1.9);
                drawRealisticEye(rightEyeX, eyeY, 2.8, 2.2);
            } else {
                drawRealisticEye(leftEyeX, eyeY, 2.7, 2.2);
                drawRealisticEye(rightEyeX, eyeY, 2.7, 2.2);
            }

            // Kaşlar
            ctx.strokeStyle = "#7f1d1d"; ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(leftEyeX - 2.8, eyeY - 3.0);
            ctx.quadraticCurveTo(leftEyeX, eyeY - 4.4, leftEyeX + 2.6, eyeY - 3.4);
            ctx.moveTo(rightEyeX - 2.6, eyeY - 3.4);
            ctx.quadraticCurveTo(rightEyeX, eyeY - 4.4, rightEyeX + 2.8, eyeY - 3.0);
            ctx.stroke();

            // Burun
            let noseX = pX + eyeShiftX * 0.8;
            let noseY = headCenterY + 2.6;

            ctx.strokeStyle = skin.shadow; ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(noseX - 0.4, headCenterY - 1.0);
            ctx.lineTo(noseX + (is34Right ? 0.6 : (is34Left ? -0.6 : 0)), noseY);
            ctx.stroke();

            ctx.strokeStyle = skin.darkShadow; ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.arc(noseX, noseY, 1.3, 0.2, Math.PI - 0.2);
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(noseX, noseY - 0.4, 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Dudaklar & Sanalika Neşeli Gülümsemesi (Fotoğraf 2 & 3: Beyaz diş çizgisi)
            let mouthX = pX + eyeShiftX * 0.7;
            let mouthY = headCenterY + 5.5;

            // Dudak tabanı
            ctx.fillStyle = "#b9554d";
            ctx.beginPath();
            ctx.moveTo(mouthX - 3.4, mouthY);
            ctx.quadraticCurveTo(mouthX, mouthY - 0.8, mouthX + 3.4, mouthY);
            ctx.quadraticCurveTo(mouthX, mouthY + 2.2, mouthX - 3.4, mouthY);
            ctx.fill();

            // Beyaz Dişler (Fotoğraf 2 & 3'teki açık gülüş)
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(mouthX - 2.6, mouthY);
            ctx.lineTo(mouthX + 2.6, mouthY);
            ctx.lineTo(mouthX + 2.2, mouthY + 1.2);
            ctx.lineTo(mouthX - 2.2, mouthY + 1.2);
            ctx.closePath();
            ctx.fill();

            // Sıcak mercan alt dudak
            ctx.fillStyle = "#d97067";
            ctx.beginPath();
            ctx.moveTo(mouthX - 3.2, mouthY + 1.0);
            ctx.quadraticCurveTo(mouthX, mouthY + 2.5, mouthX + 3.2, mouthY + 1.0);
            ctx.quadraticCurveTo(mouthX, mouthY + 1.4, mouthX - 3.2, mouthY + 1.0);
            ctx.fill();

            // Dudak parlama ışığı
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.beginPath();
            ctx.ellipse(mouthX, mouthY + 1.6, 1.2, 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            if (p.face === 'sunglasses') {
                ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
                ctx.beginPath();
                ctx.roundRect(leftEyeX - 3.4, eyeY - 2.2, 6.2, 4.4, 2);
                ctx.roundRect(rightEyeX - 2.8, eyeY - 2.2, 6.2, 4.4, 2);
                ctx.fill();
                ctx.strokeStyle = "#facc15"; ctx.lineWidth = 0.8; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(leftEyeX + 2.8, eyeY - 0.5); ctx.lineTo(rightEyeX - 2.8, eyeY - 0.5); ctx.stroke();
            }

            if (p.face === 'mustache') {
                ctx.fillStyle = "#451a03";
                ctx.beginPath();
                ctx.ellipse(mouthX - 1.6, mouthY - 0.8, 2.2, 1.2, -0.2, 0, Math.PI * 2);
                ctx.ellipse(mouthX + 1.6, mouthY - 0.8, 2.2, 1.2, 0.2, 0, Math.PI * 2);
                ctx.fill();
            }

            if (p.face === 'beard') {
                ctx.fillStyle = "rgba(69, 26, 3, 0.35)";
                ctx.beginPath();
                ctx.ellipse(pX, headCenterY + 6.8, 5.5, 3.2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    } else {
        // Ense çizgisi (Arkadan görünüm)
        ctx.strokeStyle = skin.shadow; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(pX, headCenterY + 3.0);
        ctx.lineTo(pX, neckY);
        ctx.stroke();
    }

    ctx.restore();
}

// 5. Saç Modeli: 2.5D Kızıl Rasta & Bandana
function drawRealistic25dHair(ctx, pX, pY, p, facing) {
    let isBack = (facing === 'up' || facing === 'up-left' || facing === 'up-right');
    let headCenterY = pY - 19;
    let hairId = p.hat || 'hair_sanalika_dreadlocks';

    // Eğer varsayılan veya dreadlocks ise:
    if (hairId === 'hair_sanalika_dreadlocks' || hairId === 'none' || hairId === 'bere') {
        let redBase = '#dc2626';     // Ana kızıl kırmızısı
        let redDark = '#7f1d1d';     // Derin gölge ayrım çizgileri
        let redMid = '#991b1b';      // Orta gölge
        let redLight = '#ef4444';    // Canlı açık kızıl
        let redGlint = '#f87171';    // Saç teli parlama ışığı
        let bandColor = '#f43f5e';   // Bandana pembe/kırmızı rengi

        ctx.save();

        if (isBack) {
            // =========================================================================
            // FOTOĞRAF 5: ARKADAN GÖRÜNÜM - ŞELALE GİBİ DÖKÜLEN KIZIL RASTA LÜLELERİ
            // =========================================================================

            let crownX = pX;
            let crownY = headCenterY - 7.5;

            // Arka derin gölge tabanı
            ctx.fillStyle = redDark;
            ctx.beginPath();
            ctx.arc(crownX, headCenterY - 2, 11, 0, Math.PI * 2);
            ctx.fill();

            // 11 Adet Ayrı Ayrık Rasta Lülesi (Tepeden sırt üzerine dökülen kalın burgular)
            const dreadStrands = [
                { startX: -1.0, startY: -6.0, endX: -7.5, endY: 7.5, width: 3.4 },
                { startX: -2.0, startY: -5.0, endX: -5.0, endY: 9.0, width: 3.6 },
                { startX: -1.0, startY: -4.0, endX: -2.5, endY: 10.0, width: 3.8 },
                { startX: 0.0,  startY: -4.0, endX: 0.0,  endY: 10.5, width: 4.0 }, // Orta ana lüle
                { startX: 1.0,  startY: -4.0, endX: 2.5,  endY: 10.0, width: 3.8 },
                { startX: 2.0,  startY: -5.0, endX: 5.0,  endY: 9.0, width: 3.6 },
                { startX: 1.0,  startY: -6.0, endX: 7.5,  endY: 7.5, width: 3.4 },
                // Üst katman hacim lüleleri
                { startX: -3.0, startY: -7.0, endX: -8.5, endY: 2.5, width: 3.2 },
                { startX: 3.0,  startY: -7.0, endX: 8.5,  endY: 2.5, width: 3.2 },
                { startX: -4.0, startY: -8.0, endX: -9.5, endY: -1.0, width: 3.0 },
                { startX: 4.0,  startY: -8.0, endX: 9.5,  endY: -1.0, width: 3.0 }
            ];

            dreadStrands.forEach((strand, idx) => {
                let sx = crownX + strand.startX;
                let sy = crownY + strand.startY;
                let ex = crownX + strand.endX;
                let ey = crownY + strand.endY;

                // Burgu silindir gövdesi
                let dGrad = ctx.createLinearGradient(sx, sy, ex, ey);
                dGrad.addColorStop(0, redDark);
                dGrad.addColorStop(0.3, redBase);
                dGrad.addColorStop(0.7, redLight);
                dGrad.addColorStop(1, redDark);

                ctx.strokeStyle = dGrad;
                ctx.lineWidth = strand.width;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.quadraticCurveTo((sx + ex) / 2 + (idx % 2 === 0 ? 1.0 : -1.0), (sy + ey) / 2, ex, ey);
                ctx.stroke();

                // Lüle arası derin gölge çizgisi
                ctx.strokeStyle = redDark;
                ctx.lineWidth = 0.9;
                ctx.stroke();

                // Lüle üstü parlak ışık vurgusu (Silindirik parlama)
                ctx.strokeStyle = redGlint;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(sx + 0.5, sy + 1);
                ctx.quadraticCurveTo((sx + ex) / 2, (sy + ey) / 2 - 1, ex - 0.5, ey - 2);
                ctx.stroke();
            });

            // Tepe tacı birleşim noktası
            ctx.fillStyle = redMid;
            ctx.beginPath();
            ctx.ellipse(crownX, crownY + 2, 4.5, 3.2, 0, 0, Math.PI * 2);
            ctx.fill();

        } else if (facing === 'right' || facing === 'left') {
            // =========================================================================
            // FOTOĞRAF 1 & 4: TAM PROFİL GÖRÜNÜM (Sağ ve Sol Profil Geriye Dökülen Rasta Manesi)
            // =========================================================================
            let isR = (facing === 'right');
            let dir = isR ? 1 : -1;

            // 1. Geriye Doğru Kavis Yapan Üst Diken Rasta Tutamları
            const profileDreads = [
                { sx: pX - dir * 2.0, sy: headCenterY - 8.0, ex: pX - dir * 11.0, ey: headCenterY - 14.0, w: 4.0 },
                { sx: pX - dir * 4.0, sy: headCenterY - 6.0, ex: pX - dir * 13.0, ey: headCenterY - 10.0, w: 3.8 },
                { sx: pX - dir * 5.0, sy: headCenterY - 3.0, ex: pX - dir * 14.5, ey: headCenterY - 5.0,  w: 3.6 },
                { sx: pX - dir * 6.0, sy: headCenterY,       ex: pX - dir * 15.0, ey: headCenterY + 1.0,  w: 3.5 },
                { sx: pX - dir * 5.0, sy: headCenterY + 3.0, ex: pX - dir * 13.5, ey: headCenterY + 7.0,  w: 3.4 },
                { sx: pX - dir * 3.0, sy: headCenterY + 5.0, ex: pX - dir * 11.0, ey: headCenterY + 12.0, w: 3.6 },
                { sx: pX - dir * 1.0, sy: headCenterY + 6.0, ex: pX - dir * 7.5,  ey: headCenterY + 14.0, w: 3.8 }
            ];

            profileDreads.forEach(d => {
                let grad = ctx.createLinearGradient(d.sx, d.sy, d.ex, d.ey);
                grad.addColorStop(0, redDark);
                grad.addColorStop(0.4, redBase);
                grad.addColorStop(0.8, redLight);
                grad.addColorStop(1, redDark);

                ctx.strokeStyle = grad;
                ctx.lineWidth = d.w;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(d.sx, d.sy);
                ctx.quadraticCurveTo((d.sx + d.ex) / 2 - dir * 1.5, (d.sy + d.ey) / 2, d.ex, d.ey);
                ctx.stroke();

                ctx.strokeStyle = redDark; ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo((d.sx + d.ex) / 2 - 1.0, (d.sy + d.ey) / 2 - 0.5);
                ctx.lineTo((d.sx + d.ex) / 2 + 1.0, (d.sy + d.ey) / 2 + 0.5);
                ctx.stroke();

                ctx.strokeStyle = redGlint; ctx.lineWidth = 0.7;
                ctx.beginPath();
                ctx.moveTo(d.sx, d.sy);
                ctx.lineTo((d.sx + d.ex) / 2, (d.sy + d.ey) / 2);
                ctx.stroke();
            });

            // 2. Profil Alın Bandanası (Fotoğraf 1 & 4)
            ctx.fillStyle = bandColor;
            ctx.beginPath();
            ctx.ellipse(pX + dir * 1.5, headCenterY - 4.5, 7.8, 3.8, dir * 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = redDark; ctx.lineWidth = 0.8; ctx.stroke();

            // Bandana üzerindeki pembe hilal / daire amblemi
            ctx.fillStyle = "#fbcfe8";
            ctx.beginPath();
            ctx.ellipse(pX + dir * 2.8, headCenterY - 5.2, 3.2, 1.8, dir * 0.18, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // =========================================================================
            // FOTOĞRAF 2 & 3: ÖNDEN & 3/4 GÖRÜNÜM - DİKEN TEPELİ RASTA & BANDANA & YAN LÜLELER
            // =========================================================================

            // 1. Tepe Diken Rasta Tutamları (Yukarı ve yana fışkıran hacimli saç)
            const topSpikes = [
                { x: pX - 9.0, y: headCenterY - 4, ex: pX - 12.0, ey: headCenterY - 8, w: 3.5 },
                { x: pX - 7.0, y: headCenterY - 7, ex: pX - 9.5, ey: headCenterY - 13, w: 3.8 },
                { x: pX - 4.0, y: headCenterY - 9, ex: pX - 5.0, ey: headCenterY - 16, w: 4.0 },
                { x: pX - 0.5, y: headCenterY - 10, ex: pX - 0.5, ey: headCenterY - 17, w: 4.2 },
                { x: pX + 3.0, y: headCenterY - 9, ex: pX + 4.5, ey: headCenterY - 16, w: 4.0 },
                { x: pX + 6.5, y: headCenterY - 7, ex: pX + 9.0, ey: headCenterY - 13, w: 3.8 },
                { x: pX + 8.5, y: headCenterY - 4, ex: pX + 11.5, ey: headCenterY - 8, w: 3.5 }
            ];

            topSpikes.forEach(sp => {
                let sGrad = ctx.createLinearGradient(sp.x, sp.y, sp.ex, sp.ey);
                sGrad.addColorStop(0, redDark);
                sGrad.addColorStop(0.5, redBase);
                sGrad.addColorStop(1, redLight);

                ctx.strokeStyle = sGrad;
                ctx.lineWidth = sp.w;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(sp.x, sp.y);
                ctx.lineTo(sp.ex, sp.ey);
                ctx.stroke();

                // Diken ucu açık kızıl highlight
                ctx.strokeStyle = redGlint;
                ctx.lineWidth = 1.0;
                ctx.beginPath();
                ctx.moveTo((sp.x + sp.ex) / 2, (sp.y + sp.ey) / 2);
                ctx.lineTo(sp.ex, sp.ey);
                ctx.stroke();
            });

            // 2. Yanaklardan ve Omuzlardan Aşağı Dökülen Yan Rasta Lüleleri (Kulakları kapatır)
            const sideDreads = [
                // Sol taraf lüleleri
                { sx: pX - 8.0, sy: headCenterY - 1, ex: pX - 9.5, ey: headCenterY + 9, w: 3.4 },
                { sx: pX - 6.5, sy: headCenterY + 1, ex: pX - 8.0, ey: headCenterY + 11, w: 3.6 },
                { sx: pX - 5.0, sy: headCenterY + 3, ex: pX - 6.5, ey: headCenterY + 8, w: 3.2 },
                // Sağ taraf lüleleri
                { sx: pX + 5.0, sy: headCenterY + 3, ex: pX + 6.5, ey: headCenterY + 8, w: 3.2 },
                { sx: pX + 6.5, sy: headCenterY + 1, ex: pX + 8.0, ey: headCenterY + 11, w: 3.6 },
                { sx: pX + 8.0, sy: headCenterY - 1, ex: pX + 9.5, ey: headCenterY + 9, w: 3.4 }
            ];

            sideDreads.forEach(sd => {
                let dGrad = ctx.createLinearGradient(sd.sx, sd.sy, sd.ex, sd.ey);
                dGrad.addColorStop(0, redDark);
                dGrad.addColorStop(0.4, redBase);
                dGrad.addColorStop(1, redDark);

                ctx.strokeStyle = dGrad;
                ctx.lineWidth = sd.w;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(sd.sx, sd.sy);
                ctx.quadraticCurveTo((sd.sx + sd.ex) / 2 + 1.2, (sd.sy + sd.ey) / 2, sd.ex, sd.ey);
                ctx.stroke();

                // Lüle boğum çizgileri (Twisted cord)
                ctx.strokeStyle = redDark; ctx.lineWidth = 0.8;
                for (let t = 0.2; t <= 0.8; t += 0.25) {
                    let mx = sd.sx + (sd.ex - sd.sx) * t;
                    let my = sd.sy + (sd.ey - sd.sy) * t;
                    ctx.beginPath();
                    ctx.moveTo(mx - 1.2, my - 0.6);
                    ctx.lineTo(mx + 1.2, my + 0.6);
                    ctx.stroke();
                }
            });

            // 3. Alın Bandanası (Fotoğraf 2 & 3)
            ctx.fillStyle = bandColor;
            ctx.beginPath();
            ctx.ellipse(pX, headCenterY - 4.5, 9.4, 4.0, 0, Math.PI, 0);
            ctx.lineTo(pX + 9.2, headCenterY - 2.8);
            ctx.ellipse(pX, headCenterY - 2.8, 9.2, 3.8, 0, 0, Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = redDark; ctx.lineWidth = 0.8; ctx.stroke();

            // Bandana üzerindeki pembe/beyaz hilal deseni (Fotoğraf 2 & 3)
            ctx.fillStyle = "#fbcfe8";
            ctx.beginPath();
            ctx.ellipse(pX, headCenterY - 4.2, 4.0, 1.8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

    } else if (hairId === 'hair_sanalika_street') {
        // Sokak Diken Saç
        ctx.save();
        ctx.fillStyle = "#18181b";
        ctx.beginPath();
        ctx.arc(pX, headCenterY - 3, 9.5, Math.PI, 0);
        ctx.fill();
        // Dikenler
        ctx.fillStyle = "#d97706";
        for (let i = -7; i <= 7; i += 3.5) {
            ctx.beginPath();
            ctx.moveTo(pX + i - 1.5, headCenterY - 5);
            ctx.lineTo(pX + i, headCenterY - 14);
            ctx.lineTo(pX + i + 1.5, headCenterY - 5);
            ctx.fill();
        }
        ctx.restore();
    } else if (hairId === 'hair_sanalika_wavy') {
        // Dalgalı Salaş Saç
        ctx.save();
        ctx.fillStyle = "#451a03";
        ctx.beginPath();
        ctx.arc(pX, headCenterY - 2, 10.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#78350f"; ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(pX - 4, headCenterY + 4, 5, 0, Math.PI);
        ctx.arc(pX + 4, headCenterY + 4, 5, 0, Math.PI);
        ctx.stroke();
        ctx.restore();
    } else {
        // Klasik saç/şapkalar ile uyumluluk
        drawAvatarHairAndHats(ctx, pX, pY - 1, hairId, facing);
    }
}

// 6. ANA 2.5D İZOMETRİK GERÇEKÇİ AVATAR BİRLEŞTİRİCİSİ
function drawRealistic25dAvatar(ctx, pX, pY, p, facing, isSitting, legSwing, isPreview) {
    let skinPalette = getRealisticSkinPalette(p.skinColor);

    // 1. Zemin Gölgesi (Canlı ambient occlusion - Kuğu veya binek atı varken binek kendi gölgesini çizer)
    if (!p.hasSwanBoat && !p.hasHorse) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.ellipse(pX, pY + (isSitting ? 16 : 21.5), isSitting ? 14 : 12, isSitting ? 5.5 : 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 2. Bacaklar, Kamuflaj Kargo Şort ve Sneaker Ayakkabılar
    drawRealistic25dLegs(ctx, pX, pY, p, facing, isSitting, legSwing, skinPalette);

    // 3. Gövde, Siyah Fitted Tişört ve Kollar
    drawRealistic25dTorsoAndArms(ctx, pX, pY, p, facing, isSitting, legSwing, skinPalette);

    // 4. Kafa, Boyun, Kulaklar ve Gerçekçi Yüz Hatları
    drawRealistic25dHeadAndFace(ctx, pX, pY, p, facing, skinPalette);

    // 5. Saç Modeli & Kızıl Rasta / Bandana
    drawRealistic25dHair(ctx, pX, pY, p, facing);
}

// --- 6.1 KLASİK 2 VÜCUT MODELİ (GELİŞMİŞ KLASİK AVATAR, 8 YÖNLÜ SALINAN KOLLAR & SAATLER & ÖZEL SETLER) ---

function getClassic2SleeveStyle(p, isFemale) {
    let out = p.outfit;
    let col = p.shirt || p.color || '#3b82f6';
    let skin = p.skinColor || "#ffd1a4";

    if (out === 'outfit_c2_gentleman') {
        return { color: '#334155', cuffColor: '#f8fafc', isShort: false, is3Quarter: false };
    }
    if (out === 'outfit_c2_street_cool') {
        return { color: '#0f766e', cuffColor: '#115e59', isShort: false, is3Quarter: false };
    }
    if (out === 'outfit_c2_casual_polo') {
        return { color: '#1e3a8a', cuffColor: null, isShort: true, is3Quarter: false };
    }
    if (out === 'outfit_c2_femme_chic') {
        return { color: '#ec4899', cuffColor: null, isShort: false, is3Quarter: true };
    }

    if (out && out.startsWith('dress_')) {
        if (out === 'dress_pink') return { color: '#f472b6', cuffColor: null, isShort: true, is3Quarter: false };
        if (out === 'dress_black') return { color: '#18181b', cuffColor: null, isShort: false, is3Quarter: true };
        if (out === 'dress_red') return { color: skin, cuffColor: null, isShort: true, is3Quarter: false };
        if (out === 'dress_emerald') return { color: '#059669', cuffColor: null, isShort: false, is3Quarter: false };
        if (out === 'dress_lavender') return { color: '#c084fc', cuffColor: null, isShort: true, is3Quarter: false };
        if (out === 'dress_bridal') return { color: '#ffffff', cuffColor: null, isShort: false, is3Quarter: false };
        return { color: skin, cuffColor: null, isShort: true, is3Quarter: false };
    }

    if (col === 'hoodie') return { color: '#6366f1', cuffColor: '#4f46e5', isShort: false, is3Quarter: false };
    if (col === 'leather') return { color: '#18181b', cuffColor: '#27272a', isShort: false, is3Quarter: false };
    if (col === 'polo') return { color: '#f8fafc', cuffColor: null, isShort: true, is3Quarter: false };
    if (col === 'skirt_crop') return { color: skin, cuffColor: null, isShort: true, is3Quarter: false };
    if (col === 'skirt_denim') return { color: '#38bdf8', cuffColor: null, isShort: true, is3Quarter: false };

    let shirtCol = (col && col.startsWith('#')) ? col : '#3b82f6';
    return { color: shirtCol, cuffColor: null, isShort: true, is3Quarter: false };
}

function drawClassic2Watch(targetCtx, wx, wy, watchId) {
    if (!watchId || watchId === 'none') return;
    targetCtx.save();
    if (watchId === 'watch_gold_rolex') {
        // Altın Prestij Saat: Parlak altın kordon, altın kasa, beyaz kadran
        targetCtx.fillStyle = "#ca8a04";
        targetCtx.fillRect(wx - 2.8, wy - 1.2, 5.6, 2.4);
        targetCtx.fillStyle = "#facc15";
        targetCtx.fillRect(wx - 2.8, wy - 0.7, 5.6, 1.4);
        targetCtx.fillStyle = "#fef08a";
        targetCtx.beginPath();
        targetCtx.arc(wx, wy, 1.8, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = "#1e293b";
        targetCtx.beginPath();
        targetCtx.arc(wx, wy, 0.8, 0, Math.PI * 2);
        targetCtx.fill();
    } else if (watchId === 'watch_leather_classic') {
        // Deri Kordonlu Klasik Saat: Kahverengi kordon, gümüş kasa, beyaz kadran
        targetCtx.fillStyle = "#78350f";
        targetCtx.fillRect(wx - 2.6, wy - 1.2, 5.2, 2.4);
        targetCtx.fillStyle = "#94a3b8";
        targetCtx.beginPath();
        targetCtx.arc(wx, wy, 1.8, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = "#f8fafc";
        targetCtx.beginPath();
        targetCtx.arc(wx, wy, 1.1, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = "#0f172a";
        targetCtx.fillRect(wx - 0.4, wy - 0.4, 0.8, 0.8);
    } else if (watchId === 'watch_cyber_sport') {
        // Neon Spor Kronometre: Koyu gövde, neon siyan dijital gösterge
        targetCtx.fillStyle = "#0f172a";
        targetCtx.fillRect(wx - 2.8, wy - 1.4, 5.6, 2.8);
        targetCtx.fillStyle = "#06b6d4";
        targetCtx.beginPath();
        targetCtx.roundRect(wx - 2.2, wy - 1.2, 4.4, 2.4, 0.8);
        targetCtx.fill();
        targetCtx.fillStyle = "#22d3ee";
        targetCtx.fillRect(wx - 1.6, wy - 0.7, 3.2, 1.4);
    }
    targetCtx.restore();
}

function drawClassic2Arm(targetCtx, shoulderX, shoulderY, angle, isLeftArm, isFarArm, sleeveStyle, skinColor, watchId, isSitting) {
    targetCtx.save();
    targetCtx.translate(shoulderX, shoulderY);
    if (isSitting) {
        let sitAngle = isLeftArm ? 0.32 : -0.32;
        targetCtx.rotate(sitAngle);
    } else {
        targetCtx.rotate(angle);
    }

    let armLength = 11.0;
    let armW = 3.8;
    let sleeveLength = sleeveStyle.isShort ? 4.8 : (sleeveStyle.is3Quarter ? 7.2 : 9.2);

    // 1. Üst Kol & Kol Giysisi
    targetCtx.fillStyle = sleeveStyle.color;
    targetCtx.beginPath();
    targetCtx.roundRect(-armW / 2, 0, armW, sleeveLength, [2, 2, 1, 1]);
    targetCtx.fill();
    targetCtx.strokeStyle = "rgba(0,0,0,0.12)";
    targetCtx.lineWidth = 0.6;
    targetCtx.stroke();

    // Kol manşeti detayı
    if (sleeveStyle.cuffColor) {
        targetCtx.fillStyle = sleeveStyle.cuffColor;
        targetCtx.fillRect(-armW / 2, sleeveLength - 1.4, armW, 1.4);
    }

    // 2. Ön Kol (Ten rengi)
    if (sleeveLength < armLength) {
        targetCtx.fillStyle = skinColor;
        targetCtx.beginPath();
        targetCtx.roundRect(-armW / 2 + 0.4, sleeveLength - 0.4, armW - 0.8, armLength - sleeveLength + 0.4, 1.2);
        targetCtx.fill();
    }

    // 3. Kol Saati (Sol kolda ve bilek hizasında)
    if (isLeftArm && watchId && watchId !== 'none') {
        let wristY = armLength - 1.0;
        drawClassic2Watch(targetCtx, 0, wristY, watchId);
    }

    // 4. El (Doğal yuvarlak el)
    let handY = armLength + 1.2;
    targetCtx.fillStyle = skinColor;
    targetCtx.beginPath();
    targetCtx.arc(0, handY, 2.2, 0, Math.PI * 2);
    targetCtx.fill();

    // Arka kol hafif gölgesi
    if (isFarArm) {
        targetCtx.fillStyle = "rgba(0, 0, 0, 0.22)";
        targetCtx.beginPath();
        targetCtx.roundRect(-armW / 2, 0, armW, handY + 2.2, 2);
        targetCtx.fill();
    }

    targetCtx.restore();
}

function drawClassic2Torso(targetCtx, pX, pY, p, facing, isFemale) {
    let skinColor = p.skinColor || '#ffd1a4';
    let out = p.outfit;

    // Boyun
    targetCtx.fillStyle = skinColor;
    targetCtx.fillRect(pX - 3.5, pY - 13, 7, 5.5);
    targetCtx.fillStyle = "rgba(0,0,0,0.12)";
    targetCtx.fillRect(pX - 3.5, pY - 13, 7, 1.6);

    let isBack = (facing === 'up' || facing === 'up-right' || facing === 'up-left');

    if (out === 'outfit_c2_gentleman') {
        targetCtx.save();
        // Ceket gövdesi
        targetCtx.fillStyle = '#334155';
        targetCtx.beginPath();
        targetCtx.roundRect(pX - 8, pY - 8, 16, 18, [3, 3, 2, 2]);
        targetCtx.fill();
        targetCtx.strokeStyle = "rgba(0,0,0,0.2)";
        targetCtx.lineWidth = 1;
        targetCtx.stroke();

        if (!isBack) {
            // Beyaz gömlek V yaka
            targetCtx.fillStyle = '#f8fafc';
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 3.5, pY - 8);
            targetCtx.lineTo(pX + 3.5, pY - 8);
            targetCtx.lineTo(pX, pY + 2);
            targetCtx.closePath();
            targetCtx.fill();

            // Kırmızı ipek kravat
            targetCtx.fillStyle = '#991b1b';
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 1.2, pY - 7);
            targetCtx.lineTo(pX + 1.2, pY - 7);
            targetCtx.lineTo(pX + 1.6, pY + 4);
            targetCtx.lineTo(pX, pY + 6.5);
            targetCtx.lineTo(pX - 1.6, pY + 4);
            targetCtx.closePath();
            targetCtx.fill();

            // Yelek / Ceket düğmeleri
            targetCtx.fillStyle = '#1e293b';
            targetCtx.beginPath(); targetCtx.arc(pX, pY + 4, 1.1, 0, Math.PI * 2); targetCtx.fill();
            targetCtx.beginPath(); targetCtx.arc(pX, pY + 7, 1.1, 0, Math.PI * 2); targetCtx.fill();
        }
        targetCtx.restore();
    } else if (out === 'outfit_c2_street_cool') {
        targetCtx.save();
        // Koyu zümrüt bomber ceket
        targetCtx.fillStyle = '#0f766e';
        targetCtx.beginPath();
        targetCtx.roundRect(pX - 8.5, pY - 8, 17, 18, [3, 3, 3, 3]);
        targetCtx.fill();

        if (!isBack) {
            // İç beyaz tişört
            targetCtx.fillStyle = '#f8fafc';
            targetCtx.fillRect(pX - 2.8, pY - 8, 5.6, 15);

            // Fermuar hattı
            targetCtx.strokeStyle = '#cbd5e1';
            targetCtx.lineWidth = 1.0;
            targetCtx.beginPath();
            targetCtx.moveTo(pX, pY - 6);
            targetCtx.lineTo(pX, pY + 7);
            targetCtx.stroke();
        }

        // Bomber yakası ve etek lastiği
        targetCtx.fillStyle = '#115e59';
        targetCtx.fillRect(pX - 7, pY - 9, 14, 2);
        targetCtx.fillRect(pX - 8.5, pY + 8, 17, 2.5);
        targetCtx.restore();
    } else if (out === 'outfit_c2_casual_polo') {
        targetCtx.save();
        // Marin polo mavi gövde
        targetCtx.fillStyle = '#1e3a8a';
        targetCtx.beginPath();
        targetCtx.roundRect(pX - 8, pY - 8, 16, 18, [3, 3, 2, 2]);
        targetCtx.fill();

        // Beyaz yatay çizgiler
        targetCtx.fillStyle = '#f8fafc';
        targetCtx.fillRect(pX - 8, pY - 3, 16, 2.2);
        targetCtx.fillRect(pX - 8, pY + 2.5, 16, 2.2);
        targetCtx.fillRect(pX - 8, pY + 7, 16, 2.2);

        if (!isBack) {
            // Beyaz polo yaka
            targetCtx.fillStyle = '#f8fafc';
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 5, pY - 9);
            targetCtx.lineTo(pX, pY - 5);
            targetCtx.lineTo(pX + 5, pY - 9);
            targetCtx.lineTo(pX + 3.5, pY - 4);
            targetCtx.lineTo(pX - 3.5, pY - 4);
            targetCtx.closePath();
            targetCtx.fill();
        }
        targetCtx.restore();
    } else if (out === 'outfit_c2_femme_chic') {
        targetCtx.save();
        // Pastel pembe blazer ceket
        targetCtx.fillStyle = '#ec4899';
        targetCtx.beginPath();
        targetCtx.roundRect(pX - 7.5, pY - 8, 15, 15, [3, 3, 2, 2]);
        targetCtx.fill();

        if (!isBack) {
            // İpeksi beyaz iç bluz
            targetCtx.fillStyle = '#fff1f2';
            targetCtx.beginPath();
            targetCtx.moveTo(pX - 3.5, pY - 8);
            targetCtx.lineTo(pX + 3.5, pY - 8);
            targetCtx.lineTo(pX, pY + 1);
            targetCtx.closePath();
            targetCtx.fill();

            // İnce altın kolye
            targetCtx.strokeStyle = '#facc15';
            targetCtx.lineWidth = 1.0;
            targetCtx.beginPath();
            targetCtx.arc(pX, pY - 5.5, 2.4, 0, Math.PI);
            targetCtx.stroke();
        }

        // Kalem etek üst kısmı
        targetCtx.fillStyle = '#db2777';
        targetCtx.fillRect(pX - 6.5, pY + 7, 13, 4);
        targetCtx.restore();
    } else {
        // Standart tişört / elbise gövdesi
        drawAvatarBodyAndClothes(targetCtx, pX, pY, p.outfit || p.shirt || p.color, p.skinColor, facing, isFemale);
    }
}

function drawClassic2Avatar(ctx, pX, pY, p, facing, isSitting, legSwing, playerWalkCycle, isMoving, isPreview) {
    facing = normalize8WayFacing(facing || 'down');
    let isFemale = isFemaleAvatar(p, p.color, p.hat, p.shoes);
    let skinColor = p.skinColor || "#ffd1a4";
    let watchId = p.watch || 'none';
    let sleeveStyle = getClassic2SleeveStyle(p, isFemale);

    // Pantolon ve bacak rengi çözümü
    let isSkirt = false;
    let pantsColor = '#2563eb';
    let out = p.outfit;
    if (out === 'outfit_c2_gentleman') {
        pantsColor = '#1e293b';
    } else if (out === 'outfit_c2_street_cool') {
        pantsColor = '#1d4ed8';
    } else if (out === 'outfit_c2_casual_polo') {
        pantsColor = '#d4b996';
    } else if (out === 'outfit_c2_femme_chic') {
        pantsColor = '#db2777';
        isSkirt = true;
    } else if (out && out.startsWith('dress_')) {
        isSkirt = true;
        pantsColor = skinColor;
    } else if (p.pants) {
        if (p.pants === 'pants_classic_jeans') pantsColor = '#2563eb';
        else if (p.pants === 'pants_classic_black') pantsColor = '#1e293b';
        else if (p.pants === 'pants_classic_beige') pantsColor = '#d4b996';
        else if (p.pants === 'pants_classic_cargo_olive') pantsColor = '#4d5d3b';
        else if (p.pants === 'pants_classic_white_skirt') { pantsColor = '#ffffff'; isSkirt = true; }
        else if (p.pants === 'pants_camo_cargo') pantsColor = '#4b5563';
    }

    // 8 Yönlü Yürüme Salınımı (Bacakların tersine senkronize doğal salınım)
    let hasHeldItem = (p.heldItem && p.heldItem !== 'none') || p.hasTea;
    let armSwingAngle = 0;
    if (hasHeldItem) {
        armSwingAngle = 0; // El eşyası varken kollar sabit (2.5D gibi)
    } else if (isSitting) {
        armSwingAngle = 0;
    } else if (isMoving) {
        armSwingAngle = Math.sin(playerWalkCycle || 0) * 0.42;
    } else if (isPreview) {
        armSwingAngle = Math.sin(Date.now() / 400) * 0.16; // Önizlemede tatlı bir kol salınımı
    } else {
        armSwingAngle = Math.sin(Date.now() / 650) * 0.04; // Beklerken hafif nefes mikro-salınımı
    }

    // Açıya göre omuz koordinatları ve kol katmanlaması
    let farArm = null;
    let nearArm = null;

    if (facing === 'down') {
        // Tam Öne (Güney): Her iki kol gövdenin yanında
        nearArm = [
            { sx: pX - 9, sy: pY - 6, angle: -armSwingAngle, isLeft: true, isFar: false },
            { sx: pX + 9, sy: pY - 6, angle: armSwingAngle, isLeft: false, isFar: false }
        ];
    } else if (facing === 'up') {
        // Tam Arka (Kuzey)
        farArm = [
            { sx: pX + 8, sy: pY - 6, angle: armSwingAngle, isLeft: true, isFar: true },
            { sx: pX - 8, sy: pY - 6, angle: -armSwingAngle, isLeft: false, isFar: true }
        ];
    } else if (facing === 'right') {
        // Sağ Profil
        farArm = [{ sx: pX - 2, sy: pY - 6, angle: -armSwingAngle * 1.2, isLeft: true, isFar: true }];
        nearArm = [{ sx: pX + 1, sy: pY - 6, angle: armSwingAngle * 1.2, isLeft: false, isFar: false }];
    } else if (facing === 'left') {
        // Sol Profil (Saatli sol kol önde!)
        farArm = [{ sx: pX + 2, sy: pY - 6, angle: armSwingAngle * 1.2, isLeft: false, isFar: true }];
        nearArm = [{ sx: pX - 1, sy: pY - 6, angle: -armSwingAngle * 1.2, isLeft: true, isFar: false }];
    } else if (facing === 'down-right') {
        // 3/4 Sağ İleri
        farArm = [{ sx: pX - 6, sy: pY - 7, angle: -armSwingAngle * 0.9, isLeft: true, isFar: true }];
        nearArm = [{ sx: pX + 7, sy: pY - 5, angle: armSwingAngle * 0.9, isLeft: false, isFar: false }];
    } else if (facing === 'down-left') {
        // 3/4 Sol İleri (Saatli sol kol önde!)
        farArm = [{ sx: pX + 6, sy: pY - 7, angle: armSwingAngle * 0.9, isLeft: false, isFar: true }];
        nearArm = [{ sx: pX - 7, sy: pY - 5, angle: -armSwingAngle * 0.9, isLeft: true, isFar: false }];
    } else if (facing === 'up-right') {
        // 3/4 Sağ Geri
        farArm = [
            { sx: pX - 7, sy: pY - 6, angle: armSwingAngle * 0.8, isLeft: true, isFar: true },
            { sx: pX + 5, sy: pY - 6, angle: -armSwingAngle * 0.8, isLeft: false, isFar: true }
        ];
    } else if (facing === 'up-left') {
        // 3/4 Sol Geri
        farArm = [
            { sx: pX + 7, sy: pY - 6, angle: -armSwingAngle * 0.8, isLeft: false, isFar: true },
            { sx: pX - 5, sy: pY - 6, angle: armSwingAngle * 0.8, isLeft: true, isFar: true }
        ];
    }

    let heldItem = p.heldItem || (p.hasTea ? 'cay' : 'none');
    let isBack = (facing === 'up' || facing === 'up-right' || facing === 'up-left');
    let isBackAccessory = (heldItem === 'sirtcantasi' || heldItem === 'gitar' || heldItem === 'baglama');
    let drawItemUnder = isBack && !isBackAccessory && (heldItem && heldItem !== 'none');

    // Sigara İçme / Duman Çekme Mekaniği Kol Açısı
    let smokeState = (heldItem === 'sigara') ? getAvatarSmokingState(p, isPreview) : null;
    if (smokeState && smokeState.liftProgress > 0 && heldItem === 'sigara') {
        let rightArm = (nearArm && nearArm.find(a => !a.isLeft)) || (farArm && farArm.find(a => !a.isLeft));
        if (rightArm) {
            let mouth = getAvatarMouthPos(pX, pY, facing, 'classic_2');
            let dx = mouth.x - rightArm.sx;
            let dy = mouth.y - rightArm.sy;
            let targetAngle = Math.atan2(dx, dy);
            rightArm.angle = rightArm.angle + (targetAngle - rightArm.angle) * smokeState.liftProgress;
        }
    }

    // 1. Arka plandaki (Far) kolların çizimi
    if (farArm) {
        farArm.forEach(arm => {
            drawClassic2Arm(ctx, arm.sx, arm.sy, arm.angle, arm.isLeft, arm.isFar, sleeveStyle, skinColor, watchId, isSitting);
        });
    }

    // 1.5. Karakter arkasını döndüğünde (Kuzey, Kuzey-Doğu, Kuzey-Batı), el eşyaları vücudun arkasında kalır!
    // Böylece gövde ve bacaklar eşyanın önünü kapatır, sadece salınan ve dışa taşan kısımları görünür.
    if (drawItemUnder) {
        drawHeldItem(ctx, pX, pY, heldItem, isPreview, facing, false, 'classic_2', p);
    }

    // 2. Bacaklar & Ayakkabılar (Kadın/Erkek Anatomisiyle)
    drawAvatarLegsAndShoes(ctx, pX, pY, legSwing, skinColor, p.shoes, isSkirt, isSitting, facing, isFemale, pantsColor);

    // 3. Gövde & Kıyafet / Özel Takım Seti
    drawClassic2Torso(ctx, pX, pY, p, facing, isFemale);

    // 4. Ön plandaki (Near) kolların çizimi
    if (nearArm) {
        nearArm.forEach(arm => {
            drawClassic2Arm(ctx, arm.sx, arm.sy, arm.angle, arm.isLeft, arm.isFar, sleeveStyle, skinColor, watchId, isSitting);
        });
    }

    // 5. Kafa
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(pX, pY - 18, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 6. Şapkalar & Saç Modelleri
    drawAvatarHairAndHats(ctx, pX, pY, p.hat || 'none', facing);

    // 7. Gözler ve Yüz Aksesuarları
    let eyeOffsetX = 0, eyeOffsetY = 0;
    if (facing === 'left') eyeOffsetX = -3;
    else if (facing === 'right') eyeOffsetX = 3;
    else if (facing === 'up') eyeOffsetY = -2;
    else eyeOffsetY = 1;
    drawAvatarFaceAndEyes(ctx, pX, pY, p.face || 'none', eyeOffsetX, eyeOffsetY, facing);

    // 8. Ön ve yan açılarda (veya sırtta taşınan eşyalarda) eşya gövdenin önünde çizilir
    if (!drawItemUnder && heldItem && heldItem !== 'none') {
        drawHeldItem(ctx, pX, pY, heldItem, isPreview, facing, false, 'classic_2', p);
    } else if (drawItemUnder && smokeState && smokeState.isExhaling) {
        drawExhaleSmoke(ctx, pX, pY, facing, 'classic_2', smokeState.exhaleProgress);
    }
}

// --- 7. GARDIROP ÖNİZLEME DÖNGÜSÜ ---
function avatarPreviewLoop() {
    if (!isWardrobeOpen) return;
    drawAvatarPreview();
    requestAnimationFrame(avatarPreviewLoop);
}

let _cachedPreviewCanvas = null;
let _cachedPreviewCtx = null;

function drawAvatarPreview() {
    if (!_cachedPreviewCanvas) {
        _cachedPreviewCanvas = document.getElementById('avatarPreviewCanvas');
        if (_cachedPreviewCanvas) _cachedPreviewCtx = _cachedPreviewCanvas.getContext('2d');
    }
    if (!_cachedPreviewCanvas || !_cachedPreviewCtx) return;
    const previewCanvas = _cachedPreviewCanvas;
    const pCtx = _cachedPreviewCtx;
    pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    let cX = previewCanvas.width / 2;
    let cY = 138;

    pCtx.fillStyle = "rgba(56, 189, 248, 0.12)";
    pCtx.beginPath();
    pCtx.ellipse(cX, cY + 20, 52, 16, 0, 0, Math.PI * 2);
    pCtx.fill();
    pCtx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    pCtx.lineWidth = 1.5;
    pCtx.stroke();

    pCtx.fillStyle = "rgba(56, 189, 248, 0.25)";
    pCtx.beginPath();
    pCtx.ellipse(cX, cY + 20, 34, 10, 0, 0, Math.PI * 2);
    pCtx.fill();

    let idleBob = Math.sin(Date.now() / 260) * 2.5;

    pCtx.save();
    pCtx.translate(cX, cY + idleBob);
    pCtx.scale(1.9, 1.9);

    pCtx.fillStyle = "rgba(0, 0, 0, 0.35)";
    pCtx.beginPath();
    pCtx.ellipse(0, 22, 12, 5, 0, 0, Math.PI * 2);
    pCtx.fill();

    let activeAv = (isWardrobeOpen && previewAvatar) ? previewAvatar : myAvatar;
    let isDressOrSkirt = (activeAv.color && (activeAv.color.startsWith('dress_') || activeAv.color.startsWith('skirt_') || activeAv.color.startsWith('outfit_')));
    let isFemale = isFemaleAvatar(activeAv, activeAv.color, activeAv.hat, activeAv.shoes);
    let facing = (typeof window !== 'undefined' && window.previewFacing) ? window.previewFacing : 'down';

    if (activeAv.model === 'sanalika_v2') {
        drawRealistic25dAvatar(pCtx, 0, 0, activeAv, facing, false, 0, true);
        drawHeldItem(pCtx, 0, 0, activeAv.heldItem, true, facing, true, 'sanalika_v2', activeAv);
        pCtx.restore();
        return;
    } else {
        let previewCycle = Date.now() / 250;
        drawClassic2Avatar(pCtx, 0, 0, activeAv, facing, false, 0, previewCycle, false, true);
        pCtx.restore();
        return;
    }
}

// --- 8. ANİMASYONLU VE ÇOK OYUNCULU OYUNCU ÇİZİM MOTORU ---
function drawAnimatedPlayer(p, id) {
    let isMounted = !!p.hasHorse;
    let isRidingSwan = (typeof currentRoom !== 'undefined' && (currentRoom === 'sahil' || currentRoom === 'sahilv2') && p.hasSwanBoat);
    let isSitting = (p.action === 'sitting' || isRidingSwan || isMounted);
    let playerWalkCycle = (id === myId) ? (typeof walkCycle !== 'undefined' ? walkCycle : (p.walkCycle || 0)) : (p.walkCycle || 0);
    let isMoving = (id === myId) ? (!!p.isMoving || keys.w || keys.a || keys.s || keys.d || Math.abs(p.vx || 0) > 0.05 || Math.abs(p.vy || 0) > 0.05) : !!p.isMoving;
    if (isSitting && !isRidingSwan && !isMounted) isMoving = false;
    let bob = (isMoving && !isSitting) ? Math.sin(playerWalkCycle) * 2.5 : 0;
    let legSwing = (isMoving && !isSitting) ? Math.sin(playerWalkCycle) * 5 : 0;

    let inWater = false;
    if (typeof currentRoom !== 'undefined') {
        if (currentRoom === 'sahilv2' && typeof isSahilV2Water === 'function') {
            inWater = isSahilV2Water(p.x, p.y);
        } else if (currentRoom === 'sahil') {
            let onPier = (p.x >= 70 && p.x <= 555 && p.y >= 150 && p.y <= 235);
            let shoreX = (typeof getBeachShoreX === 'function') ? getBeachShoreX(p.y) : 300;
            inWater = (p.x < shoreX && !onPier);
        }
    }
    let swanBob = (isRidingSwan && inWater) ? Math.sin(Date.now() / 320) * 2.2 : 0;
    let gallopBob = isMounted ? (isMoving ? Math.sin(playerWalkCycle * 2) * 2.8 : Math.sin(Date.now() / 400) * 0.8) : 0;

    let pX = p.x;
    let pY = p.y + (isSitting && !isRidingSwan && !isMounted ? 7 : (isRidingSwan ? -3 + swanBob : (isMounted ? -10 + gallopBob : bob)));

    let isDancing = (p.action === 'dance');
    let danceTilt = isDancing ? Math.sin(Date.now() / 140) * 0.15 : 0;

    ctx.save();
    if (isDancing) {
        ctx.translate(pX, pY);
        ctx.rotate(danceTilt);
        ctx.translate(-pX, -pY);
    }

    if (!isRidingSwan && !isMounted) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.ellipse(pX, p.y + (isSitting ? 16 : 22), isSitting ? 14 : 12, isSitting ? 5.5 : 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    const model = p.model === 'sanalika_v2' ? 'sanalika_v2' : 'classic_2';
    let rawFacing = (id === myId) ? myFacing : (p.facing || 'down');
    let facing = normalize8WayFacing(rawFacing);
    let isFemale = isFemaleAvatar(p, p.color, p.hat, p.shoes);

    // BİNEK ATI - Katman 1: Gövde, Arka Bacaklar, Kuyruk ve Eyer (Karakterin arkasında çizilir)
    if (isMounted && typeof HorseMountRenderer !== 'undefined') {
        ctx.save();
        ctx.translate(pX, p.y + 12);
        ctx.scale(1.15, 1.15);
        HorseMountRenderer.drawGroundShadow(ctx, isMoving, playerWalkCycle);
        HorseMountRenderer.drawHorseBase(ctx, facing, isMoving, playerWalkCycle);
        ctx.restore();
    }

    // Kuğu Deniz Bisikleti - Katman 1: Tekne Tabanı, Su Dalgaları ve Koltuklar (Karakterin arkasında çizilir)
    if (isRidingSwan && typeof SwanBoatRenderer !== 'undefined') {
        ctx.save();
        ctx.translate(pX, p.y + 6 + swanBob);
        ctx.scale(1.15, 1.15);
        if (inWater) {
            SwanBoatRenderer.drawWaterEffects(ctx, isMoving, Date.now());
        } else {
            SwanBoatRenderer.drawGroundShadow(ctx);
        }
        SwanBoatRenderer.drawBoatBase(ctx, facing, isMoving, Date.now());
        ctx.restore();
    }

    if (model === 'sanalika_v2') {
        drawRealistic25dAvatar(ctx, pX, pY, p, facing, isSitting, legSwing, false);
    } else {
        drawClassic2Avatar(ctx, pX, pY, p, facing, isSitting, legSwing, playerWalkCycle, isMoving, false);
    }

    // 7. Elde Taşınan Eşyalar & Balık Tutma
    if (p.isFishing) {
        ctx.save();
        let rodDirX = (facing === 'left' || facing === 'down-left' || facing === 'up-left') ? -1 : 1;
        let fishHandX = pX + rodDirX * 10;
        let fishHandY = pY + 2;
        let rodBend = Math.sin(Date.now() / 240) * 2;
        let tipX = fishHandX + rodDirX * 26;
        let tipY = fishHandY - 18 + rodBend;

        ctx.strokeStyle = "#334155"; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fishHandX, fishHandY);
        ctx.quadraticCurveTo(fishHandX + rodDirX * 13, fishHandY - 14, tipX, tipY);
        ctx.stroke();

        ctx.fillStyle = "#f59e0b";
        ctx.beginPath(); ctx.arc(fishHandX + rodDirX * 4, fishHandY, 3, 0, Math.PI * 2); ctx.fill();

        let floatTargetX = tipX + rodDirX * 16;
        let floatTargetY = tipY + 40;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(floatTargetX, floatTargetY); ctx.stroke();

        let bobberAnim = Math.sin(Date.now() / 180) * 2;
        ctx.fillStyle = "#ef4444";
        ctx.beginPath(); ctx.arc(floatTargetX, floatTargetY + bobberAnim, 3.5, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(floatTargetX, floatTargetY + bobberAnim, 3.5, 0, Math.PI); ctx.fill();

        let rippleR = ((Date.now() / 35) % 14) + 2;
        let rippleAlpha = 1 - (rippleR / 16);
        ctx.strokeStyle = `rgba(255, 255, 255, ${rippleAlpha * 0.7})`; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(floatTargetX, floatTargetY + 3, rippleR, rippleR * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    } else {
        if (model !== 'classic_2') {
            let activeHeld = p.heldItem || (p.hasTea ? 'cay' : 'none');
            drawHeldItem(ctx, pX, pY, activeHeld, false, facing, (model === 'sanalika_v2'), model, p);
        }
    }

    // 8. El Sallama Animasyonu
    if (p.action === 'wave') {
        let waveArmAngle = Math.sin(Date.now() / 90) * 0.4 - 0.7;
        ctx.save();
        ctx.translate(pX + 10, pY - 5);
        ctx.rotate(waveArmAngle);
        ctx.fillStyle = p.color;
        ctx.fillRect(0, -12, 4, 12);
        ctx.fillStyle = "#facc15";
        ctx.beginPath(); ctx.arc(2, -14, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // 9. Alkış Animasyonu
    if (p.action === 'clap') {
        let clapOffset = Math.abs(Math.sin(Date.now() / 80)) * 4;
        ctx.fillStyle = "#facc15";
        ctx.beginPath(); ctx.arc(pX - 4 + clapOffset, pY + 2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(pX + 4 - clapOffset, pY + 2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#facc15";
        ctx.font = "10px sans-serif";
        ctx.fillText("✨", pX + 8, pY);
    }

    // 10. Dans Eden Nota Simgeleri
    if (isDancing) {
        let noteY = pY - 38 - ((Date.now() / 50) % 12);
        ctx.fillStyle = "#ec4899";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("♪ ♫", pX + 10, noteY);
    }

    ctx.restore();

    // 10.0 BİNEK ATI - Katman 2: Baş, Boyun, Kulaklar, Yele, Dizginler ve Üzengi (Karakterin önünde çizilir)
    if (p.hasHorse && typeof HorseMountRenderer !== 'undefined') {
        ctx.save();
        ctx.translate(pX, p.y + 12);
        ctx.scale(1.15, 1.15);
        HorseMountRenderer.drawHorseFront(ctx, facing, isMoving, playerWalkCycle);
        ctx.restore();
    }

    // 10.1 KUĞU DENİZ BİSİKLETİ (ÖN KATMAN: Kuğu Boynu, Gaga, Direksiyon ve Ön Pruva)
    if (isRidingSwan && typeof SwanBoatRenderer !== 'undefined') {
        ctx.save();
        ctx.translate(pX, p.y + 6 + swanBob);
        ctx.scale(1.15, 1.15);
        SwanBoatRenderer.drawBoatFront(ctx, facing, isMoving, Date.now());
        ctx.restore();
    }

    // 10.2 NARGİLE DUMAN EFEKTİ
    if (p.heldItem === 'nargile' || (typeof currentRoom !== 'undefined' && currentRoom === 'nargile_cafe')) {
        let smokeTime = Date.now();
        for (let i = 0; i < 3; i++) {
            let offsetTime = (smokeTime / 450 + i * 2) % 6;
            let smokeAlpha = Math.max(0, 1 - (offsetTime / 6));
            let smokeY = pY - 28 - (offsetTime * 8);
            let smokeX = pX + Math.sin(offsetTime * 1.5 + i) * 6;
            let smokeR = 3 + offsetTime * 2.2;

            ctx.fillStyle = `rgba(240, 240, 255, ${smokeAlpha * 0.45})`;
            ctx.beginPath(); ctx.arc(smokeX, smokeY, smokeR, 0, Math.PI * 2); ctx.fill();
        }
    }

    // 11. OYUNCU İSMİ ROZETİ
    ctx.font = "bold 11px sans-serif";
    if (p._cachedNameWidth === undefined || p._cachedName !== p.name) {
        p._cachedName = p.name || '';
        p._cachedNameWidth = ctx.measureText(p._cachedName).width;
    }
    let nameWidth = p._cachedNameWidth;

    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.beginPath();
    ctx.roundRect(pX - nameWidth / 2 - 6, pY - 42, nameWidth + 12, 16, 6);
    ctx.fill();
    ctx.fillStyle = id === myId ? "#38bdf8" : "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(p.name, pX, pY - 30);

    // 11.1 Oturma & Kalkma İpucu
    if (id === myId) {
        if (isSitting) {
            let hintText = "[E] / Yön: Kalk";
            ctx.save();
            ctx.font = "bold 9px sans-serif";
            let hintW = ctx.measureText(hintText).width + 12;
            let hintY = pY + 28;
            ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
            ctx.beginPath();
            ctx.roundRect(pX - hintW / 2, hintY, hintW, 15, 6);
            ctx.fill();
            ctx.strokeStyle = "rgba(56, 189, 248, 0.7)"; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = "#38bdf8"; ctx.textAlign = "center";
            ctx.fillText(hintText, pX, hintY + 11);
            ctx.restore();
        } else {
            let nearbySeat = (typeof findNearestSittableSeat === 'function') ? findNearestSittableSeat() : null;
            if (nearbySeat) {
                let pulse = Math.sin(Date.now() / 180) * 2;
                let promptText = `🛋️ [E] Otur`;
                ctx.save();
                ctx.font = "bold 10px sans-serif";
                let promptW = ctx.measureText(promptText).width + 14;
                let promptY = pY - 60 + pulse;
                ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
                ctx.beginPath();
                ctx.roundRect(pX - promptW / 2, promptY, promptW, 17, 7);
                ctx.fill();
                ctx.strokeStyle = "#facc15"; ctx.lineWidth = 1.2; ctx.stroke();
                ctx.fillStyle = "#facc15"; ctx.textAlign = "center";
                ctx.fillText(promptText, pX, promptY + 12);
                ctx.restore();
            }
        }
    }

    // 11.2 Canlı Sesli Konuşma Göstergesi
    if (p.isSpeaking) {
        ctx.save();
        ctx.strokeStyle = "#10b981"; ctx.lineWidth = 2.5;
        ctx.beginPath();
        let pulseRadius = 24 + Math.sin(Date.now() / 150) * 3;
        ctx.arc(pX, pY - 14, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = "12px sans-serif";
        ctx.fillText("🎙️", pX + nameWidth / 2 + 12, pY - 30);
        ctx.restore();
    }

    // 12. Konuşma Baloncukları
    if (typeof activeChatBubbles !== 'undefined' && activeChatBubbles[id] && activeChatBubbles[id].length > 0) {
        let bubbles = activeChatBubbles[id];
        let bubbleY = pY - 54;

        for (let i = bubbles.length - 1; i >= 0; i--) {
            let bObj = bubbles[i];
            let text = bObj.text;

            if (bObj._textWidth === undefined) {
                ctx.font = "12px sans-serif";
                bObj._textWidth = ctx.measureText(text).width;
            }
            let textWidth = bObj._textWidth;
            let boxWidth = Math.max(textWidth + 18, 44);
            let boxHeight = 26;

            let isAllChat = (bObj.channel === 'all');
            ctx.fillStyle = isAllChat ? "#fffbeb" : "#ffffff";
            ctx.beginPath();
            ctx.roundRect(pX - boxWidth / 2, bubbleY - boxHeight, boxWidth, boxHeight, 8);
            ctx.fill();
            ctx.strokeStyle = isAllChat ? "#f59e0b" : "#334155";
            ctx.lineWidth = isAllChat ? 1.8 : 1.5;
            ctx.stroke();

            if (i === bubbles.length - 1) {
                ctx.fillStyle = isAllChat ? "#fffbeb" : "#ffffff";
                ctx.beginPath();
                ctx.moveTo(pX - 4, bubbleY);
                ctx.lineTo(pX, bubbleY + 5);
                ctx.lineTo(pX + 4, bubbleY);
                ctx.fill();
            }

            ctx.fillStyle = "#0f172a";
            ctx.textAlign = "center";
            ctx.fillText(text, pX, bubbleY - 8);

            bubbleY -= (boxHeight + 6);
        }
    }

    // 13. Hızlı Emoji Tepkileri
    if (typeof activePlayerEmojis !== 'undefined' && activePlayerEmojis[id]) {
        let emojiData = activePlayerEmojis[id];
        let elapsed = Date.now() - emojiData.start;
        if (elapsed < 3000) {
            let progress = elapsed / 3000;
            let alpha = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;
            let floatY = pY - 56 - (progress * 28);
            ctx.save();
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            ctx.beginPath();
            ctx.arc(pX, floatY, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.font = "18px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(emojiData.emoji, pX, floatY + 1);
            ctx.restore();
        } else {
            delete activePlayerEmojis[id];
        }
    }
}

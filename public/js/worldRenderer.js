// public/js/worldRenderer.js - Metaverse Haritaları, Zemin Önbellekleme ve Çarpışma Motoru
if (typeof window.isNightMode === 'undefined') window.isNightMode = false;
if (typeof window.canvasMouseX === 'undefined') window.canvasMouseX = -1;
if (typeof window.canvasMouseY === 'undefined') window.canvasMouseY = -1;

function setGameCursor(cursor) {
    if (typeof canvas !== 'undefined' && canvas && canvas.style.cursor !== cursor) {
        canvas.style.cursor = cursor;
    }
}
window.setGameCursor = setGameCursor;

// --- 8.9 STATİK ARKA PLAN ÖNBELLEKLEME MOTORU (OFFSCREEN CANVAS CACHE) ---
const bgCache = {
    canvas: null,
    ctx: null,
    currentKey: '',
    isValid: false,

    getCanvas(roomKey, width, height) {
        let isNight = (typeof isNightMode !== 'undefined' ? isNightMode : (window.isNightMode || false));
        let key = `${roomKey}_${width}x${height}_${isNight ? 'night' : 'day'}`;
        if (this.isValid && this.currentKey === key && this.canvas) {
            return this.canvas;
        }
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
        }
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.currentKey = key;
        this.isValid = true;

        renderStaticRoomTo(this.ctx, roomKey, width, height);
        return this.canvas;
    },

    invalidate() {
        this.isValid = false;
    }
};
window.invalidateBgCache = () => bgCache.invalidate();

function renderStaticRoomTo(bctx, room, width, height) {
    if (room === 'kafe') {
        renderStaticCafeTo(bctx, width, height);
    } else if (room === 'sokak') {
        renderStaticStreetTo(bctx, width, height);
    } else if (room === 'sahil') {
        renderStaticBeachTo(bctx, width, height);
    } else if (room === 'nargile_cafe') {
        renderStaticNargileCafeTo(bctx, width, height);
    } else if (room === 'market') {
        renderStaticMarketTo(bctx, width, height);
    } else if (room === 'ganyan') {
        renderStaticGanyanTo(bctx, width, height);
    } else if (room === 'cadde') {
        renderStaticCaddeTo(bctx, width, height);
    } else if (room === 'dedenin_yeri') {
        renderStaticDedeninYeriTo(bctx, width, height);
    } else if (room === 'emlakci') {
        renderStaticEmlakciTo(bctx, width, height);
    } else if (room === 'dostlar_kiraathanesi') {
        if (typeof renderStaticDostlarKiraathanesiTo === 'function') {
            renderStaticDostlarKiraathanesiTo(bctx, width, height);
        }
    } else if (room === 'sanalika_cadde') {
        if (typeof renderStaticSanalikaCaddeTo === 'function') {
            renderStaticSanalikaCaddeTo(bctx, width, height);
        }
    } else if (room === 'star_caddesi') {
        if (typeof renderStaticStarCaddesiTo === 'function') {
            renderStaticStarCaddesiTo(bctx, width, height);
        }
    } else if (room === 'meydanv2') {
        if (typeof renderStaticMeydanV2To === 'function') {
            renderStaticMeydanV2To(bctx, width, height);
        }
    } else if (room === 'sahilv2') {
        if (typeof renderStaticSahilV2To === 'function') {
            renderStaticSahilV2To(bctx, width, height);
        }
    } else if (room.startsWith('house_')) {
        let type = room.replace('house_', '');
        if (typeof renderStaticHouseTo === 'function') {
            renderStaticHouseTo(bctx, type, width, height);
        }
    }
}

function renderStaticCafeTo(bctx, width, height) {
    // 1. Üst Arka Duvar & Wainscoting Ahşap Kaplama (Perspektif & Yüksek Tavan Derinliği)
    bctx.fillStyle = "#1e1008"; // Koyu zengin maun duvar
    bctx.fillRect(0, 0, width, 75);

    // Duvar panelleri (Klasik Wainscoting pervazları)
    bctx.strokeStyle = "rgba(217, 119, 6, 0.28)";
    bctx.lineWidth = 1.5;
    for (let px = 20; px < width - 20; px += 70) {
        bctx.strokeRect(px, 12, 58, 52);
    }

    // Pirinç/Altın Korniş & Zemin Ayrım Çıtası
    bctx.fillStyle = "#92400e";
    bctx.fillRect(0, 72, width, 5);
    bctx.fillStyle = "#f59e0b";
    bctx.fillRect(0, 74, width, 2);

    // Duvarın zemine düşen yumuşak ortam gölgesi (Ambient Occlusion)
    let wallShadow = bctx.createLinearGradient(0, 76, 0, 105);
    wallShadow.addColorStop(0, "rgba(0, 0, 0, 0.45)");
    wallShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
    bctx.fillStyle = wallShadow;
    bctx.fillRect(0, 76, width, 29);

    // 2. Büyük Panoramik Kemerli Pencereler (Açık Alan Hissiyatı & Dış Mekan Görünümü)
    // Sol Pencere (x: 235..325) ve Sağ Pencere (x: 475..565)
    [[235, 12, 90, 54], [475, 12, 90, 54]].forEach(([wx, wy, ww, wh]) => {
        // Pencere çerçevesi gölgesi
        bctx.fillStyle = "rgba(0,0,0,0.5)";
        bctx.beginPath();
        bctx.roundRect(wx - 2, wy - 2, ww + 4, wh + 4, [18, 18, 4, 4]);
        bctx.fill();

        // Gökyüzü & Dış Meydan Manzarası
        let skyGrad = bctx.createLinearGradient(wx, wy, wx, wy + wh);
        skyGrad.addColorStop(0, "#38bdf8"); // Açık mavi gökyüzü
        skyGrad.addColorStop(0.65, "#bae6fd");
        skyGrad.addColorStop(1, "#86efac"); // Parktaki yemyeşil ağaçlar
        bctx.fillStyle = skyGrad;
        bctx.beginPath();
        bctx.roundRect(wx, wy, ww, wh, [16, 16, 2, 2]);
        bctx.fill();

        // Dışarıdaki yemyeşil ağaç taçları
        bctx.fillStyle = "#16a34a";
        bctx.beginPath();
        bctx.arc(wx + 22, wy + wh - 6, 18, 0, Math.PI * 2);
        bctx.arc(wx + 50, wy + wh - 10, 22, 0, Math.PI * 2);
        bctx.arc(wx + 75, wy + wh - 4, 16, 0, Math.PI * 2);
        bctx.fill();
        bctx.fillStyle = "#22c55e";
        bctx.beginPath();
        bctx.arc(wx + 45, wy + wh - 14, 15, 0, Math.PI * 2);
        bctx.fill();

        // Beyaz bulutlar
        bctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        bctx.beginPath();
        bctx.arc(wx + 30, wy + 18, 8, 0, Math.PI * 2);
        bctx.arc(wx + 42, wy + 16, 11, 0, Math.PI * 2);
        bctx.arc(wx + 54, wy + 18, 7, 0, Math.PI * 2);
        bctx.fill();

        // Pencere Ahşap Doğraması & Kemer Çerçevesi
        bctx.strokeStyle = "#451a03";
        bctx.lineWidth = 2.5;
        bctx.beginPath();
        bctx.roundRect(wx, wy, ww, wh, [16, 16, 2, 2]);
        bctx.stroke();

        // Muntin (İç Ahşap Bölmeler)
        bctx.strokeStyle = "rgba(69, 26, 3, 0.85)";
        bctx.lineWidth = 1.5;
        bctx.beginPath();
        bctx.moveTo(wx + ww / 2, wy);
        bctx.lineTo(wx + ww / 2, wy + wh);
        bctx.moveTo(wx, wy + wh * 0.55);
        bctx.lineTo(wx + ww, wy + wh * 0.55);
        bctx.stroke();

        // Cam yansıması (Güneş ışıltısı)
        bctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        bctx.beginPath();
        bctx.moveTo(wx + 10, wy + 2);
        bctx.lineTo(wx + 35, wy + 2);
        bctx.lineTo(wx + 15, wy + wh - 2);
        bctx.lineTo(wx + 2, wy + wh - 2);
        bctx.closePath();
        bctx.fill();

        // Pencerelerden zemine dökülen sıcak güneş huzmeleri (Sun rays)
        let sunRay = bctx.createLinearGradient(wx + ww / 2, 75, wx + ww / 2 - 25, 220);
        sunRay.addColorStop(0, "rgba(254, 240, 138, 0.15)");
        sunRay.addColorStop(1, "rgba(254, 240, 138, 0.0)");
        bctx.fillStyle = sunRay;
        bctx.beginPath();
        bctx.moveTo(wx + 8, 76);
        bctx.lineTo(wx + ww - 8, 76);
        bctx.lineTo(wx + ww + 35, 220);
        bctx.lineTo(wx - 25, 220);
        bctx.closePath();
        bctx.fill();
    });

    // 3. Ferah ve Parlak Ahşap Parke Zemin (76px'den 500px'e kadar tüm geniş salon boyunca)
    bctx.fillStyle = "#2c170d";
    bctx.fillRect(0, 76, width, height - 76);

    // Zengin, geniş ahşap parke plankları ve derz çizgileri
    bctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    bctx.lineWidth = 1;
    for (let y = 76; y < height; y += 24) {
        bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(width, y); bctx.stroke();
        let offset = (Math.floor(y / 24) % 2 === 0) ? 0 : 45;
        for (let x = offset; x < width; x += 90) {
            bctx.beginPath(); bctx.moveTo(x, y); bctx.lineTo(x, y + 24); bctx.stroke();
        }
    }

    // Mekan İçi Sıcak Tavan Işık Havuzları (Masa Alanlarında Ferah Salon Aydınlatması)
    [
        [110, 150, 120, 85], // Bilardo lambası ışığı
        [115, 337, 100, 75], // Tavla lambası ışığı
        [697, 165, 110, 85], // Batak 1 ışığı
        [697, 335, 110, 85]  // Batak 2 ışığı
    ].forEach(([lx, ly, rx, ry]) => {
        let lightGrad = bctx.createRadialGradient(lx, ly, 10, lx, ly, Math.max(rx, ry));
        lightGrad.addColorStop(0, "rgba(254, 240, 138, 0.12)");
        lightGrad.addColorStop(0.7, "rgba(254, 240, 138, 0.05)");
        lightGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
        bctx.fillStyle = lightGrad;
        bctx.beginPath();
        bctx.ellipse(lx, ly, rx, ry, 0, 0, Math.PI * 2);
        bctx.fill();
    });

    // 4. VIP Ferah Salon - Merkezi Yürüyüş Yolu (Zarif Bordürlü Koridor Halısı)
    // Kapıdan TV ve Çay Ocağına uzanan 140px ferah yürüyüş koridoru
    bctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    bctx.fillRect(width / 2 - 70, 75, 140, height - 145);
    bctx.strokeStyle = "rgba(217, 119, 6, 0.25)";
    bctx.lineWidth = 1.5;
    bctx.strokeRect(width / 2 - 70, 75, 140, height - 145);

    // Koridor bordür süslemeleri
    bctx.strokeStyle = "rgba(254, 240, 138, 0.15)";
    bctx.lineWidth = 1;
    bctx.strokeRect(width / 2 - 64, 80, 128, height - 155);

    // 5. Kırmızı Anadolu Kilimi (Batak Masaları Alanı - Sağ Duvar Bölümü)
    // VIP Ferah Düzen: Üst duvardan ferah mesafeli, zarif ve şık kilim
    bctx.fillStyle = "#7f1d1d";
    bctx.beginPath();
    bctx.roundRect(615, 88, 165, 360, 14);
    bctx.fill();
    bctx.strokeStyle = "#d97706";
    bctx.lineWidth = 2.5;
    bctx.stroke();

    // Kilim Saçakları ve Geleneksel Anadolu Motifleri
    bctx.strokeStyle = "rgba(254, 240, 138, 0.35)";
    bctx.lineWidth = 1;
    for (let hx = 630; hx <= 760; hx += 30) {
        bctx.strokeRect(hx, 96, 20, 16);
        bctx.strokeRect(hx, 424, 20, 16);
    }

    // Kilim iç bordürü ve baklava meander deseni
    bctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
    bctx.lineWidth = 1.2;
    bctx.strokeRect(625, 103, 145, 330);

    // 6. Bar / Çay Ocağı Tezgahı (Sol Üst)
    bctx.fillStyle = "rgba(0,0,0,0.3)";
    bctx.fillRect(25, 20, 200, 44);
    // Mermer tezgah üstü
    bctx.fillStyle = "#5c2c16";
    bctx.beginPath();
    bctx.roundRect(20, 15, 200, 42, 8);
    bctx.fill();
    bctx.strokeStyle = "#8b4513";
    bctx.lineWidth = 2;
    bctx.stroke();

    // Tezgah cilalı mermer çizgisi
    bctx.fillStyle = "rgba(255,255,255,0.15)";
    bctx.fillRect(24, 18, 192, 4);

    // Bar üstü bakır semaver ve fincanlar
    bctx.fillStyle = "#b45309";
    bctx.beginPath();
    bctx.roundRect(38, 18, 24, 28, 4);
    bctx.fill();
    bctx.fillStyle = "#facc15";
    bctx.fillRect(45, 14, 10, 4);
    bctx.fillRect(32, 32, 6, 4);

    // Çay bardakları (İnce belli kırmızı çay)
    bctx.fillStyle = "#ef4444";
    bctx.fillRect(70, 28, 8, 12);
    bctx.fillRect(84, 28, 8, 12);
    bctx.fillStyle = "#fef08a"; // Altın tabaklar
    bctx.fillRect(68, 40, 12, 2);
    bctx.fillRect(82, 40, 12, 2);

    // Bar tabelası
    bctx.fillStyle = "#fef08a";
    bctx.font = "bold 11px sans-serif";
    bctx.textAlign = "left";
    bctx.fillText("☕ Çay Ocağı (10 TL) - Tıkla", 100, 41);

    // 7. Bar Tabureleri (STATIC_ROOM_SEATS.kafe ile tam uyumlu x: 50, 110, 170)
    [50, 110, 170].forEach(sx => {
        bctx.fillStyle = "rgba(0,0,0,0.25)";
        bctx.beginPath(); bctx.arc(sx, 66, 9, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#b45309";
        bctx.beginPath(); bctx.arc(sx, 64, 8, 0, Math.PI * 2); bctx.fill();
        bctx.strokeStyle = "#78350f";
        bctx.lineWidth = 1.5;
        bctx.stroke();
    });

    // 8. VIP Dekoratif Salon Bitkileri (Girişin sağ ve sol alt köşelerinde ferah lounge hissi)
    [[215, 435], [585, 435]].forEach(([px, py]) => {
        // Saksı gölgesi
        bctx.fillStyle = "rgba(0,0,0,0.3)";
        bctx.beginPath(); bctx.ellipse(px, py + 12, 14, 6, 0, 0, Math.PI * 2); bctx.fill();
        // Saksı gövdesi (Terracotta)
        bctx.fillStyle = "#9a3412";
        bctx.beginPath();
        bctx.moveTo(px - 10, py + 2);
        bctx.lineTo(px + 10, py + 2);
        bctx.lineTo(px + 7, py + 14);
        bctx.lineTo(px - 7, py + 14);
        bctx.closePath();
        bctx.fill();
        bctx.strokeStyle = "#c2410c";
        bctx.lineWidth = 1;
        bctx.stroke();
        // Saksı ağzı
        bctx.fillStyle = "#7c2d12";
        bctx.beginPath(); bctx.ellipse(px, py + 2, 10, 3, 0, 0, Math.PI * 2); bctx.fill();
        // Palmiye / Salon yaprakları (Canlı yeşil katmanlar)
        bctx.fillStyle = "#15803d";
        bctx.beginPath(); bctx.ellipse(px - 6, py - 4, 7, 12, -0.4, 0, Math.PI * 2); bctx.fill();
        bctx.beginPath(); bctx.ellipse(px + 6, py - 4, 7, 12, 0.4, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#22c55e";
        bctx.beginPath(); bctx.ellipse(px, py - 8, 6, 14, 0, 0, Math.PI * 2); bctx.fill();
        bctx.fillStyle = "#86efac";
        bctx.beginPath(); bctx.arc(px, py - 4, 2, 0, Math.PI * 2); bctx.fill();
    });

    // 9. Dinlenme & Okuma Köşesi (Girişin sol-orta salonunda ferah dinlenme alanı)
    bctx.fillStyle = "rgba(0,0,0,0.25)";
    bctx.beginPath(); bctx.ellipse(270, 345, 18, 10, 0, 0, Math.PI * 2); bctx.fill();
    bctx.fillStyle = "#451a03";
    bctx.beginPath(); bctx.ellipse(270, 342, 16, 9, 0, 0, Math.PI * 2); bctx.fill();
    bctx.strokeStyle = "#ca8a04"; bctx.lineWidth = 1; bctx.stroke();
    bctx.fillStyle = "#f8fafc";
    bctx.fillRect(264, 339, 12, 6); // Gazete / Dergi
    bctx.fillStyle = "#ef4444";
    bctx.beginPath(); bctx.arc(273, 341, 2.5, 0, Math.PI * 2); bctx.fill(); // Minik kahve fincanı

    // 10. Meydan Çıkış Kapısı (Ortada - Meydana Çıkış)
    drawExitDoor(bctx, width / 2 - 35, height - 65, "🚪 MEYDAN", 70, 60);
    // Test Compatibility: drawExitDoor(bctx, width / 2 - 35, height - 65, "🚪 SOKAK", 70, 60);
}

// --- 9. HARİTA ÇİZİM YARDIMCILARI ---

// A) KAFE ÇİZİMİ
function drawCafeEnvironment() {
    let bg = bgCache.getCanvas('kafe', canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);

    let isTeaHover = (canvasMouseX >= 20 && canvasMouseX <= 225 && canvasMouseY >= 15 && canvasMouseY <= 60);
    if (isTeaHover) {
        hoveredTableId = 'tea';
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(20, 15, 200, 42, 8);
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("☕ Çay Ocağı (10 TL) - Tıkla ve Al", 100, 41);
    } else {
        hoveredTableId = null;
    }

    // Sokak Çıkış Kapısı Hover Kontrolü
    let isExitDoorHover = (canvasMouseX >= canvas.width / 2 - 45 && canvasMouseX <= canvas.width / 2 + 45 && canvasMouseY >= canvas.height - 75 && canvasMouseY <= canvas.height - 5);
    if (isExitDoorHover) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width / 2 - 37, canvas.height - 67, 74, 64);
    }

    // Semaverden yükselen sıcak buhar animasyonu
    let steamAnimY = 14 - ((Date.now() / 60) % 10);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(50, steamAnimY + 5);
    ctx.quadraticCurveTo(54, steamAnimY + 2, 51, steamAnimY);
    ctx.stroke();

    // Mekan İçi Duvar TV'si (Kafe Üst Duvarda - Merkezi Koridor Üzerinde)
    if (typeof drawVenueTV === 'function') {
        drawVenueTV(ctx, 340, 10, 120, 65);
    }

    // 5. MASALARI ÇİZME VE HOVER KONTROLÜ
    cafeTables.forEach(t => {
        let isHover = (canvasMouseX >= t.x && canvasMouseX <= t.x + t.w && canvasMouseY >= t.y && canvasMouseY <= t.y + t.h);
        if (isHover) hoveredTableId = t.id;

        if (t.id === 'billiard') {
            drawBilliardTableObj(t.x, t.y, t.w, t.h, isHover);
        } else if (t.id === 'tavla') {
            drawTavlaTableObj(t.x, t.y, t.w, t.h, isHover);
        } else if (t.id === 'xox') {
            drawXoxTableObj(t.x, t.y, t.w, t.h, isHover);
        } else if (t.id === 'amiral') {
            drawAmiralBattiTableObj(t.x, t.y, t.w, t.h, isHover);
        } else if (t.id === 'chess') {
            drawChessTableObj(t.x, t.y, t.w, t.h, isHover);
        } else if (t.id === 'batak') {
            drawBatakTableObj(t.x + Math.round(t.w / 2), t.y + Math.round(t.h / 2), 40, 3, "Gömmeli Batak", isHover);
        } else if (t.id === 'batak4') {
            drawBatakTableObj(t.x + Math.round(t.w / 2), t.y + Math.round(t.h / 2), 40, 4, "Normal Batak", isHover);
        } else if (t.id === 'blackjack') {
            drawBlackjackTableObj(t.x, t.y, t.w, t.h, isHover);
        }
    });

    setGameCursor((hoveredTableId || isExitDoorHover) ? 'pointer' : 'default');
}

// BİLARDO MASASI ÇİZİMİ
function drawBilliardTableObj(x, y, w, h, isHover) {
    ctx.save();
    // Masa gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 8, w, h, 14);
    ctx.fill();

    // Hover parlaması (Performans dostu vektörel dış aura)
    if (isHover) {
        ctx.strokeStyle = "rgba(250, 204, 21, 0.45)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(x - 2, y - 2, w + 4, h + 4, 14);
        ctx.stroke();
    }

    // Ahşap Çerçeve
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = isHover ? "#facc15" : "#78350f";
    ctx.lineWidth = isHover ? 3 : 2;
    ctx.stroke();

    // Yeşil Çuha
    ctx.fillStyle = "#047857";
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 12, w - 24, h - 24, 6);
    ctx.fill();

    // 6 Adet Delik
    ctx.fillStyle = "#0f172a";
    let pockets = [
        { px: x + 14, py: y + 14 }, { px: x + w / 2, py: y + 12 }, { px: x + w - 14, py: y + 14 },
        { px: x + 14, py: y + h - 14 }, { px: x + w / 2, py: y + h - 12 }, { px: x + w - 14, py: y + h - 14 }
    ];
    pockets.forEach(p => {
        ctx.beginPath(); ctx.arc(p.px, p.py, 5.5, 0, Math.PI * 2); ctx.fill();
    });

    // Beyaz Top
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(x + Math.round(w * 0.26), y + h / 2, 4.5, 0, Math.PI * 2); ctx.fill();

    // Üçgen Dizili Mini Toplar
    let rackX = x + Math.round(w * 0.78), rackY = y + h / 2;
    ctx.fillStyle = "#dc2626"; // Kırmızı
    ctx.beginPath(); ctx.arc(rackX, rackY, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000000"; // 8 numara
    ctx.beginPath(); ctx.arc(rackX + 7, rackY - 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f59e0b"; // Sarı
    ctx.beginPath(); ctx.arc(rackX + 7, rackY + 4, 4, 0, Math.PI * 2); ctx.fill();

    // Çapraz Durmuş Istaka
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 18, y + h - 16);
    ctx.lineTo(x + w - 25, y + 18);
    ctx.stroke();

    // Masa Üstü Lamba
    ctx.fillStyle = "rgba(254, 240, 138, 0.15)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2.2, h / 2.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Başlık Rozeti
    ctx.fillStyle = isHover ? "#facc15" : "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🎱 8-Ball Bilardo", x + w / 2, y + h + 18);
    if (isHover) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "10px sans-serif";
        ctx.fillText("(Tıkla ve Katıl / İzle)", x + w / 2, y + h + 30);
    }
    ctx.restore();
}

// TAVLA MASASI ÇİZİMİ
function drawTavlaTableObj(x, y, w, h, isHover) {
    ctx.save();
    // Masa gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 8, w, h, 14);
    ctx.fill();

    // Hover parlaması (Performans dostu vektörel dış aura)
    if (isHover) {
        ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(x - 2, y - 2, w + 4, h + 4, 12);
        ctx.stroke();
    }

    // Ahşap Çerçeve (Koyu Maun)
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = isHover ? "#f59e0b" : "#78350f";
    ctx.lineWidth = isHover ? 3 : 2;
    ctx.stroke();

    // Tavla Ahşap İçi (Ceviz rengi zemin)
    ctx.fillStyle = "#b45309";
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 6);
    ctx.fill();

    // Orta ahşap bölme (Bar)
    ctx.fillStyle = "#78350f";
    ctx.fillRect(x + w / 2 - 4, y + 10, 8, h - 20);
    // Pirinç Menteşeler
    ctx.fillStyle = "#facc15";
    ctx.fillRect(x + w / 2 - 2, y + 18, 4, 8);
    ctx.fillRect(x + w / 2 - 2, y + h - 26, 4, 8);

    // Tavla Haneleri (Üçgenler)
    let leftW = (w - 28) / 2;
    let pointW = leftW / 6;

    // Sol taraf üst haneler
    for (let i = 0; i < 6; i++) {
        let pX = x + 10 + i * pointW;
        ctx.fillStyle = i % 2 === 0 ? "#7f1d1d" : "#fef08a";
        ctx.beginPath();
        ctx.moveTo(pX, y + 10);
        ctx.lineTo(pX + pointW / 2, y + 36);
        ctx.lineTo(pX + pointW, y + 10);
        ctx.closePath();
        ctx.fill();
    }
    // Sağ taraf üst haneler
    for (let i = 0; i < 6; i++) {
        let pX = x + w / 2 + 4 + i * pointW;
        ctx.fillStyle = i % 2 === 0 ? "#fef08a" : "#7f1d1d";
        ctx.beginPath();
        ctx.moveTo(pX, y + 10);
        ctx.lineTo(pX + pointW / 2, y + 36);
        ctx.lineTo(pX + pointW, y + 10);
        ctx.closePath();
        ctx.fill();
    }

    // Minik pullar masada
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath(); ctx.arc(x + 22, y + 18, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 22, y + 27, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath(); ctx.arc(x + w - 22, y + h - 18, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w - 22, y + h - 27, 4.5, 0, Math.PI * 2); ctx.fill();

    // 2 Adet 3D Zar masanın üstünde
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.roundRect(x + w / 2 - 18, y + h / 2 - 7, 13, 13, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x + w / 2 + 5, y + h / 2 - 5, 13, 13, 2); ctx.fill();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.arc(x + w / 2 - 12, y + h / 2 - 1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath(); ctx.arc(x + w / 2 + 9, y + h / 2 - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w / 2 + 14, y + h / 2 + 3, 1.5, 0, Math.PI * 2); ctx.fill();

    // Sandalyeler (üst ve alt)
    [y - 12, y + h + 4].forEach(sy => {
        ctx.fillStyle = "#78350f";
        ctx.beginPath(); ctx.roundRect(x + w / 2 - 20, sy, 40, 10, 4); ctx.fill();
    });

    // Başlık Rozeti
    ctx.fillStyle = isHover ? "#f59e0b" : "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🎲 Geleneksel Tavla", x + w / 2, y + h + 18);
    if (isHover) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "10px sans-serif";
        ctx.fillText("(Tıkla ve Katıl / İzle)", x + w / 2, y + h + 30);
    }
    ctx.restore();
}

// XOX MASASI ÇİZİMİ (Neon 3x3 Cam & Ahşap Bistro Masası)
function drawXoxTableObj(x, y, w, h, isHover) {
    ctx.save();
    let cx = x + w / 2;
    let cy = y + h / 2;

    // 1. Sandalyeler (Kuzey & Güney Sandalyeleri)
    [cy - 38, cy + 38].forEach((sy, idx) => {
        // Sandalye gölgesi
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.roundRect(cx - 16, sy + 3, 32, 16, 6);
        ctx.fill();

        // Sandalye Ahşap İskeleti
        ctx.fillStyle = "#3d1a0c";
        ctx.beginPath();
        ctx.roundRect(cx - 17, sy, 34, 18, 6);
        ctx.fill();

        // Sandalye Kadife Minderi
        ctx.fillStyle = (idx === 0) ? "#0284c7" : "#e11d48";
        ctx.beginPath();
        ctx.roundRect(cx - 14, sy + 2, 28, 14, 4);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    // 2. Masa Taban Gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy + 6, w * 0.46, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Hover Dış Vektörel Parlama Halkası
    if (isHover) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.48, h * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 4. Masanın Ahşap Gövdesi (Ceviz & Pirinç Çerçeve)
    ctx.fillStyle = "#2d1606";
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.46, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isHover ? "#38bdf8" : "#ca8a04";
    ctx.lineWidth = isHover ? 2.5 : 1.8;
    ctx.stroke();

    // 5. Masanın İç Cam Tablası (Koyu Grafit / Neon Çuha)
    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.38, h * 0.30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 6. Masadaki 3x3 Neon XOX Izgarası
    let gridW = 34, gridH = 26;
    let gx = cx - gridW / 2;
    let gy = cy - gridH / 2;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
    ctx.lineWidth = 1.2;

    // Dikey çizgiler
    ctx.beginPath();
    ctx.moveTo(gx + gridW / 3, gy);
    ctx.lineTo(gx + gridW / 3, gy + gridH);
    ctx.moveTo(gx + 2 * gridW / 3, gy);
    ctx.lineTo(gx + 2 * gridW / 3, gy + gridH);
    // Yatay çizgiler
    ctx.moveTo(gx, gy + gridH / 3);
    ctx.lineTo(gx + gridW, gy + gridH / 3);
    ctx.moveTo(gx, gy + 2 * gridH / 3);
    ctx.lineTo(gx + gridW, gy + 2 * gridH / 3);
    ctx.stroke();

    // Masa Üstündeki Parıldayan X ve O Taşları
    // Sol üstte X
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(gx + 3, gy + 2); ctx.lineTo(gx + 8, gy + 7);
    ctx.moveTo(gx + 8, gy + 2); ctx.lineTo(gx + 3, gy + 7);
    ctx.stroke();

    // Ortada O
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Sağ altta ikinci X
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(gx + 25, gy + 19); ctx.lineTo(gx + 30, gy + 24);
    ctx.moveTo(gx + 30, gy + 19); ctx.lineTo(gx + 25, gy + 24);
    ctx.stroke();

    // Mini Türk Kahvesi Fincanı ve Buhar
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(cx + 28, cy - 6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#451a03";
    ctx.beginPath(); ctx.arc(cx + 28, cy - 6, 2, 0, Math.PI * 2); ctx.fill();
    let sY = cy - 8 - ((Date.now() / 90) % 6);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx + 28, sY); ctx.lineTo(cx + 29, sY - 3); ctx.stroke();

    // 7. Masa Başlığı ve Rozet
    ctx.fillStyle = isHover ? "#38bdf8" : "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("❌ XOX Düellosu ⭕", cx, y + h + 15);

    if (isHover) {
        let bounce = Math.sin(Date.now() / 180) * 3;
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(cx - 70, y - 28 + bounce, 140, 22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("❌ XOX Oyna (Tıkla)", cx, y - 13 + bounce);
    }
    ctx.restore();
}

// AMİRAL BATTI MASASI ÇİZİMİ (Taktiksel Harita Masası & Döner Radar)
function drawAmiralBattiTableObj(x, y, w, h, isHover) {
    ctx.save();
    let cx = x + w / 2;
    let cy = y + h / 2;

    // 1. Kaptan Sandalyeleri (Kuzey & Güney)
    [cy - 38, cy + 38].forEach((sy) => {
        // Sandalye gölgesi
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.roundRect(cx - 18, sy + 3, 36, 16, 5);
        ctx.fill();

        // Koyu deri kaptan koltuğu
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.roundRect(cx - 19, sy, 38, 17, 5);
        ctx.fill();
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pirinç perçinler
        ctx.fillStyle = "#ca8a04";
        [-14, -7, 0, 7, 14].forEach(px => {
            ctx.fillRect(cx + px - 1, sy + 3, 2, 2);
        });
    });

    // 2. Masa Taban Gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 8, w - 10, h - 16, 12);
    ctx.fill();

    // 3. Hover Parlama Halkası (Deniz Mavisi & Zümrüt)
    if (isHover) {
        ctx.strokeStyle = "rgba(34, 197, 94, 0.5)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(x - 2, y + 2, w + 4, h - 4, 12);
        ctx.stroke();
    }

    // 4. Masanın Ahşap Gövdesi (Koyu Maun & Pirinç Köşebentler)
    ctx.fillStyle = "#1e130a";
    ctx.beginPath();
    ctx.roundRect(x, y + 4, w, h - 8, 10);
    ctx.fill();
    ctx.strokeStyle = isHover ? "#22c55e" : "#b45309";
    ctx.lineWidth = isHover ? 2.5 : 1.8;
    ctx.stroke();

    // Pirinç Köşe Braketleri
    ctx.fillStyle = "#ca8a04";
    ctx.fillRect(x + 2, y + 6, 6, 6);
    ctx.fillRect(x + w - 8, y + 6, 6, 6);
    ctx.fillRect(x + 2, y + h - 16, 6, 6);
    ctx.fillRect(x + w - 8, y + h - 16, 6, 6);

    // 5. Masanın Taktik Deniz Mavisi Çuhası / Harita Zemini
    ctx.fillStyle = "#0c2340";
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 12, w - 16, h - 24, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // İnce Deniz Haritası Izgara Çizgileri
    ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
    ctx.lineWidth = 0.8;
    for (let lx = x + 18; lx < x + w - 10; lx += 14) {
        ctx.beginPath(); ctx.moveTo(lx, y + 12); ctx.lineTo(lx, y + h - 12); ctx.stroke();
    }
    for (let ly = y + 20; ly < y + h - 12; ly += 12) {
        ctx.beginPath(); ctx.moveTo(x + 8, ly); ctx.lineTo(x + w - 8, ly); ctx.stroke();
    }

    // 6. Masa Üstündeki 3D Minyatür Savaş Gemisi ve Denizaltı
    // Savaş Gemisi (Sol Taraf)
    let shipX = x + 16, shipY = cy - 8;
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.moveTo(shipX, shipY);
    ctx.lineTo(shipX + 22, shipY);
    ctx.lineTo(shipX + 26, shipY + 4);
    ctx.lineTo(shipX + 22, shipY + 8);
    ctx.lineTo(shipX, shipY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(shipX + 6, shipY + 2, 8, 4); // Kule
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(shipX + 15, shipY + 3, 2, 2); // Namlu

    // Denizaltı (Sağ Taraf)
    let subX = x + w - 38, subY = cy + 4;
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.ellipse(subX + 10, subY, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(subX + 8, subY - 4, 3, 4); // Periskop

    // 7. Masanın Merkezindeki Canlı Dönen Radar Dairesi
    let radR = 14;
    ctx.fillStyle = "rgba(6, 78, 59, 0.75)";
    ctx.beginPath();
    ctx.arc(cx, cy, radR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Radar Mesafe Halkaları
    ctx.strokeStyle = "rgba(34, 197, 94, 0.4)";
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(cx, cy, radR * 0.5, 0, Math.PI * 2); ctx.stroke();

    // Dönen Radar Işığı (Sonar Sweep)
    let sweepAngle = (Date.now() / 450) % (Math.PI * 2);
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * radR, cy + Math.sin(sweepAngle) * radR);
    ctx.stroke();

    // Yanıp sönen radar hedef noktası (Ping Blip)
    let blipAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.4;
    ctx.fillStyle = `rgba(239, 68, 68, ${blipAlpha})`;
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 5, 2, 0, Math.PI * 2);
    ctx.fill();

    // 8. Masa Başlığı ve Rozet
    ctx.fillStyle = isHover ? "#22c55e" : "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚓ Amiral Battı 🎯", cx, y + h + 15);

    if (isHover) {
        let bounce = Math.sin(Date.now() / 180) * 3;
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(cx - 75, y - 28 + bounce, 150, 22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("⚓ Amiral Battı Oyna (Tıkla)", cx, y - 13 + bounce);
    }
    ctx.restore();
}

// SATRANÇ MASASI ÇİZİMİ (Klasik Ahşap Masa, Kakma 8x8 Tahta & Çift LCD Satranç Saati)
function drawChessTableObj(x, y, w, h, isHover) {
    ctx.save();
    let cx = x + w / 2;
    let cy = y + h / 2;

    // 1. Koltuklar / Sandalyeler (Kuzey & Güney Sandalyeleri)
    [y - 12, y + h + 4].forEach((sy, idx) => {
        // Sandalye gölgesi
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.roundRect(cx - 18, sy + 3, 36, 12, 4);
        ctx.fill();

        // Sandalye ahşap gövde
        ctx.fillStyle = "#2d1606";
        ctx.beginPath();
        ctx.roundRect(cx - 19, sy, 38, 12, 4);
        ctx.fill();
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Deri / Kumaş minder (Üst koltuk siyah, alt koltuk beyaz/krem)
        ctx.fillStyle = (idx === 0) ? "#1e293b" : "#f1f5f9";
        ctx.beginPath();
        ctx.roundRect(cx - 15, sy + 2, 30, 8, 3);
        ctx.fill();
    });

    // 2. Masa Taban Gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 8, w - 10, h - 8, 12);
    ctx.fill();

    // 3. Hover Parlama Aurası (Zengin Altın Sarısı)
    if (isHover) {
        ctx.strokeStyle = "rgba(250, 204, 21, 0.55)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(x - 2, y - 2, w + 4, h + 4, 12);
        ctx.stroke();
    }

    // 4. Masanın Ahşap Gövdesi (Koyu Maun & Cilalı Ceviz)
    ctx.fillStyle = "#351a08";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = isHover ? "#facc15" : "#854d0e";
    ctx.lineWidth = isHover ? 2.5 : 1.8;
    ctx.stroke();

    // Masanın Ahşap Kenar Detayı (Pirinç İşlemeler)
    ctx.fillStyle = "#ca8a04";
    ctx.fillRect(x + 3, y + 3, 5, 5);
    ctx.fillRect(x + w - 8, y + 3, 5, 5);
    ctx.fillRect(x + 3, y + h - 8, 5, 5);
    ctx.fillRect(x + w - 8, y + h - 8, 5, 5);

    // 5. Kakma 8x8 Satranç Tahtası (Doğal Akçaağaç & Ceviz Ahşap Dokusu)
    let bSize = 56;
    let bx = cx - bSize / 2 + 5; // Saate yer bırakmak için hafif sağa ofset
    let by = cy - bSize / 2;
    let sqSize = bSize / 8; // 7px kare boyutu

    // Tahta ahşap çerçevesi
    ctx.fillStyle = "#1e1005";
    ctx.beginPath();
    ctx.roundRect(bx - 2, by - 2, bSize + 4, bSize + 4, 3);
    ctx.fill();

    // 8x8 Damalı Kareler (Ahşap Kakma Dokusu: Açık Akçaağaç & Koyu Ceviz)
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            let isLight = (r + c) % 2 === 0;
            ctx.fillStyle = isLight ? "#eedcb6" : "#9a6339";
            ctx.fillRect(bx + c * sqSize, by + r * sqSize, sqSize, sqSize);
        }
    }

    // 6. Minyatür 3D Satranç Taşları
    // Siyah taşlar (Üst sıra r=0, r=1)
    for (let c = 0; c < 8; c++) {
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(bx + c * sqSize + sqSize / 2, by + 1.5 * sqSize, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(bx + c * sqSize + 1.5, by + 0.3 * sqSize, sqSize - 3, sqSize - 2);
    }
    // Beyaz taşlar (Alt sıra r=6, r=7)
    for (let c = 0; c < 8; c++) {
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.arc(bx + c * sqSize + sqSize / 2, by + 6.5 * sqSize, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(bx + c * sqSize + 1.5, by + 7.3 * sqSize, sqSize - 3, sqSize - 2);
    }

    // 7. Dijital Satranç Saati (Masada sol tarafta)
    let clkX = x + 7;
    let clkY = cy - 14;
    let clkW = 11;
    let clkH = 28;

    // Saat kutusu
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(clkX, clkY, clkW, clkH, 2);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Üst butonlar (klasik eğik satranç saati butonları)
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(clkX + 2, clkY - 2, 3, 2);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(clkX + 6, clkY - 3, 3, 3);

    // İki dijital LCD ekran
    ctx.fillStyle = "#022c22";
    ctx.fillRect(clkX + 2, clkY + 3, 7, 9);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(clkX + 3, clkY + 6, 5, 3);

    ctx.fillStyle = "#022c22";
    ctx.fillRect(clkX + 2, clkY + 15, 7, 9);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(clkX + 3, clkY + 18, 5, 3);

    // 8. Masa Başlığı ve Hover Rozeti
    ctx.fillStyle = isHover ? "#facc15" : "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("♟️ Satranç Masası ⏱️", cx, y + h + 15);

    if (isHover) {
        let bounce = Math.sin(Date.now() / 180) * 3;
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(cx - 75, y - 28 + bounce, 150, 22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#facc15";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("♟️ Satranç Oyna (Tıkla)", cx, y - 13 + bounce);
    }
    ctx.restore();
}

// BATAK MASASI ÇİZİMİ (3 ve 4 Kişilik Sandalyeli)
function drawBatakTableObj(cx, cy, radius, chairCount, title, isHover) {
    ctx.save();

    // Sandalyeleri Çiz (Masanın etrafında)
    for (let i = 0; i < chairCount; i++) {
        let angle = (i * 2 * Math.PI / chairCount) - Math.PI / 2;
        let chairDist = radius + 15;
        let chX = cx + Math.cos(angle) * chairDist;
        let chY = cy + Math.sin(angle) * chairDist;

        // Sandalye gölgesi
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); ctx.arc(chX + 2, chY + 3, 11, 0, Math.PI * 2); ctx.fill();

        // Sandalye sırtı & minderi
        ctx.fillStyle = "#78350f";
        ctx.beginPath(); ctx.arc(chX, chY, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#dc2626"; // Kırmızı kadife minder
        ctx.beginPath(); ctx.arc(chX, chY, 8, 0, Math.PI * 2); ctx.fill();
    }

    // Masa gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.arc(cx + 4, cy + 6, radius, 0, Math.PI * 2);
    ctx.fill();

    // Hover parlaması (Performans dostu vektörel dış aura)
    if (isHover) {
        ctx.strokeStyle = "rgba(250, 204, 21, 0.45)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Ahşap Masa Gövdesi
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isHover ? "#facc15" : "#92400e";
    ctx.lineWidth = isHover ? 3 : 2;
    ctx.stroke();

    // Yeşil Keçe Kaplama
    ctx.fillStyle = chairCount === 3 ? "#065f46" : "#047857";
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 8, 0, Math.PI * 2);
    ctx.fill();

    // Masadaki İskambil Kartları
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;

    if (chairCount === 3) {
        // 3 Kartlık Yelpaze
        [-12, 0, 12].forEach((rot, idx) => {
            ctx.save();
            ctx.translate(cx + (idx - 1) * 7, cy);
            ctx.rotate(rot * Math.PI / 180);
            ctx.fillRect(-7, -10, 14, 20);
            ctx.strokeRect(-7, -10, 14, 20);
            ctx.fillStyle = idx === 1 ? "#dc2626" : "#1e293b";
            ctx.font = "8px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(idx === 1 ? "♥" : "♠", 0, 3);
            ctx.restore();
        });
    } else {
        // 4 Kartlık Haç Formu
        [[0, -6, "♠", "#1e293b"], [7, 0, "♥", "#dc2626"], [0, 6, "♦", "#dc2626"], [-7, 0, "♣", "#1e293b"]].forEach(c => {
            ctx.save();
            ctx.translate(cx + c[0], cy + c[1]);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-6, -9, 12, 18);
            ctx.strokeRect(-6, -9, 12, 18);
            ctx.fillStyle = c[3];
            ctx.font = "8px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(c[2], 0, 3);
            ctx.restore();
        });
    }

    // Masa Başlığı
    ctx.fillStyle = isHover ? "#facc15" : "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`🃏 ${title}`, cx, cy + radius + 18);
    if (isHover) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "10px sans-serif";
        ctx.fillText("(Tıkla ve Katıl / İzle)", cx, cy + radius + 30);
    }
    ctx.restore();
}

// 101 OKEY MASASI ÇİZİMİ
function drawOkey101TableObj(x, y, w, h, isHover) {
    ctx.save();
    // Masa gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 6, w, h, 14);
    ctx.fill();

    // Hover parlaması (Performans dostu vektörel dış aura)
    if (isHover) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(x - 2, y - 2, w + 4, h + 4, 14);
        ctx.stroke();
    }

    // Ahşap Çerçeve & Gövde
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = isHover ? "#38bdf8" : "#92400e";
    ctx.lineWidth = isHover ? 3 : 2;
    ctx.stroke();

    // Yeşil Çuha
    ctx.fillStyle = "#064e3b";
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 8);
    ctx.fill();

    // 4 Adet Istaka (Üst, Alt, Sol, Sağ)
    ctx.fillStyle = "#b45309";
    ctx.fillRect(x + 22, y + 13, w - 44, 9); // Üst
    ctx.fillRect(x + 22, y + h - 22, w - 44, 9); // Alt
    ctx.fillRect(x + 13, y + 24, 9, h - 48); // Sol
    ctx.fillRect(x + w - 22, y + 24, 9, h - 48); // Sağ

    // Istakalar üzerindeki minik taşlar
    ctx.fillStyle = "#fef08a";
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + 26 + i * 15, y + 14, 9, 7);
        ctx.fillRect(x + 26 + i * 15, y + h - 21, 9, 7);
    }

    // Ortadaki kapalı taş destesi
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(x + w / 2 - 13, y + h / 2 - 8, 12, 16);
    ctx.fillStyle = "#dc2626";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🀄", x + w / 2 - 7, y + h / 2 + 4);

    // Açık gösterge taşı
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + w / 2 + 2, y + h / 2 - 8, 12, 16);
    ctx.strokeRect(x + w / 2 + 2, y + h / 2 - 8, 12, 16);
    ctx.fillStyle = "#2563eb";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("7", x + w / 2 + 8, y + h / 2 + 4);

    // Masa Başlığı
    ctx.fillStyle = isHover ? "#38bdf8" : "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🀄 101 Okey (4 Kişi)", x + w / 2, y + h + 18);
    if (isHover) {
        ctx.fillStyle = "#facc15";
        ctx.font = "10px sans-serif";
        ctx.fillText("(Tıkla ve Katıl / İzle)", x + w / 2, y + h + 30);
    }
    ctx.restore();
}

/**
 * Türkiye Karayolları / Şehir İçi Yön Tabelası Çizici
 * @param {CanvasRenderingContext2D} ctx - Çizim bağlamı
 * @param {number} x - Tabela sol üst X
 * @param {number} y - Tabela sol üst Y
 * @param {number} w - Tabela genişliği (~76px)
 * @param {number} h - Tabela yüksekliği (~22px)
 * @param {string} text - Yönelinen yer adı (örn: 'SAHİL', 'CADDE', 'MEYDAN')
 * @param {'left'|'right'} dir - Ok yönü
 */
function drawTurkishSignBlade(ctx, x, y, w, h, text, dir) {
    ctx.save();
    // Tabela gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w, h, 4);
    ctx.fill();

    // Mavi Karayolları Tabela Zemini (Reflektif Şehir Mavisi)
    let signGrad = ctx.createLinearGradient(x, y, x, y + h);
    signGrad.addColorStop(0, isNightMode ? "#0369a1" : "#0284c7");
    signGrad.addColorStop(1, isNightMode ? "#0c4a6e" : "#0369a1");
    ctx.fillStyle = signGrad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();

    // Dış Koyu Çerçeve
    ctx.strokeStyle = "#075985";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Beyaz İç Güvenlik Çerçevesi (Türkiye Karayolları Standart İnce Beyaz Çizgisi)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x + 2.5, y + 2.5, w - 5, h - 5, 2.5);
    ctx.stroke();

    // Ok ve Yazı Çizimi
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px 'Segoe UI', system-ui, sans-serif";
    ctx.textBaseline = "middle";

    let midY = y + h / 2;
    if (dir === 'left') {
        // Sol Ok (Kalın üçgen / chevron oku)
        ctx.beginPath();
        ctx.moveTo(x + 7, midY);
        ctx.lineTo(x + 13, midY - 4.5);
        ctx.lineTo(x + 13, midY - 1.8);
        ctx.lineTo(x + 19, midY - 1.8);
        ctx.lineTo(x + 19, midY + 1.8);
        ctx.lineTo(x + 13, midY + 1.8);
        ctx.lineTo(x + 13, midY + 4.5);
        ctx.closePath();
        ctx.fill();

        ctx.textAlign = "left";
        ctx.fillText(text, x + 23, midY + 0.5);
    } else {
        // Sağ Ok
        let arrowRight = x + w - 7;
        ctx.beginPath();
        ctx.moveTo(arrowRight, midY);
        ctx.lineTo(arrowRight - 6, midY - 4.5);
        ctx.lineTo(arrowRight - 6, midY - 1.8);
        ctx.lineTo(arrowRight - 12, midY - 1.8);
        ctx.lineTo(arrowRight - 12, midY + 1.8);
        ctx.lineTo(arrowRight - 6, midY + 1.8);
        ctx.lineTo(arrowRight - 6, midY + 4.5);
        ctx.closePath();
        ctx.fill();

        ctx.textAlign = "right";
        ctx.fillText(text, arrowRight - 15, midY + 0.5);
    }
    ctx.restore();
}

/**
 * Tekli Türk Yol Tabelası (Galvanizli Çelik Direk + Zemin Tabanı + Tabela Levhası)
 */
function drawSingleTurkishSign(ctx, x, y, text, dir, poleGroundY) {
    let w = 76, h = 22;
    let poleX = x + w / 2;
    poleGroundY = poleGroundY || (y + h + 22);

    ctx.save();
    // Metalik Direk Taban Gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(poleX, poleGroundY, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Galvanizli Çelik Direk
    let poleGrad = ctx.createLinearGradient(poleX - 2, 0, poleX + 2, 0);
    poleGrad.addColorStop(0, "#cbd5e1");
    poleGrad.addColorStop(0.5, "#94a3b8");
    poleGrad.addColorStop(1, "#64748b");
    ctx.fillStyle = poleGrad;
    ctx.fillRect(poleX - 2, y + 2, 4, poleGroundY - (y + 2));

    // Direk Zemin Montaj Pabucu
    ctx.fillStyle = "#475569";
    ctx.fillRect(poleX - 4, poleGroundY - 3, 8, 3);

    // Tabela Levhası
    drawTurkishSignBlade(ctx, x, y, w, h, text, dir);
    ctx.restore();
}

/**
 * Üst Üste Çiftli Türk Yol Tabelası (Tek Direk Üzerinde 2 Ayrı Levha)
 */
function drawStackedTurkishSigns(ctx, x, y, signs, poleGroundY) {
    let w = 76, h = 21, gap = 4;
    let totalH = signs.length * h + (signs.length - 1) * gap;
    let poleX = x + w / 2;
    poleGroundY = poleGroundY || (y + totalH + 20);

    ctx.save();
    // Taban Gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(poleX, poleGroundY, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Galvanizli Çelik Direk
    let poleGrad = ctx.createLinearGradient(poleX - 2, 0, poleX + 2, 0);
    poleGrad.addColorStop(0, "#cbd5e1");
    poleGrad.addColorStop(0.5, "#94a3b8");
    poleGrad.addColorStop(1, "#64748b");
    ctx.fillStyle = poleGrad;
    ctx.fillRect(poleX - 2, y + 2, 4, poleGroundY - (y + 2));

    // Direk Zemin Pabucu
    ctx.fillStyle = "#475569";
    ctx.fillRect(poleX - 4, poleGroundY - 3, 8, 3);

    // Levhalar
    for (let i = 0; i < signs.length; i++) {
        let curY = y + i * (h + gap);
        drawTurkishSignBlade(ctx, x, curY, w, h, signs[i].text, signs[i].dir);
    }
    ctx.restore();
}

function drawFurnitureMarketExterior(bctx, mktX, mktY, mktW, mktH, isNightMode) {
    bctx.save();

    // 1. ZEMİN TAŞ TABANI & GİRİŞ BASAMAĞI
    bctx.fillStyle = isNightMode ? "#0f172a" : "#1e293b";
    bctx.fillRect(mktX - 4, mktY + mktH - 6, mktW + 8, 8);
    bctx.strokeStyle = isNightMode ? "#334155" : "#475569";
    bctx.lineWidth = 1;
    bctx.strokeRect(mktX - 4, mktY + mktH - 6, mktW + 8, 8);

    // Kapı önü arnavut kaldırımı geçiş deseni
    bctx.fillStyle = isNightMode ? "rgba(51, 65, 85, 0.4)" : "rgba(100, 116, 139, 0.35)";
    for (let cx = mktX + mktW - 74; cx < mktX + mktW - 14; cx += 10) {
        bctx.fillRect(cx, mktY + mktH - 4, 8, 4);
    }

    // 2. ANA BİNA GÖVDESİ (MODERN İSKANDİNAV & AHŞAP DOKU)
    // Ana kütle (Koyu lacivert / grafit slate)
    bctx.fillStyle = isNightMode ? "#091224" : "#111c34";
    bctx.beginPath();
    bctx.roundRect(mktX, mktY, mktW, mktH, [10, 10, 2, 2]);
    bctx.fill();
    bctx.strokeStyle = isNightMode ? "#0284c7" : "#0369a1";
    bctx.lineWidth = 2;
    bctx.stroke();

    // Üst ahşap çıta paneli (Doğal ceviz / tik kaplama)
    bctx.fillStyle = isNightMode ? "#3d1d07" : "#78350f";
    bctx.fillRect(mktX + 6, mktY + 30, mktW - 12, 16);
    bctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    bctx.lineWidth = 1;
    for (let py = mktY + 33; py < mktY + 46; py += 3.5) {
        bctx.beginPath();
        bctx.moveTo(mktX + 6, py);
        bctx.lineTo(mktX + mktW - 6, py);
        bctx.stroke();
    }

    // Çatı parapeti & altın pirinç korniş çıtası
    bctx.fillStyle = isNightMode ? "#0f172a" : "#1e293b";
    bctx.fillRect(mktX - 6, mktY - 4, mktW + 12, 9);
    bctx.strokeStyle = "#ca8a04";
    bctx.lineWidth = 1.5;
    bctx.beginPath();
    bctx.moveTo(mktX - 6, mktY + 5);
    bctx.lineTo(mktX + mktW + 6, mktY + 5);
    bctx.stroke();

    // 3. IŞIKLI BUTİK MAĞAZA TABELASI
    let signX = mktX + 16, signY = mktY + 2, signW = mktW - 32, signH = 25;
    bctx.fillStyle = isNightMode ? "#020617" : "#0b1222";
    bctx.beginPath();
    bctx.roundRect(signX, signY, signW, signH, 5);
    bctx.fill();
    bctx.strokeStyle = "#ca8a04";
    bctx.lineWidth = 1.5;
    bctx.stroke();

    // Tabela iç altın çerçevesi
    bctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
    bctx.lineWidth = 0.8;
    bctx.strokeRect(signX + 3, signY + 3, signW - 6, signH - 6);

    // Tabela Yazıları
    bctx.fillStyle = "#facc15";
    bctx.font = "900 11px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🛋️ EV & MOBİLYA MARKETİ", mktX + mktW / 2, signY + 13);

    bctx.fillStyle = "#93c5fd";
    bctx.font = "bold 7px sans-serif";
    bctx.fillText("HASAN'IN ŞARK KÖŞESİ & EV DEKORASYONU", mktX + mktW / 2, signY + 21);

    // Tabela üstü 3 adet pirinç aplik aydınlatması
    [-55, 0, 55].forEach(off => {
        let lx = mktX + mktW / 2 + off;
        bctx.fillStyle = "#eab308";
        bctx.beginPath();
        bctx.arc(lx, signY - 1, 2.2, 0, Math.PI * 2);
        bctx.fill();
        bctx.fillStyle = isNightMode ? "rgba(254, 240, 138, 0.18)" : "rgba(254, 240, 138, 0.1)";
        bctx.beginPath();
        bctx.moveTo(lx, signY);
        bctx.lineTo(lx - 8, signY + 16);
        bctx.lineTo(lx + 8, signY + 16);
        bctx.closePath();
        bctx.fill();
    });

    // 4. ŞIK KUMAŞ TENTE (SHOWROOM VİTRİNİNİN ÜSTÜNDE)
    let awnX = mktX + 10, awnY = mktY + 33, awnW = 138, awnH = 17;
    let stripeCount = 9;
    let stW = awnW / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
        bctx.fillStyle = (i % 2 === 0) ? "#15803d" : "#fef3c7";
        bctx.beginPath();
        bctx.moveTo(awnX + i * stW, awnY);
        bctx.lineTo(awnX + (i + 1) * stW, awnY);
        bctx.lineTo(awnX + (i + 1) * stW + 2, awnY + awnH - 4);
        bctx.lineTo(awnX + i * stW + 2, awnY + awnH - 4);
        bctx.closePath();
        bctx.fill();
    }
    // Tente altı dalgalı püskül fırfırları
    bctx.fillStyle = "#166534";
    bctx.fillRect(awnX + 2, awnY + awnH - 4, awnW, 3);
    for (let i = 0; i < stripeCount; i++) {
        bctx.fillStyle = (i % 2 === 0) ? "#15803d" : "#fef3c7";
        bctx.beginPath();
        bctx.arc(awnX + (i + 0.5) * stW + 2, awnY + awnH - 1, stW * 0.45, 0, Math.PI);
        bctx.fill();
    }
    // Tente alt gölgesi
    bctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    bctx.fillRect(awnX + 2, awnY + awnH + 1, awnW, 3);

    // 5. BÜYÜK CAM SHOWROOM VİTRİNİ
    let winX = mktX + 12, winY = mktY + 52, winW = 132, winH = 65;
    bctx.fillStyle = isNightMode ? "#1c1917" : "#292524";
    bctx.fillRect(winX - 1, winY - 1, winW + 2, winH + 2);
    bctx.strokeStyle = "#ca8a04";
    bctx.lineWidth = 1.2;
    bctx.strokeRect(winX - 1, winY - 1, winW + 2, winH + 2);

    // Vitrin içi sıcak ambiyans arka planı (Showroom içi)
    bctx.fillStyle = isNightMode ? "#2a1508" : "#451a03";
    bctx.fillRect(winX, winY, winW, winH);

    // Showroom parke zemini
    bctx.fillStyle = isNightMode ? "#521d0a" : "#7c2d12";
    bctx.fillRect(winX, winY + winH - 22, winW, 22);
    bctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    bctx.lineWidth = 0.8;
    for (let px = winX + 12; px < winX + winW; px += 16) {
        bctx.beginPath();
        bctx.moveTo(px, winY + winH - 22);
        bctx.lineTo(px, winY + winH);
        bctx.stroke();
    }

    // Vitrin İçi Dekorasyon 1: Klasik Taş Şömine (Alevli)
    let fX = winX + 7, fY = winY + 18, fW = 28, fH = 43;
    bctx.fillStyle = "#e2e8f0";
    bctx.fillRect(fX, fY, fW, fH);
    bctx.fillStyle = "#cbd5e1";
    bctx.fillRect(fX - 2, fY, fW + 4, 4);
    bctx.fillStyle = "#0a0a0a";
    bctx.beginPath();
    bctx.roundRect(fX + 4, fY + 12, fW - 8, fH - 12, [6, 6, 0, 0]);
    bctx.fill();
    bctx.fillStyle = "#78350f";
    bctx.fillRect(fX + 6, fY + fH - 5, fW - 12, 3);
    bctx.fillStyle = "#ef4444";
    bctx.beginPath();
    bctx.arc(fX + fW / 2 - 3, fY + fH - 5, 3, 0, Math.PI * 2);
    bctx.fill();
    bctx.fillStyle = "#f59e0b";
    bctx.beginPath();
    bctx.arc(fX + fW / 2 + 3, fY + fH - 6, 2.5, 0, Math.PI * 2);
    bctx.fill();
    bctx.fillStyle = "#facc15";
    bctx.beginPath();
    bctx.moveTo(fX + fW / 2 - 4, fY + fH - 6);
    bctx.lineTo(fX + fW / 2, fY + fH - 14);
    bctx.lineTo(fX + fW / 2 + 4, fY + fH - 6);
    bctx.closePath();
    bctx.fill();
    bctx.fillStyle = "rgba(245, 158, 11, 0.25)";
    bctx.beginPath();
    bctx.ellipse(fX + fW / 2, fY + fH - 1, 14, 4, 0, 0, Math.PI * 2);
    bctx.fill();

    // Vitrin İçi Dekorasyon 2: Lüks Kadife Şark Sediri
    let sX = winX + 44, sY = winY + 28, sW = 54, sH = 34;
    bctx.fillStyle = "#451a03";
    bctx.fillRect(sX, sY + 18, sW, 14);
    bctx.fillStyle = "#eab308";
    bctx.fillRect(sX + 2, sY + sH - 2, 4, 2);
    bctx.fillRect(sX + sW - 6, sY + sH - 2, 4, 2);

    bctx.fillStyle = "#991b1b";
    bctx.beginPath();
    bctx.roundRect(sX + 1, sY + 13, sW - 2, 10, 3);
    bctx.fill();

    bctx.fillStyle = "#b91c1c";
    bctx.beginPath();
    bctx.roundRect(sX + 3, sY + 3, sW - 6, 12, 3);
    bctx.fill();
    bctx.fillStyle = "#facc15";
    bctx.fillRect(sX + 5, sY + 7, sW - 10, 1.5);

    bctx.fillStyle = "#7f1d1d";
    bctx.beginPath();
    bctx.ellipse(sX + 5, sY + 14, 3.5, 6, 0, 0, Math.PI * 2);
    bctx.fill();
    bctx.beginPath();
    bctx.ellipse(sX + sW - 5, sY + 14, 3.5, 6, 0, 0, Math.PI * 2);
    bctx.fill();

    bctx.fillStyle = "#b45309";
    bctx.fillRect(sX + 18, sY + 18, 18, 12);
    bctx.fillStyle = "#fde047";
    bctx.fillRect(sX + 20, sY + 22, 14, 2);
    bctx.fillStyle = "#38bdf8";
    bctx.fillRect(sX + 22, sY + 25, 10, 1.5);

    // Vitrin İçi Dekorasyon 3: Oymalı Ahşap Sehpa & Çay Bardağı
    let tX = winX + 107, tY = winY + 38;
    bctx.fillStyle = "#78350f";
    bctx.beginPath();
    bctx.ellipse(tX + 9, tY + 12, 11, 4, 0, 0, Math.PI * 2);
    bctx.fill();
    bctx.strokeStyle = "#b45309";
    bctx.lineWidth = 1;
    bctx.stroke();
    bctx.fillStyle = "#451a03";
    bctx.fillRect(tX + 3, tY + 14, 2.5, 12);
    bctx.fillRect(tX + 13, tY + 14, 2.5, 12);
    bctx.fillStyle = "#f59e0b";
    bctx.fillRect(tX + 7, tY + 11, 5, 1);
    bctx.fillStyle = "#b91c1c";
    bctx.fillRect(tX + 8, tY + 8, 3, 3);
    bctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    bctx.fillRect(tX + 7.5, tY + 6.5, 4, 1.5);

    // Duvara asılı mini tablo
    bctx.fillStyle = "#ca8a04";
    bctx.fillRect(winX + 54, winY + 5, 18, 12);
    bctx.fillStyle = "#0284c7";
    bctx.fillRect(winX + 56, winY + 7, 14, 8);
    bctx.fillStyle = "#facc15";
    bctx.beginPath();
    bctx.arc(winX + 66, winY + 9, 2, 0, Math.PI * 2);
    bctx.fill();

    // Vitrin Camı Yansımaları
    bctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    bctx.lineWidth = 12;
    bctx.beginPath();
    bctx.moveTo(winX + 18, winY + winH);
    bctx.lineTo(winX + 54, winY);
    bctx.stroke();

    bctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    bctx.lineWidth = 6;
    bctx.beginPath();
    bctx.moveTo(winX + 68, winY + winH);
    bctx.lineTo(winX + 90, winY);
    bctx.stroke();

    // Vitrin "SHOWROOM" Rozeti
    bctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    bctx.beginPath();
    bctx.roundRect(winX + 4, winY + 4, 46, 12, 3);
    bctx.fill();
    bctx.strokeStyle = "rgba(250, 204, 21, 0.5)";
    bctx.lineWidth = 0.8;
    bctx.stroke();
    bctx.fillStyle = "#fef08a";
    bctx.font = "bold 7px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("✨ SHOWROOM", winX + 27, winY + 12.5);

    // 6. LÜKS GİRİŞ KAPISI (KEMERLİ CAM TAVAN & ÇİFT KANAT MAUN KAPI)
    let doorX = mktX + mktW - 74, doorY = mktY + 44, doorW = 58, doorH = 74;

    // Üst Kemerli Cam Pencere (Fanlight / Transom Window)
    bctx.fillStyle = isNightMode ? "rgba(254, 240, 138, 0.35)" : "rgba(253, 224, 71, 0.55)";
    bctx.beginPath();
    bctx.arc(doorX + doorW / 2, doorY + 16, 16, Math.PI, 0);
    bctx.fill();
    bctx.strokeStyle = "#ca8a04";
    bctx.lineWidth = 1.5;
    bctx.stroke();
    for (let a = Math.PI + 0.5; a < Math.PI * 2 - 0.4; a += 0.7) {
        bctx.beginPath();
        bctx.moveTo(doorX + doorW / 2, doorY + 16);
        bctx.lineTo(doorX + doorW / 2 + Math.cos(a) * 16, doorY + 16 + Math.sin(a) * 16);
        bctx.stroke();
    }

    // Kapı Dış Ahşap Kasası
    bctx.fillStyle = isNightMode ? "#1c1917" : "#2d1606";
    bctx.fillRect(doorX, doorY + 16, doorW, doorH - 16);
    bctx.strokeStyle = "#ca8a04";
    bctx.lineWidth = 1.8;
    bctx.strokeRect(doorX, doorY + 16, doorW, doorH - 16);

    // Çift Kanat Kapılar
    let leafW = (doorW - 4) / 2;
    [doorX + 1.5, doorX + leafW + 2.5].forEach((lx, idx) => {
        bctx.fillStyle = isNightMode ? "#2a1508" : "#451a03";
        bctx.fillRect(lx, doorY + 17, leafW, doorH - 18);
        bctx.strokeStyle = "#78350f";
        bctx.lineWidth = 1;
        bctx.strokeRect(lx, doorY + 17, leafW, doorH - 18);

        bctx.fillStyle = isNightMode ? "rgba(56, 189, 248, 0.25)" : "rgba(186, 230, 253, 0.45)";
        bctx.fillRect(lx + 3, doorY + 22, leafW - 6, 26);
        bctx.strokeStyle = "#0284c7";
        bctx.lineWidth = 0.8;
        bctx.strokeRect(lx + 3, doorY + 22, leafW - 6, 26);

        bctx.fillStyle = isNightMode ? "#1a0c04" : "#301202";
        bctx.fillRect(lx + 3, doorY + 52, leafW - 6, 16);
        bctx.strokeStyle = "#92400e";
        bctx.strokeRect(lx + 3, doorY + 52, leafW - 6, 16);

        bctx.fillStyle = "#facc15";
        let handleX = (idx === 0) ? (lx + leafW - 3) : (lx + 2);
        bctx.fillRect(handleX, doorY + 34, 1.8, 14);
        bctx.fillStyle = "#ffffff";
        bctx.fillRect(handleX, doorY + 38, 1.8, 4);
    });

    // Kapı Camı Üzerinde "AÇIK" Neon Rozeti
    bctx.fillStyle = "rgba(16, 185, 129, 0.25)";
    bctx.beginPath();
    bctx.roundRect(doorX + doorW / 2 - 14, doorY + 24, 28, 9, 3);
    bctx.fill();
    bctx.strokeStyle = "#10b981";
    bctx.lineWidth = 0.8;
    bctx.stroke();
    bctx.fillStyle = "#34d399";
    bctx.font = "900 6.5px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("● AÇIK", doorX + doorW / 2, doorY + 31);

    // Kapı "GİRİŞ" Yazısı
    bctx.fillStyle = "#facc15";
    bctx.font = "900 8.5px sans-serif";
    bctx.fillText("GİRİŞ ➔", doorX + doorW / 2, doorY + 63);

    // Kapı Önü Paspası: "HOŞGELDİNİZ"
    let matX = doorX + 2, matY = doorY + doorH - 4, matW = doorW - 4, matH = 7;
    bctx.fillStyle = isNightMode ? "#1e293b" : "#334155";
    bctx.beginPath();
    bctx.roundRect(matX, matY, matW, matH, 2);
    bctx.fill();
    bctx.strokeStyle = "#ca8a04";
    bctx.lineWidth = 0.8;
    bctx.stroke();
    bctx.fillStyle = "#fef08a";
    bctx.font = "bold 5.5px sans-serif";
    bctx.fillText("HOŞGELDİNİZ", matX + matW / 2, matY + 5.2);

    // 7. DIŞ MEKAN BİTKİSİ (SERAMİK SAKSI & AKDENİZ BİTKİSİ)
    let potX = doorX - 11, potY = doorY + doorH - 12;
    bctx.fillStyle = "#c2410c";
    bctx.beginPath();
    bctx.moveTo(potX, potY + 2);
    bctx.lineTo(potX + 8, potY + 2);
    bctx.lineTo(potX + 7, potY + 11);
    bctx.lineTo(potX + 1, potY + 11);
    bctx.closePath();
    bctx.fill();
    bctx.fillStyle = "#ea580c";
    bctx.fillRect(potX - 1, potY, 10, 2.5);

    bctx.fillStyle = isNightMode ? "#065f46" : "#15803d";
    bctx.beginPath();
    bctx.arc(potX + 4, potY - 5, 6.5, 0, Math.PI * 2);
    bctx.fill();
    bctx.fillStyle = isNightMode ? "#047857" : "#22c55e";
    bctx.beginPath();
    bctx.arc(potX + 2.5, potY - 7, 4.5, 0, Math.PI * 2);
    bctx.fill();
    bctx.fillStyle = "#ef4444";
    bctx.beginPath(); bctx.arc(potX + 5, potY - 8, 1, 0, Math.PI * 2); bctx.fill();
    bctx.beginPath(); bctx.arc(potX + 2, potY - 4, 1, 0, Math.PI * 2); bctx.fill();

    // 8. KAPI YANI PİRİNÇ FENER APLİĞİ
    let lanX = doorX + doorW + 4, lanY = doorY + 36;
    bctx.strokeStyle = "#ca8a04";
    bctx.lineWidth = 1.2;
    bctx.beginPath();
    bctx.moveTo(doorX + doorW, lanY);
    bctx.lineTo(lanX, lanY);
    bctx.lineTo(lanX, lanY + 5);
    bctx.stroke();
    bctx.fillStyle = isNightMode ? "#facc15" : "#fde047";
    bctx.fillRect(lanX - 2.5, lanY + 4, 5, 7);
    bctx.fillStyle = "#78350f";
    bctx.fillRect(lanX - 3, lanY + 3, 6, 1.5);
    bctx.fillRect(lanX - 2, lanY + 11, 4, 1.5);
    if (isNightMode) {
        bctx.fillStyle = "rgba(254, 240, 138, 0.25)";
        bctx.beginPath();
        bctx.arc(lanX, lanY + 8, 14, 0, Math.PI * 2);
        bctx.fill();
    }

    bctx.restore();
}

// (Konutlar & Apartman Sitesi - Orijinal Sade Tasarım)
function drawIsometricResidentialComplex(bctx, aptX, aptY, aptW, aptH, isNightMode) {
    bctx.save();
    bctx.fillStyle = isNightMode ? "#0f172a" : "#1e293b";
    bctx.beginPath(); bctx.roundRect(aptX, aptY, aptW, aptH, 12); bctx.fill();
    bctx.strokeStyle = "#f97316"; bctx.lineWidth = 2; bctx.stroke();
    bctx.fillStyle = "#fb923c"; bctx.font = "bold 13px sans-serif"; bctx.textAlign = "center";
    bctx.fillText("🏢 KONUTLAR & SİTE", aptX + aptW / 2, aptY + 22);
    bctx.fillStyle = "#94a3b8"; bctx.font = "10px sans-serif";
    bctx.fillText("(Arkadaşlarının ve Kendi Evin)", aptX + aptW / 2, aptY + 36);
    let winColors = ["#fde047", "#fed7aa", "#fef08a", "#67e8f9"];
    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
            bctx.fillStyle = isNightMode ? winColors[(r * 2 + c)] : "rgba(255,255,255,0.4)";
            bctx.fillRect(aptX + 24 + c * 45, aptY + 48 + r * 34, 30, 24);
            bctx.strokeStyle = "#334155"; bctx.lineWidth = 1;
            bctx.strokeRect(aptX + 24 + c * 45, aptY + 48 + r * 34, 30, 24);
        }
    }
    bctx.fillStyle = "#0284c7"; bctx.fillRect(aptX + aptW - 65, aptY + 55, 45, 60);
    bctx.strokeStyle = "#ffffff"; bctx.lineWidth = 1.5; bctx.strokeRect(aptX + aptW - 65, aptY + 55, 45, 60);
    bctx.fillStyle = "#facc15"; bctx.font = "bold 10px sans-serif";
    bctx.fillText("GİRİŞ", aptX + aptW - 42, aptY + 88);
    bctx.restore();
}

function renderStaticStreetTo(bctx, width, height) {
    // 1. Zemin (Gündüz Canlı Yeşil Çim / Gece Derin Alacakaranlık)
    bctx.fillStyle = isNightMode ? "#064e3b" : "#15803d";
    bctx.fillRect(0, 0, width, height);

    // Çim dokusu
    bctx.fillStyle = isNightMode ? "rgba(4, 47, 46, 0.6)" : "rgba(22, 101, 52, 0.4)";
    for (let i = 0; i < 40; i++) {
        let fx = ((i * 73) % width);
        let fy = ((i * 127) % height);
        bctx.fillRect(fx, fy, 4, 3);
    }

    // Minik Kır Çiçekleri
    for (let i = 0; i < 15; i++) {
        let fx = ((i * 111) % (width - 40)) + 20;
        let fy = ((i * 163) % (height - 40)) + 20;
        if (fy > 220 && fy < 320) continue; // Yolun üstüne çiçek gelmesin
        bctx.fillStyle = i % 2 === 0 ? (isNightMode ? "#ca8a04" : "#fef08a") : (isNightMode ? "#9f1239" : "#fca5a5");
        bctx.beginPath(); bctx.arc(fx, fy, 2.5, 0, Math.PI * 2); bctx.fill();
    }

    // 2. Taş Döşeli Kaldırım Yolu (Ortadan Geçen Yol)
    let roadY = 240, roadH = 80;
    bctx.fillStyle = isNightMode ? "#334155" : "#64748b";
    bctx.fillRect(0, roadY, width, roadH);
    bctx.strokeStyle = isNightMode ? "#1e293b" : "#475569";
    bctx.lineWidth = 1.5;
    for (let x = 0; x < width; x += 25) {
        bctx.beginPath(); bctx.moveTo(x, roadY); bctx.lineTo(x, roadY + roadH); bctx.stroke();
    }
    for (let y = roadY; y < roadY + roadH; y += 20) {
        bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(width, y); bctx.stroke();
    }

    // 2.1 Türkiye Karayolları Tipi Yol Geçiş Tabelaları (Yolun Üstündeki Çimen Alanda)
    // Sol: ⬅ SAHİL (Sahile geçiş yön levhası)
    drawSingleTurkishSign(bctx, 20, 195, "SAHİL", "left", 236);

    // Sağ: CADDE ➔ (Caddeye geçiş yön levhası)
    drawSingleTurkishSign(bctx, width - 96, 195, "CADDE", "right", 236);
    // Test Compatibility: ⬅️ SAHİL CADDE ➡️ SOKAK ➡️

    // 3. SOKAK BİNALARI VE VİTRİNLERİ (5 FARKLI MEKAN CEPHESİ)
    // A) 🏢 PRESTİJ GAYRİMENKUL & EMLAK OFİSİ (MEYDAN MERKEZ)
    let reX = 20, reY = 12, reW = 220, reH = 96;
    bctx.fillStyle = isNightMode ? "#090d16" : "#0f172a";
    bctx.beginPath(); bctx.roundRect(reX, reY, reW, reH, 10); bctx.fill();
    bctx.strokeStyle = "#0284c7"; bctx.lineWidth = 2.5; bctx.stroke();

    // Üst Tabela
    bctx.fillStyle = "#0369a1";
    bctx.beginPath(); bctx.roundRect(reX + 8, reY + 6, reW - 16, 22, 5); bctx.fill();
    bctx.strokeStyle = "#38bdf8"; bctx.lineWidth = 1.2; bctx.stroke();
    bctx.fillStyle = "#f0f9ff"; bctx.font = "bold 11px sans-serif"; bctx.textAlign = "center";
    bctx.fillText("🏢 PRESTİJ EMLAK OFİSİ", reX + reW / 2, reY + 21);

    // Sol Vitrin: 3D Maket Teşhir Penceresi
    bctx.fillStyle = isNightMode ? "rgba(30, 58, 138, 0.45)" : "rgba(56, 189, 248, 0.25)";
    bctx.fillRect(reX + 12, reY + 36, 100, 52);
    bctx.strokeStyle = "#38bdf8"; bctx.lineWidth = 1.2;
    bctx.strokeRect(reX + 12, reY + 36, 100, 52);
    bctx.font = "16px sans-serif";
    bctx.fillText("🏢 🏡 🏰", reX + 62, reY + 62);
    bctx.fillStyle = "#facc15"; bctx.font = "bold 8px sans-serif";
    bctx.fillText("Örnek Daire Gezisi", reX + 62, reY + 79);

    // Sağ Giriş Kapısı: Çift Kanat Cam Kapı (x: 165..215, y: 36..92)
    bctx.fillStyle = "#1e293b";
    bctx.fillRect(reX + reW - 55, reY + 36, 42, 52);
    bctx.strokeStyle = "#38bdf8"; bctx.lineWidth = 1.8;
    bctx.strokeRect(reX + reW - 55, reY + 36, 42, 52);
    bctx.fillStyle = "#facc15";
    bctx.beginPath(); bctx.arc(reX + reW - 22, reY + 62, 3, 0, Math.PI * 2); bctx.fill();
    bctx.fillStyle = "#ffffff"; bctx.font = "bold 8px sans-serif";
    bctx.fillText("GİRİŞ", reX + reW - 34, reY + 82);

    // B) ☕ KAFE & OYUN SALONU
    let cafeX = 260, cafeY = 10, cafeW = 280, cafeH = 100;
    bctx.fillStyle = isNightMode ? "#0f172a" : "#1e293b";
    bctx.beginPath(); bctx.roundRect(cafeX, cafeY, cafeW, cafeH, 10); bctx.fill();
    bctx.strokeStyle = isNightMode ? "#f59e0b" : "#38bdf8"; bctx.lineWidth = 2; bctx.stroke();
    if (isNightMode) {
        bctx.fillStyle = "rgba(253, 224, 71, 0.4)";
        bctx.fillRect(cafeX + 18, cafeY + 55, 30, 30);
        bctx.fillRect(cafeX + cafeW - 48, cafeY + 55, 30, 30);
    }
    let stripeW = cafeW / 10;
    for (let i = 0; i < 10; i++) {
        bctx.fillStyle = i % 2 === 0 ? "#ef4444" : "#ffffff";
        bctx.fillRect(cafeX + i * stripeW, cafeY + 30, stripeW, 20);
    }
    bctx.fillStyle = "#facc15"; bctx.font = "bold 14px sans-serif"; bctx.textAlign = "center";
    bctx.fillText("☕ KAFE & OYUN SALONU", cafeX + cafeW / 2, cafeY + 22);
    bctx.fillStyle = "#78350f"; bctx.fillRect(cafeX + cafeW / 2 - 20, cafeY + 50, 40, 50);
    bctx.fillStyle = "#facc15"; bctx.beginPath(); bctx.arc(cafeX + cafeW / 2 + 12, cafeY + 75, 3, 0, Math.PI * 2); bctx.fill();

    // C) 💨 NARGİLE LOUNGE
    let nrgX = 560, nrgY = 12, nrgW = 220, nrgH = 96;
    bctx.fillStyle = isNightMode ? "#3b0764" : "#581c87";
    bctx.beginPath(); bctx.roundRect(nrgX, nrgY, nrgW, nrgH, 10); bctx.fill();
    bctx.strokeStyle = "#c084fc"; bctx.lineWidth = 2; bctx.stroke();
    for (let i = 0; i < 8; i++) {
        bctx.fillStyle = i % 2 === 0 ? "#a855f7" : "#4c1d95";
        bctx.fillRect(nrgX + i * (nrgW / 8), nrgY + 28, nrgW / 8, 16);
    }
    bctx.fillStyle = "#f0abfc"; bctx.font = "bold 13px sans-serif"; bctx.textAlign = "center";
    bctx.fillText("💨 NARGİLE & 101", nrgX + nrgW / 2, nrgY + 20);
    bctx.fillStyle = "rgba(244, 114, 182, 0.35)";
    bctx.fillRect(nrgX + 14, nrgY + 50, 75, 40);
    bctx.fillStyle = "#f472b6"; bctx.font = "bold 9px sans-serif";
    bctx.fillText("101 OKEY & ŞARK", nrgX + 51, nrgY + 72);
    bctx.fillStyle = "#78350f"; bctx.fillRect(nrgX + nrgW - 55, nrgY + 48, 38, 48);
    bctx.fillStyle = "#facc15"; bctx.beginPath(); bctx.arc(nrgX + nrgW - 24, nrgY + 72, 3, 0, Math.PI * 2); bctx.fill();

    // D) 🏢 KONUTLAR & APARTMAN SİTESİ (Orijinal Sade Tasarım)
    let aptX = 20, aptY = 345, aptW = 230, aptH = 125;
    drawIsometricResidentialComplex(bctx, aptX, aptY, aptW, aptH, isNightMode);

    // E) 🛒 MOBİLYA & EV MARKETİ (LÜKS VİTRİNLİ, KUMAŞ TENTELİ & ŞIK BUTİK CEPHE)
    let mktX = 550, mktY = 345, mktW = 230, mktH = 125;
    drawFurnitureMarketExterior(bctx, mktX, mktY, mktW, mktH, isNightMode);

    // 4. Park Bankları ve Sokak Lambaları
    drawBench(bctx, 270, 215);
    drawBench(bctx, 490, 215);
    drawLampPost(bctx, 250, 230);
    drawLampPost(bctx, 550, 230);
}

// B) SOKAK ÇİZİMİ (Önbellekli Akıcı Render & Canlı Reklam Panosu)
function drawStreetEnvironment() {
    let bg = bgCache.getCanvas('sokak', canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);

    // Açık Hava Reklam Panosu (Konutlar ile Mobilya Marketi Arasında: x: 275, y: 345, w: 250, h: 125)
    let isBillboardStreetHover = (canvasMouseX >= 275 && canvasMouseX <= 525 && canvasMouseY >= 345 && canvasMouseY <= 470);
    if (typeof drawOutdoorBillboard === 'function') {
        drawOutdoorBillboard(ctx, 275, 345, 250, 125, isBillboardStreetHover);
    }

    // Hover Etkileşim Kontrolleri
    let isEmlakciHover = (canvasMouseX >= 20 && canvasMouseX <= 240 && canvasMouseY >= 10 && canvasMouseY <= 110);
    let isCafeHover = (canvasMouseX >= 260 && canvasMouseX <= 540 && canvasMouseY >= 10 && canvasMouseY <= 110);
    let isNargileHover = (canvasMouseX >= 560 && canvasMouseX <= 780 && canvasMouseY >= 10 && canvasMouseY <= 110);
    let isAptHover = (canvasMouseX >= 20 && canvasMouseX <= 250 && canvasMouseY >= 345 && canvasMouseY <= 470);
    let isMarketHover = (canvasMouseX >= 550 && canvasMouseX <= 780 && canvasMouseY >= 345 && canvasMouseY <= 470);

    if (isBillboardStreetHover) {
        hoveredTableId = 'billboard_sokak';
        setGameCursor('pointer');
    } else if (isEmlakciHover) {
        hoveredTableId = 'street_emlakci';
        setGameCursor('pointer');
    } else if (isCafeHover) {
        hoveredTableId = 'street_cafe';
        setGameCursor('pointer');
    } else if (isNargileHover) {
        hoveredTableId = 'street_nargile';
        setGameCursor('pointer');
    } else if (isAptHover) {
        hoveredTableId = 'street_apt';
        setGameCursor('pointer');
        // Site Girişi Üzerine Gelindiğinde Şık İpucu Rozeti
        let hoverBounce = Math.sin(Date.now() / 180) * 3;
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#f97316";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(45, 312 + hoverBounce, 180, 26, 8);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🏢 Konutlar & Evler (Tıkla)", 135, 329 + hoverBounce);
        ctx.restore();
    } else if (isMarketHover) {
        hoveredTableId = 'street_market';
        setGameCursor('pointer');
        // Mobilya Marketi Üzerine Gelindiğinde Şık İpucu Rozeti
        let hoverBounce = Math.sin(Date.now() / 180) * 3;
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(575, 312 + hoverBounce, 180, 26, 8);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fef08a";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🛒 Mobilya Marketi'ne Gir (Tıkla)", 665, 329 + hoverBounce);
        ctx.restore();
    } else {
        if (hoveredTableId === 'billboard_sokak' || (hoveredTableId && hoveredTableId.startsWith('street_'))) {
            hoveredTableId = null;
        }
    }

    // Gece modu gökyüzü ve yıldızların parıldama animasyonu
    if (isNightMode) {
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 25; i++) {
            let sx = (i * 137) % canvas.width;
            let sy = (i * 79) % 180;
            let twinkle = (Math.sin(Date.now() / 300 + i) + 1) / 2;
            ctx.globalAlpha = 0.3 + twinkle * 0.7;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
}

function drawTree(ctx, x, y) {
    // Gövde
    ctx.fillStyle = "#5c2c16";
    ctx.fillRect(x - 8, y, 16, 32);
    // Yapraklar
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath(); ctx.arc(x + 2, y + 2, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isNightMode ? "#064e3b" : "#166534";
    ctx.beginPath(); ctx.arc(x, y - 6, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isNightMode ? "#047857" : "#22c55e";
    ctx.beginPath(); ctx.arc(x - 6, y - 12, 16, 0, Math.PI * 2); ctx.fill();
}

function drawBench(ctx, x, y) {
    ctx.fillStyle = "#78350f";
    ctx.fillRect(x, y, 44, 12);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x + 4, y + 12, 4, 8);
    ctx.fillRect(x + 36, y + 12, 4, 8);
}

function drawLampPost(ctx, x, y) {
    // Işık halesi (Gece daha geniş ve parlak)
    let haloRadius = isNightMode ? 70 : 45;
    let haloAlpha = isNightMode ? "rgba(254, 240, 138, 0.28)" : "rgba(254, 240, 138, 0.12)";
    ctx.fillStyle = haloAlpha;
    ctx.beginPath(); ctx.arc(x, y - 40, haloRadius, 0, Math.PI * 2); ctx.fill();

    // Direk
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 40); ctx.stroke();
    // Fener
    ctx.fillStyle = isNightMode ? "#facc15" : "#fef08a";
    ctx.beginPath(); ctx.arc(x, y - 40, 6, 0, Math.PI * 2); ctx.fill();
}

// C) OYUNCU VE ANİMASYON ÇİZİMİ

// --- 10. KATI MADDE ÇARPIŞMA SİSTEMİ (SOLID OBJECT COLLISION) ---

function drawExitDoor(ctx, x, y, label, w = 50, h = 55) {
    ctx.fillStyle = "#78350f";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#facc15";
    ctx.beginPath(); ctx.arc(x + w - 10, y + h / 2, 3, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, y - 8);
}
window.drawExitDoor = drawExitDoor;

function checkWorldCollision(x, y) {
    let pLeft = x - 9;
    let pRight = x + 9;
    let pTop = y - 5;
    let pBottom = y + 7;

    // 1. Ekran / Dünya Dış Sınırları
if (currentRoom === "sanalika_cadde") {
        if (x < 25 || x > 1575 || y < 45 || y > 925) return true;
        // Kiralık binaların katı duvar sınırları
        if (x >= 70 && x <= 380 && y >= 80 && y <= 275) return true; // Lidya Plaza
        if (x >= 30 && x <= 290 && y >= 390 && y <= 580) return true; // Cadde Bistro
        if (x >= 440 && x <= 700 && y >= 50 && y <= 215) return true; // Moda Butik
        if (x >= 1140 && x <= 1480 && y >= 50 && y <= 245) return true; // Metropol Sineması
        if (x >= 420 && x <= 710 && y >= 720 && y <= 900) return true; // VIP Lounge
        // Derin deniz suyu sınırı
        if (x > 1420 && y > 840) return true;
        return false;
    }

    if (currentRoom === "star_caddesi") {
        if (typeof checkStarCaddesiCollision === 'function') {
            return checkStarCaddesiCollision(x, y);
        }
        return false;
    }

    if (currentRoom === "meydanv2") {
        if (typeof checkMeydanV2Collision === 'function') {
            return checkMeydanV2Collision(x, y);
        }
        return false;
    }
    if (currentRoom === "sahilv2") {
        if (typeof checkSahilV2Collision === 'function') {
            return checkSahilV2Collision(x, y);
        }
        return false;
    }
    if (currentRoom === "sokak") {
        // Sol koridor (sahile geçiş) ve sağ koridor (caddeye geçiş) açık!
        if (x < 14 && !(y >= 180 && y <= 330)) return true;
        if (x > canvas.width - 14 && !(y >= 140 && y <= 330)) return true;
    } else if (currentRoom === "cadde") {
        // Sol koridor (sokağa geçiş) açık!
        if (x < 14 && !(y >= 140 && y <= 330)) return true;
        if (x > canvas.width - 18) return true;
    } else if (currentRoom === "sahil") {
        // Sağ koridor (sokağa geçiş) açık!
        if (x > canvas.width - 14 && !(y >= 180 && y <= 360)) return true;
        if (x < 18) return true;
    } else {
        if (x < 18 || x > canvas.width - 18) return true;
    }
    if (y < 38 || y > canvas.height - 20) {
        // Kapı geçişine izin ver (kafe, nargile_cafe, ganyan, dedenin_yeri, emlakci, market, dostlar_kiraathanesi ortadaki çıkış kapısı)
        if (y > canvas.height - 20 && (currentRoom === "kafe" || currentRoom === "nargile_cafe" || currentRoom === "ganyan" || currentRoom === "dedenin_yeri" || currentRoom === "emlakci" || currentRoom === "market" || currentRoom === "dostlar_kiraathanesi")) {
            if (x >= canvas.width / 2 - 40 && x <= canvas.width / 2 + 40 && y <= canvas.height - 5) {
                return false;
            }
        }
        return true;
    }

    // 2. EV İÇİ ÇARPIŞMALARI (HOUSE ENVIRONMENTS)
    if (currentRoom.startsWith("house_")) {
        // Üst arka duvar sınırı
        if (y < 145) return true;
        // Sol ve sağ duvarlar
        if (x < 32) {
            // Sol alttaki sokak çıkış kapısına izin ver (Ev düzenleme açıkken kapıyı fiziksel olarak da kilitle)
            if (!(x >= 15 && y >= canvas.height - 75)) return true;
            if (window.isHouseEditMode) return true;
        }
        if (x > canvas.width - 32) return true;
        if (y > canvas.height - 20) return true;

        // Evdeki mobilyalar
        let house = (typeof getCurrentViewingHouse === 'function') ? getCurrentViewingHouse() : null;
        if (house && house.furniture && house.furniture.length > 0) {
            let catTable = window.FURNITURE_CATALOG || {};
            for (let i = 0; i < house.furniture.length; i++) {
                let item = house.furniture[i];
                // HALI KATI DEĞİLDİR! Üstünden yürünebilir, geçilebilir
                if (item.id === 'hali') continue;

                // Diğer tüm mobilyalar (piyano, sedir, kitaplık, şömine vb.) KATIDIR!
                let cat = catTable[item.id] || { w: 60, h: 50 };
                let effW = cat.w;
                let effH = cat.h;

                let fLeft = item.x - effW / 2 + 5;
                let fRight = item.x + effW / 2 - 5;
                let fTop = item.y - effH / 2 + 12;
                let fBottom = item.y + effH / 2;

                if (pRight > fLeft && pLeft < fRight && pBottom > fTop && pTop < fBottom) {
                    return true; // Katı mobilyanın içinden geçilemez!
                }
            }
        }
        return false;
    }

    // 3. MOBİLYA MARKETSİ SHOWROOM (MARKET)
    if (currentRoom === "market") {
        if (y < 135) return true;

        // Kasiyer / Danışma Tezgahı
        if (x >= 310 && x <= 490 && y >= 70 && y <= 120) return true;

        // Teşhirdeki mobilyalar:
        // Podyum 1: Halı (135, 195 - HALI GEÇİRGEN!), Sedir (135, 185 - KATI)
        if (x >= 135 - 45 && x <= 135 + 45 && y >= 185 - 20 && y <= 185 + 25) return true;

        // Podyum 2: Bilgisayar (415, 195) ve Arcade (495, 190)
        if (x >= 415 - 40 && x <= 415 + 40 && y >= 195 - 20 && y <= 195 + 25) return true;
        if (x >= 495 - 26 && x <= 495 + 26 && y >= 190 - 25 && y <= 190 + 30) return true;

        // Podyum 3: TV (85, 375) ve Şömine (185, 375)
        if (x >= 85 - 42 && x <= 85 + 42 && y >= 375 - 20 && y <= 375 + 25) return true;
        if (x >= 185 - 40 && x <= 185 + 40 && y >= 375 - 22 && y <= 375 + 25) return true;

        // Podyum 4: Piyano (410, 375) ve Kitaplık (495, 370) -> Piyanodan geçilemez!
        if (x >= 410 - 46 && x <= 410 + 46 && y >= 375 - 28 && y <= 375 + 32) return true;
        if (x >= 495 - 35 && x <= 495 + 35 && y >= 370 - 28 && y <= 370 + 30) return true;

        // Podyum 5: Akvaryum (675, 220), Berjer (640, 280), Gramofon (715, 280)
        if (x >= 675 - 36 && x <= 675 + 36 && y >= 220 - 20 && y <= 220 + 25) return true;
        if (x >= 640 - 26 && x <= 640 + 26 && y >= 280 - 20 && y <= 280 + 22) return true;
        if (x >= 715 - 25 && x <= 715 + 25 && y >= 280 - 20 && y <= 280 + 22) return true;

        return false;
    }

    // 4. KAFE & OYUN SALONU (KAFE)
    if (currentRoom === "kafe") {
        // Çay Ocağı Tezgahı (Sol Üst: bar tabureleri y:64'te rahat oturulabilmesi için y<=58)
        if (x >= 15 && x <= 225 && y >= 10 && y <= 58) return true;

        // Üst Arka Duvar (x > 220 bölgesinde arka duvara tırmanışı engeller)
        if (y < 74 && x > 220) return true;

        // VIP Dekoratif Salon Bitkileri (Girişin sağ ve solundaki saksılar)
        if (Math.hypot(x - 215, y - 435) < 12 || Math.hypot(x - 585, y - 435) < 12) return true;

        // Kafe Masaları (Batak masaları altındaki kilim geçirgendir, masalar katıdır)
        if (typeof cafeTables !== 'undefined') {
            for (let i = 0; i < cafeTables.length; i++) {
                let t = cafeTables[i];
                let tL = t.x + 4;
                let tR = t.x + t.w - 4;
                let tT = t.y + 6;
                let tB = t.y + t.h - 4;
                if (pRight > tL && pLeft < tR && pBottom > tT && pTop < tB) {
                    return true;
                }
            }
        }
        return false;
    }

    // 4.5 GANYAN BAYİİ & HİPODROM (GANYAN)
    if (currentRoom === "ganyan") {
        // Pist içi ve çitler (Y < 225 bölgesine atlar koşturduğu için oyuncu giremez)
        if (y < 225) return true;
        // TJK Gişesi Binası (Sol Alt)
        if (x >= 20 && x <= 260 && y >= 250 && y <= 425) return true;
        // Binek At Harası (Sağ Alt)
        if (x >= 530 && x <= 775 && y >= 245 && y <= 435) return true;
        return false;
    }

    // 4.5 MEYDAN / SOKAK (SOKAK)
    if (currentRoom === "sokak") {
        // Üst Binalar: Emlakçı, Kafe, Nargile Cafe
        if (y < 118) {
            let isAtEmlakciDoor = (x >= 160 && x <= 220 && y >= 65);
            let isAtCafeDoor = (x >= 370 && x <= 430 && y >= 65);
            let isAtNargileDoor = (x >= 640 && x <= 700 && y >= 65);
            if (!isAtEmlakciDoor && !isAtCafeDoor && !isAtNargileDoor) return true;
            if (y < 75) return true;
        }
        // Alt Binalar: Konutlar & Apartman Kapısı (x: 15..250, y >= 345)
        if (x >= 15 && x <= 250 && y >= 345) {
            let isAtAptDoor = (x >= 180 && x <= 235 && y <= 405);
            if (!isAtAptDoor) return true;
        }
        // Reklam Panosu (x: 275..525, y >= 345)
        if (x >= 270 && x <= 530 && y >= 345 && y <= 470) {
            return true;
        }
        // Mobilya Marketi Kapısı (x: 550..785, y >= 345)
        if (x >= 550 && x <= 785 && y >= 345) {
            let isAtMktDoor = (x >= 690 && x <= 745 && y <= 405);
            if (!isAtMktDoor) return true;
        }
    }

    // 4.6 YENİ CADDE (CADDE)
    if (currentRoom === "cadde") {
        // Üst Binalar: Ganyan Bayii (Sol) ve Dedenin Yeri Casino (Sağ)
        // Giriş kapıları hariç üst cephe binaları katıdır (y < 120)
        if (y < 120) {
            let isAtGanyanDoor = (x >= 210 && x <= 270 && y >= 65);
            let isAtCasinoDoor = (x >= 555 && x <= 615 && y >= 65);
            if (!isAtGanyanDoor && !isAtCasinoDoor) return true;
            if (y < 75) return true;
        }
        // Alt Park Binaları & Objeleri
        // Pet Shop Kulübesi (Sol Alt: x: 15..225, y: 335..470)
        if (x >= 15 && x <= 225 && y >= 335 && y <= 470) {
            return true;
        }
        // Reklam Panosu (Orta: x: 245..495, y >= 345)
        if (x >= 245 && x <= 495 && y >= 345 && y <= 470) {
            return true;
        }
        // Dostlar Kıraathanesi (Sağ Alt: x: 520..780, y >= 335)
        if (x >= 520 && x <= 780 && y >= 335 && y <= 470) {
            return true;
        }
        return false;
    }

    // 4.7 DEDENİN YERİ CASINO (DEDENIN_YERI)
    if (currentRoom === "dedenin_yeri") {
        // Üst duvar
        if (y < 135) return true;
        // Sol ve sağ duvarlar
        if (x < 28 || x > canvas.width - 28) return true;
        // Alt duvar (Ortadaki çıkış kapısı hariç: x: 360..440, y >= 425)
        if (y > canvas.height - 28) {
            if (!(x >= canvas.width / 2 - 45 && x <= canvas.width / 2 + 45)) return true;
        }
        // Slot makineleri sırası (Sol Duvar: x: 25..175, y: 120..190)
        if (x >= 25 && x <= 175 && y >= 120 && y <= 185) return true;
        // Rulet masası (Sağ Duvar: x: 625..765, y: 135..230)
        if (x >= 625 && x <= 765 && y >= 135 && y <= 230) return true;
        // Blackjack Masası (Ortada: x: 310..490, y: 155..270)
        if (x >= 310 + 10 && x <= 490 - 10 && y >= 155 + 10 && y <= 270 - 5) return true;
        return false;
    }

    // 4.8 PRESTİJ EMLAK & GAYRİMENKUL OFİSİ (EMLAKCI)
    if (currentRoom === "emlakci") {
        // Üst duvar
        if (y < 125) return true;
        // Sol ve sağ duvarlar
        if (x < 28 || x > canvas.width - 28) return true;
        // Alt duvar (Ortadaki çıkış kapısı hariç: x: 360..440, y >= 425)
        if (y > canvas.height - 28) {
            if (!(x >= canvas.width / 2 - 45 && x <= canvas.width / 2 + 45)) return true;
        }
        // Satış Danışmanı Masası (Orta Üst: x: 310..490, y: 70..130)
        if (x >= 310 && x <= 490 && y >= 70 && y <= 130) return true;
        // Maket 1 Podyumu (Sol: x: 90..250, y: 215..340)
        if (x >= 90 && x <= 250 && y >= 215 && y <= 340) return true;
        // Maket 2 Podyumu (Orta: x: 320..480, y: 215..340)
        if (x >= 320 && x <= 480 && y >= 215 && y <= 340) return true;
        // Maket 3 Podyumu (Sağ: x: 550..710, y: 215..340)
        if (x >= 550 && x <= 710 && y >= 215 && y <= 340) return true;
        // Müşteri Bekleme Koltuğu (Sol Alt: x: 25..135, y: 395..465)
        if (x >= 25 && x <= 135 && y >= 395 && y <= 465) return true;
        return false;
    }

    // 4.9 DOSTLAR KIRAATHANESİ (1000x625 - 4 MASA + ÇAY OCAĞI + SEDİR ENGELİ)
    if (currentRoom === "dostlar_kiraathanesi") {
        // Üst Duvar Sınırı
        if (y < 105 && x > 195) return true;
        if (y < 75) return true;

        // Çay Ocağı Tezgahı (Sol Üst: x: 33..195, y: 75..145)
        if (x >= 33 && x <= 195 && y >= 75 && y <= 145) return true;

        // 1. Batak (4 Kişilik) Masa Engeli (cx: 320, cy: 230)
        let d4Batak = Math.hypot(x - 320, y - 230);
        if (d4Batak < 50) return true;

        // 2. Gömmeli Batak (3 Kişilik) Masa Engeli (cx: 320, cy: 440)
        let d3Batak = Math.hypot(x - 320, y - 440);
        if (d3Batak < 46) return true;

        // 3. Dost Kazığı (4 Kişilik) Masa Engeli (cx: 720, cy: 230)
        let d4Dost = Math.hypot(x - 720, y - 230);
        if (d4Dost < 50) return true;

        // 4. Dost Kazığı (3 Kişilik) Masa Engeli (cx: 720, cy: 440)
        let d3Dost = Math.hypot(x - 720, y - 440);
        if (d3Dost < 46) return true;

        // Sedir Dinlenme Alanı (Sağ Duvar: x: 940..995, y: 190..410)
        if (x >= 940 && x <= 995 && y >= 190 && y <= 410) return true;

        return false;
    }

    // 5. NARGİLE KAFE (NARGILE_CAFE)
    if (currentRoom === "nargile_cafe") {
        if (x >= 150 && x <= 360 && y >= 165 && y <= 355) return true;
        if (x >= 440 && x <= 650 && y >= 165 && y <= 355) return true;
        // Sol ve Sağ Nargile Sehpaları (Katı Engel)
        if (x >= 95 && x <= 175 && y >= 100 && y <= 152) return true;
        if (x >= 625 && x <= 705 && y >= 100 && y <= 152) return true;
        // Mutfak kapısı duvarı (En Sağ Altta - Sadece görevliler girebilir)
        if (x >= 685 && x <= 790 && y >= 420) return true;
        // Köz & Nargile Tezgahı (Sol Alt)
        if (x >= 45 && x <= 135 && y >= 380 && y <= 420) return true;
        return false;
    }

    // 6. SAHİL & PLAJ (SAHIL - DENİZ SUYUNA KESİNLİKLE BASILAMAZ)
    if (currentRoom === "sahil") {
        let pObj = players[myId];
        let hasSwan = pObj && pObj.hasSwanBoat;

        if (hasSwan) {
            // Kuğu kiralayan oyuncu denizde serbestçe süzülebilir
            if (x < 15 || x > canvas.width - 15 || y < 35 || y > canvas.height - 20) return true;
            return false;
        } else {
            // Kuğu kiralamayan oyuncu: Yalnızca iskelede ve kumsalda yürüyebilir, denize yürüyerek kesinlikle giremez!
            let onPier = (x >= 105 && x <= 555 && y >= 155 && y <= 230);
            let shoreX = getBeachShoreX(y);
            let onSand = (x >= shoreX && y >= 115 && y <= canvas.height - 15);

            // Deniz veya kayalıklara basılamaz!
            if (!onSand && !onPier) {
                return true;
            }
            if (y < 115) return true;

            // Sahil Tropik Barı (Katı Engel - Sağ Altta)
            if (x >= 645 && x <= 785 && y >= 385 && y <= 450) return true;
            // Kamp Ateşi Taşı (Katı Engel)
            if (Math.hypot(x - 485, y - 390) < 18) return true;

            return false;
        }
    }

    return false;
}



// ============================================================================
// 8.8 CANLI BLACKJACK 21 MASASI ÇİZİMİ (Masa Objeleri Arasında Tutulur)
// ============================================================================
function drawBlackjackTableObj(x, y, w, h, isHover) {
    ctx.save();
    // Masa taban gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2 + 4, y + h / 2 + 6, w / 2, h / 2.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hover parlaması (Altın Işıma)
    if (isHover) {
        ctx.strokeStyle = "rgba(250, 204, 21, 0.7)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2 + 4, h / 2.3 + 4, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Ahşap / Deri Kenarlık (Armrest)
    ctx.fillStyle = isHover ? "#78350f" : "#451a03";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isHover ? "#facc15" : "#b45309";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Yeşil Çuha Masası (Casino Felt)
    ctx.fillStyle = "#047857";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 12, h / 2.4 - 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Masa Damgası (Felt Text)
    ctx.fillStyle = "rgba(254, 240, 138, 0.85)";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BLACKJACK 3:2", x + w / 2, y + h / 2 - 10);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "8px sans-serif";
    ctx.fillText("Kasa 17'de Durur", x + w / 2, y + h / 2 + 2);

    // Kasa / Krupiye Çip Tepsisi (Chip Rack)
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(x + w / 2 - 20, y + 14, 40, 10, 3);
    ctx.fill();
    const chipColors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'];
    chipColors.forEach((cc, ci) => {
        ctx.fillStyle = cc;
        ctx.beginPath();
        ctx.arc(x + w / 2 - 12 + ci * 8, y + 19, 3.5, 0, Math.PI * 2);
        ctx.fill();
    });

    // 3 Oyuncu Koltuğu / Bahis Halkaları
    const seatOffsets = [-36, 0, 36];
    seatOffsets.forEach(so => {
        ctx.strokeStyle = "rgba(250, 204, 21, 0.75)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + w / 2 + so, y + h / 2 + 24, 9, 0, Math.PI * 2);
        ctx.stroke();

        // Koltuk Taburesi
        ctx.fillStyle = "#78350f";
        ctx.beginPath();
        ctx.arc(x + w / 2 + so, y + h / 2 + 48, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.arc(x + w / 2 + so, y + h / 2 + 47, 6, 0, Math.PI * 2);
        ctx.fill();
    });

    // Hover Tooltip
    if (isHover) {
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🃏 Canlı Blackjack 21 Masası - Tıkla ve Masaya Otur", x + w / 2, y - 6);
    }
    ctx.restore();
}

// ==========================================
// 8.9 GANYAN BAYİİ & CANLI HİPODROM PİSTİ ÇİZİMİ
// ==========================================

// ============================================================================
// ODA MODÜLLERİ (public/js/renderers/ DİZİNİNE TAŞINDI)
// - renderSahil.js   : Martı Sahili ve Balıkçılık İskelesi
// - renderNargile.js : Otantik Nargile & Okey Salonu
// - renderMarket.js  : Mobilya Marketi & Showroom
// - renderCasino.js  : Ganyan Hipodrom & Dedenin Yeri Casino
// - renderCadde.js   : Cadde & Bulvar
// - renderEmlakci.js : Prestij Gayrimenkul Emlak Ofisi
// ============================================================================

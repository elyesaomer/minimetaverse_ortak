// public/js/renderers/renderStarCaddesi.js - Star Caddesi (1000x625 Geniş Ekran Formatı)
// Ferah bulvar, modern rezidans ve villalar, lüks butik, palmiyeli kordon, deniz iskelesi ve Yıldızlar Yolu (Walk of Fame)

const STAR_WORLD_W = 1000;
const STAR_WORLD_H = 625;

// Star Caddesi Mekan ve Parsel Tanımları
const STAR_VENUES = {
    bistro: {
        id: 'star_bistro',
        name: '☕ Star Lounge & Bistro',
        type: 'Açık Teraslı Gurme Kafe & Bar',
        desc: 'Geniş ahşap güvertesi, şemsiyeli masaları ve leziz kahve çeşitleriyle Star Caddesi’nin en popüler buluşma noktası.',
        status: 'Açık • Misafir Kabul Ediyor',
        bounds: { x: 35, y: 22, w: 225, h: 175 }
    },
    villa1: {
        id: 'star_villa1',
        name: '🏡 Star Rezidans & Villa (Arsa #1)',
        type: 'Lüks Havuzlu Müstakil Villa',
        desc: 'Turkuaz özel yüzme havuzlu, modern mimarili ve geniş bahçeli ultra lüks müstakil yaşam alanı.',
        status: 'SATILIK / KİRALIK (Fiyat: 150.000 TL)',
        bounds: { x: 285, y: 22, w: 215, h: 175 }
    },
    fashion: {
        id: 'star_fashion',
        name: '✨ Star Fashion & Butik',
        type: 'Özel Tasarım & Moda Galerisi',
        desc: 'Işıltılı vitrinleri, özel tasarım kıyafetleri ve mankenleriyle şehrin en prestijli stil merkezi.',
        status: 'Açık • Gardırop & Alışveriş',
        bounds: { x: 525, y: 22, w: 220, h: 175 }
    },
    palace: {
        id: 'star_palace',
        name: '🌟 Grand Star Palace Hotel',
        type: '5 Yıldızlı Göktelen & Rezidans',
        desc: 'Altın varaklı lobisi, çatı katı penthouseları ve panoramik şehir manzarasıyla Star Caddesi’nin zirvesi.',
        status: 'Prestij Binası • Giriş Serbest',
        bounds: { x: 770, y: 22, w: 195, h: 175 }
    },
    metro: {
        id: 'star_metro',
        name: '🚇 Star Metro İstasyonu',
        type: 'Hızlı Şehir İçi Ulaşım Hattı',
        desc: 'Meydan, Çarşı ve Sahile kesintisiz bağlanan modern metro istasyonu.',
        status: 'Aktif Hat (Sokağa / Meydana Dönüş)',
        bounds: { x: 25, y: 330, w: 110, h: 105 }
    },
    arsa2: {
        id: 'star_arsa2',
        name: '🚩 Boş Parsel (Arsa #2)',
        type: 'Yatırımlık İmar Parseli',
        desc: 'Star Bulvarı üzerinde, park cepheli ve deniz manzaralı 280 m² boş geliştirme arsası.',
        status: 'SATILIK (Fiyat: 75.000 TL)',
        bounds: { x: 470, y: 415, w: 190, h: 190 }
    },
    iskele: {
        id: 'star_iskele',
        name: '🏖️ Star Sahil & Deniz İskelesi',
        type: 'Kıyı Kordonu & Balıkçılık Alanı',
        desc: 'Ege mavisi serin sulara uzanan ahşap kordon iskelesi, palmiyeler ve balık tutma noktası.',
        status: 'Halka Açık • Balık Tutulabilir',
        bounds: { x: 740, y: 430, w: 230, h: 180 }
    }
};

// Yıldızlar Yolu (Walk of Fame) Yıldızları
const WALK_OF_FAME_STARS = [
    { name: "Barış Manço", x: 190, y: 360 },
    { name: "Kemal Sunal", x: 290, y: 360 },
    { name: "Zeki Müren", x: 390, y: 360 },
    { name: "Sezen Aksu", x: 490, y: 360 },
    { name: "Müslüm Gürses", x: 590, y: 360 },
    { name: "Şener Şen", x: 690, y: 360 },
    { name: "Tarkan", x: 790, y: 360 }
];

/**
 * 1. STATİK ARKA PLAN ÇİZİMİ (1000 x 625)
 */
function renderStaticStarCaddesiTo(bctx, width, height) {
    bctx.save();
    let isNight = (typeof isNightMode !== 'undefined' ? isNightMode : false);

    // 1. ZEMİN ÇİM DOKUSU (Lush Green Lawn)
    bctx.fillStyle = isNight ? "#14331e" : "#4ade80";
    bctx.fillRect(0, 0, width, height);

    // Çim üzerine hafif tonlu dokusal desenler
    bctx.fillStyle = isNight ? "#163a23" : "#3ecf72";
    for (let gx = 0; gx < width; gx += 40) {
        for (let gy = 0; gy < height; gy += 40) {
            if ((gx / 40 + gy / 40) % 2 === 0) {
                bctx.fillRect(gx, gy, 40, 40);
            }
        }
    }

    // Minik çiçek ve çimen benekleri
    drawLawnDetails(bctx, width, height, isNight);

    // 2. ÜST BİNALAR ZEMİN PLATFORMU (Traverten & Mermer Yaya Platformu: y: 15..220)
    bctx.fillStyle = isNight ? "#1e293b" : "#e2e8f0";
    bctx.fillRect(20, 15, width - 40, 205);
    bctx.strokeStyle = isNight ? "#334155" : "#cbd5e1";
    bctx.lineWidth = 2;
    bctx.strokeRect(20, 15, width - 40, 205);

    // 3. ÜST MEKANLARIN ÇİZİMİ
    drawStarBistro(bctx, 35, 22, 225, 175, isNight);
    drawStarVilla(bctx, 285, 22, 215, 175, isNight);
    drawStarFashion(bctx, 525, 22, 220, 175, isNight);
    drawStarPalace(bctx, 770, 22, 195, 175, isNight);

    // 4. BULVAR ASFALT YOLU (y: 220 .. 335)
    drawStarBoulevardRoad(bctx, width, isNight);

    // 5. YILDIZLAR YÜRÜYÜŞ YOLU (WALK OF FAME PROMENADE: y: 335 .. 385)
    drawWalkOfFamePromenade(bctx, width, isNight);

    // 6. ALT KALDIRIM VE ÇİÇEKLİK ŞERİDİ (y: 385 .. 415)
    drawPromenadeBorder(bctx, width, isNight);

    // 7. ALT ALANLAR:
    // Sol Metro İstasyonu
    drawStarMetroEntrance(bctx, 25, 330, 110, 105, isNight);

    // Park & Büyük Süs Havuzu (x: 165, y: 415, w: 275, h: 190)
    drawStarParkAndFountain(bctx, 165, 415, 275, 190, isNight);

    // Boş Parsel (Arsa #2) (x: 470, y: 415, w: 190, h: 190)
    drawStarArsaLot(bctx, 470, 415, 190, 190, isNight);

    // Sağ Kordon, Sahil ve Ahşap Deniz İskelesi (x: 685, y: 405, w: 295, h: 215)
    drawStarBeachAndPier(bctx, 685, 405, 295, 215, isNight);

    bctx.restore();
}

/**
 * 2. DİNAMİK / ANİMASYONLU ORTAM ÇİZİMİ (Frame başına çalışır)
 */
function drawStarCaddesiEnvironment() {
    let bg = bgCache.getCanvas('star_caddesi', canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);

    let now = Date.now();
    let isNight = (typeof isNightMode !== 'undefined' ? isNightMode : false);

    // 1. Süs Havuzu Su Çırpıntısı & Fıskiye Animasyonu (cx: 300, cy: 505)
    drawFountainAnimation(ctx, 300, 505, now);

    // 2. Villa Havuzu Su Işıltısı (cx: 440, cy: 140)
    drawVillaPoolShimmer(ctx, 435, 140, now);

    // 3. Sahil Dalgaları ve İskele Işıltısı (x: 820..1000, y: 430..625)
    drawPierWaveAnimation(ctx, 820, 440, now);

    // 4. Yıldızlar Yolu Parıltı Parçacıkları (Walk of Fame Sparkles)
    drawWalkOfFameSparkles(ctx, now);

    // 5. Neon Tabela Nabız Işıkları (Pulse)
    drawNeonSignGlows(ctx, now, isNight);

    // 6. Mouse Hover & Etkileşim Kontrolü
    handleStarCaddeHover();
}

// ============================================================================
// STATİK PARÇA ÇİZİM FONKSİYONLARI
// ============================================================================

function drawLawnDetails(bctx, width, height, isNight) {
    bctx.save();
    let flowerColors = isNight ? ["#93c5fd", "#fde047", "#f472b6"] : ["#ffffff", "#fef08a", "#f43f5e", "#a855f7"];
    for (let i = 0; i < 45; i++) {
        let fx = (i * 83 + 27) % (width - 40) + 20;
        let fy = (i * 97 + 43) % (height - 60) + 30;
        // Yolun içine çiçek çizme
        if (fy >= 210 && fy <= 390) continue;
        if (fx >= 20 && fx <= 980 && fy >= 15 && fy <= 210) continue;

        let col = flowerColors[i % flowerColors.length];
        bctx.fillStyle = col;
        bctx.beginPath();
        bctx.arc(fx, fy, 2, 0, Math.PI * 2);
        bctx.fill();
    }
    bctx.restore();
}

// ☕ MEKAN 1: Star Bistro & Lounge
function drawStarBistro(bctx, bx, by, bw, bh, isNight) {
    bctx.save();
    // Taban Gölgesi
    bctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    bctx.fillRect(bx + 4, by + 4, bw, bh);

    // Ana Ahşap Güverte (Deck)
    bctx.fillStyle = isNight ? "#3b1e08" : "#d97706";
    bctx.beginPath();
    bctx.roundRect(bx, by, bw, bh, 8);
    bctx.fill();
    bctx.strokeStyle = "#92400e";
    bctx.lineWidth = 2;
    bctx.stroke();

    // Ahşap Çizgileri
    bctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    bctx.lineWidth = 1;
    for (let px = bx + 16; px < bx + bw; px += 18) {
        bctx.beginPath();
        bctx.moveTo(px, by);
        bctx.lineTo(px, by + bh);
        bctx.stroke();
    }

    // Cam Ön Cephe ve Sıcak İç Mekan
    let winX = bx + 12, winY = by + 28, winW = bw - 24, winH = 75;
    bctx.fillStyle = isNight ? "rgba(254, 240, 138, 0.2)" : "#fef3c7";
    bctx.fillRect(winX, winY, winW, winH);
    bctx.strokeStyle = "#b45309";
    bctx.lineWidth = 2;
    bctx.strokeRect(winX, winY, winW, winH);

    // Çizgili Tente (Açık Turuncu - Beyaz)
    let stripeW = winW / 8;
    for (let s = 0; s < 8; s++) {
        bctx.fillStyle = (s % 2 === 0) ? "#ea580c" : "#ffffff";
        bctx.beginPath();
        bctx.roundRect(winX + s * stripeW, by + 16, stripeW, 16, [0, 0, 4, 4]);
        bctx.fill();
    }

    // Tabela
    bctx.fillStyle = isNight ? "#1e293b" : "#9a3412";
    bctx.beginPath();
    bctx.roundRect(bx + 18, by + 2, bw - 36, 18, 4);
    bctx.fill();
    bctx.fillStyle = "#fef08a";
    bctx.font = "bold 10px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("☕ STAR BISTRO & LOUNGE", bx + bw / 2, by + 14);

    // Dış Masa ve Şemsiyeler
    drawCafeTableWithSeats(bctx, bx + 55, by + 140, "#f97316");
    drawCafeTableWithSeats(bctx, bx + 170, by + 140, "#0284c7");

    bctx.restore();
}

function drawCafeTableWithSeats(bctx, tx, ty, umbColor) {
    // Masa tabanı
    bctx.fillStyle = "rgba(0,0,0,0.2)";
    bctx.beginPath(); bctx.arc(tx, ty + 2, 14, 0, Math.PI * 2); bctx.fill();

    bctx.fillStyle = "#f8fafc";
    bctx.beginPath(); bctx.arc(tx, ty, 13, 0, Math.PI * 2); bctx.fill();
    bctx.strokeStyle = "#94a3b8"; bctx.lineWidth = 1.5; bctx.stroke();

    // Renkli Şemsiye
    bctx.fillStyle = umbColor;
    bctx.beginPath(); bctx.arc(tx, ty - 6, 18, 0, Math.PI * 2); bctx.fill();
    bctx.strokeStyle = "#ffffff"; bctx.lineWidth = 1.2; bctx.stroke();
    bctx.fillStyle = "#ffffff";
    bctx.beginPath(); bctx.arc(tx, ty - 6, 4, 0, Math.PI * 2); bctx.fill();
}

// 🏡 MEKAN 2: VIP Star Rezidans & Villa (Arsa #1)
function drawStarVilla(bctx, vx, vy, vw, vh, isNight) {
    bctx.save();
    // Villa Parsel Çiti / Bordürü
    bctx.fillStyle = isNight ? "#064e3b" : "#86efac";
    bctx.beginPath();
    bctx.roundRect(vx, vy, vw, vh, 8);
    bctx.fill();
    bctx.strokeStyle = "#22c55e";
    bctx.lineWidth = 2;
    bctx.stroke();

    // Modern Villa Yapısı (Sol Kanat: x: vx + 10, y: vy + 20, w: 105, h: 100)
    let hx = vx + 10, hy = vy + 20, hw = 105, hh = 100;
    bctx.fillStyle = isNight ? "#1e293b" : "#f8fafc";
    bctx.beginPath();
    bctx.roundRect(hx, hy, hw, hh, 6);
    bctx.fill();
    bctx.strokeStyle = "#64748b";
    bctx.lineWidth = 2;
    bctx.stroke();

    // Çatı Saçağı / Teras
    bctx.fillStyle = isNight ? "#334155" : "#38bdf8";
    bctx.fillRect(hx - 2, hy, hw + 4, 12);

    // Geniş Panoramik Camlar
    bctx.fillStyle = isNight ? "rgba(254, 240, 138, 0.3)" : "#bae6fd";
    bctx.fillRect(hx + 10, hy + 24, 38, 30);
    bctx.fillRect(hx + 56, hy + 24, 38, 30);
    bctx.strokeStyle = "#0284c7";
    bctx.lineWidth = 1.5;
    bctx.strokeRect(hx + 10, hy + 24, 38, 30);
    bctx.strokeRect(hx + 56, hy + 24, 38, 30);

    // Villa Giriş Kapısı
    bctx.fillStyle = "#78350f";
    bctx.fillRect(hx + 38, hy + 64, 28, 36);

    // Turkuaz Yüzme Havuzu (Sağ Kanat: x: vx + 125, y: vy + 45, w: 75, h: 80)
    let px = vx + 124, py = vy + 45, pw = 78, ph = 80;
    bctx.fillStyle = "#e0f2fe";
    bctx.beginPath();
    bctx.roundRect(px - 4, py - 4, pw + 8, ph + 8, 8);
    bctx.fill();
    bctx.strokeStyle = "#38bdf8";
    bctx.lineWidth = 2;
    bctx.stroke();

    bctx.fillStyle = "#0284c7";
    bctx.beginPath();
    bctx.roundRect(px, py, pw, ph, 6);
    bctx.fill();

    // Havuz Merdiveni
    bctx.strokeStyle = "#ffffff";
    bctx.lineWidth = 2;
    bctx.beginPath();
    bctx.moveTo(px + 10, py); bctx.lineTo(px + 10, py + 14);
    bctx.moveTo(px + 22, py); bctx.lineTo(px + 22, py + 14);
    bctx.moveTo(px + 8, py + 7); bctx.lineTo(px + 24, py + 7);
    bctx.stroke();

    // Tabela: ARSA #1 SATILIK VİLLA
    bctx.fillStyle = "#ef4444";
    bctx.beginPath();
    bctx.roundRect(vx + 16, vy + vh - 38, vw - 32, 28, 6);
    bctx.fill();
    bctx.strokeStyle = "#fee2e2";
    bctx.lineWidth = 1.5;
    bctx.stroke();

    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 9px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("ARSA #1 • VIP VİLLA 🏡", vx + vw / 2, vy + vh - 24);
    bctx.fillStyle = "#fef08a";
    bctx.font = "bold 8px sans-serif";
    bctx.fillText("SATILIK / KİRALIK (Tıkla)", vx + vw / 2, vy + vh - 13);

    bctx.restore();
}

// ✨ MEKAN 3: Star Fashion & Butik
function drawStarFashion(bctx, fx, fy, fw, fh, isNight) {
    bctx.save();
    // Mağaza Binası
    bctx.fillStyle = isNight ? "#1e1b4b" : "#4338ca";
    bctx.beginPath();
    bctx.roundRect(fx, fy, fw, fh, 8);
    bctx.fill();
    bctx.strokeStyle = "#c084fc";
    bctx.lineWidth = 2.5;
    bctx.stroke();

    // Çatı Marquee
    bctx.fillStyle = isNight ? "#0f172a" : "#312e81";
    bctx.beginPath();
    bctx.roundRect(fx + 12, fy + 4, fw - 24, 24, 6);
    bctx.fill();
    bctx.strokeStyle = "#f472b6";
    bctx.lineWidth = 1.8;
    bctx.stroke();

    bctx.fillStyle = "#fdf4ff";
    bctx.font = "bold 11px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("✨ STAR FASHION & BUTİK ✨", fx + fw / 2, fy + 20);

    // Geniş Mağaza Vitrini
    let vw = fw - 28, vh = 95;
    bctx.fillStyle = isNight ? "rgba(232, 121, 249, 0.15)" : "#f5d0fe";
    bctx.beginPath();
    bctx.roundRect(fx + 14, fy + 36, vw, vh, 6);
    bctx.fill();
    bctx.strokeStyle = "#e879f9";
    bctx.lineWidth = 2;
    bctx.stroke();

    // Vitrindeki Mankenler ve Askılıklar
    bctx.fillStyle = "#ffffff";
    bctx.font = "24px sans-serif";
    bctx.fillText("👗", fx + 46, fy + 90);
    bctx.fillText("👔", fx + fw / 2, fy + 90);
    bctx.fillText("👠", fx + fw - 46, fy + 90);

    // Butik Giriş Halısı (Pembe / Fuşya Yolluk)
    bctx.fillStyle = "#db2777";
    bctx.beginPath();
    bctx.roundRect(fx + fw / 2 - 20, fy + fh - 32, 40, 32, [4, 4, 0, 0]);
    bctx.fill();

    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 8.5px sans-serif";
    bctx.fillText("GİRİŞ", fx + fw / 2, fy + fh - 10);

    bctx.restore();
}

// 🌟 MEKAN 4: Grand Star Palace Hotel
function drawStarPalace(bctx, px, py, pw, ph, isNight) {
    bctx.save();
    // Gökdelen Gövdesi (Koyu Lacivert & Altın Detay)
    bctx.fillStyle = isNight ? "#020617" : "#0f172a";
    bctx.beginPath();
    bctx.roundRect(px, py, pw, ph, 8);
    bctx.fill();
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 2.5;
    bctx.stroke();

    // Üst Penthouse Terası ve Anten
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 2;
    bctx.beginPath();
    bctx.moveTo(px + pw / 2, py);
    bctx.lineTo(px + pw / 2, py - 16);
    bctx.stroke();
    bctx.fillStyle = "#ef4444";
    bctx.beginPath();
    bctx.arc(px + pw / 2, py - 16, 3, 0, Math.PI * 2);
    bctx.fill();

    // Otel Tabelası
    bctx.fillStyle = "#1e293b";
    bctx.beginPath();
    bctx.roundRect(px + 10, py + 6, pw - 20, 22, 4);
    bctx.fill();
    bctx.strokeStyle = "#fbbf24";
    bctx.lineWidth = 1.5;
    bctx.stroke();
    bctx.fillStyle = "#fef08a";
    bctx.font = "bold 10px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🌟 STAR PALACE HOTEL", px + pw / 2, py + 21);

    // Pencereler Grid (Işıklı Otel Odaları)
    let rows = 4, cols = 5;
    let gridW = pw - 30, gridH = 80;
    let cw = gridW / cols, ch = gridH / rows;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let lit = ((r + c) % 2 === 0);
            bctx.fillStyle = lit ? (isNight ? "#fde047" : "#bae6fd") : (isNight ? "#334155" : "#64748b");
            bctx.fillRect(px + 15 + c * cw + 2, py + 36 + r * ch + 2, cw - 4, ch - 4);
        }
    }

    // Giriş Kanopisi ve Kırmızı Halı
    bctx.fillStyle = "#991b1b";
    bctx.beginPath();
    bctx.roundRect(px + pw / 2 - 24, py + ph - 28, 48, 28, [4, 4, 0, 0]);
    bctx.fill();
    bctx.fillStyle = "#facc15";
    bctx.font = "bold 8px sans-serif";
    bctx.fillText("VIP REZERVASYON", px + pw / 2, py + ph - 8);

    bctx.restore();
}

// 4. BULVAR ASFALT YOLU (y: 220 .. 335)
function drawStarBoulevardRoad(bctx, width, isNight) {
    bctx.save();
    let roadY = 220, roadH = 115;

    // Asfalt
    bctx.fillStyle = isNight ? "#1e293b" : "#334155";
    bctx.fillRect(0, roadY, width, roadH);

    // Bordür Taşları (Kaldırım Kenarları)
    bctx.fillStyle = "#cbd5e1";
    bctx.fillRect(0, roadY - 4, width, 4);
    bctx.fillRect(0, roadY + roadH, width, 4);

    // Orta Kesik Şerit Çizgisi
    bctx.strokeStyle = "#ffffff";
    bctx.lineWidth = 3;
    bctx.setLineDash([20, 15]);
    bctx.beginPath();
    bctx.moveTo(0, roadY + roadH / 2);
    bctx.lineTo(width, roadY + roadH / 2);
    bctx.stroke();
    bctx.setLineDash([]);

    // Yaya Geçitleri (Zebra Crosswalks)
    drawZebraCrosswalk(bctx, 110, roadY, 40, roadH);
    drawZebraCrosswalk(bctx, 720, roadY, 40, roadH);

    bctx.restore();
}

function drawZebraCrosswalk(bctx, zx, zy, zw, zh) {
    bctx.fillStyle = "#ffffff";
    for (let py = zy + 6; py < zy + zh - 6; py += 14) {
        bctx.fillRect(zx, py, zw, 8);
    }
}

// 5. YILDIZLAR YÜRÜYÜŞ YOLU (WALK OF FAME: y: 335 .. 385)
function drawWalkOfFamePromenade(bctx, width, isNight) {
    bctx.save();
    let promY = 335, promH = 50;

    // Pembe Granit Zemin
    bctx.fillStyle = isNight ? "#3b1e2e" : "#fbcfe8";
    bctx.fillRect(0, promY, width, promH);
    bctx.strokeStyle = "#f472b6";
    bctx.lineWidth = 1.5;
    bctx.strokeRect(0, promY, width, promH);

    // Yıldız Karoları
    for (let star of WALK_OF_FAME_STARS) {
        drawStarTile(bctx, star.x, star.y, star.name, isNight);
    }

    bctx.restore();
}

function drawStarTile(bctx, sx, sy, name, isNight) {
    bctx.save();
    // Karo Plakası (Koyu Kırmızımsı Kahverengi Taş)
    bctx.fillStyle = isNight ? "#1c1917" : "#451a03";
    bctx.beginPath();
    bctx.roundRect(sx - 28, sy - 18, 56, 36, 4);
    bctx.fill();
    bctx.strokeStyle = "#fbbf24";
    bctx.lineWidth = 1.5;
    bctx.stroke();

    // Altın Yıldız İkonu
    bctx.fillStyle = "#facc15";
    bctx.font = "14px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("⭐", sx, sy - 2);

    // Sanatçı Adı
    bctx.fillStyle = "#fef08a";
    bctx.font = "bold 7.5px sans-serif";
    bctx.fillText(name, sx, sy + 12);
    bctx.restore();
}

function drawPromenadeBorder(bctx, width, isNight) {
    bctx.save();
    // Traverten Kaldırım
    bctx.fillStyle = isNight ? "#1e293b" : "#e2e8f0";
    bctx.fillRect(0, 385, width, 30);
    bctx.strokeStyle = "#94a3b8";
    bctx.lineWidth = 1;
    bctx.strokeRect(0, 385, width, 30);

    // Çiçeklik Şeridi
    for (let x = 60; x < width - 60; x += 90) {
        bctx.fillStyle = "#15803d";
        bctx.beginPath();
        bctx.roundRect(x, 390, 45, 18, 4);
        bctx.fill();
        bctx.fillStyle = "#f43f5e";
        bctx.beginPath();
        bctx.arc(x + 12, 399, 3, 0, Math.PI * 2);
        bctx.arc(x + 23, 399, 3, 0, Math.PI * 2);
        bctx.arc(x + 34, 399, 3, 0, Math.PI * 2);
        bctx.fill();
    }
    bctx.restore();
}

// 🚇 MEKAN 5: Star Metro İstasyonu (Meydana Dönüş Yolu)
function drawStarMetroEntrance(bctx, mx, my, mw, mh, isNight) {
    bctx.save();
    // Zemin
    bctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    bctx.fillRect(mx + 4, my + 4, mw, mh);

    // Metro Cam Köşk & Kanopi
    bctx.fillStyle = isNight ? "#0f172a" : "#1e293b";
    bctx.beginPath();
    bctx.roundRect(mx, my, mw, mh, 8);
    bctx.fill();
    bctx.strokeStyle = "#38bdf8";
    bctx.lineWidth = 2.5;
    bctx.stroke();

    // Metro Başlığı
    bctx.fillStyle = "#0284c7";
    bctx.beginPath();
    bctx.roundRect(mx + 6, my + 6, mw - 12, 22, 4);
    bctx.fill();
    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 9px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🚇 STAR METRO", mx + mw / 2, my + 20);

    // Merdiven Boşluğu / Aşağı Giriş
    bctx.fillStyle = "#030712";
    bctx.fillRect(mx + 12, my + 34, mw - 24, mh - 58);
    bctx.strokeStyle = "#475569";
    bctx.lineWidth = 1.5;
    bctx.strokeRect(mx + 12, my + 34, mw - 24, mh - 58);

    // Merdiven Basamakları
    bctx.strokeStyle = "#334155";
    bctx.lineWidth = 1.2;
    for (let sy = my + 42; sy < my + mh - 30; sy += 8) {
        bctx.beginPath();
        bctx.moveTo(mx + 16, sy);
        bctx.lineTo(mx + mw - 16, sy);
        bctx.stroke();
    }

    // Yön Tabelası: MEYDANA DÖNÜŞ
    bctx.fillStyle = "#10b981";
    bctx.beginPath();
    bctx.roundRect(mx + 8, my + mh - 20, mw - 16, 16, 4);
    bctx.fill();
    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 8px sans-serif";
    bctx.fillText("⬅️ MEYDANA ÇIK", mx + mw / 2, my + mh - 8);

    bctx.restore();
}

// 🏞️ MEKAN 6: Star Park & Büyük Süs Havuzu
function drawStarParkAndFountain(bctx, px, py, pw, ph, isNight) {
    bctx.save();
    // Park Zemin Alanı (Açık Çim & Traverten Yürüyüş Yolu)
    bctx.fillStyle = isNight ? "#143a21" : "#86efac";
    bctx.beginPath();
    bctx.roundRect(px, py, pw, ph, 12);
    bctx.fill();
    bctx.strokeStyle = "#22c55e";
    bctx.lineWidth = 2;
    bctx.stroke();

    // Havuz Tabanı (Merkez: x: px + pw/2, y: py + ph/2)
    let fx = px + pw / 2, fy = py + ph / 2;
    let radX = 85, radY = 55;

    // Dış Taş Çerçeve
    bctx.fillStyle = isNight ? "#334155" : "#f1f5f9";
    bctx.beginPath();
    bctx.ellipse(fx, fy, radX + 8, radY + 8, 0, 0, Math.PI * 2);
    bctx.fill();
    bctx.strokeStyle = "#cbd5e1";
    bctx.lineWidth = 2.5;
    bctx.stroke();

    // Havuz Suyu
    bctx.fillStyle = "#0284c7";
    bctx.beginPath();
    bctx.ellipse(fx, fy, radX, radY, 0, 0, Math.PI * 2);
    bctx.fill();
    bctx.strokeStyle = "#38bdf8";
    bctx.lineWidth = 1.5;
    bctx.stroke();

    // Merkez Fıskiye Kaidesi
    bctx.fillStyle = "#ffffff";
    bctx.beginPath();
    bctx.arc(fx, fy, 16, 0, Math.PI * 2);
    bctx.fill();
    bctx.strokeStyle = "#94a3b8";
    bctx.lineWidth = 2;
    bctx.stroke();

    // Park Bankları (Sol ve Sağ)
    drawStarCaddesiParkBench(bctx, px + 25, py + ph / 2 - 12);
    drawStarCaddesiParkBench(bctx, px + pw - 45, py + ph / 2 - 12);

    bctx.restore();
}

function drawStarCaddesiParkBench(bctx, bx, by) {
    bctx.fillStyle = "#78350f";
    bctx.beginPath();
    bctx.roundRect(bx, by, 24, 28, 4);
    bctx.fill();
    bctx.strokeStyle = "#451a03";
    bctx.lineWidth = 1.5;
    bctx.stroke();
    bctx.fillStyle = "#b45309";
    bctx.fillRect(bx + 2, by + 4, 20, 4);
    bctx.fillRect(bx + 2, by + 12, 20, 4);
    bctx.fillRect(bx + 2, by + 20, 20, 4);
}

// 🚩 MEKAN 7: Boş Parsel (Arsa #2)
function drawStarArsaLot(bctx, ax, ay, aw, ah, isNight) {
    bctx.save();
    // Parsel Beyaz Çerçevesi
    bctx.strokeStyle = "#ffffff";
    bctx.lineWidth = 3;
    bctx.strokeRect(ax, ay, aw, ah);

    // Kumlu Toprak Parsel Zemini (Screenshot 2'deki gibi)
    bctx.fillStyle = isNight ? "#451a03" : "#d97706";
    bctx.fillRect(ax + 3, ay + 3, aw - 6, ah - 6);

    // Boş Arsa Köşe Bayrağı
    bctx.strokeStyle = "#ffffff";
    bctx.lineWidth = 2;
    bctx.beginPath();
    bctx.moveTo(ax + aw - 16, ay + 12);
    bctx.lineTo(ax + aw - 16, ay + 42);
    bctx.stroke();
    bctx.fillStyle = "#38bdf8";
    bctx.beginPath();
    bctx.moveTo(ax + aw - 16, ay + 12);
    bctx.lineTo(ax + aw - 34, ay + 20);
    bctx.lineTo(ax + aw - 16, ay + 28);
    bctx.closePath();
    bctx.fill();

    // Parsel Numarası (#2)
    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 13px sans-serif";
    bctx.textAlign = "left";
    bctx.fillText("#2", ax + 14, ay + 24);

    // Ahşap Satılık Tabelası
    let sx = ax + aw / 2 - 60, sy = ay + ah / 2 - 18;
    bctx.fillStyle = "rgba(0,0,0,0.2)";
    bctx.fillRect(sx + 3, sy + 3, 120, 42);

    bctx.fillStyle = "#ffffff";
    bctx.fillRect(sx, sy, 120, 42);
    bctx.strokeStyle = "#ef4444";
    bctx.lineWidth = 2.5;
    bctx.strokeRect(sx, sy, 120, 42);

    bctx.fillStyle = "#dc2626";
    bctx.font = "900 11px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("SATILIK ARSA", ax + aw / 2, sy + 18);
    bctx.fillStyle = "#0f172a";
    bctx.font = "bold 10px sans-serif";
    bctx.fillText("75.000 TL", ax + aw / 2, sy + 33);

    bctx.restore();
}

// 🏖️ MEKAN 8: Kordon, Palmiyeler ve Ahşap Deniz İskelesi
function drawStarBeachAndPier(bctx, bx, by, bw, bh, isNight) {
    bctx.save();
    // Kıyı Kum Şeridi
    bctx.fillStyle = isNight ? "#78350f" : "#fef08a";
    bctx.fillRect(bx, by, bw, 32);

    // Deniz / Mavi Sular (y: by + 32 .. by + bh)
    let waterY = by + 32;
    bctx.fillStyle = isNight ? "#082f49" : "#0284c7";
    bctx.fillRect(bx, waterY, bw, bh - 32);

    // Sahil Köpüğü Şeridi (White Sea Foam)
    bctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    bctx.lineWidth = 3;
    bctx.beginPath();
    bctx.moveTo(bx, waterY);
    bctx.lineTo(bx + bw, waterY);
    bctx.stroke();

    // Ahşap Deniz İskelesi (Screenshot 1'deki İskele Boyut ve Tarzında)
    let pierX = bx + 65, pierY = by + 12, pierW = 60, pierH = bh - 24;
    // İskele Gölgesi
    bctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    bctx.fillRect(pierX + 4, pierY + 4, pierW, pierH);

    // İskele Tahtaları
    bctx.fillStyle = isNight ? "#451a03" : "#b45309";
    bctx.fillRect(pierX, pierY, pierW, pierH);
    bctx.strokeStyle = "#78350f";
    bctx.lineWidth = 2;
    bctx.strokeRect(pierX, pierY, pierW, pierH);

    // Ahşap Tahta Çizgileri
    bctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    bctx.lineWidth = 1.2;
    for (let py = pierY + 8; py < pierY + pierH; py += 8) {
        bctx.beginPath();
        bctx.moveTo(pierX, py);
        bctx.lineTo(pierX + pierW, py);
        bctx.stroke();
    }

    // Tabela: DENİZ İSKELESİ
    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 8.5px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("DENİZ İSKELESİ", pierX + pierW / 2, pierY + pierH - 8);

    // Sahilde Palmiye Ağaçları (Screenshot 1 gibi)
    drawPalmTree(bctx, bx + 22, by + 26);
    drawPalmTree(bctx, bx + 165, by + 26);

    // Sahil Şemsiyesi & Şezlong
    drawStarCaddesiBeachUmbrella(bctx, bx + 215, by + 18, "#ef4444");
    drawStarCaddesiBeachUmbrella(bctx, bx + 260, by + 18, "#0284c7");

    // Bağlı Küçük Ahşap Sandal
    let boatX = pierX + pierW + 16, boatY = waterY + 45;
    bctx.fillStyle = "#78350f";
    bctx.beginPath();
    bctx.ellipse(boatX, boatY, 18, 9, 0.2, 0, Math.PI * 2);
    bctx.fill();
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 1.2;
    bctx.stroke();

    bctx.restore();
}

function drawPalmTree(bctx, px, py) {
    bctx.save();
    // Gövde
    bctx.strokeStyle = "#78350f";
    bctx.lineWidth = 5;
    bctx.lineCap = "round";
    bctx.beginPath();
    bctx.moveTo(px, py + 24);
    bctx.quadraticCurveTo(px + 4, py + 12, px - 2, py - 4);
    bctx.stroke();

    // Palmiye Yaprakları (Yeşil Yelpaze)
    bctx.fillStyle = "#15803d";
    let angles = [-0.9, -0.4, 0, 0.4, 0.9];
    for (let a of angles) {
        bctx.save();
        bctx.translate(px - 2, py - 4);
        bctx.rotate(a);
        bctx.beginPath();
        bctx.ellipse(0, -14, 6, 16, 0, 0, Math.PI * 2);
        bctx.fill();
        bctx.restore();
    }

    // Hindistan Cevizleri
    bctx.fillStyle = "#451a03";
    bctx.beginPath();
    bctx.arc(px - 4, py - 2, 2.5, 0, Math.PI * 2);
    bctx.arc(px + 1, py - 3, 2.5, 0, Math.PI * 2);
    bctx.fill();

    bctx.restore();
}

function drawStarCaddesiBeachUmbrella(bctx, ux, uy, color) {
    bctx.save();
    bctx.fillStyle = color;
    bctx.beginPath();
    bctx.arc(ux, uy, 12, 0, Math.PI * 2);
    bctx.fill();
    bctx.strokeStyle = "#ffffff";
    bctx.lineWidth = 1.5;
    bctx.stroke();
    bctx.fillStyle = "#ffffff";
    bctx.beginPath();
    bctx.arc(ux, uy, 3.5, 0, Math.PI * 2);
    bctx.fill();
    bctx.restore();
}

// ============================================================================
// ANİMASYON FONKSİYONLARI
// ============================================================================

function drawFountainAnimation(ctx, fx, fy, now) {
    ctx.save();
    let ripRad = 10 + ((now / 40) % 35);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(fx, fy, ripRad * 1.5, ripRad, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Fıskiye Dans Eden Su Damlaları
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 8; i++) {
        let ang = (i * Math.PI / 4) + (now / 350);
        let dist = 14 + Math.sin(now / 120 + i) * 8;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(ang) * dist * 1.4, fy + Math.sin(ang) * dist - 4, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawVillaPoolShimmer(ctx, px, py, now) {
    ctx.save();
    let pulse = (Math.sin(now / 250) + 1) / 2;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + pulse * 0.25})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px - 20, py + pulse * 10);
    ctx.lineTo(px + 20, py - pulse * 10);
    ctx.stroke();
    ctx.restore();
}

function drawPierWaveAnimation(ctx, wx, wy, now) {
    ctx.save();
    let waveShift = Math.sin(now / 300) * 4;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wx, wy + waveShift);
    ctx.lineTo(wx + 170, wy + waveShift);
    ctx.stroke();
    ctx.restore();
}

function drawWalkOfFameSparkles(ctx, now) {
    ctx.save();
    let idx = Math.floor((now / 800) % WALK_OF_FAME_STARS.length);
    let s = WALK_OF_FAME_STARS[idx];
    let sparkAlpha = (Math.sin(now / 150) + 1) / 2;
    ctx.fillStyle = `rgba(254, 240, 138, ${sparkAlpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y - 10, 4 + sparkAlpha * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawNeonSignGlows(ctx, now, isNight) {
    if (!isNight) return;
    ctx.save();
    let pulse = (Math.sin(now / 200) + 1) / 2;
    ctx.fillStyle = `rgba(232, 121, 249, ${0.08 + pulse * 0.12})`;
    ctx.fillRect(525, 22, 220, 30);
    ctx.restore();
}

// ============================================================================
// HOVER, ETKİLEŞİM VE TIKLAMA YÖNETİCİSİ
// ============================================================================

function handleStarCaddeHover() {
    let mx = canvasMouseX, my = canvasMouseY;
    if (mx < 0 || my < 0) return;

    let hoveredVenue = null;
    for (let k in STAR_VENUES) {
        let v = STAR_VENUES[k];
        let b = v.bounds;
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
            hoveredVenue = v;
            break;
        }
    }

    if (hoveredVenue) {
        ctx.save();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.strokeRect(hoveredVenue.bounds.x, hoveredVenue.bounds.y, hoveredVenue.bounds.w, hoveredVenue.bounds.h);

        // Tooltip Banner
        let tx = hoveredVenue.bounds.x + hoveredVenue.bounds.w / 2;
        let ty = hoveredVenue.bounds.y - 8;
        if (ty < 20) ty = hoveredVenue.bounds.y + hoveredVenue.bounds.h + 16;

        ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
        ctx.beginPath();
        ctx.roundRect(tx - 110, ty - 16, 220, 22, 6);
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#facc15";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`🔍 ${hoveredVenue.name} (Tıkla)`, tx, ty - 2);

        ctx.restore();
        setGameCursor('pointer');
    } else {
        setGameCursor('default');
    }
}

/**
 * Tıklama Olayı (Click Handling)
 */
function handleStarCaddesiClick(clickX, clickY, p) {
    for (let k in STAR_VENUES) {
        let v = STAR_VENUES[k];
        let b = v.bounds;
        if (clickX >= b.x && clickX <= b.x + b.w && clickY >= b.y && clickY <= b.y + b.h) {
            // Metro -> Sokağa geçiş
            if (v.id === 'star_metro') {
                if (typeof changeRoom === 'function') changeRoom('sokak');
                return true;
            }
            // Butik -> Gardırop
            if (v.id === 'star_fashion') {
                if (typeof openWardrobe === 'function') openWardrobe();
                return true;
            }
            // Diğerleri -> Detaylı Tanıtım / Bilgi Modalı
            openStarCaddeInspectModal(v);
            return true;
        }
    }
    return false;
}

/**
 * 'E' Tuşu ve Mobil Yakınlık Etkileşimi
 */
function handleStarCaddesiMobileInteract(p) {
    if (!p) return false;

    // Metro İstasyonuna yakın mı?
    if (p.x <= 130 && p.y >= 320 && p.y <= 440) {
        if (typeof changeRoom === 'function') changeRoom('sokak');
        return true;
    }
    // İskele ucuna yakın mı? -> Balık Tutma
    if (p.x >= 740 && p.y >= 430) {
        if (typeof triggerFishing === 'function') triggerFishing();
        return true;
    }
    // Arsa #2'ye yakın mı?
    if (p.x >= 460 && p.x <= 670 && p.y >= 410) {
        openStarCaddeInspectModal(STAR_VENUES.arsa2);
        return true;
    }
    return false;
}

/**
 * Katı Çarpışma (Collision Engine)
 */
function checkStarCaddesiCollision(x, y) {
    // 1. Dış Sınırlar (1000 x 625)
    if (x < 14 && !(y >= 320 && y <= 440)) return true; // Sol metro çıkışı açık
    if (x > STAR_WORLD_W - 14) return true;
    if (y < 45 || y > STAR_WORLD_H - 18) return true;

    // 2. Üst Binaların Katı Gövdeleri (y: 20 .. 185)
    if (y < 185) {
        // Star Bistro gövdesi (kapı ve açık teras hariç)
        if (x >= 35 && x <= 255 && y <= 150) return true;
        // Villa ana gövdesi
        if (x >= 285 && x <= 495 && y <= 150) return true;
        // Fashion butik gövdesi
        if (x >= 525 && x <= 740 && y <= 150) return true;
        // Grand Palace gövdesi
        if (x >= 770 && x <= 965 && y <= 150) return true;
    }

    // 3. Süs Havuzu Katı Çemberi (cx: 300, cy: 505, rx: 85, ry: 55)
    let dx = (x - 300) / 88;
    let dy = (y - 505) / 58;
    if (dx * dx + dy * dy <= 1) return true;

    // 4. Deniz Suyu Sınırı (İskele hariç suya girilmez)
    if (x >= 685 && y >= 438) {
        // İskele alanı (x: 745..815) üzerinde yürümeye izin ver
        let isOnPier = (x >= 745 && x <= 815 && y <= 600);
        if (!isOnPier) return true;
    }

    return false;
}

/**
 * Mekan ve Parsel İnceleme Modalı
 */
function openStarCaddeInspectModal(venue) {
    if (window.playSound) window.playSound('uiClick');
    let modal = document.getElementById('starCaddeInspectModal');
    if (!modal) return;

    let titleEl = document.getElementById('starCaddeInspectTitle');
    let typeEl = document.getElementById('starCaddeInspectType');
    let descEl = document.getElementById('starCaddeInspectDesc');
    let statusEl = document.getElementById('starCaddeInspectStatus');

    if (titleEl) titleEl.innerText = venue.name;
    if (typeEl) typeEl.innerText = venue.type;
    if (descEl) descEl.innerText = venue.desc;
    if (statusEl) statusEl.innerText = venue.status;

    modal.style.display = 'flex';
}
window.openStarCaddeInspectModal = openStarCaddeInspectModal;

function closeStarCaddeInspectModal() {
    let modal = document.getElementById('starCaddeInspectModal');
    if (modal) modal.style.display = 'none';
}
window.closeStarCaddeInspectModal = closeStarCaddeInspectModal;

// Global Export
window.renderStaticStarCaddesiTo = renderStaticStarCaddesiTo;
window.drawStarCaddesiEnvironment = drawStarCaddesiEnvironment;
window.handleStarCaddesiClick = handleStarCaddesiClick;
window.handleStarCaddesiMobileInteract = handleStarCaddesiMobileInteract;
window.checkStarCaddesiCollision = checkStarCaddesiCollision;

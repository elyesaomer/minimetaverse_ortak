// public/js/renderers/renderSanalikaCadde.js - Sanalika Tarzı İzometrik Cadde & Büyük Harita Modülü
// Dünya Boyutları: 1600 x 960 piksel (Standart 800x500 haritalardan 4 kat daha geniş)
// Sahte 3D İzometrik caddeler, sarı-siyah bordür taşları, kiralık binalar, sonbahar parkı ve sahil

const SANALIKA_WORLD_W = 1600;
const SANALIKA_WORLD_H = 960;

// Kiralık Binalar Tanımları
const KIRALIK_VENUES = {
    lidya: {
        id: 'lidya',
        name: '🏢 Lidya Plaza & Rezidans',
        type: 'Ticari Plaza & Finans Merkezi',
        area: '650 m² (3 Katlı)',
        desc: 'Geniş mermer kolonlu cepheye, yüksek tavanlı lobiye ve güvenlikli kasalara sahip prestijli ticari alan. Banka şubesi, şirket genel merkezi veya sanat galerisi için idealdir.',
        status: 'Boş / Kiralamaya Hazır',
        monthly: '50.000 💰 / Ay',
        bounds: { x: 70, y: 80, w: 310, h: 220 }
    },
    bistro: {
        id: 'bistro',
        name: '🍷 Cadde Bistro & Lounge',
        type: 'Restoran & Kafe & Bar',
        area: '420 m² (Açık Teraslı)',
        desc: 'Canlı cadde cepheli, mor neon aydınlatmalı, modern kokteyl barı ve açık hava kaldırım terasına sahip hazır gastronomi mekanı.',
        status: 'Boş / Kiralamaya Hazır',
        monthly: '35.000 💰 / Ay',
        bounds: { x: 30, y: 390, w: 260, h: 210 }
    },
    butik: {
        id: 'butik',
        name: '👗 Moda & Stil Butik',
        type: 'Giyim & Aksesuar Mağazası',
        area: '280 m²',
        desc: 'Geniş vitrin camları, şık tentesi ve prova kabinleriyle moda tasarımcıları ve özel koleksiyon satıcıları için özel olarak tasarlanmış butik alanı.',
        status: 'Boş / Kiralamaya Hazır',
        monthly: '25.000 💰 / Ay',
        bounds: { x: 440, y: 50, w: 260, h: 180 }
    },
    sinema: {
        id: 'sinema',
        name: '🎬 Metropol Sineması & Tiyatro',
        type: 'Kültür & Eğlence Kompleksi',
        area: '850 m² (Dev Sahne & Fuaye)',
        desc: 'Nostaljik Art-Deco ışıklı tabelası, afiş panoları ve 200 kişilik amfi tiyatro düzeniyle film gösterimleri, söyleşiler ve konserler için mükemmel mekan.',
        status: 'Boş / Kiralamaya Hazır',
        monthly: '60.000 💰 / Ay',
        bounds: { x: 1140, y: 50, w: 340, h: 210 }
    },
    vip_lounge: {
        id: 'vip_lounge',
        name: '✨ VIP Metropol Club',
        type: 'Gece Kulübü & VIP Etkinlik Alanı',
        area: '520 m² (Çift Katlı & Çatı Bahçeli)',
        desc: 'Obsidyen cam cephe, fütüristik neon ışık şeritleri ve özel VIP localarıyla şehrin en seçkin partilerine ev sahipliği yapmaya hazır eğlence kulübü.',
        status: 'Boş / Kiralamaya Hazır',
        monthly: '45.000 💰 / Ay',
        bounds: { x: 420, y: 720, w: 290, h: 190 }
    }
};

/**
 * Statik Katmanı Ön Belleğe (Offscreen Canvas) Çizer
 */
function renderStaticSanalikaCaddeTo(bctx, width, height) {
    let isNight = (typeof isNightMode !== 'undefined' ? isNightMode : (window.isNightMode || false));

    // 1. ZEMİN VE DIŞ ALAN TABANI (Geniş asfalt & kaldırım döşemesi)
    bctx.fillStyle = isNight ? "#090d16" : "#64748b";
    bctx.fillRect(0, 0, width, height);

    // Açık gri taş kaldırım dokusu
    bctx.fillStyle = isNight ? "#111827" : "#94a3b8";
    bctx.fillRect(0, 0, width, height);

    // Kaldırım derz çizgileri (Sanalika tarzı hafif taş ızgara)
    bctx.strokeStyle = isNight ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.15)";
    bctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
        bctx.beginPath();
        bctx.moveTo(x, 0);
        bctx.lineTo(x, height);
        bctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
        bctx.beginPath();
        bctx.moveTo(0, y);
        bctx.lineTo(width, y);
        bctx.stroke();
    }

    // 2. İZOMETRİK CADDELER (1. Cadde ve 10. Cadde Kesişimi)
    drawIsometricStreets(bctx, width, height, isNight);

    // 3. İKİ CADDE KENARI SARI-SİYAH BORDÜR TAŞLARI (Iconic Sanalika Curb Stones)
    drawSanalikaCurbStones(bctx, width, height);

    // 4. KESİŞİM MEYDANI YAYA GEÇİTLERİ (Zebra Crossings)
    drawIsometricCrosswalks(bctx);

    // 5. SAHİL & DENİZ ALANI (Sağ Alt Köşe)
    drawStaticBeachSection(bctx, isNight);

    // 6. SONBAHAR FESTİVAL PARKI (Üst Sağ Bölüm: "Merhaba Sonbahar")
    drawStaticAutumnPark(bctx, isNight);

    // 7. KİRALIK BİNALAR VE MİMARİ CEPHELER
    drawStaticVenues(bctx, isNight);

    // 8. OTOBÜS DURAĞI & SOKAK DİREKLERİ & TABELALAR
    drawStaticStreetProps(bctx, isNight);
}

/**
 * İzometrik Çapraz Caddeleri Çizer
 */
function drawIsometricStreets(bctx, width, height, isNight) {
    let roadColor = isNight ? "#1e293b" : "#334155";
    let roadBorder = isNight ? "#0f172a" : "#1e293b";

    // --- 1. CADDE (Sol Üstten Sağ Alta İnen Ana Bulvar: ~25-30 derece eğim) ---
    // Yol poligonu: Üst sol (0, 240) -> (width, 820)
    bctx.fillStyle = roadColor;
    bctx.beginPath();
    bctx.moveTo(-100, 200);
    bctx.lineTo(width + 100, 780);
    bctx.lineTo(width + 100, 930);
    bctx.lineTo(-100, 350);
    bctx.closePath();
    bctx.fill();

    // 1. Cadde Asfalt Kenar Gölgeleri
    bctx.strokeStyle = roadBorder;
    bctx.lineWidth = 3;
    bctx.beginPath();
    bctx.moveTo(-100, 200);
    bctx.lineTo(width + 100, 780);
    bctx.moveTo(-100, 350);
    bctx.lineTo(width + 100, 930);
    bctx.stroke();

    // 1. Cadde Kesik Sarı Şerit Çizgisi
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 4;
    bctx.setLineDash([26, 20]);
    bctx.beginPath();
    bctx.moveTo(-100, 275);
    bctx.lineTo(width + 100, 855);
    bctx.stroke();
    bctx.setLineDash([]);

    // --- 10. CADDE (Sol Alttan Sağ Üste Giden Kesişen Cadde) ---
    // Yol poligonu: (80, height+50) -> (1250, 100)
    bctx.fillStyle = roadColor;
    bctx.beginPath();
    bctx.moveTo(40, height + 80);
    bctx.lineTo(1120, 160);
    bctx.lineTo(1240, 240);
    bctx.lineTo(160, height + 80);
    bctx.closePath();
    bctx.fill();

    // 10. Cadde Asfalt Kenar Çizgileri
    bctx.strokeStyle = roadBorder;
    bctx.lineWidth = 3;
    bctx.beginPath();
    bctx.moveTo(40, height + 80);
    bctx.lineTo(1120, 160);
    bctx.moveTo(160, height + 80);
    bctx.lineTo(1240, 240);
    bctx.stroke();

    // 10. Cadde Beyaz Kesik Şerit
    bctx.strokeStyle = "#ffffff";
    bctx.lineWidth = 3;
    bctx.setLineDash([22, 18]);
    bctx.beginPath();
    bctx.moveTo(100, height + 80);
    bctx.lineTo(1180, 200);
    bctx.stroke();
    bctx.setLineDash([]);

    // Caddelerin kesiştiği orta göbek meydan asfaltı (Pürüzsüz kavşak birleşimi)
    bctx.fillStyle = roadColor;
    bctx.beginPath();
    bctx.moveTo(640, 470);
    bctx.lineTo(840, 410);
    bctx.lineTo(910, 580);
    bctx.lineTo(710, 640);
    bctx.closePath();
    bctx.fill();
}

/**
 * Sanalika'nın İkonik Sarı-Siyah Açılı Kaldırım Bordür Taşları
 */
function drawSanalikaCurbStones(bctx, width, height) {
    function drawCurbLine(x1, y1, x2, y2, curbWidth, blockLen) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        let len = Math.hypot(dx, dy);
        let count = Math.floor(len / blockLen);
        let ux = dx / len;
        let uy = dy / len;
        // Normal vector (kaldırıma dik)
        let nx = -uy * curbWidth;
        let ny = ux * curbWidth;

        for (let i = 0; i < count; i++) {
            let startT = (i * blockLen) / len;
            let endT = Math.min(1, ((i + 1) * blockLen) / len);

            let sx = x1 + dx * startT;
            let sy = y1 + dy * startT;
            let ex = x1 + dx * endT;
            let ey = y1 + dy * endT;

            let isYellow = (i % 2 === 0);
            bctx.fillStyle = isYellow ? "#facc15" : "#1e293b";

            bctx.beginPath();
            bctx.moveTo(sx, sy);
            bctx.lineTo(ex, ey);
            bctx.lineTo(ex + nx, ey + ny);
            bctx.lineTo(sx + nx, sy + ny);
            bctx.closePath();
            bctx.fill();

            // Bordür taşı kenar parıltısı ve gölgesi (3D Hissiyat)
            bctx.strokeStyle = isYellow ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)";
            bctx.lineWidth = 1;
            bctx.stroke();
        }
    }

    // 1. Cadde Üst Bordür
    drawCurbLine(-50, 195, 640, 465, -8, 22);
    drawCurbLine(840, 405, width + 50, 775, -8, 22);

    // 1. Cadde Alt Bordür
    drawCurbLine(-50, 355, 710, 645, 8, 22);
    drawCurbLine(910, 585, width + 50, 935, 8, 22);

    // 10. Cadde Sol Bordür
    drawCurbLine(35, height + 75, 635, 475, -8, 22);
    drawCurbLine(835, 405, 1115, 155, -8, 22);

    // 10. Cadde Sağ Bordür
    drawCurbLine(165, height + 85, 715, 645, 8, 22);
    drawCurbLine(915, 585, 1245, 245, 8, 22);
}

/**
 * İzometrik Yaya Geçitleri (Zebra Crossings)
 */
function drawIsometricCrosswalks(bctx) {
    bctx.fillStyle = "#ffffff";

    // 1. Cadde Batı Yaya Geçidi (x: 590..650, y: 440..510)
    for (let i = 0; i < 7; i++) {
        let ox = 580 + i * 11;
        let oy = 430 + i * 5;
        bctx.beginPath();
        bctx.moveTo(ox, oy);
        bctx.lineTo(ox + 16, oy + 7);
        bctx.lineTo(ox - 30, oy + 85);
        bctx.lineTo(ox - 46, oy + 78);
        bctx.closePath();
        bctx.fill();
    }

    // 1. Cadde Doğu Yaya Geçidi (x: 830..900, y: 500..570)
    for (let i = 0; i < 7; i++) {
        let ox = 840 + i * 11;
        let oy = 490 + i * 5;
        bctx.beginPath();
        bctx.moveTo(ox, oy);
        bctx.lineTo(ox + 16, oy + 7);
        bctx.lineTo(ox - 30, oy + 85);
        bctx.lineTo(ox - 46, oy + 78);
        bctx.closePath();
        bctx.fill();
    }
}

/**
 * Sahil & Deniz Bölümü (Sağ Alt Köşe)
 */
function drawStaticBeachSection(bctx, isNight) {
    // Kumsal Açık Altın Sarısı
    let sandGrad = bctx.createLinearGradient(1040, 560, 1600, 960);
    sandGrad.addColorStop(0, isNight ? "#785c37" : "#fef08a");
    sandGrad.addColorStop(0.5, isNight ? "#5c4323" : "#fde047");
    sandGrad.addColorStop(1, isNight ? "#453218" : "#facc15");

    bctx.fillStyle = sandGrad;
    bctx.beginPath();
    bctx.moveTo(1040, 680);
    bctx.quadraticCurveTo(1200, 640, 1400, 700);
    bctx.quadraticCurveTo(1520, 740, 1600, 730);
    bctx.lineTo(1600, 960);
    bctx.lineTo(1040, 960);
    bctx.closePath();
    bctx.fill();

    // Turkuaz Deniz Alanı
    let seaGrad = bctx.createLinearGradient(1250, 780, 1600, 960);
    seaGrad.addColorStop(0, isNight ? "#082f49" : "#0284c7");
    seaGrad.addColorStop(0.5, isNight ? "#0369a1" : "#0ea5e9");
    seaGrad.addColorStop(1, isNight ? "#075985" : "#38bdf8");

    bctx.fillStyle = seaGrad;
    bctx.beginPath();
    bctx.moveTo(1250, 780);
    bctx.quadraticCurveTo(1380, 750, 1600, 800);
    bctx.lineTo(1600, 960);
    bctx.lineTo(1250, 960);
    bctx.closePath();
    bctx.fill();

    // Ahşap Balıkçı İskelesi & Tekne Bağlama Direği (x: 1350, y: 770)
    bctx.fillStyle = "#78350f";
    bctx.fillRect(1340, 760, 60, 14);
    bctx.fillStyle = "#92400e";
    bctx.fillRect(1340, 774, 60, 6);
    // İskele kazıkları
    bctx.fillStyle = "#451a03";
    bctx.fillRect(1344, 780, 8, 25);
    bctx.fillRect(1388, 780, 8, 25);

    // Bağlı Ahşap Balıkçı Teknesi (Sanalika Screenshot'taki ikonik tekne)
    let boatX = 1410, boatY = 785;
    bctx.fillStyle = "rgba(0,0,0,0.25)";
    bctx.beginPath();
    bctx.ellipse(boatX + 45, boatY + 28, 48, 14, 0, 0, Math.PI * 2);
    bctx.fill();

    // Tekne gövdesi (Turkuaz & Beyaz bordalı)
    bctx.fillStyle = "#0284c7";
    bctx.beginPath();
    bctx.moveTo(boatX, boatY + 16);
    bctx.quadraticCurveTo(boatX + 45, boatY - 4, boatX + 90, boatY + 14);
    bctx.quadraticCurveTo(boatX + 75, boatY + 32, boatX + 15, boatY + 30);
    bctx.closePath();
    bctx.fill();
    bctx.strokeStyle = "#ffffff";
    bctx.lineWidth = 3;
    bctx.stroke();

    // Tekne içi ahşap oturaklar
    bctx.fillStyle = "#b45309";
    bctx.fillRect(boatX + 25, boatY + 14, 40, 8);
    // Tekne burnu bayrağı
    bctx.strokeStyle = "#64748b";
    bctx.lineWidth = 2;
    bctx.beginPath();
    bctx.moveTo(boatX + 85, boatY + 10);
    bctx.lineTo(boatX + 85, boatY - 14);
    bctx.stroke();
    bctx.fillStyle = "#ef4444";
    bctx.beginPath();
    bctx.moveTo(boatX + 85, boatY - 14);
    bctx.lineTo(boatX + 70, boatY - 8);
    bctx.lineTo(boatX + 85, boatY - 2);
    bctx.closePath();
    bctx.fill();

    // Kırmızı-Beyaz Çizgili Plaj Şemsiyeleri
    drawSanalikaBeachUmbrella(bctx, 1180, 710, 42);
    drawSanalikaBeachUmbrella(bctx, 1290, 730, 36);

    // Ahşap Şezlonglar (Sittable)
    drawBeachLounger(bctx, 1220, 760, 42, 20);
    drawBeachLounger(bctx, 1260, 810, 42, 20);
    drawBeachLounger(bctx, 1330, 840, 42, 20);
}

function drawSanalikaBeachUmbrella(bctx, x, y, r) {
    // Gölge
    bctx.fillStyle = "rgba(0,0,0,0.2)";
    bctx.beginPath();
    bctx.ellipse(x + 12, y + 25, r * 0.8, r * 0.4, 0, 0, Math.PI * 2);
    bctx.fill();

    // Direk
    bctx.strokeStyle = "#e2e8f0";
    bctx.lineWidth = 4;
    bctx.beginPath();
    bctx.moveTo(x, y + 20);
    bctx.lineTo(x, y);
    bctx.stroke();

    // Şemsiye kubbesi (Kırmızı & Beyaz dilimler)
    let slices = 8;
    for (let i = 0; i < slices; i++) {
        let startAngle = (i * Math.PI) / slices;
        let endAngle = ((i + 1) * Math.PI) / slices;
        bctx.fillStyle = (i % 2 === 0) ? "#ef4444" : "#f8fafc";
        bctx.beginPath();
        bctx.moveTo(x, y);
        bctx.arc(x, y, r, Math.PI + startAngle, Math.PI + endAngle);
        bctx.closePath();
        bctx.fill();
    }
    // Şemsiye tepesi topuzu
    bctx.fillStyle = "#fbbf24";
    bctx.beginPath();
    bctx.arc(x, y - 2, 4, 0, Math.PI * 2);
    bctx.fill();
}

function drawBeachLounger(bctx, x, y, w, h) {
    // Şezlong Ahşap Gövde
    bctx.fillStyle = "#b45309";
    bctx.beginPath();
    bctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
    bctx.fill();
    // Mavi Minder
    bctx.fillStyle = "#38bdf8";
    bctx.beginPath();
    bctx.roundRect(x - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4, 3);
    bctx.fill();
    // Beyaz Havlu
    bctx.fillStyle = "#ffffff";
    bctx.fillRect(x - w / 2 + 4, y - h / 2 + 3, 10, h - 6);
}

/**
 * Sonbahar Festival Parkı ("MERHABA SONBAHAR")
 */
function drawStaticAutumnPark(bctx, isNight) {
    let px = 760, py = 80, pw = 340, ph = 240;

    // Park Çim Alanı (Sonbahar yeşili & dökülen altın yapraklar)
    bctx.fillStyle = isNight ? "#14532d" : "#4ade80";
    bctx.beginPath();
    bctx.roundRect(px, py, pw, ph, 16);
    bctx.fill();

    // Çim dokusu & sarı yaprak benekleri
    bctx.fillStyle = isNight ? "#166534" : "#86efac";
    bctx.fillRect(px + 4, py + 4, pw - 8, ph - 8);

    // Dökülmüş sonbahar yaprakları
    let leafColors = ["#ea580c", "#d97706", "#f59e0b", "#b45309", "#ef4444"];
    for (let i = 0; i < 45; i++) {
        let lx = px + 15 + ((i * 37) % (pw - 30));
        let ly = py + 15 + ((i * 53) % (ph - 30));
        bctx.fillStyle = leafColors[i % leafColors.length];
        bctx.beginPath();
        bctx.ellipse(lx, ly, 4, 2.5, i * 0.4, 0, Math.PI * 2);
        bctx.fill();
    }

    // Beyaz Ahşap Çitler (Park Çevresi - Sanalika Screenshot'taki gibi)
    bctx.strokeStyle = "#ffffff";
    bctx.lineWidth = 3;
    // Yatay kirişler
    bctx.beginPath();
    bctx.moveTo(px + 10, py + 20);
    bctx.lineTo(px + pw - 10, py + 20);
    bctx.moveTo(px + 10, py + ph - 10);
    bctx.lineTo(px + pw - 10, py + ph - 10);
    bctx.stroke();
    // Düşey çit parmaklıkları
    for (let cx = px + 15; cx < px + pw - 15; cx += 18) {
        bctx.fillStyle = "#ffffff";
        bctx.fillRect(cx, py + 8, 5, 20);
        bctx.fillRect(cx, py + ph - 22, 5, 20);
    }

    // "MERHABA SONBAHAR" Büyük Festival Panosu (x: 930, y: 110)
    let signX = 930, signY = 110;
    bctx.fillStyle = "#78350f";
    bctx.fillRect(signX + 38, signY + 70, 8, 35); // Ahşap ayak
    // Kara Tahta Zemin & Çiçekli Çerçeve
    bctx.fillStyle = "#1e293b";
    bctx.beginPath();
    bctx.roundRect(signX, signY, 84, 72, 8);
    bctx.fill();
    bctx.strokeStyle = "#f59e0b";
    bctx.lineWidth = 3;
    bctx.stroke();

    // Tahta yazısı
    bctx.fillStyle = "#fbbf24";
    bctx.font = "bold 11px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🍂 Merhaba", signX + 42, signY + 30);
    bctx.fillText("Sonbahar 🍂", signX + 42, signY + 48);

    // Büyük Yapraklı Festival Gölgeliği / Çadırı (x: 830, y: 130)
    let tentX = 830, tentY = 135;
    bctx.fillStyle = "rgba(0,0,0,0.2)";
    bctx.beginPath();
    bctx.ellipse(tentX + 25, tentY + 50, 45, 18, 0, 0, Math.PI * 2);
    bctx.fill();

    bctx.fillStyle = "#ea580c";
    bctx.beginPath();
    bctx.arc(tentX + 25, tentY + 20, 36, 0, Math.PI * 2);
    bctx.fill();
    bctx.fillStyle = "#f59e0b";
    bctx.beginPath();
    bctx.arc(tentX + 25, tentY + 20, 24, 0, Math.PI * 2);
    bctx.fill();

    // Balkabakları (Pumpkins - Sanalika Festival Süslemeleri)
    let pumpkins = [
        { x: px + 40, y: py + 30, r: 9 },
        { x: px + 65, y: py + 32, r: 12 },
        { x: px + 90, y: py + 28, r: 8 },
        { x: px + 210, y: py + 215, r: 11 },
        { x: px + 235, y: py + 218, r: 13 },
        { x: px + 260, y: py + 214, r: 9 }
    ];
    pumpkins.forEach(p => {
        bctx.fillStyle = "#ea580c";
        bctx.beginPath();
        bctx.ellipse(p.x, p.y, p.r, p.r * 0.85, 0, 0, Math.PI * 2);
        bctx.fill();
        bctx.fillStyle = "#c2410c";
        bctx.beginPath();
        bctx.ellipse(p.x, p.y, p.r * 0.6, p.r * 0.85, 0, 0, Math.PI * 2);
        bctx.fill();
        // Sapı
        bctx.fillStyle = "#15803d";
        bctx.fillRect(p.x - 1.5, p.y - p.r - 2, 3, 4);
    });

    // Park Bankı (Sittable: Sonbahar Park Bankı)
    drawSanalikaParkBench(bctx, 790, 335, 48);
}

/**
 * 5 Kiralık Binaların Statik Mimarisi
 */
function drawStaticVenues(bctx, isNight) {
    // 1. 🏢 LİDYA PLAZA (Sol Üst: x: 70, y: 80, w: 310, h: 220)
    let lp = KIRALIK_VENUES.lidya.bounds;
    drawNeoclassicalPlaza(bctx, lp.x, lp.y, lp.w, lp.h, isNight);

    // 2. 🍷 CADDE BISTRO (Sol Orta: x: 30, y: 390, w: 260, h: 210)
    let cb = KIRALIK_VENUES.bistro.bounds;
    drawModernBistro(bctx, cb.x, cb.y, cb.w, cb.h, isNight);

    // 3. 👗 MODA BUTİK (Üst Orta: x: 440, y: 50, w: 260, h: 180)
    let mb = KIRALIK_VENUES.butik.bounds;
    drawChicBoutique(bctx, mb.x, mb.y, mb.w, mb.h, isNight);

    // 4. 🎬 METROPOL SİNEMASI (Sağ Üst: x: 1140, y: 50, w: 340, h: 210)
    let ms = KIRALIK_VENUES.sinema.bounds;
    drawArtDecoCinema(bctx, ms.x, ms.y, ms.w, ms.h, isNight);

    // 5. ✨ VIP CLUB (Sol Alt: x: 420, y: 720, w: 290, h: 190)
    let vc = KIRALIK_VENUES.vip_lounge.bounds;
    drawVipClub(bctx, vc.x, vc.y, vc.w, vc.h, isNight);
}

// 1. Bina: Lidya Plaza & Rezidans
function drawNeoclassicalPlaza(bctx, x, y, w, h, isNight) {
    // Gölge
    bctx.fillStyle = "rgba(0,0,0,0.3)";
    bctx.fillRect(x + 10, y + 10, w, h);

    // Klasik Mermer Taş Gövde
    bctx.fillStyle = isNight ? "#1e293b" : "#e2e8f0";
    bctx.beginPath();
    bctx.roundRect(x, y, w, h, [12, 12, 0, 0]);
    bctx.fill();
    bctx.strokeStyle = isNight ? "#475569" : "#cbd5e1";
    bctx.lineWidth = 2.5;
    bctx.stroke();

    // Üst Çatı Alınlığı (Triangular Pediment)
    bctx.fillStyle = isNight ? "#0f172a" : "#cbd5e1";
    bctx.beginPath();
    bctx.moveTo(x - 5, y);
    bctx.lineTo(x + w / 2, y - 28);
    bctx.lineTo(x + w + 5, y);
    bctx.closePath();
    bctx.fill();
    bctx.strokeStyle = "#94a3b8";
    bctx.lineWidth = 2;
    bctx.stroke();

    // Mermer Sütunlar (Colonnade)
    let colW = 16;
    for (let cx = x + 30; cx < x + w - 30; cx += 45) {
        bctx.fillStyle = isNight ? "#334155" : "#f8fafc";
        bctx.fillRect(cx, y + 42, colW, h - 44);
        bctx.fillStyle = isNight ? "#475569" : "#e2e8f0";
        bctx.fillRect(cx - 2, y + 38, colW + 4, 6); // Başlık
        bctx.fillRect(cx - 2, y + h - 6, colW + 4, 6); // Kaide
    }

    // Cam Giriş Kapısı & Lobi
    bctx.fillStyle = isNight ? "#0284c7" : "#38bdf8";
    bctx.fillRect(x + w / 2 - 32, y + h - 70, 64, 70);
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 2;
    bctx.strokeRect(x + w / 2 - 32, y + h - 70, 64, 70);

    // Işıklı Tabela & Kiralık Rozeti
    bctx.fillStyle = "#0f172a";
    bctx.fillRect(x + 20, y + 10, w - 40, 26);
    bctx.fillStyle = "#38bdf8";
    bctx.font = "bold 13px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🏢 LİDYA PLAZA", x + w / 2, y + 28);

    drawKiralikBadge(bctx, x + w / 2, y + 78);
}

// 2. Bina: Cadde Bistro & Lounge (Sanalika Mor/Magenta Binası)
function drawModernBistro(bctx, x, y, w, h, isNight) {
    bctx.fillStyle = "rgba(0,0,0,0.3)";
    bctx.fillRect(x + 10, y + 10, w, h);

    // Canlı Mor & Magenta Gövde (Screenshot'taki gibi)
    bctx.fillStyle = isNight ? "#4a044e" : "#86198f";
    bctx.beginPath();
    bctx.roundRect(x, y, w, h, 10);
    bctx.fill();

    // Dikey Akordeon Paneller
    bctx.strokeStyle = isNight ? "#701a75" : "#a21caf";
    bctx.lineWidth = 2;
    for (let px = x + 18; px < x + w - 18; px += 22) {
        bctx.beginPath();
        bctx.moveTo(px, y + 42);
        bctx.lineTo(px, y + h);
        bctx.stroke();
    }

    // Giriş Cam Kapısı
    bctx.fillStyle = isNight ? "#0284c7" : "#67e8f9";
    bctx.fillRect(x + w - 65, y + h - 75, 50, 75);
    bctx.strokeStyle = "#ffffff";
    bctx.lineWidth = 2;
    bctx.strokeRect(x + w - 65, y + h - 75, 50, 75);

    // Tabela
    bctx.fillStyle = "#4a044e";
    bctx.fillRect(x + 15, y + 10, w - 30, 26);
    bctx.fillStyle = "#f472b6";
    bctx.font = "bold 13px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🍷 CADDE BISTRO", x + w / 2, y + 28);

    drawKiralikBadge(bctx, x + w / 2, y + 78);
}

// 3. Bina: Moda Butik
function drawChicBoutique(bctx, x, y, w, h, isNight) {
    bctx.fillStyle = "rgba(0,0,0,0.3)";
    bctx.fillRect(x + 8, y + 8, w, h);

    // Pudra / Krem & Altın Çerçeve
    bctx.fillStyle = isNight ? "#042f2e" : "#0d9488";
    bctx.beginPath();
    bctx.roundRect(x, y, w, h, 8);
    bctx.fill();

    // Çizgili Tente (Turkuaz - Beyaz)
    let stripeW = w / 10;
    for (let i = 0; i < 10; i++) {
        bctx.fillStyle = (i % 2 === 0) ? "#2dd4bf" : "#ffffff";
        bctx.fillRect(x + i * stripeW, y + 36, stripeW, 16);
    }

    // Vitrin Pencereleri
    bctx.fillStyle = isNight ? "rgba(15,23,42,0.8)" : "#f0fdfa";
    bctx.fillRect(x + 20, y + 62, 80, 70);
    bctx.fillRect(x + w - 100, y + 62, 80, 70);
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 1.5;
    bctx.strokeRect(x + 20, y + 62, 80, 70);
    bctx.strokeRect(x + w - 100, y + 62, 80, 70);

    // Tabela
    bctx.fillStyle = "#134e4a";
    bctx.fillRect(x + 15, y + 8, w - 30, 24);
    bctx.fillStyle = "#5eead4";
    bctx.font = "bold 12.5px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("👗 MODA BUTİK", x + w / 2, y + 25);

    drawKiralikBadge(bctx, x + w / 2, y + 88);
}

// 4. Bina: Metropol Sineması & Tiyatro
function drawArtDecoCinema(bctx, x, y, w, h, isNight) {
    bctx.fillStyle = "rgba(0,0,0,0.3)";
    bctx.fillRect(x + 10, y + 10, w, h);

    // Koyu Kırmızı / Bordo & Altın Sarısı Art Deco
    bctx.fillStyle = isNight ? "#450a0a" : "#991b1b";
    bctx.beginPath();
    bctx.roundRect(x, y, w, h, 12);
    bctx.fill();

    // Tavan Işık Bandı & Ampuller
    bctx.fillStyle = "#facc15";
    for (let lx = x + 15; lx < x + w - 15; lx += 14) {
        bctx.beginPath();
        bctx.arc(lx, y + 38, 3.5, 0, Math.PI * 2);
        bctx.fill();
    }

    // Sinema Afiş Panoları
    bctx.fillStyle = "#0f172a";
    bctx.fillRect(x + 25, y + 55, 65, 85);
    bctx.fillRect(x + w - 90, y + 55, 65, 85);
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 2;
    bctx.strokeRect(x + 25, y + 55, 65, 85);
    bctx.strokeRect(x + w - 90, y + 55, 65, 85);

    bctx.fillStyle = "#fde047";
    bctx.font = "bold 9px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("YAKINDA", x + 57, y + 100);
    bctx.fillText("VİZYONDA", x + w - 57, y + 100);

    // Tabela
    bctx.fillStyle = "#1e1b4b";
    bctx.fillRect(x + 20, y + 8, w - 40, 26);
    bctx.fillStyle = "#facc15";
    bctx.font = "bold 13px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🎬 METROPOL SİNEMA & TİYATRO", x + w / 2, y + 26);

    drawKiralikBadge(bctx, x + w / 2, y + 85);
}

// 5. Bina: VIP Lounge & Club
function drawVipClub(bctx, x, y, w, h, isNight) {
    bctx.fillStyle = "rgba(0,0,0,0.3)";
    bctx.fillRect(x + 8, y + 8, w, h);

    // Koyu Obsidyen & Neon Mavi
    bctx.fillStyle = isNight ? "#030712" : "#0f172a";
    bctx.beginPath();
    bctx.roundRect(x, y, w, h, 10);
    bctx.fill();
    bctx.strokeStyle = "#38bdf8";
    bctx.lineWidth = 2.5;
    bctx.stroke();

    // Neon Şeritler
    bctx.strokeStyle = "#a855f7";
    bctx.lineWidth = 2;
    bctx.beginPath();
    bctx.moveTo(x + 10, y + 40);
    bctx.lineTo(x + w - 10, y + 40);
    bctx.stroke();

    // Tabela
    bctx.fillStyle = "#0284c7";
    bctx.fillRect(x + 20, y + 10, w - 40, 24);
    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 12.5px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("✨ VIP METROPOL CLUB", x + w / 2, y + 27);

    drawKiralikBadge(bctx, x + w / 2, y + 82);
}

/**
 * Yanıp Sönen Kiralık Rozeti (Badge)
 */
function drawKiralikBadge(bctx, cx, cy) {
    bctx.fillStyle = "rgba(220, 38, 38, 0.95)";
    bctx.beginPath();
    bctx.roundRect(cx - 72, cy - 14, 144, 28, 14);
    bctx.fill();
    bctx.strokeStyle = "#fef08a";
    bctx.lineWidth = 2;
    bctx.stroke();

    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 11px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🔴 KİRALIK MEKAN", cx, cy + 4);
}

/**
 * Otobüs Durağı, Sokak Lambaları, Banklar ve Tabelalar
 */
function drawStaticStreetProps(bctx, isNight) {
    // 10. Cadde Otobüs Durağı (x: 410, y: 550, w: 90, h: 55)
    let bsX = 410, bsY = 550;
    bctx.fillStyle = "rgba(15, 23, 42, 0.6)";
    bctx.beginPath();
    bctx.roundRect(bsX, bsY, 90, 55, 6);
    bctx.fill();
    bctx.strokeStyle = "#38bdf8";
    bctx.lineWidth = 2;
    bctx.stroke();
    // Durak Sarı Çatısı
    bctx.fillStyle = "#facc15";
    bctx.fillRect(bsX - 4, bsY - 6, 98, 8);
    // Durak İsmi
    bctx.fillStyle = "#0f172a";
    bctx.font = "bold 8.5px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🚏 10. CADDE DURAĞI", bsX + 45, bsY + 14);
    // Durak İçi Bank (Sittable: Durak Bankı)
    drawSanalikaParkBench(bctx, 440, 585, 42);

    // Klasik Sanalika Mavi Yön Tabelaları (Screenshot'taki tabelalar)
    drawSanalikaStreetSign(bctx, 320, 680, "⬅ 10. CADDE", "left");
    drawSanalikaStreetSign(bctx, 1180, 480, "⬆ 1. CADDE", "up");
    drawSpeedLimitSign(bctx, 1140, 520, "60");

    // Park Bankları (Sittable)
    drawSanalikaParkBench(bctx, 520, 380, 46);
    drawSanalikaParkBench(bctx, 910, 560, 46);

    // Klasik Sokak Lambaları
    drawSanalikaLamp(bctx, 240, 310, isNight);
    drawSanalikaLamp(bctx, 600, 410, isNight);
    drawSanalikaLamp(bctx, 890, 370, isNight);
    drawSanalikaLamp(bctx, 1260, 680, isNight);
    drawSanalikaLamp(bctx, 560, 680, isNight);

    // Yangın Musluğu (Red Fire Hydrant)
    drawFireHydrant(bctx, 720, 460);

    // Ağaçlar
    drawSanalikaTree(bctx, 360, 210);
    drawSanalikaTree(bctx, 1080, 410);
    drawSanalikaTree(bctx, 360, 710);
}

function drawSanalikaStreetSign(bctx, x, y, text, dir) {
    bctx.fillStyle = "#475569";
    bctx.fillRect(x + 3, y, 4, 34); // Direk

    bctx.fillStyle = "#0284c7";
    bctx.beginPath();
    bctx.roundRect(x - 35, y - 18, 80, 18, 4);
    bctx.fill();
    bctx.strokeStyle = "#ffffff";
    bctx.lineWidth = 1.5;
    bctx.stroke();

    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 9.5px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText(text, x + 5, y - 5);
}

function drawSpeedLimitSign(bctx, x, y, speed) {
    bctx.fillStyle = "#475569";
    bctx.fillRect(x + 2, y, 4, 30);

    bctx.fillStyle = "#ffffff";
    bctx.beginPath();
    bctx.arc(x + 4, y - 8, 12, 0, Math.PI * 2);
    bctx.fill();
    bctx.strokeStyle = "#ef4444";
    bctx.lineWidth = 3;
    bctx.stroke();

    bctx.fillStyle = "#0f172a";
    bctx.font = "bold 11px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText(speed, x + 4, y - 4);
}

function drawSanalikaParkBench(bctx, x, y, w) {
    bctx.fillStyle = "rgba(0,0,0,0.2)";
    bctx.fillRect(x - w / 2, y + 10, w, 6);

    // Ayaklar
    bctx.fillStyle = "#1e293b";
    bctx.fillRect(x - w / 2 + 4, y + 2, 4, 10);
    bctx.fillRect(x + w / 2 - 8, y + 2, 4, 10);

    // Ahşap Oturak & Sırtlık
    bctx.fillStyle = "#92400e";
    bctx.fillRect(x - w / 2, y + 2, w, 6);
    bctx.fillStyle = "#b45309";
    bctx.fillRect(x - w / 2, y - 6, w, 7);
}

function drawSanalikaLamp(bctx, x, y, isNight) {
    // Direk
    bctx.fillStyle = "#0f172a";
    bctx.fillRect(x - 2, y - 40, 4, 40);
    bctx.fillRect(x - 5, y - 2, 10, 4);

    // Fener Kafası
    bctx.fillStyle = isNight ? "#fef08a" : "#fef9c3";
    bctx.beginPath();
    bctx.arc(x, y - 44, 7, 0, Math.PI * 2);
    bctx.fill();
    bctx.strokeStyle = "#0f172a";
    bctx.lineWidth = 2;
    bctx.stroke();

    // Gece Işık Hüzmesi (Soft Light Cone)
    if (isNight) {
        let lGrad = bctx.createRadialGradient(x, y - 44, 4, x, y + 10, 55);
        lGrad.addColorStop(0, "rgba(254, 240, 138, 0.35)");
        lGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
        bctx.fillStyle = lGrad;
        bctx.beginPath();
        bctx.arc(x, y + 5, 55, 0, Math.PI * 2);
        bctx.fill();
    }
}

function drawFireHydrant(bctx, x, y) {
    bctx.fillStyle = "#dc2626";
    bctx.fillRect(x - 4, y - 14, 8, 14);
    bctx.fillRect(x - 7, y - 10, 14, 5);
    bctx.beginPath();
    bctx.arc(x, y - 14, 4, 0, Math.PI * 2);
    bctx.fill();
}

function drawSanalikaTree(bctx, x, y) {
    // Gölge
    bctx.fillStyle = "rgba(0,0,0,0.2)";
    bctx.beginPath();
    bctx.ellipse(x, y + 6, 22, 10, 0, 0, Math.PI * 2);
    bctx.fill();

    // Gövde
    bctx.fillStyle = "#78350f";
    bctx.fillRect(x - 4, y - 26, 8, 26);

    // Yeşil Taç
    bctx.fillStyle = "#15803d";
    bctx.beginPath();
    bctx.arc(x, y - 38, 22, 0, Math.PI * 2);
    bctx.arc(x - 12, y - 32, 16, 0, Math.PI * 2);
    bctx.arc(x + 12, y - 32, 16, 0, Math.PI * 2);
    bctx.fill();
}


/**
 * DİNAMİK / ANİMASYONLU ÇİZİM DÖNGÜSÜ (60 FPS)
 * - Deniz dalgaları, parıltılar, hover kontrolleri
 */
let hoveredKiralikKey = null;

function drawSanalikaCaddeEnvironment() {
    let bg = bgCache.getCanvas('sanalika_cadde', SANALIKA_WORLD_W, SANALIKA_WORLD_H);
    ctx.drawImage(bg, 0, 0);

    let now = Date.now();

    // 1. Deniz Dalgaları & Köpük Animasyonu (Sağ alt köşe)
    let waveOffset = (now / 400) % 15;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1.5;
    for (let wy = 810; wy < 940; wy += 35) {
        ctx.beginPath();
        ctx.moveTo(1320 + waveOffset, wy);
        ctx.bezierCurveTo(1380, wy - 6, 1450, wy + 6, 1580, wy - 4);
        ctx.stroke();
    }

    // Balıkçı Şamandırası (Buoy - Su üstünde nazikçe sallanan şamandıra)
    let buoyX = 1490;
    let buoyY = 880 + Math.sin(now / 350) * 3;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(buoyX, buoyY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(buoyX - 5, buoyY - 2, 10, 4);

    // 2. Kiralık Binaların Yanıp Sönen Neon Çerçevesi (Pulse Animasyonu)
    let pulse = (Math.sin(now / 250) + 1) / 2;

    // Hover Tespiti: Mouse world koordinatlarında mı?
    // canvasMouseX/Y screen koordinatlarıdır. sanalikaCamera eklenmelidir.
    let worldMouseX = window.canvasMouseX + (window.sanalikaCamera ? window.sanalikaCamera.x : 0);
    let worldMouseY = window.canvasMouseY + (window.sanalikaCamera ? window.sanalikaCamera.y : 0);

    let newlyHovered = null;
    for (let k in KIRALIK_VENUES) {
        let v = KIRALIK_VENUES[k];
        let b = v.bounds;
        if (worldMouseX >= b.x && worldMouseX <= b.x + b.w && worldMouseY >= b.y && worldMouseY <= b.y + b.h) {
            newlyHovered = k;
            break;
        }
    }

    hoveredKiralikKey = newlyHovered;

    // Hover edilen binaya tatlı bir neon parlama efekti ver
    if (hoveredKiralikKey && KIRALIK_VENUES[hoveredKiralikKey]) {
        let v = KIRALIK_VENUES[hoveredKiralikKey];
        let b = v.bounds;
        ctx.save();
        ctx.strokeStyle = `rgba(250, 204, 21, ${0.5 + pulse * 0.5})`;
        ctx.lineWidth = 3.5;
        ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);

        // Bilgi etiketi (Tooltip)
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.beginPath();
        ctx.roundRect(b.x + b.w / 2 - 80, b.y - 28, 160, 24, 6);
        ctx.fill();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#fde047";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🔍 İlanı İncelemek İçin Tıkla", b.x + b.w / 2, b.y - 12);
        ctx.restore();

        setGameCursor('pointer');
    } else {
        setGameCursor('default');
    }
}

/**
 * Tıklama Olayı (World Coordinate Click)
 */
function handleSanalikaCaddeClick(worldX, worldY) {
    for (let k in KIRALIK_VENUES) {
        let v = KIRALIK_VENUES[k];
        let b = v.bounds;
        if (worldX >= b.x && worldX <= b.x + b.w && worldY >= b.y && worldY <= b.y + b.h) {
            openKiralikPropertyModal(k);
            return true;
        }
    }

    // Sonbahar Parkı Pano Tıklaması
    if (worldX >= 920 && worldX <= 1020 && worldY >= 100 && worldY <= 200) {
        if (typeof showSocialNotificationToast === 'function') {
            showSocialNotificationToast('🍂', 'Sonbahar Festivali', '1. Cadde Sonbahar Festival Alanındasın! Balkabakları ve sıcak içecekler hazır.');
        }
        return true;
    }

    // Balıkçı Teknesi Tıklaması
    if (worldX >= 1390 && worldX <= 1520 && worldY >= 770 && worldY <= 830) {
        if (typeof showSocialNotificationToast === 'function') {
            showSocialNotificationToast('⚓', 'Balıkçı İskelesi', '1. Cadde Sahil İskelesi. Yakında buradan açık deniz turları başlayacak!');
        }
        return true;
    }

    return false;
}

/**
 * Kiralık Mülk Bilgi Modalını Açar
 */
function openKiralikPropertyModal(venueKey) {
    let venue = KIRALIK_VENUES[venueKey];
    if (!venue) return;

    if (window.playSound) window.playSound('uiClick');

    let modal = document.getElementById('kiralikPropertyModal');
    if (!modal) {
        // Dinamik olarak oluştur
        modal = document.createElement('div');
        modal.id = 'kiralikPropertyModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px);
            z-index: 10050; display: flex; align-items: center; justify-content: center;
        `;
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 2px solid #38bdf8; border-radius: 20px; padding: 26px; max-width: 480px; width: 92%; color: white; box-shadow: 0 25px 60px rgba(0,0,0,0.85); position: relative; animation: popIn 0.25s ease-out;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 22px;">🏢</div>
                    <div>
                        <div style="font-weight: 800; font-size: 17px; color: #f8fafc;">${venue.name}</div>
                        <div style="font-size: 12px; color: #38bdf8; font-weight: 600;">${venue.type}</div>
                    </div>
                </div>
                <button type="button" onclick="closeKiralikPropertyModal()" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <span style="background: rgba(220, 38, 38, 0.2); border: 1px solid #ef4444; color: #fca5a5; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">🔴 KİRALIK</span>
                <span style="background: rgba(14, 165, 233, 0.2); border: 1px solid #0ea5e9; color: #7dd3fc; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px;">📐 ${venue.area}</span>
                <span style="background: rgba(234, 179, 8, 0.2); border: 1px solid #eab308; color: #fde047; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px;">📍 1. Cadde</span>
            </div>

            <div style="background: rgba(0, 0, 0, 0.35); border-radius: 12px; padding: 14px; font-size: 13px; line-height: 1.6; color: #cbd5e1; margin-bottom: 18px; border: 1px solid rgba(255,255,255,0.06);">
                ${venue.desc}
            </div>

            <div style="background: rgba(30, 41, 59, 0.7); border: 1px dashed rgba(255,255,255,0.18); border-radius: 12px; padding: 12px 16px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; color: #94a3b8;">Temsili Kiralama Bedeli:</span>
                <span style="font-weight: 800; font-size: 15px; color: #facc15;">${venue.monthly}</span>
            </div>

            <div style="font-size: 11.5px; color: #94a3b8; margin-bottom: 18px; line-height: 1.5; text-align: center;">
                💡 Bu mekan Sanalika tarzı 1. Cadde genişleme projesi kapsamında hazırlanmıştır. İlerleyen güncellemelerde içine girilebilir işletmeler, mağazalar ve etkinlik kulüpleri faaliyete geçecektir!
            </div>

            <div style="display: flex; gap: 10px;">
                <button type="button" onclick="closeKiralikPropertyModal()" style="flex: 1; padding: 12px; border-radius: 10px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border: none; color: white; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);">Tamam, Anladım</button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeKiralikPropertyModal() {
    let modal = document.getElementById('kiralikPropertyModal');
    if (modal) modal.style.display = 'none';
}

// Window global referansları
if (typeof window !== 'undefined') {
    window.SANALIKA_WORLD_W = SANALIKA_WORLD_W;
    window.SANALIKA_WORLD_H = SANALIKA_WORLD_H;
    window.renderStaticSanalikaCaddeTo = renderStaticSanalikaCaddeTo;
    window.drawSanalikaCaddeEnvironment = drawSanalikaCaddeEnvironment;
    window.handleSanalikaCaddeClick = handleSanalikaCaddeClick;
    window.openKiralikPropertyModal = openKiralikPropertyModal;
    window.closeKiralikPropertyModal = closeKiralikPropertyModal;
}

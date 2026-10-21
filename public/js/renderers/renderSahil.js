// public/js/renderers/renderSahil.js - Martı Sahili ve Balıkçılık İskelesi Çizim Modülü
// --- 11. SAHİL VE DENİZ ÇİZİMİ (BEACH ENVIRONMENT - ÖNBELLEKLİ & AKICI) ---
function getBeachShoreX(y) {
    if (y >= 460) return 175 + (500 - y) * 0.9;
    if (y >= 400) return 211 + (460 - y) * 0.9;
    if (y >= 350) return 265 + (400 - y) * 1.1;
    if (y >= 300) return 320 + (350 - y) * 1.3;
    if (y >= 250) return 385 + (300 - y) * 1.45;
    if (y >= 200) return 458 + (250 - y) * 1.45;
    if (y >= 150) return 530 + (200 - y) * 1.8;
    if (y >= 120) return 620 + (150 - y) * 2.8;
    return 9999;
}
window.getBeachShoreX = getBeachShoreX;

const BEACH_SHELLS = [
    { x: 530, y: 340, c: '#fda4af', r: 3 },
    { x: 620, y: 410, c: '#fed7aa', r: 3.5 },
    { x: 470, y: 440, c: '#fbcfe8', r: 3 },
    { x: 690, y: 280, c: '#fef08a', r: 2.8 },
    { x: 740, y: 390, c: '#fed7aa', r: 3.2 },
    { x: 380, y: 460, c: '#fbcfe8', r: 3 },
    { x: 440, y: 360, c: '#fef08a', r: 2.5 }
];

const BEACH_STARFISH = [
    { x: 330, y: 410, c: '#f43f5e', rot: 0.3 },
    { x: 430, y: 290, c: '#fb923c', rot: 1.1 },
    { x: 510, y: 220, c: '#f43f5e', rot: -0.4 }
];

const PIER_PILINGS_X = [125, 195, 265, 335, 405, 475];

// A) DETAYLI HİNDİSTAN CEVİZİ PALMİYESİ ÇİZİCİ
function drawDetailedPalmTree(ctx, x, y, scale = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Kumsal Gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kıvrımlı Palmiye Gövdesi
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#451a03";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-15, -40, -18, -80, -2, -125);
    ctx.stroke();

    ctx.lineWidth = 10;
    ctx.strokeStyle = "#78350f";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-15, -40, -18, -80, -2, -125);
    ctx.stroke();

    // Gövde Boğum Çizgileri
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = 2;
    for (let i = 1; i <= 6; i++) {
        let t = i / 7;
        let by = -125 * t;
        let bx = -15 * Math.sin(t * Math.PI);
        ctx.beginPath();
        ctx.moveTo(bx - 5, by);
        ctx.lineTo(bx + 5, by);
        ctx.stroke();
    }

    // Taç Merkezi (x: -2, y: -125)
    let crownX = -2, crownY = -125;

    // Hindistan Cevizleri (4 adet altın kahve)
    ctx.fillStyle = "#713f12";
    [[-6, 4], [4, 2], [-2, 8], [6, 8]].forEach(cp => {
        ctx.beginPath();
        ctx.arc(crownX + cp[0], crownY + cp[1], 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    // 8 Adet Dolgun Yaprak Frond (Layered Emerald Leaves)
    const fronds = [
        { endX: -65, endY: -35, ctrlX: -45, ctrlY: -70 },
        { endX: 62, endY: -32, ctrlX: 42, ctrlY: -68 },
        { endX: -75, endY: 5, ctrlX: -55, ctrlY: -35 },
        { endX: 72, endY: 8, ctrlX: 52, ctrlY: -32 },
        { endX: -45, endY: -65, ctrlX: -25, ctrlY: -95 },
        { endX: 42, endY: -62, ctrlX: 22, ctrlY: -92 },
        { endX: -10, endY: -80, ctrlX: -8, ctrlY: -105 },
        { endX: 12, endY: -78, ctrlX: 10, ctrlY: -102 }
    ];

    fronds.forEach((f, idx) => {
        // Yaprak Ana Omurgası
        ctx.strokeStyle = (idx % 2 === 0) ? "#15803d" : "#16a34a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(crownX, crownY);
        ctx.quadraticCurveTo(crownX + f.ctrlX, crownY + f.ctrlY, crownX + f.endX, crownY + f.endY);
        ctx.stroke();

        // Yaprak Saçakları (Tüylü yeşil dalcıklar)
        ctx.strokeStyle = (idx % 2 === 0) ? "#22c55e" : "#4ade80";
        ctx.lineWidth = 1.5;
        for (let s = 0.2; s <= 0.9; s += 0.15) {
            let px = crownX + f.ctrlX * s * 0.8 + f.endX * (1 - s) * 0.3;
            let py = crownY + f.ctrlY * s * 0.8 + f.endY * (1 - s) * 0.3;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + (idx % 2 === 0 ? -7 : 7), py + 6);
            ctx.stroke();
        }
    });

    ctx.restore();
}

// B) TROPİK SAHİL KOKTEYL BARI
function drawTikiBeachBar(bctx, x, y, w, h) {
    bctx.save();
    // Bar Zemin Gölgesi
    bctx.fillStyle = "rgba(0,0,0,0.25)";
    bctx.beginPath();
    bctx.roundRect(x + 2, y + h - 4, w - 4, 10, 4);
    bctx.fill();

    // Bambu Ayaklar & Yan Duvarlar
    bctx.fillStyle = "#78350f";
    bctx.fillRect(x + 6, y + 20, w - 12, h - 22);
    bctx.strokeStyle = "#ca8a04";
    bctx.lineWidth = 1.5;
    bctx.strokeRect(x + 6, y + 20, w - 12, h - 22);

    // Dikey Bambu Çıtalar
    for (let bx = x + 14; bx < x + w - 10; bx += 12) {
        bctx.fillStyle = "#a16207";
        bctx.fillRect(bx, y + 20, 3, h - 22);
    }

    // Ahşap Servis Tezgahı
    bctx.fillStyle = "#92400e";
    bctx.beginPath();
    bctx.roundRect(x + 2, y + 24, w - 4, 10, 3);
    bctx.fill();
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 1;
    bctx.stroke();

    // Tezgahtaki İçecekler & Meyveler
    // Hindistan Cevizi Kokteyli (Pipetli)
    bctx.fillStyle = "#713f12";
    bctx.beginPath(); bctx.arc(x + 24, y + 20, 5, 0, Math.PI * 2); bctx.fill();
    bctx.strokeStyle = "#ef4444"; bctx.lineWidth = 1.5; // Kırmızı Pipet
    bctx.beginPath(); bctx.moveTo(x + 24, y + 17); bctx.lineTo(x + 28, y + 10); bctx.stroke();

    // Tropik Meyve Kasesi / Ananas
    bctx.fillStyle = "#eab308";
    bctx.beginPath(); bctx.roundRect(x + 48, y + 14, 10, 12, 3); bctx.fill();
    bctx.fillStyle = "#15803d";
    bctx.beginPath(); bctx.moveTo(x + 53, y + 14); bctx.lineTo(x + 50, y + 8); bctx.lineTo(x + 56, y + 8); bctx.closePath(); bctx.fill();

    // Renkli Sörf Tahtası (Bara Dayalı)
    bctx.fillStyle = "#06b6d4";
    bctx.beginPath();
    bctx.ellipse(x + w - 14, y + h / 2 + 6, 6, 22, -0.2, 0, Math.PI * 2);
    bctx.fill();
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 1.2;
    bctx.stroke();
    // Sörf Çizgisi
    bctx.strokeStyle = "#ffffff";
    bctx.lineWidth = 1.5;
    bctx.beginPath();
    bctx.moveTo(x + w - 16, y + h / 2 - 10);
    bctx.lineTo(x + w - 12, y + h / 2 + 20);
    bctx.stroke();

    // Saz / Hasır Çatı (Thatched Straw Roof Overhang)
    bctx.fillStyle = "#ca8a04";
    bctx.beginPath();
    bctx.moveTo(x - 6, y + 20);
    bctx.lineTo(x + w / 2, y - 4);
    bctx.lineTo(x + w + 6, y + 20);
    bctx.closePath();
    bctx.fill();

    bctx.fillStyle = "#eab308";
    bctx.beginPath();
    bctx.moveTo(x - 2, y + 18);
    bctx.lineTo(x + w / 2, y - 2);
    bctx.lineTo(x + w + 2, y + 18);
    bctx.closePath();
    bctx.fill();

    // Çatı Püskülleri
    bctx.strokeStyle = "#fef08a";
    bctx.lineWidth = 1.2;
    for (let rx = x - 6; rx <= x + w + 6; rx += 6) {
        bctx.beginPath();
        bctx.moveTo(rx, y + 19);
        bctx.lineTo(rx + 2, y + 25);
        bctx.stroke();
    }

    // Tabela
    bctx.fillStyle = "#1e293b";
    bctx.beginPath();
    bctx.roundRect(x + w / 2 - 38, y + 4, 76, 15, 4);
    bctx.fill();
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 1;
    bctx.stroke();

    bctx.fillStyle = "#facc15";
    bctx.font = "bold 8.5px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🍹 TROPİK BAR", x + w / 2, y + 15);

    bctx.restore();
}

// C) PLAJ ŞEZLONGLARI & HASIR TİKİ ŞEMSİYE
function drawBeachLoungers(bctx, x, y) {
    bctx.save();
    // Taban Gölgesi
    bctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    bctx.beginPath();
    bctx.ellipse(x + 28, y + 18, 44, 16, 0, 0, Math.PI * 2);
    bctx.fill();

    // 1. Şezlong (Turkuaz Çizgili Minder)
    bctx.fillStyle = "#78350f"; // Teak Ahşap İskelet
    bctx.fillRect(x, y + 2, 46, 20);
    bctx.fillStyle = "#0284c7"; // Mavi Minder
    bctx.beginPath(); bctx.roundRect(x + 2, y + 4, 42, 16, 3); bctx.fill();
    bctx.fillStyle = "#ffffff"; // Çizgiler
    bctx.fillRect(x + 12, y + 4, 5, 16);
    bctx.fillRect(x + 24, y + 4, 5, 16);
    bctx.fillRect(x + 36, y + 4, 5, 16);

    // 2. Şezlong (Mercan Pembesi Çizgili Minder)
    bctx.fillStyle = "#78350f";
    bctx.fillRect(x + 6, y + 28, 46, 20);
    bctx.fillStyle = "#f43f5e";
    bctx.beginPath(); bctx.roundRect(x + 8, y + 30, 42, 16, 3); bctx.fill();
    bctx.fillStyle = "#ffffff";
    bctx.fillRect(x + 18, y + 30, 5, 16);
    bctx.fillRect(x + 30, y + 30, 5, 16);

    // Hasır Tiki Şemsiye Direği
    bctx.strokeStyle = "#78350f";
    bctx.lineWidth = 4;
    bctx.beginPath();
    bctx.moveTo(x + 58, y + 32);
    bctx.lineTo(x + 58, y - 18);
    bctx.stroke();

    // Hasır Şemsiye Kubbesi
    bctx.fillStyle = "#eab308";
    bctx.beginPath();
    bctx.arc(x + 58, y - 18, 30, Math.PI, 0);
    bctx.fill();

    bctx.strokeStyle = "#ca8a04";
    bctx.lineWidth = 2;
    for (let a = Math.PI; a <= 0; a += Math.PI / 6) {
        bctx.beginPath();
        bctx.moveTo(x + 58, y - 18);
        bctx.lineTo(x + 58 + Math.cos(a) * 30, y - 18 + Math.sin(a) * 30);
        bctx.stroke();
    }

    // Hasır Püskülleri
    bctx.strokeStyle = "#fef08a";
    bctx.lineWidth = 1.2;
    for (let sx = x + 26; sx <= x + 90; sx += 4) {
        bctx.beginPath();
        bctx.moveTo(sx, y - 18);
        bctx.lineTo(sx + 1, y - 12);
        bctx.stroke();
    }

    // Sehpa & Soğuk İçecek
    bctx.fillStyle = "#451a03";
    bctx.beginPath(); bctx.arc(x + 44, y + 24, 7, 0, Math.PI * 2); bctx.fill();
    bctx.fillStyle = "#38bdf8";
    bctx.fillRect(x + 42, y + 20, 4, 6);
    bctx.fillStyle = "#84cc16"; // Limon dilimi
    bctx.beginPath(); bctx.arc(x + 44, y + 19, 2, 0, Math.PI * 2); bctx.fill();

    bctx.restore();
}

// D) DERİN DENİZDEKİ LÜKS UFUK YATI / YELKENLİ
function drawHorizonYacht(bctx, x, y) {
    bctx.save();
    // Su Yüzey Yansıması
    bctx.fillStyle = "rgba(15, 23, 42, 0.25)";
    bctx.beginPath();
    bctx.ellipse(x + 16, y + 12, 28, 4, 0, 0, Math.PI * 2);
    bctx.fill();

    // Beyaz Tekne Gövdesi
    bctx.fillStyle = "#ffffff";
    bctx.beginPath();
    bctx.moveTo(x - 14, y + 6);
    bctx.lineTo(x + 36, y + 6);
    bctx.lineTo(x + 44, y + 2);
    bctx.lineTo(x + 32, y - 2);
    bctx.lineTo(x - 10, y - 2);
    bctx.closePath();
    bctx.fill();

    // Lacivert Su Çizgisi
    bctx.strokeStyle = "#0284c7";
    bctx.lineWidth = 1.5;
    bctx.beginPath();
    bctx.moveTo(x - 12, y + 4);
    bctx.lineTo(x + 38, y + 4);
    bctx.stroke();

    // Kabin & Pencereler
    bctx.fillStyle = "#e2e8f0";
    bctx.fillRect(x, y - 6, 20, 5);
    bctx.fillStyle = "#0284c7";
    bctx.fillRect(x + 3, y - 5, 4, 3);
    bctx.fillRect(x + 9, y - 5, 4, 3);
    bctx.fillRect(x + 15, y - 5, 4, 3);

    // Yelken Direği
    bctx.strokeStyle = "#94a3b8";
    bctx.lineWidth = 1.8;
    bctx.beginPath();
    bctx.moveTo(x + 12, y - 2);
    bctx.lineTo(x + 12, y - 32);
    bctx.stroke();

    // Beyaz Şişkin Üçgen Yelken
    bctx.fillStyle = "#ffffff";
    bctx.beginPath();
    bctx.moveTo(x + 14, y - 30);
    bctx.lineTo(x + 28, y - 8);
    bctx.lineTo(x + 14, y - 8);
    bctx.closePath();
    bctx.fill();
    bctx.strokeStyle = "rgba(0,0,0,0.15)";
    bctx.lineWidth = 1;
    bctx.stroke();

    // Ön Flok Yelkeni
    bctx.fillStyle = "#f8fafc";
    bctx.beginPath();
    bctx.moveTo(x + 10, y - 28);
    bctx.lineTo(x - 6, y - 5);
    bctx.lineTo(x + 10, y - 5);
    bctx.closePath();
    bctx.fill();

    // Minik Kırmızı Bayrak
    bctx.fillStyle = "#ef4444";
    bctx.beginPath();
    bctx.moveTo(x + 12, y - 32);
    bctx.lineTo(x + 18, y - 30);
    bctx.lineTo(x + 12, y - 28);
    bctx.closePath();
    bctx.fill();

    bctx.restore();
}

function renderStaticBeachTo(bctx, width, height) {
    // 1. Berrak Turkuaz Derin Deniz Tabanı
    let oceanGrad = bctx.createLinearGradient(0, 0, width * 0.7, height * 0.7);
    oceanGrad.addColorStop(0, '#0369a1');
    oceanGrad.addColorStop(0.35, '#0284c7');
    oceanGrad.addColorStop(0.7, '#0ea5e9');
    oceanGrad.addColorStop(1, '#38bdf8');
    bctx.fillStyle = oceanGrad;
    bctx.fillRect(0, 0, width, height);

    // 2. Sıcak Altın Kumsal (Büyüleyici Kıyı Kıvrımı)
    let sandGrad = bctx.createLinearGradient(350, 200, width, height);
    sandGrad.addColorStop(0, '#fef08a');
    sandGrad.addColorStop(0.6, '#fde047');
    sandGrad.addColorStop(1, '#eab308');
    bctx.fillStyle = sandGrad;
    bctx.beginPath();
    bctx.moveTo(180, height);
    bctx.bezierCurveTo(310, 380, 420, 240, width, 140);
    bctx.lineTo(width, height);
    bctx.closePath();
    bctx.fill();

    // Kumsal Islak Kum Şeridi (Suya yakın koyulaşan altın kum)
    bctx.strokeStyle = "rgba(180, 83, 9, 0.25)";
    bctx.lineWidth = 8;
    bctx.beginPath();
    bctx.moveTo(182, height);
    bctx.bezierCurveTo(312, 380, 422, 240, width, 142);
    bctx.stroke();

    // 3. Kumsaldaki Deniz Kabukları & Çakıllar
    BEACH_SHELLS.forEach(s => {
        bctx.fillStyle = s.c;
        bctx.beginPath();
        bctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        bctx.fill();
        bctx.strokeStyle = "rgba(0,0,0,0.15)";
        bctx.lineWidth = 0.8;
        bctx.stroke();
    });

    // Deniz Yıldızları (Kumsala Vuran Yıldızlar ⭐)
    BEACH_STARFISH.forEach(st => {
        bctx.save();
        bctx.translate(st.x, st.y);
        bctx.rotate(st.rot);
        bctx.fillStyle = st.c;
        bctx.beginPath();
        for (let i = 0; i < 5; i++) {
            let armA = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            let innerA = armA + Math.PI / 5;
            let armR = 7, innerR = 3;
            if (i === 0) bctx.moveTo(Math.cos(armA) * armR, Math.sin(armA) * armR);
            else bctx.lineTo(Math.cos(armA) * armR, Math.sin(armA) * armR);
            bctx.lineTo(Math.cos(innerA) * innerR, Math.sin(innerA) * innerR);
        }
        bctx.closePath();
        bctx.fill();
        bctx.restore();
    });

    // 4. Ufuktaki Lüks Yat / Yelkenli
    drawHorizonYacht(bctx, 70, 56);

    // 5. Ahşap Balıkçılık İskelesi & Köprüsü (Kumsala Tamamen Kenetlenmiş: pierX=110, pierW=440 -> x=550)
    let pierX = 110, pierY = 160, pierW = 440, pierH = 65;

    // İskele Kazıkları (Yalnızca su altındaki kısımda: x <= 480)
    PIER_PILINGS_X.forEach(px => {
        bctx.fillStyle = "rgba(15, 23, 42, 0.4)";
        bctx.fillRect(px - 1, pierY + pierH, 14, 28);
        bctx.fillStyle = "#451a03";
        bctx.fillRect(px, pierY + pierH, 10, 24);
        bctx.fillStyle = "#78350f";
        bctx.fillRect(px + 2, pierY + pierH, 6, 24);
    });

    // İskele Taban Gölgesi
    bctx.fillStyle = "rgba(15, 23, 42, 0.35)";
    bctx.fillRect(pierX + 4, pierY + 6, pierW, pierH);

    // Ana Ahşap Gövde (Ceviz / Meşe Kirişler)
    bctx.fillStyle = "#78350f";
    bctx.fillRect(pierX, pierY, pierW, pierH);
    bctx.strokeStyle = "#451a03";
    bctx.lineWidth = 2;
    bctx.strokeRect(pierX, pierY, pierW, pierH);

    // Ahşap Tahta Çizgileri ve Çivi Başları
    bctx.strokeStyle = "#451a03";
    bctx.lineWidth = 1.2;
    for (let x = pierX + 16; x < pierX + pierW; x += 18) {
        bctx.beginPath();
        bctx.moveTo(x, pierY);
        bctx.lineTo(x, pierY + pierH);
        bctx.stroke();

        bctx.fillStyle = "#1e293b";
        bctx.fillRect(x - 8, pierY + 4, 1.5, 1.5);
        bctx.fillRect(x - 8, pierY + pierH - 6, 1.5, 1.5);
    }

    // Köprünün Kumsala Birleştiği Taş & Ahşap Rampa (x: 540..556)
    bctx.fillStyle = "#5c2809";
    bctx.beginPath();
    bctx.roundRect(pierX + pierW - 8, pierY - 2, 20, pierH + 4, 4);
    bctx.fill();
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 1.5;
    bctx.stroke();

    // Palamar Babaları (Bollards)
    let bollards = [pierX + 15, pierX + 120, pierX + 225, pierX + 330];
    bollards.forEach(bx => {
        bctx.fillStyle = "#92400e";
        bctx.beginPath();
        bctx.roundRect(bx, pierY - 10, 10, 14, 2);
        bctx.fill();
        bctx.strokeStyle = "#451a03";
        bctx.lineWidth = 1;
        bctx.stroke();
    });

    // Balıkçı Kovası
    bctx.fillStyle = "#0284c7";
    bctx.beginPath();
    bctx.roundRect(pierX + 30, pierY + 12, 16, 18, 2);
    bctx.fill();
    bctx.fillStyle = "#38bdf8";
    bctx.fillRect(pierX + 32, pierY + 12, 12, 3);
    bctx.fillStyle = "#f97316";
    bctx.beginPath();
    bctx.moveTo(pierX + 42, pierY + 10);
    bctx.lineTo(pierX + 49, pierY + 3);
    bctx.lineTo(pierX + 46, pierY + 12);
    bctx.closePath();
    bctx.fill();

    // 6. Plaj Şezlongları ve Hasır Tiki Şemsiye
    drawBeachLoungers(bctx, 580, 295);

    // 7. Tropik Sahil Barı (Sağ Altta: x: 650, y: 385, w: 130, h: 72)
    drawTikiBeachBar(bctx, 650, 385, 130, 72);

    // 7.1 Tropik Bar Önü 3 Adet Ahşap & Minderli Bar Taburesi
    const barStoolCoords = [{ x: 678, y: 462 }, { x: 712, y: 462 }, { x: 746, y: 462 }];
    barStoolCoords.forEach(st => {
        // Tabure Ayakları
        bctx.strokeStyle = "#78350f";
        bctx.lineWidth = 2.5;
        bctx.beginPath();
        bctx.moveTo(st.x - 7, st.y); bctx.lineTo(st.x - 5, st.y - 12);
        bctx.moveTo(st.x + 7, st.y); bctx.lineTo(st.x + 5, st.y - 12);
        bctx.stroke();

        // Bambu Çember Bağlantısı
        bctx.strokeStyle = "#ca8a04";
        bctx.lineWidth = 1.5;
        bctx.beginPath();
        bctx.ellipse(st.x, st.y - 6, 6, 2.5, 0, 0, Math.PI * 2);
        bctx.stroke();

        // Rahat Turkuaz Minder Tabanı
        bctx.fillStyle = "#0284c7";
        bctx.beginPath();
        bctx.ellipse(st.x, st.y - 12, 10, 6, 0, 0, Math.PI * 2);
        bctx.fill();
        bctx.strokeStyle = "#facc15";
        bctx.lineWidth = 1;
        bctx.stroke();

        // Minder Işık Parlaması
        bctx.fillStyle = "#38bdf8";
        bctx.beginPath();
        bctx.ellipse(st.x - 2, st.y - 13, 6, 3, 0, 0, Math.PI * 2);
        bctx.fill();
    });

    // 8. Taşlı Kamp Ateşi Çemberi (x: 485, y: 390)
    let fireX = 485, fireY = 390;
    bctx.fillStyle = "rgba(0,0,0,0.3)";
    bctx.beginPath(); bctx.ellipse(fireX, fireY + 2, 22, 14, 0, 0, Math.PI * 2); bctx.fill();

    // Dere Taşları Çemberi
    const stoneAngles = [0, 0.55, 1.15, 1.7, 2.3, 2.85, 3.45, 4.0, 4.6, 5.2, 5.75];
    stoneAngles.forEach(ang => {
        let sx = fireX + Math.cos(ang) * 16;
        let sy = fireY + Math.sin(ang) * 10;
        bctx.fillStyle = "#64748b";
        bctx.beginPath(); bctx.arc(sx, sy, 4.2, 0, Math.PI * 2); bctx.fill();
        bctx.strokeStyle = "#334155"; bctx.lineWidth = 1; bctx.stroke();
    });
    // Kömür & Yanık Odun Tabanı
    bctx.fillStyle = "#1e1e24";
    bctx.beginPath(); bctx.ellipse(fireX, fireY, 11, 7, 0, 0, Math.PI * 2); bctx.fill();
    // Odunlar
    bctx.strokeStyle = "#451a03"; bctx.lineWidth = 2.5;
    bctx.beginPath(); bctx.moveTo(fireX - 8, fireY - 3); bctx.lineTo(fireX + 8, fireY + 3); bctx.stroke();
    bctx.beginPath(); bctx.moveTo(fireX + 7, fireY - 3); bctx.lineTo(fireX - 7, fireY + 3); bctx.stroke();

    // 9. İskele Girişindeki Bambu Meşaleler (Tiki Torches)
    [[535, 152], [535, 232]].forEach(tp => {
        bctx.strokeStyle = "#78350f";
        bctx.lineWidth = 3;
        bctx.beginPath(); bctx.moveTo(tp[0], tp[1]); bctx.lineTo(tp[0], tp[1] - 18); bctx.stroke();
        bctx.fillStyle = "#ca8a04";
        bctx.fillRect(tp[0] - 3, tp[1] - 22, 6, 5);
    });

    // 11. Palmiye Ağaçları (3 Muhteşem Hindistan Cevizi Ağacı)
    drawDetailedPalmTree(bctx, 745, 375, 1.15); // Büyük Görkemli Palmiye
    drawDetailedPalmTree(bctx, 765, 142, 0.9);  // Giriş Palmiyesi
    drawDetailedPalmTree(bctx, 585, 475, 0.85); // Alt Kumul Palmiyesi

    // 12. Türkiye Karayolları Tipi Çiftli Yol Tabelası (Kumsal / Sahil Çıkışında Üst Üste İki Tabela)
    // Üstte: MEYDAN ➔, Altta: CADDE ➔
    drawStackedTurkishSigns(bctx, width - 96, 170, [
        { text: "MEYDAN", dir: "right" },
        { text: "CADDE", dir: "right" }
    ], 222);
}

function drawBeachEnvironment() {
    let now = Date.now();
    let bg = bgCache.getCanvas('sahil', canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);

    // 1. Deniz İçi Canlı Su Dalgalanmaları & Işık Kırılmaları
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
        let waveY = 60 + i * 45;
        let waveOffset = Math.sin((now / 1200) + i) * 18;
        ctx.beginPath();
        ctx.moveTo(0, waveY + waveOffset);
        ctx.bezierCurveTo(
            150, waveY - 12 + waveOffset,
            300, waveY + 12 + waveOffset,
            450, waveY + waveOffset
        );
        ctx.stroke();
    }

    // 2. Canlı Gelgit Kumsal Köpüğü (Multi-Layer Foam Wave)
    let tide = Math.sin(now / 1400) * 8;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(180 + tide, canvas.height);
    ctx.bezierCurveTo(
        310 + tide, 380,
        420 + tide, 240,
        canvas.width, 140 + tide * 0.5
    );
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(172 + tide, canvas.height);
    ctx.bezierCurveTo(
        302 + tide, 380,
        412 + tide, 240,
        canvas.width, 132 + tide * 0.5
    );
    ctx.stroke();

    // 3. İskele Direkleri Su Yüzey Dalgaları
    let pierY = 160, pierH = 65;
    PIER_PILINGS_X.forEach(px => {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(px + 5, pierY + pierH + 22, 9, 3.5, 0, 0, Math.PI * 2);
        ctx.stroke();
    });

    // 4. Canlı Kamp Ateşi Alevi & Kıvılcımları (x: 490, y: 390)
    let fireX = 490, fireY = 390;
    let flamePulse = Math.sin(now / 120) * 2;
    let flameH = 14 + flamePulse;

    // Dış Turuncu Alev
    ctx.fillStyle = "rgba(249, 115, 22, 0.85)";
    ctx.beginPath();
    ctx.moveTo(fireX - 6, fireY + 1);
    ctx.quadraticCurveTo(fireX - 8, fireY - flameH * 0.6, fireX, fireY - flameH);
    ctx.quadraticCurveTo(fireX + 8, fireY - flameH * 0.6, fireX + 6, fireY + 1);
    ctx.closePath();
    ctx.fill();

    // İç Sarı Alev
    ctx.fillStyle = "rgba(253, 224, 71, 0.95)";
    ctx.beginPath();
    ctx.moveTo(fireX - 3.5, fireY);
    ctx.quadraticCurveTo(fireX - 4, fireY - flameH * 0.5, fireX, fireY - flameH * 0.8);
    ctx.quadraticCurveTo(fireX + 4, fireY - flameH * 0.5, fireX + 3.5, fireY);
    ctx.closePath();
    ctx.fill();

    // Havaya Uçuşan Kıvılcımlar
    for (let sp = 0; sp < 4; sp++) {
        let sparkLife = ((now / 35 + sp * 25) % 40);
        let sparkX = fireX + Math.sin(now / 150 + sp) * 7;
        let sparkY = fireY - flameH - sparkLife;
        ctx.fillStyle = `rgba(254, 240, 138, ${1 - sparkLife / 40})`;
        ctx.beginPath(); ctx.arc(sparkX, sparkY, 1.2, 0, Math.PI * 2); ctx.fill();
    }

    // 5. Bambu Meşalelerin Canlı Ateşleri (x: 535, y: 152 / 232)
    [[535, 152], [535, 232]].forEach((tp, tIdx) => {
        let tFlame = Math.sin(now / 100 + tIdx) * 1.5;
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(tp[0], tp[1] - 24 + tFlame, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(tp[0], tp[1] - 25 + tFlame, 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // 6. Uçan Martılar
    let gulls = [
        { baseX: 160, baseY: 65, speed: 1.8, span: 12 },
        { baseX: 340, baseY: 90, speed: 1.4, span: 9 },
        { baseX: 510, baseY: 45, speed: 2.1, span: 14 }
    ];
    gulls.forEach((g, idx) => {
        let gx = (g.baseX + (now / 40) * g.speed) % (canvas.width + 40) - 20;
        let gy = g.baseY + Math.sin((now / 350) + idx) * 6;
        let wingFlap = Math.sin(now / 120) * 4;

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx - g.span, gy + wingFlap);
        ctx.quadraticCurveTo(gx - g.span / 2, gy - 3, gx, gy);
        ctx.quadraticCurveTo(gx + g.span / 2, gy - 3, gx + g.span, gy + wingFlap);
        ctx.stroke();
    });

    // 6.1 Köprünün En Solundaki Kuğu Bisikletçi (Kiralama NPC'si)
    let vendorX = 135, vendorY = 188;
    let isVendorHover = (canvasMouseX >= 105 && canvasMouseX <= 165 && canvasMouseY >= 145 && canvasMouseY <= 225);

    // NPC Ayak Gölgesi
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(vendorX, vendorY + 12, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hover Işıltısı
    if (isVendorHover) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
        ctx.beginPath();
        ctx.arc(vendorX, vendorY - 6, 22, 0, Math.PI * 2);
        ctx.fill();
    }

    // NPC Vücut (Denizci Kaptanı Kıyafeti)
    // Pantolon
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(vendorX - 6, vendorY, 5, 12);
    ctx.fillRect(vendorX + 1, vendorY, 5, 12);
    // Çizgili Tişört
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(vendorX - 9, vendorY - 14, 18, 15, 3);
    ctx.fill();
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(vendorX - 8, vendorY - 11, 16, 2.5);
    ctx.fillRect(vendorX - 8, vendorY - 6, 16, 2.5);
    // Kafa & Gülümseme
    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.arc(vendorX, vendorY - 20, 7, 0, Math.PI * 2);
    ctx.fill();
    // Kaptan Şapkası (Sarı Çapalı Lacivert Vizör)
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(vendorX - 8, vendorY - 27, 16, 6, 2);
    ctx.fill();
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(vendorX, vendorY - 24, 2, 0, Math.PI * 2);
    ctx.fill();

    // Tabela / Rozet (Kuğu Bisikletçi)
    ctx.fillStyle = isVendorHover ? "rgba(15, 23, 42, 0.95)" : "rgba(15, 23, 42, 0.85)";
    ctx.beginPath();
    ctx.roundRect(vendorX - 55, vendorY - 48, 110, 20, 6);
    ctx.fill();
    ctx.strokeStyle = isVendorHover ? "#38bdf8" : "#facc15";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isVendorHover ? "#38bdf8" : "#ffffff";
    ctx.font = "bold 9.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🦢 Kaptan Kuğu", vendorX, vendorY - 37);
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 8.5px sans-serif";
    ctx.fillText("20 TL (Tıkla Kirala)", vendorX, vendorY - 30);

    // 6.2 Köprü Yanında Suda Animasyonlu Yüzen Kuğu Bisikletleri (2 Adet)
    function drawFloatingSwanBoat(cx, cy, animOffset, facingLeft) {
        let bobY = cy + Math.sin(now / 380 + animOffset) * 3.5;
        let bobTilt = Math.sin(now / 420 + animOffset) * 0.04;

        ctx.save();
        ctx.translate(cx, bobY);
        if (facingLeft) ctx.scale(-1, 1);
        ctx.rotate(bobTilt);

        // Su dalgası & köpük halkası
        let rippleR = 22 + Math.sin(now / 220 + animOffset) * 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 15, rippleR, 7, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Kuğu Tekne Tabanı (Gövdesi)
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.ellipse(0, 10, 24, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Güneşlik Tentesi (Turkuaz - Beyaz Çizgili)
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.roundRect(-10, -6, 18, 5, 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-6, -6, 4, 5);
        ctx.fillRect(2, -6, 4, 5);
        // Tente Direkleri
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-8, -1); ctx.lineTo(-8, 8);
        ctx.moveTo(6, -1); ctx.lineTo(6, 8);
        ctx.stroke();

        // Zarif Kuğu Boynu & Başı
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(12, 10);
        ctx.quadraticCurveTo(22, -6, 16, -14);
        ctx.lineTo(11, -14);
        ctx.quadraticCurveTo(14, 0, 8, 10);
        ctx.closePath();
        ctx.fill();

        // Turuncu Gaga & Siyah Maske
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(16, -14);
        ctx.lineTo(22, -11);
        ctx.lineTo(16, -9);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(14, -12, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // 1. Kuğu (Köprünün sol yanında, hafifçe süzülüyor)
    drawFloatingSwanBoat(68, 198, 0, false);
    // 2. Kuğu (Köprünün biraz üstünde, karşıya bakıyor)
    drawFloatingSwanBoat(76, 138, 1.8, true);

    // 7. Bilgilendirme ve Tıklama Rozeti (Sahil Başlığı)
    let isWaterHover = (canvasMouseX < 560 || canvasMouseY < 320);
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.beginPath();
    ctx.roundRect(18, 16, 310, 34, 10);
    ctx.fill();
    ctx.strokeStyle = isWaterHover ? "#38bdf8" : "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isWaterHover ? "#38bdf8" : "#fef08a";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("🎣 Martı Sahili & Balıkçılık İskelesi", 30, 32);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "10px sans-serif";
    ctx.fillText(isWaterHover ? "✨ Oltanı atmak için tıkla (10 sn bekle)!" : "💡 Denize veya iskeleye tıkla, balık tut!", 30, 44);
}



if (typeof window !== 'undefined') {
    window.renderStaticBeachTo = renderStaticBeachTo;
    window.drawBeachEnvironment = drawBeachEnvironment;
    window.getBeachShoreX = getBeachShoreX;
    window.drawDetailedPalmTree = drawDetailedPalmTree;
    window.drawTikiBeachBar = drawTikiBeachBar;
    window.drawBeachLoungers = drawBeachLoungers;
    window.drawHorizonYacht = drawHorizonYacht;
}

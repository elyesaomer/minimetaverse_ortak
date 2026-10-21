// public/js/renderers/renderDostlarKiraathanesi.js - Dostlar Kıraathanesi İç Mekan ve Dinamik Ortam Çizim Modülü
// 1000x625 Geniş Salon: 4 Kişilik Batak, Gömmeli Batak, 4 Kişilik Dost Kazığı, 3 Kişilik Dost Kazığı, İçecek Standı ve Çaycı Hüseyin Usta NPC'si

function renderStaticDostlarKiraathanesiTo(bctx, width, height) {
    // 1. ZEMİN: Sıcak Ahşap Kıraathane Parkesi (Ceviz & Meşe)
    bctx.fillStyle = "#1e130b";
    bctx.fillRect(0, 0, width, height);

    // Ahşap Parke Fuga Çizgileri
    const plankHeight = 24;
    for (let y = 75; y < height; y += plankHeight) {
        bctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
        bctx.lineWidth = 1;
        bctx.beginPath();
        bctx.moveTo(0, y);
        bctx.lineTo(width, y);
        bctx.stroke();

        const offset = ((y / plankHeight) % 3) * 60;
        for (let x = offset; x < width; x += 140) {
            bctx.beginPath();
            bctx.moveTo(x, y);
            bctx.lineTo(x, y + plankHeight);
            bctx.stroke();
        }
    }

    // 2. ORTADA BÜYÜK OTANTİK ANADOLU HALILARI
    bctx.save();
    // Sol Halı (Batak & Dost Kazığı Sol Bölümü)
    const carpet1X = 220, carpet1Y = 145, carpet1W = 200, carpet1H = 370;
    bctx.fillStyle = "rgba(120, 20, 20, 0.35)";
    bctx.beginPath();
    bctx.roundRect(carpet1X, carpet1Y, carpet1W, carpet1H, 16);
    bctx.fill();
    bctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
    bctx.lineWidth = 2.5;
    bctx.stroke();

    // Sağ Halı (Gömmeli Batak & 3P Dost Kazığı Sağ Bölümü)
    const carpet2X = 620, carpet2Y = 145, carpet2W = 200, carpet2H = 370;
    bctx.fillStyle = "rgba(120, 20, 20, 0.35)";
    bctx.beginPath();
    bctx.roundRect(carpet2X, carpet2Y, carpet2W, carpet2H, 16);
    bctx.fill();
    bctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
    bctx.lineWidth = 2.5;
    bctx.stroke();

    // Halı desen bordürleri
    bctx.strokeStyle = "rgba(254, 240, 138, 0.18)";
    bctx.lineWidth = 1.2;
    bctx.strokeRect(carpet1X + 8, carpet1Y + 8, carpet1W - 16, carpet1H - 16);
    bctx.strokeRect(carpet2X + 8, carpet2Y + 8, carpet2W - 16, carpet2H - 16);
    bctx.restore();

    // 3. ARKA DUVAR: Maun Ahşap Lambiri & Pirinç Çıtalar
    bctx.fillStyle = "#120803";
    bctx.fillRect(0, 0, width, 80);

    bctx.strokeStyle = "rgba(217, 119, 6, 0.32)";
    bctx.lineWidth = 1.5;
    for (let px = 25; px < width - 25; px += 75) {
        bctx.strokeRect(px, 12, 60, 56);
    }

    bctx.fillStyle = "#78350f";
    bctx.fillRect(0, 76, width, 5);
    bctx.fillStyle = "#facc15";
    bctx.fillRect(0, 79, width, 2);

    const wallShadow = bctx.createLinearGradient(0, 81, 0, 120);
    wallShadow.addColorStop(0, "rgba(0, 0, 0, 0.65)");
    wallShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
    bctx.fillStyle = wallShadow;
    bctx.fillRect(0, 81, width, 39);

    // 4. MERKEZ TABELA: "DOSTLAR KIRAATHANESİ"
    bctx.save();
    const bannerW = 340, bannerH = 48, bannerX = (width - bannerW) / 2, bannerY = 16;
    bctx.fillStyle = "#1c1917";
    bctx.beginPath();
    bctx.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
    bctx.fill();
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 2.5;
    bctx.stroke();
    bctx.strokeStyle = "rgba(250, 204, 21, 0.5)";
    bctx.strokeRect(bannerX + 4, bannerY + 4, bannerW - 8, bannerH - 8);

    bctx.font = "900 16px sans-serif";
    bctx.fillStyle = "#facc15";
    bctx.textAlign = "center";
    bctx.fillText("☕ DOSTLAR KIRAATHANESİ ☕", width / 2, bannerY + 23);

    bctx.font = "bold 10px sans-serif";
    bctx.fillStyle = "#38bdf8";
    bctx.fillText("♠️ Batak • Gömmeli Batak • Eşli Dost Kazığı ♣️", width / 2, bannerY + 39);
    bctx.restore();

    // 5. NOSTALJİK ÇERÇEVELİ DUVAR TABLOLARI VE SAAT
    drawWallDecorations(bctx, width - 140, 85);
    drawWallDecorations(bctx, 230, 85);

    // 6. SOL ÜST: İÇECEK STANDI VE ÇAY OCAĞI TEZGAHI (Çaycı Hüseyin Usta Arkada)
    drawTeaStandCounter(bctx, 35, 78, 155, 68);

    // 7. MASA 1 (ÜST SOL): 4 KİŞİLİK BATAK MASASI (batak4)
    drawBatakTable4P(bctx, 320, 230, 58);

    // 8. MASA 2 (ALT SOL): 3 KİŞİLİK GÖMMELİ BATAK MASASI (batak)
    drawBatakTable3P(bctx, 320, 440, 54);

    // 9. MASA 3 (ÜST SAĞ): 4 KİŞİLİK DOST KAZIĞI MASASI (dost_kazigi)
    drawKiraathaneTable4P(bctx, 720, 230, 58);

    // 10. MASA 4 (ALT SAĞ): 3 KİŞİLİK DOST KAZIĞI MASASI (dost_kazigi_3p)
    drawKiraathaneTable3P(bctx, 720, 440, 54);

    // 11. ŞARK KÖŞESİ / KAHVEHANE SEDİRİ (Sağ Duvar Kenarı)
    drawKiraathaneSedir(bctx, width - 60, 190, 48, 220);

    // 12. ÇIKIŞ KAPISI: CADDEYE DÖNÜŞ (Alt Orta)
    drawKiraathaneExitDoor(bctx, width / 2 - 45, height - 65, 90, 65);
}

// İçecek Standı ve Çay Ocağı Tezgahı Çizimi
function drawTeaStandCounter(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.roundRect(x - 2, y + 2, w + 4, h + 4, 8);
    ctx.fill();

    ctx.fillStyle = "#292524";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Üst Mermer Tezgah Plakası
    ctx.fillStyle = "#f5f5f4";
    ctx.beginPath();
    ctx.roundRect(x - 3, y - 4, w + 6, 15, 4);
    ctx.fill();
    ctx.strokeStyle = "#a8a29e";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bakır Kıraathane Semaveri
    const semaverX = x + 35, semaverY = y + 4;
    ctx.fillStyle = "#b45309";
    ctx.beginPath();
    ctx.roundRect(semaverX - 12, semaverY - 14, 24, 20, 4);
    ctx.fill();
    ctx.fillStyle = "#d97706";
    ctx.beginPath();
    ctx.arc(semaverX, semaverY - 15, 8, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1;
    ctx.stroke();

    // İnce Belli Çay Bardakları ve Tabaklar
    [x + 72, x + 92, x + 112].forEach(bx => {
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.roundRect(bx - 3, y - 8, 7, 10, 2);
        ctx.fill();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.roundRect(bx - 2, y - 5, 5, 6, 1);
        ctx.fill();
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.ellipse(bx, y + 3, 5, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // Tabela: "ÇAY OCAĞI & İÇECEK"
    ctx.fillStyle = "#0c0a09";
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 24, w - 20, 22, 5);
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "900 10.5px sans-serif";
    ctx.fillStyle = "#facc15";
    ctx.textAlign = "center";
    ctx.fillText("☕ ÇAY & İÇECEK STANDI", x + w / 2, y + 39);

    // Önündeki Tabureler
    [x + 35, x + 85, x + 130].forEach(sx => {
        ctx.fillStyle = "#451a03";
        ctx.beginPath();
        ctx.ellipse(sx, y + h + 12, 11, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1.2;
        ctx.stroke();
    });

    ctx.restore();
}

// 4 Kişilik Batak Masası (batak4) Çizimi
function drawBatakTable4P(ctx, cx, cy, radius) {
    ctx.save();
    // Masa gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.arc(cx + 3, cy + 5, radius + 4, 0, Math.PI * 2);
    ctx.fill();

    // Ahşap Masa Kasası
    ctx.fillStyle = "#3f1f0a";
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Yeşil Çuha
    ctx.fillStyle = "#166534";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    ctx.stroke();

    // İskambil Desenleri
    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.textAlign = "center";
    ctx.fillText("♠️", cx - 18, cy - 6);
    ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
    ctx.fillText("♥️", cx + 18, cy - 6);

    // Kart destesi
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(cx - 10, cy + 3, 20, 14, 2);
    ctx.fill();
    ctx.strokeStyle = "#b91c1c";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tabela Etiketi
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.beginPath();
    ctx.roundRect(cx - 75, cy + radius + 10, 150, 32, 6);
    ctx.fill();
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "900 11px sans-serif";
    ctx.fillStyle = "#4ade80";
    ctx.textAlign = "center";
    ctx.fillText("4 KİŞİLİK BATAK", cx, cy + radius + 23);
    ctx.font = "bold 8.5px sans-serif";
    ctx.fillStyle = "#fef08a";
    ctx.fillText("(Tek Deste & Çift Deste)", cx, cy + radius + 35);

    // 4 Sandalye
    drawTableChair(ctx, cx, cy - radius - 15, 'down');
    drawTableChair(ctx, cx, cy + radius + 5, 'up');
    drawTableChair(ctx, cx - radius - 15, cy, 'right');
    drawTableChair(ctx, cx + radius + 15, cy, 'left');

    ctx.restore();
}

// 3 Kişilik Gömmeli Batak Masası (batak) Çizimi
function drawBatakTable3P(ctx, cx, cy, radius) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.arc(cx + 3, cy + 5, radius + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3f1f0a";
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Koyu Yeşil Çuha
    ctx.fillStyle = "#14532d";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gömmeli Batak İskambil Simgesi
    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.textAlign = "center";
    ctx.fillText("♣️", cx - 14, cy - 6);
    ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
    ctx.fillText("♦️", cx + 14, cy - 6);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(cx - 9, cy + 3, 18, 13, 2);
    ctx.fill();
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tabela Etiketi
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.beginPath();
    ctx.roundRect(cx - 75, cy + radius + 10, 150, 32, 6);
    ctx.fill();
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "900 11px sans-serif";
    ctx.fillStyle = "#86efac";
    ctx.textAlign = "center";
    ctx.fillText("GÖMMELİ BATAK", cx, cy + radius + 23);
    ctx.font = "bold 8.5px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("(3 Kişilik Klasik)", cx, cy + radius + 35);

    // 3 Sandalye (Kuzey, Sağ, Sol)
    drawTableChair(ctx, cx, cy - radius - 15, 'down');
    drawTableChair(ctx, cx + radius * 0.9, cy + radius * 0.55, 'left');
    drawTableChair(ctx, cx - radius * 0.9, cy + radius * 0.55, 'right');

    ctx.restore();
}

// 4 Kişilik Dost Kazığı Masası (dost_kazigi) Çizimi
function drawKiraathaneTable4P(ctx, cx, cy, radius) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.arc(cx + 3, cy + 5, radius + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3f1f0a";
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Zümrüt Çuha
    ctx.fillStyle = "#065f46";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "rgba(250, 204, 21, 0.45)";
    ctx.textAlign = "center";
    ctx.fillText("👑", cx, cy - 6);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(cx - 11, cy + 3, 22, 14, 2);
    ctx.fill();
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tabela Etiketi
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.beginPath();
    ctx.roundRect(cx - 80, cy + radius + 10, 160, 32, 6);
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "900 11px sans-serif";
    ctx.fillStyle = "#facc15";
    ctx.textAlign = "center";
    ctx.fillText("4 KİŞİLİK DOST KAZIĞI", cx, cy + radius + 23);
    ctx.font = "bold 8.5px sans-serif";
    ctx.fillStyle = "#fef08a";
    ctx.fillText("(Tek Deste & Çift Deste)", cx, cy + radius + 35);

    drawTableChair(ctx, cx, cy - radius - 15, 'down');
    drawTableChair(ctx, cx, cy + radius + 5, 'up');
    drawTableChair(ctx, cx - radius - 15, cy, 'right');
    drawTableChair(ctx, cx + radius + 15, cy, 'left');

    ctx.restore();
}

// 3 Kişilik Dost Kazığı Masası (dost_kazigi_3p) Çizimi
function drawKiraathaneTable3P(ctx, cx, cy, radius) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.arc(cx + 3, cy + 5, radius + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3f1f0a";
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Mavi Kadife Çuha
    ctx.fillStyle = "#0c4a6e";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
    ctx.textAlign = "center";
    ctx.fillText("⚡", cx, cy - 6);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(cx - 9, cy + 3, 18, 13, 2);
    ctx.fill();
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tabela Etiketi
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.beginPath();
    ctx.roundRect(cx - 75, cy + radius + 10, 150, 32, 6);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "900 11px sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "center";
    ctx.fillText("3 KİŞİLİK DOST KAZIĞI", cx, cy + radius + 23);
    ctx.font = "bold 8.5px sans-serif";
    ctx.fillStyle = "#bae6fd";
    ctx.fillText("(Hızlı Tek Deste)", cx, cy + radius + 35);

    drawTableChair(ctx, cx, cy - radius - 15, 'down');
    drawTableChair(ctx, cx + radius * 0.9, cy + radius * 0.55, 'left');
    drawTableChair(ctx, cx - radius * 0.9, cy + radius * 0.55, 'right');

    ctx.restore();
}

// Sandalye Çizimi
function drawTableChair(ctx, x, y, facing) {
    ctx.save();
    ctx.fillStyle = "#292524";
    ctx.beginPath();
    ctx.roundRect(x - 12, y - 10, 24, 20, 4);
    ctx.fill();
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Arkalık Minderi
    ctx.fillStyle = "#b45309";
    if (facing === 'down') {
        ctx.fillRect(x - 10, y - 9, 20, 5);
    } else if (facing === 'up') {
        ctx.fillRect(x - 10, y + 4, 20, 5);
    } else if (facing === 'right') {
        ctx.fillRect(x - 9, y - 8, 5, 16);
    } else if (facing === 'left') {
        ctx.fillRect(x + 4, y - 8, 5, 16);
    }
    ctx.restore();
}

// Kıraathane Sediri (Şark Köşesi)
function drawKiraathaneSedir(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Kırmızı Anadolu Dokuması Minder
    ctx.fillStyle = "#991b1b";
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 6);
    ctx.fill();

    // Sedir Yastıkları
    for (let py = y + 15; py < y + h - 15; py += 45) {
        ctx.fillStyle = "#b45309";
        ctx.beginPath();
        ctx.roundRect(x + w - 16, py, 12, 32, 4);
        ctx.fill();
        ctx.strokeStyle = "#fde68a";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    ctx.restore();
}

// Duvar Tabloları & Nostaljik Saat
function drawWallDecorations(ctx, x, y) {
    ctx.save();
    // Ahşap Çerçeve
    ctx.fillStyle = "#451a03";
    ctx.fillRect(x - 22, y - 55, 44, 30);
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 22, y - 55, 44, 30);

    // Tablo Resmi
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x - 18, y - 51, 36, 22);
    ctx.font = "bold 9px sans-serif";
    ctx.fillStyle = "#facc15";
    ctx.textAlign = "center";
    ctx.fillText("KURALLAR", x, y - 36);

    // Duvar Saati
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(x + 45, y - 40, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Saat ibreleri
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 45, y - 40);
    ctx.lineTo(x + 45, y - 47);
    ctx.moveTo(x + 45, y - 40);
    ctx.lineTo(x + 51, y - 40);
    ctx.stroke();
    ctx.restore();
}

// Çıkış Kapısı Çizimi
function drawKiraathaneExitDoor(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "#292524";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Paspas
    ctx.fillStyle = "#451a03";
    ctx.fillRect(x + 8, y + h - 14, w - 16, 12);
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 8, y + h - 14, w - 16, 12);

    ctx.font = "900 12px sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "center";
    ctx.fillText("🚪 CADDEYE ÇIK", x + w / 2, y + 25);

    ctx.font = "bold 9px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("(Çıkmak İçin Bas / Yürü)", x + w / 2, y + 42);

    ctx.restore();
}

// -------------------------------------------------------------
// DİNAMİK ORTAM VE TEMSİLİ NPC ÇİZİMİ (HER KAREDE ÇAĞRILIR)
// -------------------------------------------------------------
function drawDostlarKiraathanesiEnvironment() {
    if (typeof canvas === 'undefined' || typeof ctx === 'undefined') return;

    const width = canvas.width;
    const height = canvas.height;
    const now = Date.now();

    // 1. Önbelleğe alınmış statik zemini çiz
    if (typeof bgCache !== 'undefined') {
        const bg = bgCache.getCanvas('dostlar_kiraathanesi', width, height);
        ctx.drawImage(bg, 0, 0);
    }

    // 2. ÇAY OCAĞI & TEMSİLİ NPC: "ÇAYCI HÜSEYİN USTA"
    const npcX = 115;
    const npcY = 72;
    drawCayciHuseyinNpc(ctx, npcX, npcY, now);

    // 3. SEMAVERDEN YÜKSELEN CANLI DUMAN EFEKTİ
    drawSemaverSteam(ctx, 35 + 35, 78 + 12, now);

    // 4. MOUSE HOVER VE ETKİLEŞİM VURGULARI
    handleKiraathaneHovers(ctx, width, height, now);
}

// Temsili Çaycı Hüseyin Usta NPC Karakteri Çizimi
function drawCayciHuseyinNpc(ctx, x, y, now) {
    ctx.save();
    const breath = Math.sin(now / 400) * 1.5;

    // Gövde & Beyaz Gömlek
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(x - 13, y - 6 + breath, 26, 22, 4);
    ctx.fill();

    // Kahverengi Kıraathane Yeleği
    ctx.fillStyle = "#451a03";
    ctx.fillRect(x - 13, y - 6 + breath, 7, 20);
    ctx.fillRect(x + 6, y - 6 + breath, 7, 20);

    // Beyaz Çaycı Önlüğü
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(x - 9, y + 6 + breath, 18, 14);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 9, y + 6 + breath, 18, 14);

    // Kafa & Boyun
    ctx.fillStyle = "#ffd1a4";
    ctx.beginPath();
    ctx.arc(x, y - 16 + breath, 9.5, 0, Math.PI * 2);
    ctx.fill();

    // Bıyık
    ctx.fillStyle = "#1e1b18";
    ctx.beginPath();
    ctx.ellipse(x, y - 13 + breath, 5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gözler
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(x - 3.5, y - 17 + breath, 1.2, 0, Math.PI * 2);
    ctx.arc(x + 3.5, y - 17 + breath, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Kasket
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(x - 11, y - 26 + breath, 22, 9, 3);
    ctx.fill();
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.ellipse(x, y - 20 + breath, 11, 3.5, 0, 0, Math.PI);
    ctx.fill();

    // Çay Tepsisi
    ctx.save();
    ctx.translate(x + 16, y + 4 + breath);
    ctx.fillStyle = "#ca8a04";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-2, -5, 4, 6);
    ctx.restore();

    // Konuşma Baloncuğu
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.beginPath();
    ctx.roundRect(x - 90, y - 46 + breath, 180, 16, 8);
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "900 8.5px sans-serif";
    ctx.fillStyle = "#facc15";
    ctx.textAlign = "center";
    ctx.fillText("☕ ÇAYCI HÜSEYİN USTA (Sipariş İçin Tıkla)", x, y - 35 + breath);

    ctx.restore();
}

// Canlı Buhar Efekti
function drawSemaverSteam(ctx, x, y, now) {
    ctx.save();
    for (let i = 0; i < 4; i++) {
        const offset = (now / 15 + i * 35) % 55;
        const alpha = Math.max(0, 1 - (offset / 55)) * 0.45;
        const drift = Math.sin(now / 250 + i) * 6;
        const radius = 3.5 + (offset / 8);

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x + drift, y - offset, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Mouse Hover ve Etkileşim Vurguları (4 Masa + Stand + Kapı)
function handleKiraathaneHovers(ctx, width, height, now) {
    if (typeof canvasMouseX === 'undefined' || typeof canvasMouseY === 'undefined') return;

    const mx = canvasMouseX;
    const my = canvasMouseY;

    // 1. İçecek Standı & Çaycı Hüseyin Usta (x: 35..190, y: 65..150)
    const isStandHover = (mx >= 35 && mx <= 195 && my >= 65 && my <= 150);

    // 2. 4 Kişilik Batak Masası (Üst Sol - cx: 320, cy: 230, r: 65)
    const d4Batak = Math.hypot(mx - 320, my - 230);
    const isBatak4Hover = (d4Batak <= 65 || (mx >= 240 && mx <= 400 && my >= 285 && my <= 325));

    // 3. 3 Kişilik Gömmeli Batak Masası (Alt Sol - cx: 320, cy: 440, r: 62)
    const d3Batak = Math.hypot(mx - 320, my - 440);
    const isBatak3Hover = (d3Batak <= 62 || (mx >= 240 && mx <= 400 && my >= 495 && my <= 535));

    // 4. 4 Kişilik Dost Kazığı Masası (Üst Sağ - cx: 720, cy: 230, r: 65)
    const d4Dost = Math.hypot(mx - 720, my - 230);
    const isDostKazigi4Hover = (d4Dost <= 65 || (mx >= 640 && mx <= 800 && my >= 285 && my <= 325));

    // 5. 3 Kişilik Dost Kazığı Masası (Alt Sağ - cx: 720, cy: 440, r: 62)
    const d3Dost = Math.hypot(mx - 720, my - 440);
    const isDostKazigi3pHover = (d3Dost <= 62 || (mx >= 640 && mx <= 800 && my >= 495 && my <= 535));

    // 6. Çıkış Kapısı
    const isExitHover = (mx >= width / 2 - 45 && mx <= width / 2 + 45 && my >= height - 65 && my <= height);

    ctx.save();

    if (isStandHover) {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(33, 76, 159, 72);
        ctx.fillStyle = "rgba(250, 204, 21, 0.12)";
        ctx.fillRect(33, 76, 159, 72);

        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.beginPath();
        ctx.roundRect(115 - 80, 155, 160, 20, 5);
        ctx.fill();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "bold 9.5px sans-serif";
        ctx.fillStyle = "#facc15";
        ctx.textAlign = "center";
        ctx.fillText("☕ Çay & İçecek Menüsü (Tıkla)", 115, 168);

        if (typeof hoveredTableId !== 'undefined') hoveredTableId = 'kiraathane_stand';
    }
    else if (isBatak4Hover) {
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(320, 230, 64, 0, Math.PI * 2);
        ctx.stroke();

        if (typeof hoveredTableId !== 'undefined') hoveredTableId = 'batak4';
    }
    else if (isBatak3Hover) {
        ctx.strokeStyle = "#16a34a";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(320, 440, 60, 0, Math.PI * 2);
        ctx.stroke();

        if (typeof hoveredTableId !== 'undefined') hoveredTableId = 'batak';
    }
    else if (isDostKazigi4Hover) {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(720, 230, 64, 0, Math.PI * 2);
        ctx.stroke();

        if (typeof hoveredTableId !== 'undefined') hoveredTableId = 'dost_kazigi';
    }
    else if (isDostKazigi3pHover) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(720, 440, 60, 0, Math.PI * 2);
        ctx.stroke();

        if (typeof hoveredTableId !== 'undefined') hoveredTableId = 'dost_kazigi_3p';
    }
    else if (isExitHover) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.strokeRect(width / 2 - 45, height - 65, 90, 65);

        if (typeof hoveredTableId !== 'undefined') hoveredTableId = 'kiraathane_exit';
    }
    else {
        if (typeof hoveredTableId !== 'undefined' && hoveredTableId && (hoveredTableId === 'kiraathane_stand' || hoveredTableId === 'batak4' || hoveredTableId === 'batak' || hoveredTableId === 'dost_kazigi' || hoveredTableId === 'dost_kazigi_3p' || hoveredTableId === 'kiraathane_exit')) {
            hoveredTableId = null;
        }
    }

    ctx.restore();

    const isAnyHover = (isStandHover || isBatak4Hover || isBatak3Hover || isDostKazigi4Hover || isDostKazigi3pHover || isExitHover);
    if (typeof setGameCursor === 'function') {
        setGameCursor(isAnyHover ? 'pointer' : 'default');
    }
}

if (typeof window !== 'undefined') {
    window.renderStaticDostlarKiraathanesiTo = renderStaticDostlarKiraathanesiTo;
    window.drawDostlarKiraathanesiEnvironment = drawDostlarKiraathanesiEnvironment;
}

// public/js/renderers/renderNargile.js - Otantik Nargile & Okey Salonu Çizim Modülü
function renderStaticNargileCafeTo(bctx, width, height) {
    // 1. Zemin: Şık Koyu Bordo / Otantik Doğu Halısı
    bctx.fillStyle = "#450a0a";
    bctx.fillRect(0, 0, width, height);

    // Otantik halı bordürü
    bctx.strokeStyle = "#ca8a04";
    bctx.lineWidth = 4;
    bctx.strokeRect(15, 15, width - 30, height - 30);
    bctx.strokeStyle = "#991b1b";
    bctx.lineWidth = 2;
    bctx.strokeRect(22, 22, width - 44, height - 44);

    // Halı geometrik desenleri
    bctx.fillStyle = "rgba(180, 83, 9, 0.25)";
    for (let x = 60; x < width - 60; x += 110) {
        for (let y = 60; y < height - 60; y += 110) {
            bctx.beginPath();
            bctx.arc(x, y, 22, 0, Math.PI * 2);
            bctx.fill();
        }
    }



    // 3. Sol Üst ve Sağ Üst Nargile Locaları (Genişletilmiş ve Lüks Köşe Sedirler)
    drawLuxuryLoungeSuite(bctx, 30, 55, 175, 115, false);
    drawLuxuryLoungeSuite(bctx, 595, 55, 175, 115, true);

    // 5. Nargile Köz Semaveri / Tezgahı (Sol Altta)
    drawHookahCounter(bctx, 75, 380);

    // 6. Meydan Çıkış Kapısı (Ortada - Ortadan Giriş / Çıkış)
    drawExitDoor(bctx, width / 2 - 35, height - 65, "🚪 MEYDAN", 70, 60);

    // 7. Mutfak / Garson Kapısı (En Sağ Altta - Sadece Görevliler Girebilir)
    drawKitchenDoor(bctx, width - 105, height - 68, 90, 68);
}

function drawKitchenDoor(ctx, x, y, w, h) {
    ctx.save();
    // Kapı Kasası & Ahşap pervaz
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(x - 3, y - 3, w + 6, h + 6, 8);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Paslanmaz Çelik Mutfak Kanadı
    let doorGrad = ctx.createLinearGradient(x, y, x + w, y);
    doorGrad.addColorStop(0, '#475569');
    doorGrad.addColorStop(0.5, '#94a3b8');
    doorGrad.addColorStop(1, '#334155');
    ctx.fillStyle = doorGrad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();

    // Kapı ortası dikey kanat çizgisi
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.stroke();

    // Metal tekme koruma plakası (Kickplate - Alt tarafta)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x + 4, y + h - 14, w - 8, 10);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(x + 6, y + h - 12, w - 12, 1);

    // İki Adet Yuvarlak Lumboz Cam Pencere (Sıcak mutfak ışığı parıltısıyla)
    [x + w / 4, x + (3 * w) / 4].forEach(px => {
        ctx.fillStyle = "#1e293b";
        ctx.beginPath(); ctx.arc(px, y + 22, 11, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1.5; ctx.stroke();

        let winGrad = ctx.createRadialGradient(px - 2, y + 20, 2, px, y + 22, 9);
        winGrad.addColorStop(0, '#fef08a');
        winGrad.addColorStop(0.7, '#f59e0b');
        winGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = winGrad;
        ctx.beginPath(); ctx.arc(px, y + 22, 9, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px, y + 22, 6, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
    });

    // Tabela: 👨‍🍳 MUTFAK (SADECE GÖREVLİLER)
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.beginPath();
    ctx.roundRect(x + w / 2 - 45, y - 20, 90, 18, 5);
    ctx.fill();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 8.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("👨‍🍳 MUTFAK (GÖREVLİ)", x + w / 2, y - 8);

    ctx.restore();
}

function drawNargileCafeEnvironment() {
    let bg = bgCache.getCanvas('nargile_cafe', canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);

    // Mekan İçi Duvar TV'si (Nargile Cafe Üst Duvarda - Büyütülmüş)
    if (typeof drawVenueTV === 'function') {
        drawVenueTV(ctx, 325, 10, 150, 76);
    }

    // İki Adet 101 Okey Masası (Dinamik Hover ve Çerçeve)
    let isHoverTekli = (canvasMouseX >= 145 && canvasMouseX <= 365 && canvasMouseY >= 160 && canvasMouseY <= 360);
    let isHoverEsli = (canvasMouseX >= 435 && canvasMouseX <= 655 && canvasMouseY >= 160 && canvasMouseY <= 360);

    drawNargileOkeyTable(ctx, 160, 175, 190, 135, 'okey101_tekli', '👤 TEKLİ 101 OKEY', '(Bireysel - 4 Kişi)', '#0f766e', '#38bdf8', isHoverTekli);
    drawNargileOkeyTable(ctx, 450, 175, 190, 135, 'okey101', '👥 ÇİFTLİ / EŞLİ 101', '(2v2 Kıraathane & A4 Yazboz)', '#15803d', '#4ade80', isHoverEsli);

    // Sol ve Sağ Loca Hover Kontrolleri
    let isHoverSolLoca = (canvasMouseX >= 25 && canvasMouseX <= 215 && canvasMouseY >= 50 && canvasMouseY <= 175);
    let isHoverSagLoca = (canvasMouseX >= 585 && canvasMouseX <= 775 && canvasMouseY >= 50 && canvasMouseY <= 175);

    drawLoungeHoverOverlay(ctx, 30, 55, 175, 115, 'Sol Üst Nargile Locası', isHoverSolLoca);
    drawLoungeHoverOverlay(ctx, 595, 55, 175, 115, 'Sağ Üst Nargile Locası', isHoverSagLoca);

    // Nargile ve Meyve Tabağı SADECE ve SADECE Sol ve Sağ Loca Sehpalarında Servis Edilir (101 Masalarına Bırakılmaz!)
    if (typeof window.drawTableActiveItems === 'function') {
        window.drawTableActiveItems(ctx, 'lounge_sol', 95, 100, 80, 52);
        window.drawTableActiveItems(ctx, 'lounge_sag', 625, 100, 80, 52);
    }

    // Garson Haydar'ın Servis Animasyonu
    if (typeof window.updateGarsonHaydar === 'function' && typeof window.drawGarsonHaydar === 'function') {
        window.updateGarsonHaydar();
        window.drawGarsonHaydar(ctx);
    }

    // Gerçekçi Nargile Duman Partikülleri
    if (typeof window.updateAndDrawSmokeParticles === 'function') {
        window.updateAndDrawSmokeParticles(ctx);
    }
}

function drawNargileOkeyTable(ctx, x, y, w, h, tableId, title, subTitle, feltColor, accentColor, isHover) {
    ctx.save();

    // 1. Dört Sandalye (Üst, Alt, Sol, Sağ)
    let chairPad = 12;
    // Üst sandalye
    ctx.fillStyle = "#78350f";
    ctx.beginPath(); ctx.roundRect(x + w / 2 - 24, y - chairPad, 48, 10, 4); ctx.fill();
    ctx.fillStyle = feltColor;
    ctx.beginPath(); ctx.roundRect(x + w / 2 - 20, y - chairPad + 2, 40, 6, 2); ctx.fill();
    // Alt sandalye
    ctx.fillStyle = "#78350f";
    ctx.beginPath(); ctx.roundRect(x + w / 2 - 24, y + h + 2, 48, 10, 4); ctx.fill();
    ctx.fillStyle = feltColor;
    ctx.beginPath(); ctx.roundRect(x + w / 2 - 20, y + h + 4, 40, 6, 2); ctx.fill();
    // Sol sandalye
    ctx.fillStyle = "#78350f";
    ctx.beginPath(); ctx.roundRect(x - chairPad, y + h / 2 - 20, 10, 40, 4); ctx.fill();
    ctx.fillStyle = feltColor;
    ctx.beginPath(); ctx.roundRect(x - chairPad + 2, y + h / 2 - 16, 6, 32, 2); ctx.fill();
    // Sağ sandalye
    ctx.fillStyle = "#78350f";
    ctx.beginPath(); ctx.roundRect(x + w + 2, y + h / 2 - 20, 10, 40, 4); ctx.fill();
    ctx.fillStyle = feltColor;
    ctx.beginPath(); ctx.roundRect(x + w + 4, y + h / 2 - 16, 6, 32, 2); ctx.fill();

    // 2. Masa Gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 7, w, h, 14);
    ctx.fill();

    // 3. Hover Parlaması (Performans dostu vektörel dış aura)
    if (isHover) {
        ctx.strokeStyle = (typeof accentColor === 'string' && accentColor.startsWith('#')) ? accentColor + "77" : "rgba(202, 138, 4, 0.45)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(x - 2, y - 2, w + 4, h + 4, 14);
        ctx.stroke();
    }

    // 4. Lüks Ahşap Çerçeve & Altın Detay
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = isHover ? accentColor : "#ca8a04";
    ctx.lineWidth = isHover ? 3 : 2;
    ctx.stroke();

    // 5. Kadife / Çuha Zemin
    ctx.fillStyle = feltColor;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 6. Dört Istaka (Ahşap)
    ctx.fillStyle = "#b45309";
    ctx.fillRect(x + 32, y + 13, w - 64, 11); // Üst
    ctx.fillRect(x + 32, y + h - 24, w - 64, 11); // Alt
    ctx.fillRect(x + 13, y + 26, 11, h - 52); // Sol
    ctx.fillRect(x + w - 24, y + 26, 11, h - 52); // Sağ

    // Istaka üzerindeki minik taşlar (Fildişi)
    ctx.fillStyle = "#fef08a";
    for (let i = 0; i < 7; i++) {
        ctx.fillRect(x + 36 + i * 16, y + 15, 11, 8);
        ctx.fillRect(x + 36 + i * 16, y + h - 22, 11, 8);
    }
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + 14, y + 30 + i * 18, 9, 12);
        ctx.fillRect(x + w - 23, y + 30 + i * 18, 9, 12);
    }

    // 7. Ortadaki Taş Destesi ve Gösterge Taşı
    // Taş destesi (kapalı)
    ctx.fillStyle = "#fef9c3";
    ctx.fillRect(x + w / 2 - 18, y + h / 2 - 9, 15, 18);
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x + w / 2 - 18, y + h / 2 - 9, 15, 18);
    ctx.fillStyle = "#b45309";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🀄", x + w / 2 - 10, y + h / 2 + 5);

    // Açık gösterge taşı
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + w / 2 + 2, y + h / 2 - 9, 15, 18);
    ctx.strokeRect(x + w / 2 + 2, y + h / 2 - 9, 15, 18);
    ctx.fillStyle = (tableId === 'okey101_tekli') ? "#0284c7" : "#dc2626";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText((tableId === 'okey101_tekli') ? "7" : "10", x + w / 2 + 10, y + h / 2 + 4);

    // 8. Tabela & Rozet (Masa Altında)
    let badgeBg = isHover ? "rgba(15, 23, 42, 0.95)" : "rgba(15, 23, 42, 0.82)";
    ctx.fillStyle = badgeBg;
    ctx.beginPath();
    ctx.roundRect(x + w / 2 - 82, y + h + 15, 164, 30, 8);
    ctx.fill();
    ctx.strokeStyle = isHover ? accentColor : "rgba(250, 204, 21, 0.35)";
    ctx.lineWidth = isHover ? 1.8 : 1;
    ctx.stroke();

    ctx.fillStyle = isHover ? accentColor : "#facc15";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, x + w / 2, y + h + 28);

    ctx.fillStyle = isHover ? "#f8fafc" : "#94a3b8";
    ctx.font = "9px sans-serif";
    ctx.fillText(subTitle, x + w / 2, y + h + 40);

    ctx.restore();
}

// --- 11.2 MOBİLYA MARKETİ ÇİZİMİ (ÖNBELLEKLİ & AKICI) ---

function drawLuxuryLoungeSuite(ctx, x, y, w, h, isRightSide) {
    ctx.save();

    // 1. Zemin Halısı / Kilim (Otantik Doğu İpeği & Altın Saçaklar)
    let rugGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    if (!isRightSide) {
        rugGrad.addColorStop(0, '#3b0764');
        rugGrad.addColorStop(0.5, '#4a044e');
        rugGrad.addColorStop(1, '#581c87');
    } else {
        rugGrad.addColorStop(0, '#0f172a');
        rugGrad.addColorStop(0.5, '#1e1b4b');
        rugGrad.addColorStop(1, '#312e81');
    }
    ctx.fillStyle = rugGrad;
    ctx.beginPath();
    ctx.roundRect(x - 6, y - 6, w + 12, h + 12, 10);
    ctx.fill();
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Halı saçakları ve iç bordür
    ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);

    // 2. Chesterfield Köşe Koltuk (Genişletilmiş ve Kapitoneli Lüks Sedir)
    let sofaColor = !isRightSide ? '#831843' : '#1e3a8a';
    let sofaTrim = !isRightSide ? '#9d174d' : '#1d4ed8';
    let woodFrame = '#451a03';

    // A) Üst Sırtlık ve Minder (x'ten x+w'ye)
    ctx.fillStyle = woodFrame;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 14, 4);
    ctx.fill();
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Üst Koltuk Minderi (Velvet / Kadife Kapitone)
    ctx.fillStyle = sofaColor;
    ctx.beginPath();
    ctx.roundRect(x, y + 12, w, 28, 4);
    ctx.fill();
    ctx.strokeStyle = sofaTrim;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Kapitone altın düğme dikişleri
    ctx.fillStyle = "rgba(250, 204, 21, 0.75)";
    for (let bx = x + 18; bx < x + w - 10; bx += 24) {
        ctx.beginPath(); ctx.arc(bx, y + 26, 2, 0, Math.PI * 2); ctx.fill();
    }

    // B) Yan Sırtlık ve Minder (Sol loca için sol kenar, Sağ loca için sağ kenar)
    if (!isRightSide) {
        ctx.fillStyle = woodFrame;
        ctx.beginPath();
        ctx.roundRect(x, y + 38, 14, h - 38, 4);
        ctx.fill();
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = sofaColor;
        ctx.beginPath();
        ctx.roundRect(x + 12, y + 38, 28, h - 38, 4);
        ctx.fill();
        ctx.strokeStyle = sofaTrim;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        for (let by = y + 54; by < y + h - 10; by += 26) {
            ctx.beginPath(); ctx.arc(x + 26, by, 2, 0, Math.PI * 2); ctx.fill();
        }
    } else {
        ctx.fillStyle = woodFrame;
        ctx.beginPath();
        ctx.roundRect(x + w - 14, y + 38, 14, h - 38, 4);
        ctx.fill();
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = sofaColor;
        ctx.beginPath();
        ctx.roundRect(x + w - 40, y + 38, 28, h - 38, 4);
        ctx.fill();
        ctx.strokeStyle = sofaTrim;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        for (let by = y + 54; by < y + h - 10; by += 26) {
            ctx.beginPath(); ctx.arc(x + w - 26, by, 2, 0, Math.PI * 2); ctx.fill();
        }
    }

    // 3. İpek Püsküllü Kırlentler (Throw Pillows)
    const pillowColors = ['#eab308', '#06b6d4', '#ec4899', '#10b981'];
    if (!isRightSide) {
        drawSilkPillow(ctx, x + 16, y + 16, pillowColors[0]);
        drawSilkPillow(ctx, x + 75, y + 18, pillowColors[1]);
        drawSilkPillow(ctx, x + 135, y + 18, pillowColors[2]);
        drawSilkPillow(ctx, x + 20, y + 75, pillowColors[3]);
    } else {
        drawSilkPillow(ctx, x + w - 30, y + 16, pillowColors[0]);
        drawSilkPillow(ctx, x + 40, y + 18, pillowColors[1]);
        drawSilkPillow(ctx, x + 100, y + 18, pillowColors[2]);
        drawSilkPillow(ctx, x + w - 34, y + 75, pillowColors[3]);
    }

    // 4. Lüks Mermer / Ahşap Altın Kakmalı Nargile Sehpası (Coffee Table)
    let sx = !isRightSide ? (x + 65) : (x + 30);
    let sy = y + 45;
    let sw = 80;
    let sh = 52;

    // Sehpa Zemin Gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(sx + sw / 2 + 2, sy + sh / 2 + 6, sw / 2 + 6, sh / 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sehpa Ahşap / Pirinç Ayakları
    ctx.fillStyle = "#ca8a04";
    [[sx + 6, sy + 6], [sx + sw - 10, sy + 6], [sx + 6, sy + sh - 6], [sx + sw - 10, sy + sh - 6]].forEach(pt => {
        ctx.fillRect(pt[0], pt[1], 4, 8);
    });

    // Sehpa Üst Tablası (Ceviz Ağacı Çerçeveli & Siyah/Yeşil Damarlı Mermer)
    ctx.fillStyle = "#3b1a08";
    ctx.beginPath();
    ctx.roundRect(sx, sy, sw, sh, 10);
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Mermer İç Tabla
    let marbleGrad = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
    if (!isRightSide) {
        marbleGrad.addColorStop(0, '#064e3b');
        marbleGrad.addColorStop(0.5, '#022c22');
        marbleGrad.addColorStop(1, '#064e3b');
    } else {
        marbleGrad.addColorStop(0, '#1e293b');
        marbleGrad.addColorStop(0.5, '#0f172a');
        marbleGrad.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = marbleGrad;
    ctx.beginPath();
    ctx.roundRect(sx + 5, sy + 5, sw - 10, sh - 10, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(250, 204, 21, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Mermer orta pirinç desen
    ctx.strokeStyle = "rgba(250, 204, 21, 0.35)";
    ctx.beginPath();
    ctx.arc(sx + sw / 2, sy + sh / 2, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function drawSilkPillow(ctx, px, py, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(px, py, 14, 14, 3);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Altın püskül ucu
    ctx.fillStyle = "#facc15";
    ctx.beginPath(); ctx.arc(px + 7, py + 7, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawLoungeHoverOverlay(ctx, x, y, w, h, title, isHover) {
    if (!isHover) return;
    ctx.save();
    // Altın ışıma aurası
    ctx.strokeStyle = "rgba(250, 204, 21, 0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x - 5, y - 5, w + 10, h + 10, 12);
    ctx.stroke();

    // Loca Başlığı Rozeti
    let badgeW = 200;
    let badgeH = 22;
    let bx = x + w / 2 - badgeW / 2;
    let by = y - 18;

    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, 6);
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 10px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${title} (Tıkla & Sipariş)`, x + w / 2, by + 15);
    ctx.restore();
}

function drawHookahCounter(ctx, x, y) {
    ctx.fillStyle = "#78350f";
    ctx.fillRect(x - 30, y, 90, 40);
    ctx.fillStyle = "#b45309";
    ctx.beginPath(); ctx.arc(x + 15, y - 5, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.arc(x + 15, y - 7, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#facc15";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔥 Köz & Nargile", x + 15, y + 24);
}

// ==========================================
// 8.8 CANLI BLACKJACK 21 MASASI ÇİZİMİ (KAFE İÇİ)
// ==========================================

if (typeof window !== 'undefined') {
    window.renderStaticNargileCafeTo = renderStaticNargileCafeTo;
    window.drawNargileCafeEnvironment = drawNargileCafeEnvironment;
    window.drawKitchenDoor = drawKitchenDoor;
    window.drawNargileOkeyTable = drawNargileOkeyTable;
    window.drawLuxuryLoungeSuite = drawLuxuryLoungeSuite;
    window.drawSilkPillow = drawSilkPillow;
    window.drawLoungeHoverOverlay = drawLoungeHoverOverlay;
    window.drawHookahCounter = drawHookahCounter;
}

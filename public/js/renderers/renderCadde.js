// public/js/renderers/renderCadde.js - Cadde & Bulvar Çizim Modülü
function renderStaticCaddeTo(bctx, width, height) {
    // 1. Zemin & Gökyüzü / Cadde Arka Planı
    bctx.fillStyle = isNightMode ? "#090d16" : "#1e293b";
    bctx.fillRect(0, 0, width, height);

    // Gece gökyüzü / Yıldızlar (Y < 130)
    if (isNightMode) {
        bctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        for (let i = 0; i < 30; i++) {
            let sx = (i * 137) % width;
            let sy = (i * 73) % 115;
            bctx.beginPath();
            bctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
            bctx.fill();
        }
    }

    // 2. Geniş Asfalt Bulvar Yolu (Ortadan Geçen Cadde)
    let roadY = 135, roadH = 175;
    bctx.fillStyle = isNightMode ? "#1e293b" : "#334155";
    bctx.fillRect(0, roadY, width, roadH);

    // Yol Kenarı Bordür Taşları (Granit Kaldırım Kenarı)
    bctx.fillStyle = isNightMode ? "#475569" : "#64748b";
    bctx.fillRect(0, roadY - 6, width, 6);
    bctx.fillRect(0, roadY + roadH, width, 6);

    // Asfalt Dokusu ve Şerit Çizgileri
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 3;
    bctx.setLineDash([24, 18]);
    bctx.beginPath();
    bctx.moveTo(0, roadY + roadH / 2);
    bctx.lineTo(width, roadY + roadH / 2);
    bctx.stroke();
    bctx.setLineDash([]); // Çizgiyi sıfırla

    // Üst Kaldırım Taşları (y: 110..130)
    bctx.fillStyle = isNightMode ? "#1e293b" : "#475569";
    bctx.fillRect(0, 110, width, 25);
    bctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    bctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
        bctx.beginPath(); bctx.moveTo(x, 110); bctx.lineTo(x, 135); bctx.stroke();
    }

    // Sol Yol Çıkışı: Türkiye Karayolları Tipi Çiftli Yol Tabelası (Kaldırım / Yol Üstü Yeşil Alanında - TAMAMEN GÖRÜNÜR)
    // Üstte: ⬅ MEYDAN, Altta: ⬅ SAHİL
    drawStackedTurkishSigns(bctx, 12, 80, [
        { text: "MEYDAN", dir: "left" },
        { text: "SAHİL", dir: "left" }
    ], 134);

    // 3. ÜST BİNALAR VE CEPHESİ (%10 YATAY KÜÇÜLTÜLMÜŞ GANYAN VE DEDENİN YERİ)
    // A) 🏇 GANYAN BAYİİ & HİPODROM CEPHESİ (Sol Üst: x: 90, y: 12, w: 300, h: 105)
    let gX = 90, gY = 12, gW = 300, gH = 105;
    bctx.fillStyle = isNightMode ? "#042f2e" : "#064e3b";
    bctx.beginPath(); bctx.roundRect(gX, gY, gW, gH, 12); bctx.fill();
    bctx.strokeStyle = "#f59e0b"; bctx.lineWidth = 2.5; bctx.stroke();

    // Tente (Koyu Yeşil - Beyaz Çizgili Tente)
    let gStripeW = gW / 12;
    for (let i = 0; i < 12; i++) {
        bctx.fillStyle = i % 2 === 0 ? "#10b981" : "#ffffff";
        bctx.fillRect(gX + i * gStripeW, gY + 30, gStripeW, 16);
    }

    // Işıklı Tabela
    bctx.fillStyle = "#facc15";
    bctx.font = "bold 12.5px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🏇 TJK GANYAN BAYİİ & HİPODROM", gX + gW / 2, gY + 22);

    // Sol Vitrin: Canlı Yarış TV Ekranı
    bctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    bctx.fillRect(gX + 14, gY + 52, 85, 48);
    bctx.strokeStyle = "#10b981"; bctx.lineWidth = 1.5; bctx.strokeRect(gX + 14, gY + 52, 85, 48);
    bctx.fillStyle = "#34d399"; bctx.font = "bold 8.5px sans-serif";
    bctx.fillText("🔴 TJK TV CANLI", gX + 56, gY + 70);
    bctx.fillStyle = "#fde047"; bctx.font = "8px sans-serif";
    bctx.fillText("Canlı Hipodrom", gX + 56, gY + 84);

    // Ganyan Giriş Kapısı (x: 215, y: 50, w: 48, h: 54)
    bctx.fillStyle = "#78350f";
    bctx.beginPath(); bctx.roundRect(gX + 125, gY + 50, 48, 54, 6); bctx.fill();
    bctx.strokeStyle = "#facc15"; bctx.lineWidth = 2; bctx.stroke();
    bctx.fillStyle = "#facc15"; bctx.beginPath(); bctx.arc(gX + 162, gY + 77, 3, 0, Math.PI * 2); bctx.fill();
    bctx.fillStyle = "#facc15"; bctx.font = "bold 9px sans-serif";
    bctx.fillText("GİRİŞ", gX + 149, gY + 75);

    // Sağ Bilgi Panosu: Oranlar & Atlar
    bctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    bctx.fillRect(gX + 195, gY + 52, 90, 48);
    bctx.strokeStyle = "#f59e0b"; bctx.lineWidth = 1; bctx.strokeRect(gX + 195, gY + 52, 90, 48);
    bctx.fillStyle = "#fde047"; bctx.font = "bold 8px sans-serif";
    bctx.fillText("💰 6'lı Ganyan", gX + 240, gY + 68);
    bctx.fillStyle = "#ffffff"; bctx.font = "8px sans-serif";
    bctx.fillText("Seyis Binek Harası", gX + 240, gY + 82);

    // B) ⚡ DEDENİN YERİ KUMARHANESİ (Sağ Üst: x: 440, y: 12, w: 300, h: 105)
    let cX = 440, cY = 12, cW = 300, cH = 105;
    bctx.fillStyle = isNightMode ? "#09041a" : "#1e113a";
    bctx.beginPath(); bctx.roundRect(cX, cY, cW, cH, 12); bctx.fill();
    bctx.strokeStyle = "#06b6d4"; bctx.lineWidth = 2.5; bctx.stroke();

    // Altın ve Mor Neon Saçak
    bctx.fillStyle = "rgba(234, 179, 8, 0.25)";
    bctx.fillRect(cX, cY + 28, cW, 16);
    bctx.strokeStyle = "#facc15"; bctx.lineWidth = 1; bctx.strokeRect(cX, cY + 28, cW, 16);

    // GÖRKEMLİ DEDENİN YERİ TABELASI (ŞİMŞEK LOGOLU ⚡)
    bctx.fillStyle = "#fde047";
    bctx.font = "bold 13.5px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("⚡ DEDENİN YERİ ⚡", cX + cW / 2, cY + 22);

    bctx.fillStyle = "#22d3ee";
    bctx.font = "bold 8px sans-serif";
    bctx.fillText("🎰 VIP CASINO & CANLI BLACKJACK 21", cX + cW / 2, cY + 40);

    // Sol Vitrin: Neon İskambil & Rulet Figürleri
    bctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    bctx.fillRect(cX + 14, cY + 52, 85, 48);
    bctx.strokeStyle = "#e11d48"; bctx.lineWidth = 1.5; bctx.strokeRect(cX + 14, cY + 52, 85, 48);
    bctx.fillStyle = "#ef4444"; bctx.font = "15px sans-serif";
    bctx.fillText("♠️ ♥️ ♣️ ♦️", cX + 56, cY + 74);
    bctx.fillStyle = "#facc15"; bctx.font = "8px sans-serif";
    bctx.fillText("Blackjack 3:2", cX + 56, cY + 90);

    // Casino Giriş Kapısı (Altın Yaldızlı Çift Kanat Kapı)
    bctx.fillStyle = "#450a0a";
    bctx.beginPath(); bctx.roundRect(cX + 125, cY + 50, 50, 54, 6); bctx.fill();
    bctx.strokeStyle = "#facc15"; bctx.lineWidth = 2; bctx.stroke();
    bctx.fillStyle = "#facc15";
    bctx.beginPath(); bctx.arc(cX + 143, cY + 77, 3, 0, Math.PI * 2); bctx.fill();
    bctx.beginPath(); bctx.arc(cX + 157, cY + 77, 3, 0, Math.PI * 2); bctx.fill();
    bctx.font = "bold 9px sans-serif";
    bctx.fillText("GİRİŞ", cX + 150, cY + 92);

    // Sağ Vitrin: Slot Çarkı & Jackpot Grafiği
    bctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    bctx.fillRect(cX + 195, cY + 52, 90, 48);
    bctx.strokeStyle = "#facc15"; bctx.lineWidth = 1.5; bctx.strokeRect(cX + 195, cY + 52, 90, 48);
    bctx.fillStyle = "#facc15"; bctx.font = "14px sans-serif";
    bctx.fillText("7️⃣ 7️⃣ 7️⃣", cX + 240, cY + 73);
    bctx.fillStyle = "#38bdf8"; bctx.font = "8px sans-serif";
    bctx.fillText("VIP Jackpot", cX + 240, cY + 89);

    // 4. ALT PARK PROMENADI VE AÇIK HAVA ALANI (y: 315..500)
    let parkY = 320, parkH = height - parkY;
    bctx.fillStyle = isNightMode ? "#064e3b" : "#15803d";
    bctx.fillRect(0, parkY, width, parkH);

    // Minik Kır Çiçekleri & Çim Detayı (Park alanında)
    for (let i = 0; i < 22; i++) {
        let fx = ((i * 113) % 430) + 15;
        let fy = parkY + ((i * 67) % (parkH - 25)) + 10;
        bctx.fillStyle = i % 2 === 0 ? "#fef08a" : "#fca5a5";
        bctx.beginPath(); bctx.arc(fx, fy, 2, 0, Math.PI * 2); bctx.fill();
    }

    // Sol Pet Shop Standı (Genişletildi ve Süs Havuzunun Yerini Kapsadı: x: 15, y: 335, w: 210, h: 135)
    drawPetShopBooth(bctx, 15, 335, 210, 135);

    // YOLUN & HARİTANIN ORTASINDAKİ BANKLAR VE SOKAK LAMBALARI
    drawLampPost(bctx, 210, 218);
    drawBench(bctx, 270, 222);
    drawLampPost(bctx, 380, 218);
    drawBench(bctx, 440, 222);
    drawLampPost(bctx, 550, 218);

    // SAĞ ALT: ☕ DOSTLAR KIRAATHANESİ BİNASI (x: 520, y: 335, w: 260, h: 135)
    drawDostlarKiraathanesiBooth(bctx, 520, 335, 260, 135);
}
function drawCaddeEnvironment() {
    let bg = bgCache.getCanvas('cadde', canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);

    let now = Date.now();



    // Dedenin Yeri Şimşek Tabelası Nabız Parıltısı (Pulse)
    let pulse = (Math.sin(now / 200) + 1) / 2;
    ctx.fillStyle = `rgba(250, 204, 21, ${0.12 + pulse * 0.18})`;
    ctx.fillRect(440, 12, 300, 40);

    // Açık Hava Reklam Panosu (HARİTANIN ORTASINA ÇEKİLDİ: x: 245, y: 345, w: 250, h: 125)
    let isBillboardCaddeHover = (canvasMouseX >= 245 && canvasMouseX <= 495 && canvasMouseY >= 345 && canvasMouseY <= 470);
    if (typeof drawOutdoorBillboard === 'function') {
        drawOutdoorBillboard(ctx, 245, 345, 250, 125, isBillboardCaddeHover);
    }

    // Hover Etkileşim Kontrolleri
    let isPetShopHover = (canvasMouseX >= 15 && canvasMouseX <= 225 && canvasMouseY >= 335 && canvasMouseY <= 470);
    let isGanyanHover = (canvasMouseX >= 90 && canvasMouseX <= 390 && canvasMouseY >= 12 && canvasMouseY <= 125);
    let isCasinoHover = (canvasMouseX >= 440 && canvasMouseX <= 740 && canvasMouseY >= 12 && canvasMouseY <= 125);
    let isKiraathaneHover = (canvasMouseX >= 520 && canvasMouseX <= 780 && canvasMouseY >= 335 && canvasMouseY <= 470);
    let isExitStreetHover = (canvasMouseX <= 66 && canvasMouseY >= 140 && canvasMouseY <= 315);

    if (isBillboardCaddeHover) {
        hoveredTableId = 'billboard_cadde';
        setGameCursor('pointer');
    } else if (isPetShopHover) {
        hoveredTableId = 'cadde_petshop';
        ctx.strokeStyle = "#fb923c";
        ctx.lineWidth = 3;
        ctx.strokeRect(15, 335, 210, 135);
        ctx.fillStyle = "#fef08a";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🐾 Sevimli Patiler Pet Shop (Tıkla)", 120, 325);
        setGameCursor('pointer');
    } else if (isKiraathaneHover) {
        hoveredTableId = 'cadde_dostlar_kiraathanesi';
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3;
        ctx.strokeRect(520, 335, 260, 135);
        ctx.fillStyle = "#fde047";
        ctx.font = "bold 11.5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("☕ Dostlar Kıraathanesi (Dost Kazığı & Oyunlar)", 650, 328);
        setGameCursor('pointer');
    } else if (isGanyanHover) {
        hoveredTableId = 'cadde_ganyan';
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3;
        ctx.strokeRect(90, 12, 300, 105);
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🏇 Ganyan Bayii & Hipodrom'a Gir", 240, 132);
        setGameCursor('pointer');
    } else if (isCasinoHover) {
        hoveredTableId = 'cadde_casino';
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 3;
        ctx.strokeRect(440, 12, 300, 105);
        ctx.fillStyle = "#fde047";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚡ Dedenin Yeri Casino'ya Gir (Blackjack 21)", 590, 132);
        setGameCursor('pointer');
    } else if (isExitStreetHover) {
        hoveredTableId = 'cadde_to_street';
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(4, 180, 64, 60);
        setGameCursor('pointer');
    } else {
        if (hoveredTableId === 'cadde_ganyan' || hoveredTableId === 'cadde_casino' || hoveredTableId === 'cadde_to_street' || hoveredTableId === 'billboard_cadde' || hoveredTableId === 'cadde_petshop' || hoveredTableId === 'cadde_dostlar_kiraathanesi') {
            hoveredTableId = null;
        }
        setGameCursor('default');
    }
}

// ============================================================================
// 13. DEDENİN YERİ CASINO & BLACKJACK 21 SALONU (İÇ MEKAN)
// ============================================================================

function drawPetShopBooth(bctx, psX, psY, psW, psH) {
    bctx.save();
    // Bina Zemin Gölgesi
    bctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    bctx.beginPath();
    bctx.roundRect(psX + 4, psY + psH - 8, psW + 6, 14, 6);
    bctx.fill();

    // Ana Ahşap Gövde
    bctx.fillStyle = isNightMode ? "#451a03" : "#fef3c7";
    bctx.beginPath();
    bctx.roundRect(psX, psY + 22, psW, psH - 22, 10);
    bctx.fill();
    bctx.strokeStyle = "#d97706";
    bctx.lineWidth = 2.2;
    bctx.stroke();

    // Renkli Tente (Turuncu & Beyaz Çizgili)
    let stripeCount = 12;
    let stripeW = psW / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
        bctx.fillStyle = (i % 2 === 0) ? "#f97316" : "#ffffff";
        bctx.beginPath();
        bctx.roundRect(psX + i * stripeW, psY + 20, stripeW, 16, [0, 0, 4, 4]);
        bctx.fill();
    }

    // Sevimli Işıklı Tabela
    bctx.fillStyle = isNightMode ? "#1e293b" : "#ea580c";
    bctx.beginPath();
    bctx.roundRect(psX + 8, psY, psW - 16, 24, 6);
    bctx.fill();
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 1.8;
    bctx.stroke();

    bctx.fillStyle = "#fef08a";
    bctx.font = "bold 12px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🐾 SEVİMLİ PATİLER PET SHOP 🐾", psX + psW / 2, psY + 16);

    // Sol Vitrin: Sevimli Hayvanlar ve Bilgi Rozeti
    let winX = psX + 12, winY = psY + 42, winW = 114, winH = 78;
    bctx.fillStyle = isNightMode ? "rgba(254, 240, 138, 0.18)" : "#e0f2fe";
    bctx.beginPath();
    bctx.roundRect(winX, winY, winW, winH, 6);
    bctx.fill();
    bctx.strokeStyle = "#b45309";
    bctx.lineWidth = 1.8;
    bctx.stroke();

    bctx.font = "24px sans-serif";
    bctx.fillText("🐱 🐶 🐭", winX + winW / 2, winY + 36);

    bctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    bctx.beginPath();
    bctx.roundRect(winX + 4, winY + winH - 22, winW - 8, 16, 4);
    bctx.fill();
    bctx.fillStyle = "#facc15";
    bctx.font = "bold 8.5px sans-serif";
    bctx.fillText("15 Dk Sadık Yoldaş ⏳", winX + winW / 2, winY + winH - 10);

    // Sağ Giriş Kapısı
    let doorX = psX + 138, doorY = psY + 42, doorW = 58, doorH = 82;
    bctx.fillStyle = "#78350f";
    bctx.beginPath();
    bctx.roundRect(doorX, doorY, doorW, doorH, 6);
    bctx.fill();
    bctx.strokeStyle = "#f59e0b";
    bctx.lineWidth = 1.8;
    bctx.stroke();

    // Kapı Camı ve Tokmağı
    bctx.fillStyle = "rgba(56, 189, 248, 0.35)";
    bctx.fillRect(doorX + 8, doorY + 10, doorW - 16, 30);
    bctx.fillStyle = "#facc15";
    bctx.beginPath();
    bctx.arc(doorX + doorW - 12, doorY + 52, 2.5, 0, Math.PI * 2);
    bctx.fill();

    bctx.fillStyle = "#10b981";
    bctx.beginPath();
    bctx.roundRect(doorX + 8, doorY + 60, doorW - 16, 14, 4);
    bctx.fill();
    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 8.5px sans-serif";
    bctx.fillText("GİRİŞ", doorX + doorW / 2, doorY + 70);

    bctx.restore();
}

function drawDostlarKiraathanesiBooth(bctx, dkX, dkY, dkW, dkH) {
    bctx.save();
    // Bina Zemin Gölgesi
    bctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    bctx.beginPath();
    bctx.roundRect(dkX + 6, dkY + dkH - 6, dkW + 8, 14, 6);
    bctx.fill();

    // Ana Ahşap Bina Gövdesi
    bctx.fillStyle = isNightMode ? "#3b1e08" : "#78350f";
    bctx.beginPath();
    bctx.roundRect(dkX, dkY + 22, dkW, dkH - 22, 10);
    bctx.fill();
    bctx.strokeStyle = "#f59e0b";
    bctx.lineWidth = 2.5;
    bctx.stroke();

    // Tuğla/Ahşap Çizgi Detayları
    bctx.strokeStyle = "rgba(0,0,0,0.2)";
    bctx.lineWidth = 1;
    for (let y = dkY + 40; y < dkY + dkH - 10; y += 18) {
        bctx.beginPath(); bctx.moveTo(dkX + 4, y); bctx.lineTo(dkX + dkW - 4, y); bctx.stroke();
    }

    // Nostaljik Tente (Bordo & Beyaz Çizgili Kahvehane Tentesi)
    let stripeCount = 10;
    let stripeW = dkW / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
        bctx.fillStyle = (i % 2 === 0) ? "#991b1b" : "#fef3c7";
        bctx.beginPath();
        bctx.roundRect(dkX + i * stripeW, dkY + 20, stripeW, 16, [0, 0, 4, 4]);
        bctx.fill();
    }

    // Işıklı Ahşap Tabela
    bctx.fillStyle = isNightMode ? "#1c1917" : "#451a03";
    bctx.beginPath();
    bctx.roundRect(dkX + 10, dkY, dkW - 20, 24, 6);
    bctx.fill();
    bctx.strokeStyle = "#fbbf24";
    bctx.lineWidth = 2;
    bctx.stroke();

    bctx.fillStyle = "#fde047";
    bctx.font = "bold 12px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("☕ DOSTLAR KIRAATHANESİ ☕", dkX + dkW / 2, dkY + 16);

    // Sol Vitrin: Semaver & Çay Ocağı
    let win1X = dkX + 14, winY = dkY + 46, winW = 80, winH = 70;
    bctx.fillStyle = isNightMode ? "rgba(254, 240, 138, 0.15)" : "#fef9c3";
    bctx.beginPath(); bctx.roundRect(win1X, winY, winW, winH, 6); bctx.fill();
    bctx.strokeStyle = "#b45309"; bctx.lineWidth = 1.8; bctx.stroke();

    bctx.font = "20px sans-serif";
    bctx.fillText("🫖 ☕", win1X + winW / 2, winY + 32);
    bctx.fillStyle = "#92400e";
    bctx.font = "bold 8.5px sans-serif";
    bctx.fillText("Taze Demli Çay", win1X + winW / 2, winY + 52);
    bctx.fillStyle = "#b45309";
    bctx.font = "bold 7.5px sans-serif";
    bctx.fillText("Közde Kahve", win1X + winW / 2, winY + 63);

    // Orta Kapı (Giriş)
    let doorX = dkX + 104, doorY = dkY + 46, doorW = 52, doorH = 76;
    bctx.fillStyle = "#451a03";
    bctx.beginPath(); bctx.roundRect(doorX, doorY, doorW, doorH, 6); bctx.fill();
    bctx.strokeStyle = "#facc15"; bctx.lineWidth = 2; bctx.stroke();

    // Kapı Camı ve Tokmağı
    bctx.fillStyle = "rgba(56, 189, 248, 0.3)";
    bctx.fillRect(doorX + 8, doorY + 10, doorW - 16, 26);
    bctx.fillStyle = "#facc15";
    bctx.beginPath(); bctx.arc(doorX + doorW - 10, doorY + 48, 2.5, 0, Math.PI * 2); bctx.fill();

    bctx.fillStyle = "#10b981";
    bctx.beginPath(); bctx.roundRect(doorX + 8, doorY + 56, doorW - 16, 14, 4); bctx.fill();
    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 8.5px sans-serif";
    bctx.fillText("GİRİŞ", doorX + doorW / 2, doorY + 66);

    // Sağ Vitrin: Oyun Salonu (Dost Kazığı & Tavla & Okey)
    let win2X = dkX + 166;
    bctx.fillStyle = isNightMode ? "rgba(254, 240, 138, 0.15)" : "#fef9c3";
    bctx.beginPath(); bctx.roundRect(win2X, winY, winW, winH, 6); bctx.fill();
    bctx.strokeStyle = "#b45309"; bctx.lineWidth = 1.8; bctx.stroke();

    bctx.font = "20px sans-serif";
    bctx.fillText("🎲 🃏", win2X + winW / 2, winY + 32);
    bctx.fillStyle = "#dc2626";
    bctx.font = "bold 8.5px sans-serif";
    bctx.fillText("Dost Kazığı 👑", win2X + winW / 2, winY + 52);
    bctx.fillStyle = "#15803d";
    bctx.font = "bold 7.5px sans-serif";
    bctx.fillText("Okey & Tavla", win2X + winW / 2, winY + 63);

    bctx.restore();
}

if (typeof window !== 'undefined') {
    window.renderStaticCaddeTo = renderStaticCaddeTo;
    window.drawCaddeEnvironment = drawCaddeEnvironment;
    window.drawPetShopBooth = drawPetShopBooth;
    window.drawDostlarKiraathanesiBooth = drawDostlarKiraathanesiBooth;
}

// public/js/renderers/renderMarket.js - Mobilya Marketi & Showroom Çizim Modülü
function renderStaticMarketTo(bctx, width, height) {
    // 1. Zemin: Lüks Açık Meşe Showroom Parkesi ve Halı Yolluklar
    bctx.fillStyle = "#b45309";
    bctx.fillRect(0, 0, width, height);

    // Parke derz çizgileri
    bctx.strokeStyle = "rgba(0,0,0,0.15)";
    bctx.lineWidth = 1;
    for (let y = 0; y < height; y += 28) {
        bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(width, y); bctx.stroke();
    }
    for (let x = 0; x < width; x += 60) {
        bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x, height); bctx.stroke();
    }

    // Ana Showroom Halı Yolluğu (Kırmızı & Altın Bordürlü)
    bctx.fillStyle = "#881337";
    bctx.fillRect(265, 0, 70, height);
    bctx.fillRect(0, 260, width, 36);
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 1.5;
    bctx.strokeRect(267, 0, 66, height);
    bctx.strokeRect(0, 262, width, 32);

    // 2. Üst Tabela
    bctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    bctx.beginPath();
    bctx.roundRect(width / 2 - 190, 6, 380, 36, 10);
    bctx.fill();
    bctx.strokeStyle = "#22d3ee";
    bctx.lineWidth = 2;
    bctx.stroke();

    bctx.fillStyle = "#22d3ee";
    bctx.font = "bold 15px 'Plus Jakarta Sans', sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🛒 MOBİLYA & EV DEKORASYON MARKETİ", width / 2, 30);

    // 3. Duvar Teşhir Rafları (Dolu, Canlı ve Şık Mağaza Rafları)
    drawMarketWallShelves(bctx, 30, 48, 480, 80);

    // 4. Kasiyer Hasan ve Danışma Tezgahı (Sağ Üstte)
    let kX = 660, kY = 88;
    bctx.fillStyle = "#451a03";
    bctx.fillRect(kX - 65, kY + 6, 130, 42);
    bctx.fillStyle = "#78350f";
    bctx.fillRect(kX - 60, kY + 10, 120, 34);
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 2;
    bctx.strokeRect(kX - 65, kY + 6, 130, 42);

    // Kasa / POS Terminali
    bctx.fillStyle = "#1e293b";
    bctx.fillRect(kX - 45, kY - 4, 28, 14);
    bctx.fillStyle = "#22c55e";
    bctx.fillRect(kX - 43, kY - 2, 24, 10);
    bctx.fillStyle = "#38bdf8";
    bctx.beginPath(); bctx.arc(kX - 10, kY + 4, 3, 0, Math.PI * 2); bctx.fill();

    bctx.fillStyle = "#facc15";
    bctx.font = "bold 11px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("KASİYER HASAN", kX + 10, kY + 32);

    // Kasiyer NPC Karakteri
    bctx.fillStyle = "#10b981";
    bctx.fillRect(kX + 5, kY - 14, 24, 24);
    bctx.fillStyle = "#ffd1a4";
    bctx.beginPath(); bctx.arc(kX + 17, kY - 24, 10, 0, Math.PI * 2); bctx.fill();
    bctx.fillStyle = "#1e293b";
    bctx.fillRect(kX + 5, kY - 32, 24, 6);
}

function drawMarketEnvironment() {
    let now = Date.now();
    let bg = bgCache.getCanvas('market', canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);
    let kX = 660, kY = 88;

    // Konuşma Balonu
    let bobY = Math.sin(now / 300) * 3;
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.beginPath();
    ctx.roundRect(kX - 110, kY - 74 + bobY, 220, 32, 8);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("👋 Hoş Geldiniz! Tıklayıp Eşya Satın Alın!", kX, kY - 54 + bobY);

    // 5. BEŞ ADET ZENGİN SHOWROOM PODYUMU:
    // Podyum 1: Salon & Şark Köşesi (Sol Üst)
    drawShowroomPodium(ctx, 135, 195, 200, 100, "🛋️ Otantik Şark Sediri & Halı");
    if (typeof drawPlacedFurniture === 'function') {
        drawPlacedFurniture(ctx, { id: 'hali', x: 135, y: 195 });
        drawPlacedFurniture(ctx, { id: 'sedir', x: 135, y: 185 });
    }

    // Podyum 2: RGB Gaming, Retro Atari & Vegas Slot Makinesi (Orta Üst)
    drawShowroomPodium(ctx, 460, 195, 220, 100, "🎮 Gaming PC, Atari & Vegas Slot");
    if (typeof drawPlacedFurniture === 'function') {
        drawPlacedFurniture(ctx, { id: 'bilgisayar', x: 395, y: 195 });
        drawPlacedFurniture(ctx, { id: 'arcade', x: 460, y: 190 });
        drawPlacedFurniture(ctx, { id: 'slot_machine', x: 530, y: 190 });
    }

    // Podyum 3: Smart TV & Doğal Taş Şömine (Sol Alt)
    drawShowroomPodium(ctx, 135, 375, 200, 110, "📺 Smart TV & Doğal Taş Şömine");
    if (typeof drawPlacedFurniture === 'function') {
        drawPlacedFurniture(ctx, { id: 'tv', x: 85, y: 375 });
        drawPlacedFurniture(ctx, { id: 'somine', x: 185, y: 375 });
    }

    // Podyum 4: Piyano & Kütüphane (Orta Alt)
    drawShowroomPodium(ctx, 450, 375, 200, 110, "🎹 Kuyruklu Piyano & Kütüphane");
    if (typeof drawPlacedFurniture === 'function') {
        drawPlacedFurniture(ctx, { id: 'piyano', x: 410, y: 375 });
        drawPlacedFurniture(ctx, { id: 'kitaplik', x: 495, y: 370 });
    }

    // Podyum 5: Resif Akvaryumu & Lüks Deri Berjer (Sağ Taraf)
    drawShowroomPodium(ctx, 675, 260, 185, 150, "🐠 Canlı Akvaryum & Berjer");
    if (typeof drawPlacedFurniture === 'function') {
        drawPlacedFurniture(ctx, { id: 'akvaryum', x: 675, y: 220 });
        drawPlacedFurniture(ctx, { id: 'berjer', x: 640, y: 280 });
        drawPlacedFurniture(ctx, { id: 'gramofon', x: 715, y: 280 });
    }

    // Tavan Ray Spotları (Showroom Aydınlatmaları)
    drawCeilingTrackLights(ctx);

    // 6. Çıkış Kapısı (Orta Altta - Meydana Çıkış)
    drawExitDoor(ctx, canvas.width / 2 - 25, canvas.height - 65, "🚪 MEYDAN");
}

function drawMarketWallShelves(ctx, x, y, w, h) {
    ctx.save();
    // Ahşap Arka Panel
    ctx.fillStyle = "#3e1c07";
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill();
    ctx.strokeStyle = "#ca8a04"; ctx.lineWidth = 1.5; ctx.stroke();

    // 2 Adet Masif Raf Tablası
    let r1 = y + 36;
    let r2 = y + 74;
    ctx.fillStyle = "#78350f";
    ctx.fillRect(x + 4, r1, w - 8, 6);
    ctx.fillRect(x + 4, r2, w - 8, 6);
    ctx.fillStyle = "#ca8a04";
    ctx.fillRect(x + 4, r1 + 5, w - 8, 1.5);
    ctx.fillRect(x + 4, r2 + 5, w - 8, 1.5);

    // 1. Üst Raftaki Eşyalar:
    // Masa Lambası (Sarı abajur)
    ctx.fillStyle = "#facc15";
    ctx.beginPath(); ctx.moveTo(x + 24, r1 - 22); ctx.lineTo(x + 36, r1 - 22); ctx.lineTo(x + 42, r1 - 10); ctx.lineTo(x + 18, r1 - 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ca8a04"; ctx.fillRect(x + 28, r1 - 10, 4, 10); ctx.fillRect(x + 24, r1, 12, 2);

    // Renkli Kitap Dizisi
    let bColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
    bColors.forEach((bc, i) => {
        ctx.fillStyle = bc;
        ctx.fillRect(x + 56 + i * 8, r1 - 24, 6, 24);
        ctx.fillStyle = "#fef08a"; ctx.fillRect(x + 56 + i * 8, r1 - 20, 6, 1.5);
    });

    // Porselen Vazo ve Çiçekler
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath(); ctx.ellipse(x + 130, r1 - 8, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ec4899"; ctx.beginPath(); ctx.arc(x + 130, r1 - 18, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(x + 135, r1 - 15, 3, 0, Math.PI * 2); ctx.fill();

    // Rulo Halılar
    ctx.fillStyle = "#991b1b"; ctx.beginPath(); ctx.roundRect(x + 160, r1 - 14, 34, 12, 4); ctx.fill();
    ctx.fillStyle = "#1e3a8a"; ctx.beginPath(); ctx.roundRect(x + 198, r1 - 14, 34, 12, 4); ctx.fill();
    ctx.fillStyle = "#facc15"; ctx.fillRect(x + 162, r1 - 10, 2, 8); ctx.fillRect(x + 200, r1 - 10, 2, 8);

    // Altın Şamdan ve Mumlar
    ctx.fillStyle = "#facc15"; ctx.fillRect(x + 255, r1 - 18, 3, 18);
    ctx.fillRect(x + 248, r1 - 12, 17, 3);
    ctx.fillStyle = "#ea580c"; ctx.beginPath(); ctx.arc(x + 256.5, r1 - 21, 2, 0, Math.PI * 2); ctx.fill();

    // Antika Küre
    ctx.fillStyle = "#ca8a04"; ctx.fillRect(x + 295, r1 - 6, 4, 6);
    ctx.fillStyle = "#0284c7"; ctx.beginPath(); ctx.arc(x + 297, r1 - 14, 7, 0, Math.PI * 2); ctx.fill();

    // Monstera Saksı & Ficus
    ctx.fillStyle = "#f8fafc"; ctx.fillRect(x + 330, r1 - 12, 14, 12);
    ctx.fillStyle = "#16a34a"; ctx.beginPath(); ctx.arc(x + 337, r1 - 16, 7, 0, Math.PI * 2); ctx.fill();

    // Vintage Radyo
    ctx.fillStyle = "#78350f"; ctx.beginPath(); ctx.roundRect(x + 370, r1 - 16, 26, 16, 3); ctx.fill();
    ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.arc(x + 378, r1 - 8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1e293b"; ctx.fillRect(x + 386, r1 - 12, 7, 4);

    // İndirim Rozeti
    ctx.fillStyle = "#dc2626"; ctx.beginPath(); ctx.roundRect(x + 420, r1 - 20, 52, 18, 4); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("🏷️ %20 İNDİRİM", x + 446, r1 - 8);

    // 2. Alt Raftaki Eşyalar:
    // Hediyelik Kutular
    ctx.fillStyle = "#0284c7"; ctx.fillRect(x + 20, r2 - 16, 22, 16);
    ctx.fillStyle = "#facc15"; ctx.fillRect(x + 29, r2 - 16, 4, 16); ctx.fillRect(x + 20, r2 - 9, 22, 4);

    ctx.fillStyle = "#ec4899"; ctx.fillRect(x + 50, r2 - 14, 18, 14);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 57, r2 - 14, 4, 14);

    // Ansiklopedi Seti
    for (let j = 0; j < 8; j++) {
        ctx.fillStyle = (j % 2 === 0) ? "#1e293b" : "#7f1d1d";
        ctx.fillRect(x + 85 + j * 7, r2 - 20, 6, 20);
    }

    // Mini Masa Lambası
    ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.moveTo(x + 165, r2 - 16); ctx.lineTo(x + 179, r2 - 16); ctx.lineTo(x + 183, r2 - 6); ctx.lineTo(x + 161, r2 - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#64748b"; ctx.fillRect(x + 169, r2 - 6, 2, 6);

    // Cam Fanus & Sukulent
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x + 215, r2 - 11, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(x + 215, r2 - 8, 4, 0, Math.PI * 2); ctx.fill();

    // Ahşap Sandık
    ctx.fillStyle = "#5c2306"; ctx.beginPath(); ctx.roundRect(x + 245, r2 - 14, 22, 14, 3); ctx.fill();
    ctx.fillStyle = "#facc15"; ctx.fillRect(x + 253, r2 - 9, 6, 4);

    // Fotoğraf Çerçeveleri
    ctx.fillStyle = "#ca8a04"; ctx.fillRect(x + 285, r2 - 18, 15, 18);
    ctx.fillStyle = "#38bdf8"; ctx.fillRect(x + 287, r2 - 16, 11, 14);
    ctx.fillStyle = "#ca8a04"; ctx.fillRect(x + 305, r2 - 16, 14, 16);
    ctx.fillStyle = "#facc15"; ctx.fillRect(x + 307, r2 - 14, 10, 12);

    // Kaktüs Serisi
    ctx.fillStyle = "#b45309"; ctx.fillRect(x + 338, r2 - 8, 10, 8); ctx.fillRect(x + 355, r2 - 8, 10, 8);
    ctx.fillStyle = "#15803d"; ctx.beginPath(); ctx.arc(x + 343, r2 - 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 360, r2 - 14, 5, 0, Math.PI * 2); ctx.fill();

    // "YENİ GELENLER" Tabelası
    ctx.fillStyle = "#059669"; ctx.beginPath(); ctx.roundRect(x + 385, r2 - 18, 70, 18, 4); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("✨ YENİ SEZON", x + 420, r2 - 6);

    ctx.restore();
}

function drawCeilingTrackLights(ctx) {
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(40, 2); ctx.lineTo(canvas.width - 40, 2); ctx.stroke();

    let spots = [135, 295, 450, 600, 710];
    spots.forEach(sx => {
        ctx.fillStyle = "#64748b";
        ctx.fillRect(sx - 3, 2, 6, 6);
        ctx.fillStyle = "#1e293b";
        ctx.beginPath(); ctx.arc(sx, 11, 5, 0, Math.PI * 2); ctx.fill();

        let halo = ctx.createRadialGradient(sx, 12, 1, sx, 80, 70);
        halo.addColorStop(0, "rgba(254, 240, 138, 0.16)");
        halo.addColorStop(1, "transparent");
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(sx, 80, 70, 0, Math.PI * 2); ctx.fill();
    });
}

function drawShowroomPodium(ctx, x, y, w, h, label) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + h / 2 + 14);
}


if (typeof window !== 'undefined') {
    window.renderStaticMarketTo = renderStaticMarketTo;
    window.drawMarketEnvironment = drawMarketEnvironment;
    window.drawMarketWallShelves = drawMarketWallShelves;
    window.drawCeilingTrackLights = drawCeilingTrackLights;
    window.drawShowroomPodium = drawShowroomPodium;
}

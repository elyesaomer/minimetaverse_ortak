// public/js/renderers/renderEmlakci.js - Prestij Gayrimenkul Emlak Ofisi Çizim Modülü
function renderStaticEmlakciTo(bctx, width, height) {
    const housePrices = window.METAVERSE_PRICES.HOUSE_PRICES;
    // 1. Zemin: Parlak İtalyan Mermer Karo (Kare Mermer & Altın Çıta)
    bctx.fillStyle = "#0f172a";
    bctx.fillRect(0, 0, width, height);

    // Mermer Karo Zemin (Geniş salon boyunca 40x40 karolar)
    let tileSize = 42;
    for (let ty = 0; ty < height; ty += tileSize) {
        for (let tx = 0; tx < width; tx += tileSize) {
            let isAlt = ((tx / tileSize + ty / tileSize) % 2 === 0);
            bctx.fillStyle = isAlt ? "#1e293b" : "#0f172a";
            bctx.fillRect(tx, ty, tileSize, tileSize);
            bctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
            bctx.lineWidth = 1;
            bctx.strokeRect(tx, ty, tileSize, tileSize);
        }
    }

    // 2. Lüks Kraliyet Mavisi & Altın Çerçeveli Merkez Halısı
    let rugX = 65, rugY = 175, rugW = 670, rugH = 215;
    bctx.save();
    let rugGrad = bctx.createLinearGradient(rugX, rugY, rugX + rugW, rugY + rugH);
    rugGrad.addColorStop(0, '#0c4a6e');
    rugGrad.addColorStop(0.5, '#075985');
    rugGrad.addColorStop(1, '#0369a1');
    bctx.fillStyle = rugGrad;
    bctx.beginPath();
    bctx.roundRect(rugX, rugY, rugW, rugH, 18);
    bctx.fill();

    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 3;
    bctx.stroke();

    // Halı Saçakları ve İç Geometrik Bordür
    bctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
    bctx.lineWidth = 1.2;
    bctx.strokeRect(rugX + 8, rugY + 8, rugW - 16, rugH - 16);
    bctx.restore();

    // 3. Üst Mimari Duvar ve Tavandaki Sıcak Spot Işıklar
    bctx.fillStyle = "#090d16";
    bctx.fillRect(0, 0, width, 65);
    bctx.strokeStyle = "rgba(255,255,255,0.1)";
    bctx.lineWidth = 1.5;
    bctx.beginPath(); bctx.moveTo(0, 65); bctx.lineTo(width, 65); bctx.stroke();

    // Duvara Asılı Mimari Çizimler / Çerçeveli Tablolar
    // Sol Proje Tablosu: Standart Şehir Projesi
    bctx.fillStyle = "#1e293b";
    bctx.fillRect(80, 12, 110, 44);
    bctx.strokeStyle = "#38bdf8"; bctx.lineWidth = 1.5; bctx.strokeRect(80, 12, 110, 44);
    bctx.fillStyle = "#38bdf8"; bctx.font = "bold 8px sans-serif"; bctx.textAlign = "center";
    bctx.fillText("🏢 ŞEHİR REZİDANSLARI", 135, 26);
    bctx.fillStyle = "#94a3b8"; bctx.font = "7px sans-serif";
    bctx.fillText("Mimari Kesit & Planlar", 135, 42);

    // Sağ Proje Tablosu: Doğa & Villa Projesi
    bctx.fillStyle = "#1e293b";
    bctx.fillRect(width - 190, 12, 110, 44);
    bctx.strokeStyle = "#facc15"; bctx.lineWidth = 1.5; bctx.strokeRect(width - 190, 12, 110, 44);
    bctx.fillStyle = "#facc15"; bctx.font = "bold 8px sans-serif"; bctx.textAlign = "center";
    bctx.fillText("🏰 PANORAMİK VİLLALAR", width - 135, 26);
    bctx.fillStyle = "#94a3b8"; bctx.font = "7px sans-serif";
    bctx.fillText("Bahçe & Peyzaj Tasarımı", width - 135, 42);

    // Ana Tabela (Ortada: x: 220, y: 8, w: 360, h: 48)
    bctx.fillStyle = "#0f172a";
    bctx.beginPath(); bctx.roundRect(220, 8, 360, 48, 8); bctx.fill();
    bctx.strokeStyle = "#38bdf8"; bctx.lineWidth = 2; bctx.stroke();

    bctx.fillStyle = "#38bdf8";
    bctx.font = "bold 13px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🏢 PRESTİJ GAYRİMENKUL & EMLAK OFİSİ 🏢", 400, 26);
    bctx.fillStyle = "#fde047";
    bctx.font = "bold 9px sans-serif";
    bctx.fillText("Maketleri İnceleyin • Satın Almadan Önce Evi Gezin", 400, 43);

    // 4. Satış Danışmanı Danışma & Karşılama Bankosu (Orta Üst: x: 310..490, y: 70..130)
    let dX = 320, dY = 75, dW = 160, dH = 55;
    bctx.fillStyle = "rgba(0,0,0,0.4)";
    bctx.fillRect(dX + 6, dY + 8, dW, dH);

    // Banko Gövdesi (Ceviz Ağacı Kaplama & Beyaz Mermer Üst)
    bctx.fillStyle = "#451a03";
    bctx.beginPath(); bctx.roundRect(dX, dY, dW, dH, 10); bctx.fill();
    bctx.strokeStyle = "#ca8a04"; bctx.lineWidth = 2; bctx.stroke();

    // Mermer Üst Yüzey
    bctx.fillStyle = "#f8fafc";
    bctx.beginPath(); bctx.roundRect(dX - 2, dY, dW + 4, 14, 4); bctx.fill();
    bctx.strokeStyle = "#e2e8f0"; bctx.lineWidth = 1; bctx.stroke();

    // Masa Üstündeki Bilgisayar & Mimari Plan Rulosu
    bctx.fillStyle = "#334155";
    bctx.fillRect(dX + 20, dY - 6, 26, 16);
    bctx.fillStyle = "#38bdf8";
    bctx.fillRect(dX + 22, dY - 4, 22, 10);
    // Mimari Plan Rulosu
    bctx.fillStyle = "#fef08a";
    bctx.fillRect(dX + 110, dY + 2, 32, 6);
    bctx.strokeStyle = "#ca8a04"; bctx.lineWidth = 1; bctx.strokeRect(dX + 110, dY + 2, 32, 6);

    // Danışman İsimliği
    bctx.fillStyle = "#1e293b";
    bctx.fillRect(dX + 50, dY + 28, 60, 16);
    bctx.strokeStyle = "#facc15"; bctx.lineWidth = 1; bctx.strokeRect(dX + 50, dY + 28, 60, 16);
    bctx.fillStyle = "#facc15"; bctx.font = "bold 8px sans-serif";
    bctx.fillText("MERT BEY", dX + 80, dY + 40);

    // =========================================================================
    // 5. ÜÇ ADET 3D MİMARİ EV MAKETİ (AYNI MARKETTEKİ PODYUMLAR GİBİ!)
    // =========================================================================
    // Podyum 1: 🏢 Standart Şehir Dairesi (Sol: x: 90, y: 215, w: 160, h: 140)
    drawMaketPedestal(bctx, 90, 215, 160, 140, `🏢 Standart Daire (${housePrices.standart.toLocaleString('tr-TR')} TL)`, "#38bdf8");
    drawMiniApartmentBuilding(bctx, 170, 255);

    // Podyum 2: 🏡 Verandalı Bahçeli Ev (Orta: x: 320, y: 215, w: 160, h: 140)
    drawMaketPedestal(bctx, 320, 215, 160, 140, `🏡 Bahçeli Ev (${housePrices.garden.toLocaleString('tr-TR')} TL)`, "#22c55e");
    drawMiniCountryHouse(bctx, 400, 255);

    // Podyum 3: 🏰 Bahçeli & Havuzlu Villa (Sağ: x: 550, y: 215, w: 160, h: 140)
    drawMaketPedestal(bctx, 550, 215, 160, 140, `🏰 Havuzlu Villa (${housePrices.pool.toLocaleString('tr-TR')} TL)`, "#f59e0b");
    drawMiniLuxuryVilla(bctx, 630, 255);

    // 6. Sol Alt: Müşteri Bekleme & Dinlenme Köşesi (Deri Kanepe & Sehpa)
    let sX = 25, sY = 395;
    // Sehpa
    bctx.fillStyle = "#78350f";
    bctx.beginPath(); bctx.roundRect(sX + 80, sY + 12, 38, 48, 6); bctx.fill();
    bctx.strokeStyle = "#ca8a04"; bctx.lineWidth = 1.5; bctx.stroke();
    bctx.fillStyle = "#38bdf8"; bctx.font = "bold 7px sans-serif";
    bctx.fillText("Katalog", sX + 99, sY + 38);

    // Kanepe
    bctx.fillStyle = "#475569";
    bctx.beginPath(); bctx.roundRect(sX, sY, 68, 60, 8); bctx.fill();
    bctx.strokeStyle = "#94a3b8"; bctx.lineWidth = 1.5; bctx.stroke();
    bctx.fillStyle = "#f8fafc";
    bctx.font = "bold 8px sans-serif";
    bctx.fillText("🛋️ Dinlenme", sX + 34, sY + 35);

    // 7. Çıkış Kapısı (Orta Altta: Caddeye Açılır)
    drawExitDoor(bctx, width / 2 - 35, height - 65, "🚪 CADDE", 70, 60);
}

// Maket Podyumu Çizim Yardımcısı
function drawMaketPedestal(ctx, x, y, w, h, label, accentColor) {
    ctx.save();
    // Podyum Taban Gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath(); ctx.roundRect(x + 6, y + 8, w, h, 14); ctx.fill();

    // Ahşap Gövde (Ceviz & Bronz)
    ctx.fillStyle = "#1e293b";
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cam Teşhir Tablası (Spot Işıklı Zemin)
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.beginPath(); ctx.roundRect(x + 8, y + 8, w - 16, h - 42, 8); ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Alt Pirinç Plaka & Ev Adı
    ctx.fillStyle = "#0f172a";
    ctx.beginPath(); ctx.roundRect(x + 10, y + h - 30, w - 20, 22, 6); ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, y + h - 15);
    ctx.restore();
}

// 1. Minyatür Standart Şehir Dairesi Maketi
function drawMiniApartmentBuilding(ctx, cx, cy) {
    ctx.save();
    // Bina Gövdesi (Modern Şehir Bloğu)
    let bW = 54, bH = 68;
    let bX = cx - bW / 2, bY = cy - bH / 2;

    // Bina Gölgesi
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(bX + 5, bY + 6, bW, bH);

    // Cephe Rengi (Antrasit & Beyaz)
    ctx.fillStyle = "#334155";
    ctx.fillRect(bX, bY, bW, bH);
    ctx.strokeStyle = "#0284c7"; ctx.lineWidth = 1.5; ctx.strokeRect(bX, bY, bW, bH);

    // Minik Işıklı Pencereler (3 Kat x 3 Sütun)
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            let pX = bX + 6 + c * 16;
            let pY = bY + 8 + r * 18;
            ctx.fillStyle = "#fef08a"; // Sıcak lamba ışığı
            ctx.fillRect(pX, pY, 10, 11);
            ctx.strokeStyle = "#d97706"; ctx.lineWidth = 0.8; ctx.strokeRect(pX, pY, 10, 11);
        }
    }

    // Minyatür Giriş Kapısı & Çatı Anteni
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(bX + bW / 2 - 5, bY + bH - 12, 10, 12);
    ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, bY); ctx.lineTo(cx, bY - 10); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, bY - 10, 2, 0, Math.PI * 2); ctx.fillStyle = "#ef4444"; ctx.fill();
    ctx.restore();
}

// 2. Minyatür Verandalı Bahçeli Ev Maketi
function drawMiniCountryHouse(ctx, cx, cy) {
    ctx.save();
    let bW = 60, bH = 46;
    let bX = cx - bW / 2, bY = cy - bH / 2 + 10;

    // Çim Bahçe Zemini
    ctx.fillStyle = "#15803d";
    ctx.beginPath(); ctx.roundRect(cx - 42, cy - 25, 84, 76, 6); ctx.fill();
    ctx.strokeStyle = "#86efac"; ctx.lineWidth = 1; ctx.stroke();

    // Minik Çitler
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 7; i++) {
        ctx.fillRect(cx - 38 + i * 12, cy + 42, 6, 8);
    }

    // Ev Gövdesi (Ahşap & Taş)
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(bX, bY, bW, bH);
    ctx.strokeStyle = "#78350f"; ctx.lineWidth = 1.5; ctx.strokeRect(bX, bY, bW, bH);

    // Kırmızı Üçgen Çatı
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(bX - 4, bY);
    ctx.lineTo(cx, bY - 20);
    ctx.lineTo(bX + bW + 4, bY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#991b1b"; ctx.lineWidth = 1.2; ctx.stroke();

    // Minik Baca
    ctx.fillStyle = "#78350f";
    ctx.fillRect(cx + 12, bY - 24, 7, 12);

    // Ahşap Veranda & Kapı
    ctx.fillStyle = "#b45309";
    ctx.fillRect(cx - 6, bY + bH - 14, 12, 14);

    // Minik Elma Ağacı (Bahçede)
    ctx.fillStyle = "#78350f";
    ctx.fillRect(cx + 26, cy - 8, 4, 16);
    ctx.fillStyle = "#16a34a";
    ctx.beginPath(); ctx.arc(cx + 28, cy - 14, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.arc(cx + 25, cy - 16, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 31, cy - 12, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// 3. Minyatür Lüks Havuzlu Villa Maketi
function drawMiniLuxuryVilla(ctx, cx, cy) {
    ctx.save();
    // Mermer Bahçe Zemini
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath(); ctx.roundRect(cx - 44, cy - 25, 88, 76, 6); ctx.fill();

    // 2 Katlı Beyaz Villa
    let vW = 46, vH = 50;
    let vX = cx - 40, vY = cy - 20;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(vX, vY, vW, vH);
    ctx.strokeStyle = "#0284c7"; ctx.lineWidth = 1.5; ctx.strokeRect(vX, vY, vW, vH);

    // Panoramik Cam Pencereler
    ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
    ctx.fillRect(vX + 6, vY + 6, 34, 15);
    ctx.fillRect(vX + 6, vY + 28, 22, 16);

    // Kristal Turkuaz Yüzme Havuzu (Işıltılı)
    let pX = cx + 12, pY = cy - 15, pW = 28, pH = 44;
    ctx.fillStyle = "#06b6d4";
    ctx.beginPath(); ctx.roundRect(pX, pY, pW, pH, 4); ctx.fill();
    ctx.strokeStyle = "#e0f2fe"; ctx.lineWidth = 1.5; ctx.stroke();

    // Havuz Su Dalgası
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pX + 4, pY + 12); ctx.lineTo(pX + pW - 4, pY + 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pX + 4, pY + 28); ctx.lineTo(pX + pW - 4, pY + 28); ctx.stroke();

    // Minik Şezlong & Şemsiye
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(pX - 4, pY + 4, 3, 10);
    // Minik Palmiye Ağacı
    ctx.fillStyle = "#78350f";
    ctx.fillRect(cx - 36, cy + 34, 3, 12);
    ctx.fillStyle = "#22c55e";
    ctx.beginPath(); ctx.arc(cx - 35, cy + 32, 7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawEmlakciEnvironment() {
    let bg = bgCache.getCanvas('emlakci', canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);

    let now = Date.now();

    // 1. Satış Danışmanı NPC (Mert Bey) Çizimi (x: 400, y: 72)
    let nX = 400, nY = 72;
    ctx.save();
    // Beden & Lacivert Takım Elbise
    ctx.fillStyle = "#1e3a8a";
    ctx.beginPath(); ctx.roundRect(nX - 12, nY + 10, 24, 20, 4); ctx.fill();
    // Beyaz Gömlek & Kırmızı İpek Kravat
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(nX - 4, nY + 10, 8, 12);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(nX - 1.5, nY + 12, 3, 10);

    // Kafa & Yüz
    ctx.fillStyle = "#fbcfe8";
    ctx.beginPath(); ctx.arc(nX, nY + 2, 8, 0, Math.PI * 2); ctx.fill();
    // Stilize Saç
    ctx.fillStyle = "#451a03";
    ctx.beginPath(); ctx.arc(nX, nY, 8.5, Math.PI, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Satış Danışmanı Baş Üstü Canlı Konuşma Baloncuğu
    let bubbleY = nY - 26 + Math.sin(now / 350) * 2;
    ctx.save();
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath(); ctx.roundRect(nX - 145, bubbleY - 14, 290, 24, 8); ctx.fill();
    ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 1.5; ctx.stroke();

    // Balon Okcuğu
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(nX - 6, bubbleY + 10);
    ctx.lineTo(nX, bubbleY + 17);
    ctx.lineTo(nX + 6, bubbleY + 10);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 9.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🤵 \"Hoş geldiniz! Satın almadan önce evleri gezmek ister misiniz?\"", nX, bubbleY + 2);
    ctx.restore();

    // 2. Maketlerin Üzerindeki Işık Parıltısı / Nabız Efekti
    let pulse = (Math.sin(now / 250) + 1) / 2;

    // Hover Etkileşim Kontrolleri
    let isDeskHover = (canvasMouseX >= 310 && canvasMouseX <= 490 && canvasMouseY >= 65 && canvasMouseY <= 145);
    let isMaket1Hover = (canvasMouseX >= 85 && canvasMouseX <= 255 && canvasMouseY >= 210 && canvasMouseY <= 360);
    let isMaket2Hover = (canvasMouseX >= 315 && canvasMouseX <= 485 && canvasMouseY >= 210 && canvasMouseY <= 360);
    let isMaket3Hover = (canvasMouseX >= 545 && canvasMouseX <= 715 && canvasMouseY >= 210 && canvasMouseY <= 360);
    let isExitHover = (canvasMouseX >= canvas.width / 2 - 45 && canvasMouseX <= canvas.width / 2 + 45 && canvasMouseY >= canvas.height - 75 && canvasMouseY <= canvas.height - 5);

    if (isDeskHover) {
        hoveredTableId = 'emlakci_desk';
        ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 3;
        ctx.strokeRect(320, 75, 160, 55);
        ctx.fillStyle = "#38bdf8"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("🤵 Satış Danışmanı Mert Bey ile Konuş (Tıkla / E)", 400, 148);
    } else if (isMaket1Hover) {
        hoveredTableId = 'maket_standart';
        ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 3.5;
        ctx.strokeRect(90, 215, 160, 140);
        ctx.fillStyle = "#38bdf8"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("👁️ Maketi İncele & Evi Gez (Tıkla / E)", 170, 205);
    } else if (isMaket2Hover) {
        hoveredTableId = 'maket_garden';
        ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 3.5;
        ctx.strokeRect(320, 215, 160, 140);
        ctx.fillStyle = "#86efac"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("👁️ Maketi İncele & Evi Gez (Tıkla / E)", 400, 205);
    } else if (isMaket3Hover) {
        hoveredTableId = 'maket_pool';
        ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 3.5;
        ctx.strokeRect(550, 215, 160, 140);
        ctx.fillStyle = "#fde047"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("👁️ Maketi İncele & Evi Gez (Tıkla / E)", 630, 205);
    } else if (isExitHover) {
        hoveredTableId = 'emlakci_exit';
        ctx.strokeStyle = "#facc15"; ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width / 2 - 37, canvas.height - 67, 74, 64);
        ctx.fillStyle = "#facc15"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("🚪 Caddeye Çık", canvas.width / 2, canvas.height - 72);
    } else {
        if (hoveredTableId && hoveredTableId.startsWith('emlakci_') || hoveredTableId && hoveredTableId.startsWith('maket_')) {
            hoveredTableId = null;
        }
    }

    setGameCursor((isDeskHover || isMaket1Hover || isMaket2Hover || isMaket3Hover || isExitHover) ? 'pointer' : 'default');
}


if (typeof window !== 'undefined') {
    window.renderStaticEmlakciTo = renderStaticEmlakciTo;
    window.drawMaketPedestal = drawMaketPedestal;
    window.drawMiniApartmentBuilding = drawMiniApartmentBuilding;
    window.drawMiniCountryHouse = drawMiniCountryHouse;
    window.drawMiniLuxuryVilla = drawMiniLuxuryVilla;
    window.drawEmlakciEnvironment = drawEmlakciEnvironment;
}

// public/js/renderers/renderMeydanV2.js - Meydan v2 (1000x625) Geniş İzometrik Harita & Mekan Render Motoru
// Sanalika tarzı sahte 3D izometrik perspektif, orijinal Meydan binaları ve canlı Açık Hava Reklam Panosu

(function () {
    let fountainWaveOffset = 0;

    /**
     * Statik Meydan v2 Çizimi (bgCache için 1 defa çizilir, 60 FPS GPU dostu önbellek)
     */
    function renderStaticMeydanV2To(bctx, width, height) {
        let isNight = (typeof isNightMode !== 'undefined' ? isNightMode : (window.isNightMode || false));

        // 1. Zemin: Doğal Park Çimi & Yumuşak Gölgelendirme
        let grassGrad = bctx.createLinearGradient(0, 0, width, height);
        if (isNight) {
            grassGrad.addColorStop(0, "#091420");
            grassGrad.addColorStop(0.5, "#0b1928");
            grassGrad.addColorStop(1, "#07101a");
        } else {
            grassGrad.addColorStop(0, "#387d3a");
            grassGrad.addColorStop(0.5, "#438e46");
            grassGrad.addColorStop(1, "#2f6b31");
        }
        bctx.fillStyle = grassGrad;
        bctx.fillRect(0, 0, width, height);

        // Çim doku noktacıkları & kır çiçekleri
        for (let i = 0; i < 400; i++) {
            let fx = (i * 97) % width;
            let fy = (i * 71) % height;
            // Binaların ve yolun altına gelmeyen yerlere minik çiçekler
            if (fy > 165 && fy < 415 && (fx < 260 || fx > 600)) {
                bctx.fillStyle = (i % 2 === 0) ? (isNight ? "#ca8a04" : "#fef08a") : (isNight ? "#9f1239" : "#fca5a5");
                bctx.beginPath();
                bctx.arc(fx, fy, 2, 0, Math.PI * 2);
                bctx.fill();
            }
        }

        // 2. Büyük İzometrik Bulvar ve Geniş Meydan Yolu (Ortadan Geçen Ana Bulvar: y: 175 to 425)
        let roadTop = 175, roadHeight = 245;
        let roadGrad = bctx.createLinearGradient(0, roadTop, 0, roadTop + roadHeight);
        if (isNight) {
            roadGrad.addColorStop(0, "#1e293b");
            roadGrad.addColorStop(0.5, "#334155");
            roadGrad.addColorStop(1, "#1e293b");
        } else {
            roadGrad.addColorStop(0, "#64748b");
            roadGrad.addColorStop(0.5, "#94a3b8");
            roadGrad.addColorStop(1, "#64748b");
        }
        bctx.fillStyle = roadGrad;
        bctx.fillRect(0, roadTop, width, roadHeight);

        // Üst & Alt Kaldırım Bordür Taşları (3D Kabartmalı Granit Bordürler)
        bctx.fillStyle = isNight ? "#0f172a" : "#475569";
        bctx.fillRect(0, roadTop - 12, width, 12);
        bctx.fillRect(0, roadTop + roadHeight, width, 12);
        bctx.fillStyle = isNight ? "#38bdf8" : "#cbd5e1";
        bctx.fillRect(0, roadTop - 2, width, 2);
        bctx.fillRect(0, roadTop + roadHeight, width, 2);

        // Parke Taş Dokusu & Çapraz İzometrik Taş Derzleri
        bctx.strokeStyle = isNight ? "rgba(15, 23, 42, 0.45)" : "rgba(71, 85, 105, 0.35)";
        bctx.lineWidth = 1.2;
        for (let x = -width; x < width * 2; x += 40) {
            bctx.beginPath();
            bctx.moveTo(x, roadTop);
            bctx.lineTo(x + roadHeight * 0.7, roadTop + roadHeight);
            bctx.stroke();

            bctx.beginPath();
            bctx.moveTo(x, roadTop);
            bctx.lineTo(x - roadHeight * 0.7, roadTop + roadHeight);
            bctx.stroke();
        }

        // Yaya Geçitleri (Cadde Çıkışına Doğru Beyaz Şeritler)
        bctx.fillStyle = isNight ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.75)";
        for (let sy = roadTop + 20; sy < roadTop + roadHeight - 20; sy += 28) {
            bctx.fillRect(920, sy, 45, 14);
        }

        // 3. Güney Yolu (Sahil Geçiş Koridoru: x: 440..560, y: 420 to 625)
        let sahilRoadGrad = bctx.createLinearGradient(440, 0, 560, 0);
        if (isNight) {
            sahilRoadGrad.addColorStop(0, "#1e293b");
            sahilRoadGrad.addColorStop(1, "#334155");
        } else {
            sahilRoadGrad.addColorStop(0, "#64748b");
            sahilRoadGrad.addColorStop(1, "#94a3b8");
        }
        bctx.fillStyle = sahilRoadGrad;
        bctx.fillRect(440, roadTop + roadHeight, 120, height - (roadTop + roadHeight));
        bctx.fillStyle = isNight ? "#0f172a" : "#475569";
        bctx.fillRect(434, roadTop + roadHeight, 6, height - (roadTop + roadHeight));
        bctx.fillRect(560, roadTop + roadHeight, 6, height - (roadTop + roadHeight));

        // Sahile yönlendirici oklar ve palmiye süsleri
        bctx.fillStyle = isNight ? "#38bdf8" : "#fef08a";
        bctx.font = "bold 13px sans-serif";
        bctx.textAlign = "center";
        bctx.fillText("🏖️ SAHİL & İSKELE ⬇", 500, height - 18);

        // Caddeye yönlendirici ok
        bctx.save();
        bctx.translate(970, 340);
        bctx.rotate(Math.PI / 2);
        bctx.fillStyle = isNight ? "#facc15" : "#ffffff";
        bctx.font = "bold 12px sans-serif";
        bctx.textAlign = "center";
        bctx.fillText("🛣️ CADDE (BULVAR) ➔", 0, 0);
        bctx.restore();

        // 4. MEYDAN BİNALARI (KUZEY CEPHELERİ)

        // A) 🏢 PRESTİJ GAYRİMENKUL & EMLAK OFİSİ (x: 35, y: 22, w: 205, h: 145)
        drawIsometricRealEstate(bctx, 35, 22, 205, 145, isNight);

        // B) ☕ KAFE & OYUN SALONU (x: 260, y: 18, w: 245, h: 150)
        drawIsometricCafe(bctx, 260, 18, 245, 150, isNight);

        // C) 💨 NARGİLE LOUNGE & 101 (x: 525, y: 18, w: 235, h: 150)
        drawIsometricNargile(bctx, 525, 18, 235, 150, isNight);

        // D) 🛒 MOBİLYA & YAŞAM MARKETİ (x: 780, y: 22, w: 190, h: 145)
        drawIsometricMarket(bctx, 780, 22, 190, 145, isNight);

        // 5. GÜNEY CEPHE: SANALİKA REZİDANS & KONUTLAR (x: 35, y: 410, w: 255, h: 185)
        drawIsometricResidenceTower(bctx, 35, 410, 255, 185, isNight);

        // 6. GÜNEY-DOĞU CEPHE: MEYDAN ÇAY BAHÇESİ & AÇIK HAVA TERASI (x: 710, y: 435, w: 260, h: 170)
        drawTeaGardenPlaza(bctx, 710, 435, 260, 170, isNight);

        // 7. BÜYÜK AÇIK HAVA REKLAM PANOSU STATİK İSKELETİ & TABANLARI (x: 650, y: 220, w: 250, h: 125)
        drawBillboardFramework(bctx, 650, 220, 250, 125, isNight);

        // 8. MERKEZ MERMER FISKİYE STATİK TABANI (Merkez: 360, 300 - Yarıçap: 44)
        drawFountainBasin(bctx, 360, 300, 44, isNight);

        // 9. PARK BANKLARI (seatRegistry ile tam uyumlu)
        drawMeydanBench(bctx, 235, 195, isNight);
        drawMeydanBench(bctx, 440, 285, isNight);
        drawMeydanBench(bctx, 590, 285, isNight);
        drawMeydanBench(bctx, 360, 405, isNight);

        // 10. SOKAK LAMBALARI & DEKORATİF AĞAÇLAR
        drawMeydanLamp(bctx, 250, 175, isNight);
        drawMeydanLamp(bctx, 515, 175, isNight);
        drawMeydanLamp(bctx, 770, 175, isNight);
        drawMeydanLamp(bctx, 320, 420, isNight);
        drawMeydanLamp(bctx, 600, 420, isNight);

        // Çınar Ağaçları (Park Adası)
        drawOrnamentalTree(bctx, 430, 230, isNight);
        drawOrnamentalTree(bctx, 600, 230, isNight);
        drawOrnamentalTree(bctx, 670, 420, isNight);
    }

    // --- BİNA ÇİZİM FONKSİYONLARI ---

    // A) PRESTİJ EMLAK OFİSİ
    function drawIsometricRealEstate(ctx, x, y, w, h, isNight) {
        ctx.save();
        // 3D Taban Gölgesi
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 8, w, h, 14);
        ctx.fill();

        // Ana Gövde
        let bGrad = ctx.createLinearGradient(x, y, x, y + h);
        bGrad.addColorStop(0, isNight ? "#091322" : "#0f172a");
        bGrad.addColorStop(1, isNight ? "#030712" : "#1e293b");
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 12);
        ctx.fill();
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Çatı Bordürü
        ctx.fillStyle = "#0369a1";
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 6, w - 16, 26, 6);
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🏢 PRESTİJ EMLAK OFİSİ", x + w / 2, y + 23);

        // Sol Vitrin: 3D Maket Teşhir Penceresi
        ctx.fillStyle = isNight ? "rgba(30, 58, 138, 0.55)" : "rgba(56, 189, 248, 0.25)";
        ctx.fillRect(x + 14, y + 42, 95, 68);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x + 14, y + 42, 95, 68);

        ctx.font = "20px sans-serif";
        ctx.fillText("🏡 🏢 🏰", x + 61, y + 76);
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("Örnek Daire Gezisi", x + 61, y + 98);

        // Giriş Kapısı (Sağ Taraf: x: 135..185)
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x + w - 65, y + 42, 48, 75);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + w - 65, y + 42, 48, 75);

        // Kapı Camı & Kolu
        ctx.fillStyle = isNight ? "rgba(56, 189, 248, 0.3)" : "rgba(147, 197, 253, 0.4)";
        ctx.fillRect(x + w - 60, y + 48, 38, 38);
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(x + w - 24, y + 88, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("GİRİŞ", x + w - 41, y + 130);

        ctx.restore();
    }

    // B) KAFE & OYUN SALONU
    function drawIsometricCafe(ctx, x, y, w, h, isNight) {
        ctx.save();
        // 3D Gölge
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 8, w, h, 14);
        ctx.fill();

        // Tuğla & Taş Bina Gövdesi
        let bGrad = ctx.createLinearGradient(x, y, x, y + h);
        bGrad.addColorStop(0, isNight ? "#1c140e" : "#451a03");
        bGrad.addColorStop(1, isNight ? "#0c0a09" : "#1e1b18");
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 12);
        ctx.fill();
        ctx.strokeStyle = isNight ? "#f59e0b" : "#b45309";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Neon Tabela
        ctx.fillStyle = isNight ? "#78350f" : "#9a3412";
        ctx.beginPath();
        ctx.roundRect(x + 12, y + 6, w - 24, 26, 6);
        ctx.fill();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#facc15";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("☕ KAFE & OYUN SALONU", x + w / 2, y + 23);

        // Kırmızı/Beyaz Tente
        let awningH = 22;
        let stripeCount = 12;
        let stripeW = (w - 20) / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
            ctx.fillStyle = (i % 2 === 0) ? "#ef4444" : "#f8fafc";
            ctx.fillRect(x + 10 + i * stripeW, y + 36, stripeW, awningH);
        }

        // Pencereler (Sol ve Sağ Işıklı Vitrin)
        ctx.fillStyle = isNight ? "rgba(253, 224, 71, 0.45)" : "rgba(254, 240, 138, 0.7)";
        ctx.fillRect(x + 18, y + 66, 55, 45);
        ctx.fillRect(x + w - 73, y + 66, 55, 45);
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 18, y + 66, 55, 45);
        ctx.strokeRect(x + w - 73, y + 66, 55, 45);

        // Ahşap Çift Kanat Kapı
        ctx.fillStyle = "#78350f";
        ctx.fillRect(x + w / 2 - 24, y + 66, 48, 62);
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1.8;
        ctx.strokeRect(x + w / 2 - 24, y + 66, 48, 62);
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(x + w / 2 + 14, y + 98, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("KAPI", x + w / 2, y + 140);

        ctx.restore();
    }

    // C) NARGİLE LOUNGE & 101
    function drawIsometricNargile(ctx, x, y, w, h, isNight) {
        ctx.save();
        // 3D Gölge
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 8, w, h, 14);
        ctx.fill();

        // Oryantal Saray Gövdesi
        let bGrad = ctx.createLinearGradient(x, y, x, y + h);
        bGrad.addColorStop(0, isNight ? "#2e1065" : "#581c87");
        bGrad.addColorStop(1, isNight ? "#0f051d" : "#3b0764");
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 12);
        ctx.fill();
        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Tabela
        ctx.fillStyle = isNight ? "#4c1d95" : "#6b21a8";
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 6, w - 20, 26, 6);
        ctx.fill();
        ctx.strokeStyle = "#f0abfc";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#f0abfc";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💨 NARGİLE LOUNGE & 101", x + w / 2, y + 23);

        // Mor & Altın Tente Saçağı
        let stripeCount = 10;
        let stripeW = (w - 20) / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
            ctx.fillStyle = (i % 2 === 0) ? "#a855f7" : "#fbbf24";
            ctx.fillRect(x + 10 + i * stripeW, y + 36, stripeW, 18);
        }

        // 101 Okey & Şark Köşesi Vitrini
        ctx.fillStyle = isNight ? "rgba(236, 72, 153, 0.4)" : "rgba(244, 114, 182, 0.35)";
        ctx.fillRect(x + 16, y + 62, 90, 50);
        ctx.strokeStyle = "#f472b6";
        ctx.strokeRect(x + 16, y + 62, 90, 50);
        ctx.fillStyle = "#fdf4ff";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("🀄 101 OKEY & ŞARK", x + 61, y + 90);

        // Ahşap / Pirinç Saray Kapısı
        ctx.fillStyle = "#78350f";
        ctx.fillRect(x + w - 66, y + 60, 48, 65);
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + w - 66, y + 60, 48, 65);
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(x + w - 26, y + 92, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f0abfc";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("GİRİŞ", x + w - 42, y + 138);

        ctx.restore();
    }

    // D) MOBİLYA & YAŞAM MARKETİ
    function drawIsometricMarket(ctx, x, y, w, h, isNight) {
        ctx.save();
        // 3D Gölge
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 8, w, h, 14);
        ctx.fill();

        // Şık Butik Zümrüt & Yeşil Cephe
        let bGrad = ctx.createLinearGradient(x, y, x, y + h);
        bGrad.addColorStop(0, isNight ? "#062e24" : "#064e3b");
        bGrad.addColorStop(1, isNight ? "#021c16" : "#022c22");
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 12);
        ctx.fill();
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Tabela
        ctx.fillStyle = isNight ? "#065f46" : "#047857";
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 6, w - 16, 26, 6);
        ctx.fill();
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#a7f3d0";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🛒 MOBİLYA MARKETİ", x + w / 2, y + 23);

        // Geniş Showroom Teşhir Camı (Mobilya ve Ev Eşyaları)
        ctx.fillStyle = isNight ? "rgba(16, 185, 129, 0.35)" : "rgba(209, 250, 229, 0.55)";
        ctx.fillRect(x + 12, y + 40, 95, 68);
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 12, y + 40, 95, 68);

        ctx.font = "18px sans-serif";
        ctx.fillText("🛋️ 📺 🛏️", x + 60, y + 74);
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 8px sans-serif";
        ctx.fillText("Lüks Ev Mobilyaları", x + 60, y + 96);

        // Otomatik Cam Kayar Kapı (Sağ)
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x + w - 62, y + 40, 48, 72);
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + w - 62, y + 40, 48, 72);

        ctx.fillStyle = "#6ee7b7";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("GİRİŞ", x + w - 38, y + 126);

        ctx.restore();
    }

    // E) SANALİKA REZİDANS & KONUTLAR (GÜNEY CEPHE)
    function drawIsometricResidenceTower(ctx, x, y, w, h, isNight) {
        ctx.save();
        // 3D Gölge
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 8, w, h, 16);
        ctx.fill();

        // Kule Gövdesi
        let bGrad = ctx.createLinearGradient(x, y, x, y + h);
        bGrad.addColorStop(0, isNight ? "#0f172a" : "#1e293b");
        bGrad.addColorStop(1, isNight ? "#020617" : "#0f172a");
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 14);
        ctx.fill();
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 2.8;
        ctx.stroke();

        // Çatı Terası ve Neon Tabela
        ctx.fillStyle = isNight ? "#7c2d12" : "#c2410c";
        ctx.beginPath();
        ctx.roundRect(x + 12, y + 8, w - 24, 26, 6);
        ctx.fill();
        ctx.strokeStyle = "#fed7aa";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#fed7aa";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🏢 SANALİKA REZİDANS & KONUTLAR", x + w / 2, y + 25);

        // 3 Sıra Kat Balkonları & Işıklı Daire Pencereleri
        for (let row = 0; row < 2; row++) {
            let ry = y + 44 + row * 40;
            for (let col = 0; col < 4; col++) {
                let rx = x + 16 + col * 56;
                // Pencere
                ctx.fillStyle = isNight ? ((col + row) % 2 === 0 ? "rgba(253, 224, 71, 0.65)" : "rgba(30, 41, 59, 0.9)") : "rgba(254, 240, 138, 0.85)";
                ctx.fillRect(rx, ry, 44, 24);
                ctx.strokeStyle = "#475569";
                ctx.lineWidth = 1;
                ctx.strokeRect(rx, ry, 44, 24);
                // Balkon cam korkuluk
                ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
                ctx.fillRect(rx - 2, ry + 16, 48, 10);
                ctx.strokeStyle = "#38bdf8";
                ctx.strokeRect(rx - 2, ry + 16, 48, 10);
            }
        }

        // Lobi Giriş Portali
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x + w / 2 - 40, y + 128, 80, 48);
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + w / 2 - 40, y + 128, 80, 48);

        ctx.fillStyle = "#fdba74";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("🚪 LOBİ GİRİŞİ", x + w / 2, y + 155);

        ctx.restore();
    }

    // F) MEYDAN ÇAY BAHÇESİ (GÜNEY-DOĞU)
    function drawTeaGardenPlaza(ctx, x, y, w, h, isNight) {
        ctx.save();
        // Karo Zemin
        ctx.fillStyle = isNight ? "#1e293b" : "#e2e8f0";
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 12);
        ctx.fill();
        ctx.strokeStyle = isNight ? "#334155" : "#94a3b8";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tabela
        ctx.fillStyle = isNight ? "#064e3b" : "#047857";
        ctx.beginPath();
        ctx.roundRect(x + 16, y + 8, w - 32, 22, 6);
        ctx.fill();
        ctx.fillStyle = "#a7f3d0";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("☕ MEYDAN ÇAY BAHÇESİ & TERAS", x + w / 2, y + 23);

        // Ahşap Kamelya & Masalar
        for (let i = 0; i < 2; i++) {
            let tx = x + 40 + i * 110;
            let ty = y + 70;
            // Masa
            ctx.fillStyle = "#78350f";
            ctx.beginPath();
            ctx.arc(tx, ty, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#facc15";
            ctx.stroke();
            // Sandalyeler
            ctx.fillStyle = "#92400e";
            ctx.fillRect(tx - 28, ty - 6, 8, 12);
            ctx.fillRect(tx + 20, ty - 6, 8, 12);
            ctx.fillRect(tx - 6, ty - 28, 12, 8);
            ctx.fillRect(tx - 6, ty + 20, 12, 8);
            // Masa Üstü Çay Bardağı
            ctx.font = "14px sans-serif";
            ctx.fillText("☕", tx, ty + 5);
        }

        ctx.restore();
    }

    // G) BİLLBOARD İSKELETİ & TABANI
    function drawBillboardFramework(ctx, x, y, w, h, isNight) {
        ctx.save();
        // 2 Ağır Çelik Taşıyıcı Ayak (Zemine ankastre çelik kuleler)
        let poleW = 16;
        let pole1X = x + 40;
        let pole2X = x + w - 40 - poleW;
        let poleBaseY = y + h;

        ctx.fillStyle = isNight ? "#0f172a" : "#334155";
        ctx.fillRect(pole1X, y + 10, poleW, h);
        ctx.fillRect(pole2X, y + 10, poleW, h);

        // Çelik çapraz kafes (Truss gantry)
        ctx.strokeStyle = isNight ? "#1e293b" : "#64748b";
        ctx.lineWidth = 2;
        for (let py = y + 15; py < poleBaseY - 10; py += 25) {
            ctx.beginPath();
            ctx.moveTo(pole1X + poleW, py);
            ctx.lineTo(pole2X, py + 25);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pole2X, py);
            ctx.lineTo(pole1X + poleW, py + 25);
            ctx.stroke();
        }

        // Beton Taban Pabuçları
        ctx.fillStyle = isNight ? "#334155" : "#94a3b8";
        ctx.fillRect(pole1X - 8, poleBaseY, poleW + 16, 12);
        ctx.fillRect(pole2X - 8, poleBaseY, poleW + 16, 12);

        // Çerçeve Dış Gövdesi (Canlı ekran drawMeydanV2Environment içinde çizilecek)
        ctx.fillStyle = isNight ? "#020617" : "#0f172a";
        ctx.beginPath();
        ctx.roundRect(x - 6, y - 6, w + 12, h + 12, 10);
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.restore();
    }

    // H) MERMER SÜS FISKİYESİ TABANI
    function drawFountainBasin(ctx, cx, cy, r, isNight) {
        ctx.save();
        // Dış Taban Gölgesi
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.arc(cx + 3, cy + 5, r + 5, 0, Math.PI * 2);
        ctx.fill();

        // Mermer Dış Havuz Kenarı
        let mGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        mGrad.addColorStop(0, isNight ? "#475569" : "#f1f5f9");
        mGrad.addColorStop(0.5, isNight ? "#334155" : "#e2e8f0");
        mGrad.addColorStop(1, isNight ? "#1e293b" : "#cbd5e1");
        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isNight ? "#64748b" : "#94a3b8";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // İç Su Çanağı Statik Tabanı
        ctx.fillStyle = isNight ? "#0369a1" : "#0ea5e9";
        ctx.beginPath();
        ctx.arc(cx, cy, r - 7, 0, Math.PI * 2);
        ctx.fill();

        // Merkez Mermer Heykel / Fıskiye Kaidesi
        ctx.fillStyle = isNight ? "#e2e8f0" : "#ffffff";
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    // I) PARK BANKI
    function drawMeydanBench(ctx, x, y, isNight) {
        ctx.save();
        // Döküm Ayaklar
        ctx.fillStyle = isNight ? "#0f172a" : "#1e293b";
        ctx.fillRect(x - 22, y + 6, 6, 12);
        ctx.fillRect(x + 16, y + 6, 6, 12);

        // Ahşap Çıtalar
        ctx.fillStyle = isNight ? "#92400e" : "#b45309";
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x - 26, y - 6 + i * 5, 52, 4);
        }
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x - 26, y - 6, 52, 14);
        ctx.restore();
    }

    // J) SOKAK LAMBASI
    function drawMeydanLamp(ctx, x, y, isNight) {
        ctx.save();
        // Demir Direk
        ctx.fillStyle = isNight ? "#334155" : "#1e293b";
        ctx.fillRect(x - 2.5, y - 48, 5, 48);
        ctx.fillRect(x - 7, y - 4, 14, 5);

        // Fener
        ctx.fillStyle = isNight ? "#facc15" : "#fef08a";
        ctx.beginPath();
        ctx.arc(x, y - 52, 7, 0, Math.PI * 2);
        ctx.fill();

        // Gece Işık Halesi
        if (isNight) {
            let halo = ctx.createRadialGradient(x, y - 52, 2, x, y - 52, 50);
            halo.addColorStop(0, "rgba(250, 204, 21, 0.45)");
            halo.addColorStop(1, "rgba(250, 204, 21, 0)");
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(x, y - 52, 50, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // K) SÜS AĞACI
    function drawOrnamentalTree(ctx, x, y, isNight) {
        ctx.save();
        // Ağaç Gövdesi
        ctx.fillStyle = "#78350f";
        ctx.fillRect(x - 4, y - 24, 8, 24);

        // Taç Yapraklar (3 Katmanlı Küreler)
        ctx.fillStyle = isNight ? "#14532d" : "#16a34a";
        ctx.beginPath();
        ctx.arc(x, y - 36, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isNight ? "#166534" : "#22c55e";
        ctx.beginPath();
        ctx.arc(x - 6, y - 44, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + 7, y - 42, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Canlı Oyun Döngüsü Çizimi (60 FPS - Fıskiye Suyu, Billboard Ekranı, Hover Highlight)
     */
    function drawMeydanV2Environment() {
        // 1. Önbellekli Statik Arka Planı Çiz
        let bg = bgCache.getCanvas('meydanv2', canvas.width, canvas.height);
        ctx.drawImage(bg, 0, 0);

        // 2. Canlı Mermer Fıskiye Dalgalanma Animasyonu (Merkez: 360, 300)
        fountainWaveOffset += 0.08;
        ctx.save();
        ctx.lineWidth = 1.8;
        for (let i = 0; i < 3; i++) {
            let waveRadius = 12 + ((fountainWaveOffset * 10 + i * 11) % 24);
            let alpha = Math.max(0, 1 - (waveRadius / 36));
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
            ctx.beginPath();
            ctx.arc(360, 300, waveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Fıskiye merkez su fışkırtma spreyi
        let sprayH = 10 + Math.sin(fountainWaveOffset * 4) * 3;
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(360, 300 - sprayH, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Canlı Açık Hava Reklam Panosu Ekranı (x: 650, y: 220, w: 250, h: 125)
        let isBillboardHover = (canvasMouseX >= 645 && canvasMouseX <= 905 && canvasMouseY >= 215 && canvasMouseY <= 345);
        if (typeof drawOutdoorBillboard === 'function') {
            drawOutdoorBillboard(ctx, 650, 220, 250, 125, isBillboardHover);
        }

        // 4. Hover Kontrolleri & İmleç Güncellemesi
        let isEmlakciHover = (canvasMouseX >= 35 && canvasMouseX <= 240 && canvasMouseY >= 20 && canvasMouseY <= 170);
        let isCafeHover = (canvasMouseX >= 260 && canvasMouseX <= 505 && canvasMouseY >= 18 && canvasMouseY <= 170);
        let isNargileHover = (canvasMouseX >= 525 && canvasMouseX <= 760 && canvasMouseY >= 18 && canvasMouseY <= 170);
        let isMarketHover = (canvasMouseX >= 780 && canvasMouseX <= 970 && canvasMouseY >= 20 && canvasMouseY <= 170);
        let isResidenceHover = (canvasMouseX >= 35 && canvasMouseX <= 290 && canvasMouseY >= 410 && canvasMouseY <= 595);
        let isSahilExitHover = (canvasMouseX >= 430 && canvasMouseX <= 570 && canvasMouseY >= 570 && canvasMouseY <= 625);
        let isCaddeExitHover = (canvasMouseX >= 930 && canvasMouseX <= 1000 && canvasMouseY >= 260 && canvasMouseY <= 400);

        if (isBillboardHover) {
            hoveredTableId = 'meydanv2_billboard';
            setGameCursor('pointer');
        } else if (isEmlakciHover) {
            hoveredTableId = 'meydanv2_emlakci';
            setGameCursor('pointer');
            drawHoverBadge(ctx, 137, 18, "🏢 Prestij Emlak Ofisi'ne Gir (Tıkla)", "#38bdf8");
        } else if (isCafeHover) {
            hoveredTableId = 'meydanv2_cafe';
            setGameCursor('pointer');
            drawHoverBadge(ctx, 382, 14, "☕ Kafe & Oyun Salonu'na Gir (Tıkla)", "#facc15");
        } else if (isNargileHover) {
            hoveredTableId = 'meydanv2_nargile';
            setGameCursor('pointer');
            drawHoverBadge(ctx, 642, 14, "💨 Nargile Kafe & 101'e Gir (Tıkla)", "#f0abfc");
        } else if (isMarketHover) {
            hoveredTableId = 'meydanv2_market';
            setGameCursor('pointer');
            drawHoverBadge(ctx, 875, 18, "🛒 Mobilya Marketi'ne Gir (Tıkla)", "#6ee7b7");
        } else if (isResidenceHover) {
            hoveredTableId = 'meydanv2_apt';
            setGameCursor('pointer');
            drawHoverBadge(ctx, 162, 405, "🏢 Konutlar & Rezidans Portali (Tıkla)", "#fb923c");
        } else if (isSahilExitHover) {
            hoveredTableId = 'meydanv2_sahil_exit';
            setGameCursor('pointer');
        } else if (isCaddeExitHover) {
            hoveredTableId = 'meydanv2_cadde_exit';
            setGameCursor('pointer');
        } else {
            if (hoveredTableId && hoveredTableId.startsWith('meydanv2_')) {
                hoveredTableId = null;
            }
        }
    }

    function drawHoverBadge(ctx, x, y, text, color) {
        let hoverBounce = Math.sin(Date.now() / 180) * 3;
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(x - 90, y - 10 + hoverBounce, 180, 24, 7);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(text, x, y + 6 + hoverBounce);
        ctx.restore();
    }

    /**
     * Çarpışma Kontrolü (1000x625 formatı)
     */
    function checkMeydanV2Collision(x, y) {
        // Dünya sınırları
        if (x < 18) return true;
        // Doğu sınır: Cadde çıkış koridoru hariç (y: 260..400)
        if (x > 982) {
            if (y >= 260 && y <= 400) return false;
            return true;
        }
        // Kuzey sınır: Bina hatları
        if (y < 145) return true;
        // Güney sınır: Sahil çıkış koridoru hariç (x: 430..570)
        if (y > 608) {
            if (x >= 430 && x <= 570) return false;
            return true;
        }

        // Binaların Katı Engelleri:
        // A) Emlakçı: x: 30..240, y: 20..155
        if (x >= 28 && x <= 242 && y >= 20 && y <= 155) return true;
        // B) Kafe: x: 255..505, y: 18..155
        if (x >= 255 && x <= 505 && y >= 18 && y <= 155) return true;
        // C) Nargile: x: 520..760, y: 18..155
        if (x >= 520 && x <= 760 && y >= 18 && y <= 155) return true;
        // D) Market: x: 775..975, y: 20..155
        if (x >= 775 && x <= 975 && y >= 20 && y <= 155) return true;
        // E) Rezidans & Konutlar: x: 30..290, y: 405..585 (Giriş yolu önü açık: x >= 85 && x <= 165 && y >= 560 hariç)
        if (x >= 30 && x <= 290 && y >= 405 && y <= 585) {
            if (x >= 85 && x <= 165 && y >= 555) return false;
            return true;
        }

        // F) Fıskiye Katı Havuzu (Merkez: 360, 300, yarıçap: 46)
        if (Math.hypot(x - 360, y - 300) < 46) return true;

        // G) Billboard Ağır Ayakları (x: 680..710 & x: 840..870, y: 220..340)
        if (x >= 675 && x <= 715 && y >= 220 && y <= 340) return true;
        if (x >= 835 && x <= 875 && y >= 220 && y <= 340) return true;

        return false;
    }

    /**
     * Tıklama Etkileşim Yöneticisi
     */
    function handleMeydanV2Click(clickX, clickY, p) {
        // 1. Emlakçı Binası
        if (clickX >= 35 && clickX <= 240 && clickY >= 20 && clickY <= 170) {
            if (typeof navigatePlayerToDoor === 'function') {
                navigatePlayerToDoor(180, 160, 'emlakci');
            } else if (typeof changeRoom === 'function') {
                changeRoom('emlakci');
            }
            return true;
        }

        // 2. Kafe & Oyun Salonu Binası
        if (clickX >= 260 && clickX <= 505 && clickY >= 18 && clickY <= 170) {
            if (typeof navigatePlayerToDoor === 'function') {
                navigatePlayerToDoor(380, 160, 'kafe');
            } else if (typeof changeRoom === 'function') {
                changeRoom('kafe');
            }
            return true;
        }

        // 3. Nargile Kafe & 101 Binası
        if (clickX >= 525 && clickX <= 760 && clickY >= 18 && clickY <= 170) {
            if (typeof navigatePlayerToDoor === 'function') {
                navigatePlayerToDoor(640, 160, 'nargile_cafe');
            } else if (typeof changeRoom === 'function') {
                changeRoom('nargile_cafe');
            }
            return true;
        }

        // 4. Mobilya Marketi Binası
        if (clickX >= 780 && clickX <= 970 && clickY >= 20 && clickY <= 170) {
            if (typeof navigatePlayerToDoor === 'function') {
                navigatePlayerToDoor(880, 160, 'market');
            } else if (typeof changeRoom === 'function') {
                changeRoom('market');
            }
            return true;
        }

        // 5. Sanalika Rezidans & Konutlar
        if (clickX >= 35 && clickX <= 290 && clickY >= 410 && clickY <= 595) {
            if (typeof openHousingPortalModal === 'function') {
                openHousingPortalModal();
            }
            return true;
        }

        // 6. Canlı Açık Hava Reklam Panosu
        if (clickX >= 645 && clickX <= 905 && clickY >= 215 && clickY <= 345) {
            if (typeof openBillboardAdModal === 'function') {
                openBillboardAdModal();
            }
            return true;
        }

        // 7. Cadde Çıkış Geçidi
        if (clickX >= 925 && clickX <= 1000 && clickY >= 260 && clickY <= 400) {
            if (typeof navigatePlayerToDoor === 'function') {
                navigatePlayerToDoor(980, 330, 'cadde');
            } else if (typeof changeRoom === 'function') {
                changeRoom('cadde');
            }
            return true;
        }

        // 8. Sahil Çıkış Geçidi
        if (clickX >= 430 && clickX <= 570 && clickY >= 565 && clickY <= 625) {
            if (typeof navigatePlayerToDoor === 'function') {
                navigatePlayerToDoor(500, 615, 'sahil');
            } else if (typeof changeRoom === 'function') {
                changeRoom('sahil');
            }
            return true;
        }

        return false;
    }

    /**
     * Mobil & Klavye 'E' Tuşu Etkileşim Yöneticisi
     */
    function handleMeydanV2MobileInteract(p) {
        if (!p) return false;

        // Emlakçı yakınında
        if (p.x <= 245 && p.y <= 190) {
            if (typeof changeRoom === 'function') changeRoom('emlakci');
            return true;
        }

        // Kafe yakınında
        if (p.x >= 255 && p.x <= 510 && p.y <= 190) {
            if (typeof changeRoom === 'function') changeRoom('kafe');
            return true;
        }

        // Nargile yakınında
        if (p.x >= 515 && p.x <= 765 && p.y <= 190) {
            if (typeof changeRoom === 'function') changeRoom('nargile_cafe');
            return true;
        }

        // Market yakınında
        if (p.x >= 770 && p.y <= 190) {
            if (typeof changeRoom === 'function') changeRoom('market');
            return true;
        }

        // Konutlar yakınında
        if (p.x <= 310 && p.y >= 390) {
            if (typeof openHousingPortalModal === 'function') openHousingPortalModal();
            return true;
        }

        // Billboard yakınında
        if (p.x >= 630 && p.x <= 915 && p.y >= 200 && p.y <= 360) {
            if (typeof openBillboardAdModal === 'function') openBillboardAdModal();
            return true;
        }

        // Cadde çıkış yakınında
        if (p.x >= 920 && p.y >= 250 && p.y <= 410) {
            if (typeof changeRoom === 'function') changeRoom('cadde');
            return true;
        }

        // Sahil çıkış yakınında
        if (p.x >= 410 && p.x <= 590 && p.y >= 540) {
            if (typeof changeRoom === 'function') changeRoom('sahil');
            return true;
        }

        return false;
    }

    // Global Dışa Aktarımlar
    window.renderStaticMeydanV2To = renderStaticMeydanV2To;
    window.drawMeydanV2Environment = drawMeydanV2Environment;
    window.checkMeydanV2Collision = checkMeydanV2Collision;
    window.handleMeydanV2Click = handleMeydanV2Click;
    window.handleMeydanV2MobileInteract = handleMeydanV2MobileInteract;
})();

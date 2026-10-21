// public/js/renderers/renderCasino.js - Ganyan Hipodrom & Dedenin Yeri Casino Çizim Modülü
function renderStaticGanyanTo(bctx, width, height) {
    // 1. Zemin: Çim Saha ve Hipodrom Zemin (Biçilmiş çim deseni)
    bctx.fillStyle = "#0f3d1f";
    bctx.fillRect(0, 0, width, height);

    // Çim çizgileri (Lawn mower stripes)
    bctx.fillStyle = "#14532d";
    for (let y = 0; y < 240; y += 24) {
        bctx.fillRect(0, y, width, 12);
    }

    // 2. Hipodrom Pist Çerçevesi (Grandstand & Track Frame)
    bctx.fillStyle = "#1e3a1f";
    bctx.beginPath();
    bctx.roundRect(10, 14, width - 20, 216, 24);
    bctx.fill();
    bctx.strokeStyle = "#166534";
    bctx.lineWidth = 3;
    bctx.stroke();

    // 3. Alt Taraf Zemin (Kaldırım & Ahşap Güverte)
    bctx.fillStyle = "#0f172a";
    bctx.fillRect(0, 235, width, height - 235);

    bctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    bctx.lineWidth = 1;
    for (let x = 0; x < width; x += 32) {
        bctx.beginPath(); bctx.moveTo(x, 235); bctx.lineTo(x, height); bctx.stroke();
    }

    // 4. SOL ALT: 777 Nolu GANYAN BAYİİ & KUPON GİŞESİ (Görsel Olarak Gelişmiş Tasarım)
    // Dış Çerçeve & Gövde
    bctx.fillStyle = "rgba(10, 24, 18, 0.98)";
    bctx.beginPath();
    bctx.roundRect(20, 248, 245, 184, 14);
    bctx.fill();
    bctx.strokeStyle = "#059669";
    bctx.lineWidth = 3;
    bctx.stroke();

    // Bayi Işıklı Neon Tabelası
    bctx.fillStyle = "linear-gradient(135deg, #065f46, #047857)";
    bctx.beginPath();
    bctx.roundRect(28, 256, 229, 36, 8);
    bctx.fill();
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 2;
    bctx.stroke();

    bctx.fillStyle = "#fef08a";
    bctx.font = "bold 12px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🏇 TJK 777 NOLU GANYAN BAYİİ 🏇", 142, 278);

    // TV Monitörleri (Canlı TJK TV + Resmi Bülten)
    // TV 1: TJK TV
    bctx.fillStyle = "#090d16";
    bctx.beginPath();
    bctx.roundRect(35, 300, 102, 60, 6);
    bctx.fill();
    bctx.strokeStyle = "#38bdf8";
    bctx.lineWidth = 2;
    bctx.stroke();

    bctx.fillStyle = "#0284c7";
    bctx.fillRect(38, 303, 96, 12);
    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 8px sans-serif";
    bctx.fillText("🔴 TJK TV CANLI", 86, 312);

    bctx.fillStyle = "#38bdf8";
    bctx.font = "bold 9px sans-serif";
    bctx.fillText("📺 Hipodrom Canlı", 86, 334);
    bctx.fillStyle = "#67e8f9";
    bctx.font = "8px sans-serif";
    bctx.fillText("Canlı Oranlar & Sonuç", 86, 348);

    // TV 2: Resmi Koşu Bülteni
    bctx.fillStyle = "#090d16";
    bctx.beginPath();
    bctx.roundRect(147, 300, 102, 60, 6);
    bctx.fill();
    bctx.strokeStyle = "#f59e0b";
    bctx.lineWidth = 2;
    bctx.stroke();

    bctx.fillStyle = "#b45309";
    bctx.fillRect(150, 303, 96, 12);
    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 8px sans-serif";
    bctx.fillText("📋 GÜNLÜK BÜLTEN", 198, 312);

    bctx.fillStyle = "#fde047";
    bctx.font = "bold 9px sans-serif";
    bctx.fillText("💰 6'lı Ganyan", 198, 334);
    bctx.fillStyle = "#fcd34d";
    bctx.font = "8px sans-serif";
    bctx.fillText("Banko: Şahbatur", 198, 348);

    // Gişe Bankosu & Kupon Doldurma Masası
    bctx.fillStyle = "#78350f";
    bctx.beginPath();
    bctx.roundRect(28, 370, 229, 54, 8);
    bctx.fill();
    bctx.strokeStyle = "#d97706";
    bctx.lineWidth = 2;
    bctx.stroke();

    // Gişe Parmaklıkları / Pirinç Demirler
    bctx.strokeStyle = "#fde047";
    bctx.lineWidth = 1.5;
    for (let gx = 45; gx <= 235; gx += 16) {
        bctx.beginPath();
        bctx.moveTo(gx, 372);
        bctx.lineTo(gx, 386);
        bctx.stroke();
    }

    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 12px sans-serif";
    bctx.fillText("🎫 Kupon Doldurmak İçin Tıkla", 142, 404);
    bctx.fillStyle = "#fde047";
    bctx.font = "9px sans-serif";
    bctx.fillText("Tek At • Tek Kupon • 30s Bahis / 50s Koşu", 142, 417);

    // 4.6 CADDE ÇIKIŞ KAPISI (Ortada)
    drawExitDoor(bctx, width / 2 - 35, height - 65, "🚪 CADDE", 70, 60);

    // 5. SAĞ ALT: BİNEK ATI HARASI & SEYİS DURSUN (Görsel Olarak Gelişmiş Tasarım)
    bctx.fillStyle = "rgba(42, 22, 14, 0.98)";
    bctx.beginPath();
    bctx.roundRect(525, 245, 255, 187, 14);
    bctx.fill();
    bctx.strokeStyle = "#f59e0b";
    bctx.lineWidth = 3;
    bctx.stroke();

    // Ahşap Tabela
    bctx.fillStyle = "#78350f";
    bctx.beginPath();
    bctx.roundRect(535, 253, 235, 38, 8);
    bctx.fill();
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 2;
    bctx.stroke();

    bctx.fillStyle = "#fde047";
    bctx.font = "bold 12px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("🐎 SEYİS DURSUN BİNEK HARASI", 652, 276);

    // Ahır Bölmesi ve Çitler
    bctx.fillStyle = "#451a03";
    bctx.fillRect(538, 300, 115, 52);
    bctx.strokeStyle = "#92400e";
    bctx.lineWidth = 2;
    bctx.strokeRect(538, 300, 115, 52);

    // Saman Balyaları
    bctx.fillStyle = "#ca8a04";
    bctx.beginPath();
    bctx.roundRect(544, 320, 36, 26, 4);
    bctx.roundRect(584, 324, 34, 22, 4);
    bctx.fill();

    // Ahır Nalı
    bctx.fillStyle = "#e2e8f0";
    bctx.font = "14px sans-serif";
    bctx.fillText("🧲", 632, 324);

    // Ahırdan Bakan At Başı Çizimi
    bctx.fillStyle = "#78350f";
    bctx.beginPath();
    bctx.ellipse(688, 320, 16, 22, 0.2, 0, Math.PI * 2);
    bctx.fill();
    // Atın Beyaz Alın Akıtması
    bctx.fillStyle = "#ffffff";
    bctx.beginPath();
    bctx.ellipse(688, 318, 4, 10, 0.2, 0, Math.PI * 2);
    bctx.fill();
    // Atın Kulakları
    bctx.fillStyle = "#78350f";
    bctx.beginPath();
    bctx.moveTo(678, 302); bctx.lineTo(683, 290); bctx.lineTo(687, 302);
    bctx.moveTo(691, 302); bctx.lineTo(695, 290); bctx.lineTo(699, 302);
    bctx.fill();
    // Göz
    bctx.fillStyle = "#000000";
    bctx.beginPath();
    bctx.arc(684, 314, 2.5, 0, Math.PI * 2);
    bctx.fill();

    // Seyis Kulübesi Butonu
    bctx.fillStyle = "linear-gradient(135deg, #10b981, #059669)";
    bctx.beginPath();
    bctx.roundRect(535, 362, 235, 62, 8);
    bctx.fill();
    bctx.strokeStyle = "#86efac";
    bctx.lineWidth = 2;
    bctx.stroke();

    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 13px sans-serif";
    bctx.fillText("🐎 Binek Atı Kirala (200 TL)", 652, 386);
    bctx.fillStyle = "#fde047";
    bctx.font = "bold 11px sans-serif";
    bctx.fillText("⚡ 5 Dakika Boyunca 2.5X Hız!", 652, 403);
    bctx.fillStyle = "#e2e8f0";
    bctx.font = "9px sans-serif";
    bctx.fillText("Tüm mekanlarda rüzgar gibi dörtnal koş", 652, 417);
}

function drawGanyanEnvironment() {
    let bg = bgCache.getCanvas('ganyan', canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);

    const gState = window.ganyanState || {};
    const horses = gState.horses || [];
    const raceProg = gState.raceProgress || {};
    const isRacing = (gState.phase === 'RACING');

    // 1. PİST BOYUTLARI VE SANAL UZATILMIŞ PİST (2800px)
    const tvX = 14;
    const tvY = 18;
    const tvW = canvas.width - 28;
    const tvH = 208;

    const VIRTUAL_TRACK_LENGTH = 2800;
    const START_GATE_X = 65;
    const FINISH_LINE_X = 2620;
    const TRACK_RUN_DISTANCE = FINISH_LINE_X - START_GATE_X; // 2555px

    // 60 FPS / 120 FPS / Yüksek Yenileme Hızlı Akıcı Zaman Adımı (Delta-time)
    let now = performance.now();
    let dt = window._ganyanLastFrame ? Math.min(0.05, (now - window._ganyanLastFrame) / 1000) : 0.016;
    window._ganyanLastFrame = now;

    // 60 FPS İstemci İlerleme İnterpolasyonu (Client-side smooth continuous extrapolation)
    window._ganyanHorses = window._ganyanHorses || {};
    let leaderProg = 0;
    let leaderHorse = null;
    let leaderVirtualX = START_GATE_X;

    const durationSec = gState.durationSeconds || 30;
    const baseSpeed = 100 / durationSec; // ~3.33 % / sn

    horses.forEach((h, idx) => {
        let hData = window._ganyanHorses[h.id];
        if (!hData) {
            hData = window._ganyanHorses[h.id] = { curProg: 0, targetProg: 0, gallopPhase: idx * 1.5 };
        }
        let srvProg = (raceProg[h.id] && raceProg[h.id].pos) || 0;

        if (!isRacing) {
            // Bahis fazında atlar başlangıç kapısına yumuşakça döner
            hData.curProg += (0 - hData.curProg) * Math.min(1, dt * 5.0);
            if (hData.curProg < 0.02) hData.curProg = 0;
            hData.targetProg = 0;
            hData.gallopPhase = (hData.gallopPhase || 0) + dt * 2.0; // Kapıda hafif soluma
        } else {
            hData.targetProg = srvProg;

            // Kesintisiz, akıcı ileri hareket (Işınlanma/teleport kesinlikle engellendi)
            if (hData.curProg < hData.targetProg) {
                let dist = hData.targetProg - hData.curProg;
                // İleri akış hızı + mesafeyi pürüzsüz kapatan elastik yaklaşım
                let stepSpeed = Math.max(baseSpeed * 0.9, baseSpeed + dist * 4.5);
                hData.curProg = Math.min(hData.targetProg, hData.curProg + stepSpeed * dt);
            } else if (hData.curProg < 100 && (gState.secondsLeft || 0) > 0) {
                // Paketler arasındaki milisaniyelerde sabit akıcı hızla ilerle
                hData.curProg = Math.min(100, hData.curProg + baseSpeed * 0.96 * dt);
            }

            // Dörtnal koşu fazı: İlerleme hızına tam senkron
            hData.gallopPhase = (hData.gallopPhase || 0) + dt * 24.0;
        }

        let vX = START_GATE_X + (hData.curProg / 100) * TRACK_RUN_DISTANCE;
        if (hData.curProg > leaderProg || !leaderHorse) {
            leaderProg = hData.curProg;
            leaderHorse = h;
            leaderVirtualX = vX;
        }
    });

    // Akıcı Dinamik Kamera (Smooth Camera Lerp - Titremesiz Glide)
    let targetCamX = 0;
    if (isRacing) {
        // Atları ekranın sol-orta bölümünde tutup önlerindeki pisti aç
        targetCamX = Math.max(0, Math.min(VIRTUAL_TRACK_LENGTH - tvW, leaderVirtualX - tvW * 0.35));
    } else {
        targetCamX = 0;
    }

    if (window._ganyanCamX === undefined) {
        window._ganyanCamX = targetCamX;
    } else {
        let camLerp = 1.0 - Math.exp(-dt * 4.5);
        window._ganyanCamX += (targetCamX - window._ganyanCamX) * camLerp;
    }
    const camX = window._ganyanCamX;

    // 2. HİPODROM PİSTİNİ ÇİZ (Sadece tvX, tvY, tvW, tvH içine clip edilir)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(tvX, tvY, tvW, tvH, 18);
    ctx.clip();

    // 2.A ZEMİN: EQUESTRIAN DIRT TRACK (Toprak Pisti Gradyanı)
    let dirtGrad = ctx.createLinearGradient(0, tvY, 0, tvY + tvH);
    dirtGrad.addColorStop(0, "#68390d");
    dirtGrad.addColorStop(0.3, "#854d0e");
    dirtGrad.addColorStop(0.7, "#78350f");
    dirtGrad.addColorStop(1, "#522504");
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(tvX, tvY, tvW, tvH);

    // Hızlı koşan zemin hissi için kayan toprak dokuları
    ctx.strokeStyle = "rgba(254, 215, 170, 0.12)";
    ctx.lineWidth = 1;
    let stripeOffset = -Math.floor(camX * 1.5) % 40;
    for (let sx = tvX + stripeOffset - 40; sx < tvX + tvW + 40; sx += 40) {
        ctx.beginPath();
        ctx.moveTo(sx, tvY + 8);
        ctx.lineTo(sx - 15, tvY + tvH - 8);
        ctx.stroke();
    }

    // 2.B KULVAR ÇİZGİLERİ (5 Kulvar)
    const laneHeight = (tvH - 42) / 5;
    ctx.strokeStyle = "rgba(254, 240, 138, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([16, 12]);
    ctx.lineDashOffset = -camX; // Kesintisiz kayan kesik çizgiler
    for (let l = 1; l <= 4; l++) {
        let ly = tvY + 24 + l * laneHeight;
        ctx.beginPath();
        ctx.moveTo(tvX, ly);
        ctx.lineTo(tvX + tvW, ly);
        ctx.stroke();
    }
    ctx.setLineDash([]); // Sıfırla

    // 2.C KORKULUKLAR (White Running Rails)
    // Korkuluk rayları
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tvX, tvY + 14);
    ctx.lineTo(tvX + tvW, tvY + 14);
    ctx.moveTo(tvX, tvY + tvH - 12);
    ctx.lineTo(tvX + tvW, tvY + tvH - 12);
    ctx.stroke();

    // Kayan Korkuluk Direkleri (Scrolling Railing Posts)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 2;
    let postSpacing = 32;
    let postStart = Math.floor(camX / postSpacing) * postSpacing;
    for (let px = postStart; px < camX + tvW + postSpacing; px += postSpacing) {
        let sx = tvX + (px - camX);
        if (sx >= tvX && sx <= tvX + tvW) {
            // Üst korkuluk ayağı
            ctx.beginPath();
            ctx.moveTo(sx, tvY + 8);
            ctx.lineTo(sx, tvY + 18);
            ctx.stroke();
            // Alt korkuluk ayağı
            ctx.beginPath();
            ctx.moveTo(sx, tvY + tvH - 18);
            ctx.lineTo(sx, tvY + tvH - 6);
            ctx.stroke();
        }
    }

    // 2.D TJK MESAFE TABELALARI (Authentic Distance Markers along the Track)
    const distanceMarkers = [
        { vX: 400, label: "2400m", sub: "START SONRASI", color: "#38bdf8" },
        { vX: 850, label: "2000m", sub: "1. VİRAJ", color: "#38bdf8" },
        { vX: 1300, label: "1600m", sub: "KARŞI DÜZLÜK", color: "#38bdf8" },
        { vX: 1750, label: "1200m", sub: "2. VİRAJ", color: "#38bdf8" },
        { vX: 2100, label: "⚡ 800m", sub: "SON DÜZLÜK", color: "#facc15" },
        { vX: 2350, label: "🔥 400m", sub: "SON ATAK", color: "#fb923c" },
        { vX: 2500, label: "🚨 200m", sub: "DİREK", color: "#ef4444" }
    ];

    distanceMarkers.forEach(m => {
        let sx = tvX + (m.vX - camX);
        if (sx >= tvX - 60 && sx <= tvX + tvW + 60) {
            // Direk Gövdesi
            ctx.fillStyle = "#cbd5e1";
            ctx.fillRect(sx - 2, tvY + 14, 4, 28);

            // Tabela Kutusu
            ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
            ctx.beginPath();
            ctx.roundRect(sx - 34, tvY + 18, 68, 22, 5);
            ctx.fill();
            ctx.strokeStyle = m.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Metinler
            ctx.fillStyle = m.color;
            ctx.font = "bold 9px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(m.label, sx, tvY + 29);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "7px sans-serif";
            ctx.fillText(m.sub, sx, tvY + 37);
        }
    });

    // 2.E BAŞLANGIÇ BOKS KAPILARI (Starting Gate at START_GATE_X = 65)
    let startGateSX = tvX + (START_GATE_X - 35 - camX);
    if (startGateSX >= tvX - 80 && startGateSX <= tvX + tvW + 80) {
        // İskelet Kafesi
        ctx.fillStyle = "rgba(30, 41, 59, 0.95)";
        ctx.fillRect(startGateSX, tvY + 20, 24, tvH - 40);
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2;
        ctx.strokeRect(startGateSX, tvY + 20, 24, tvH - 40);

        // Başlangıç Lambası
        let isGreen = isRacing;
        ctx.fillStyle = isGreen ? "#22c55e" : "#ef4444";
        ctx.beginPath();
        ctx.arc(startGateSX + 12, tvY + 12, 5, 0, Math.PI * 2);
        ctx.fill();

        for (let s = 0; s < 5; s++) {
            let sy = tvY + 24 + s * laneHeight;
            // Boks Bölmesi
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(startGateSX + 2, sy + 2, 20, laneHeight - 4);
            ctx.fillStyle = "#facc15";
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText((s + 1).toString(), startGateSX + 12, sy + laneHeight / 2 + 3);

            // Boks Kapısı (Yarışta açık, bahiste kapalı)
            ctx.strokeStyle = isRacing ? "#22c55e" : "#ef4444";
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (isRacing) {
                // Açılmış kapı kanadı
                ctx.moveTo(startGateSX + 22, sy + 2);
                ctx.lineTo(startGateSX + 34, sy + 8);
            } else {
                // Kapalı kilitli kapı
                ctx.moveTo(startGateSX + 22, sy + 2);
                ctx.lineTo(startGateSX + 22, sy + laneHeight - 2);
            }
            ctx.stroke();
        }
    }

    // 2.F FİNİŞ ÇİZGİSİ & FOTO-FİNİŞ KULESİ (Finish Line at FINISH_LINE_X = 2620)
    let finishSX = tvX + (FINISH_LINE_X - camX);
    if (finishSX >= tvX - 80 && finishSX <= tvX + tvW + 80) {
        // Dama Taşı Desenli Finiş Çizgisi
        for (let fy = tvY + 16; fy < tvY + tvH - 16; fy += 10) {
            let alt = Math.floor((fy - tvY) / 10) % 2 === 0;
            ctx.fillStyle = alt ? "#ffffff" : "#000000";
            ctx.fillRect(finishSX, fy, 7, 10);
            ctx.fillStyle = alt ? "#000000" : "#ffffff";
            ctx.fillRect(finishSX + 7, fy, 7, 10);
        }

        // Finiş Takı & Tabela
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.roundRect(finishSX - 24, tvY + 4, 62, 18, 4);
        ctx.fill();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🏁 FİNİŞ", finishSX + 7, tvY + 16);

        // Foto-Finiş Sensör Flaşı (At potaya yaklaşırken veya geçerken)
        if (isRacing && leaderProg > 96) {
            let flashAlpha = (Math.sin(Date.now() / 60) + 1) * 0.25;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
            ctx.fillRect(finishSX - 15, tvY + 16, 44, tvH - 32);
        }
    }

    // 2.G KOŞAN ATLAR (Yüksek Hızlı 60 FPS Gallop Kinematiği)
    horses.forEach((h, idx) => {
        let hData = window._ganyanHorses[h.id] || { curProg: 0 };
        let horseProg = hData.curProg;
        let horseVX = START_GATE_X + (horseProg / 100) * TRACK_RUN_DISTANCE;
        let horseSX = tvX + (horseVX - camX);
        let horseSY = tvY + 28 + idx * laneHeight + laneHeight / 2;

        // Görünmeyen atları ekran dışında optimize et
        if (horseSX < tvX - 90 || horseSX > tvX + tvW + 90) return;

        ctx.save();

        // Koşu Dörtnal Kinematik Salınımı (Delta-time ile tam senkronize)
        let gallopTime = (hData.gallopPhase !== undefined) ? hData.gallopPhase : (Date.now() / 36 + idx * 1.6);
        let runBounce = isRacing ? Math.sin(gallopTime) * 3.2 : Math.sin(Date.now() / 400) * 0.8;
        ctx.translate(horseSX, horseSY + runBounce);

        // A. PİSTTEKİ GÖLGE
        ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
        ctx.beginPath();
        ctx.ellipse(2, 14, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // B. NAL TOZU / TOZ BULUTLARI (Hızlı dörtnalda arkaya savrulan tozlar)
        if (isRacing && horseProg > 1) {
            ctx.fillStyle = "rgba(245, 158, 11, 0.4)";
            for (let d = 0; d < 4; d++) {
                let dustOffX = -18 - d * 9 + Math.sin(gallopTime + d) * 4;
                let dustOffY = 10 + Math.cos(gallopTime + d) * 3;
                let dustR = 3 + Math.sin(gallopTime * 2 + d) * 2;
                ctx.beginPath();
                ctx.arc(dustOffX, dustOffY, Math.max(1, dustR), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // C. KOŞAN ATIN BACAKLARI (4 Dinamik Bacak - Geniş Koşu Adımı)
        let horseColor = h.coatColor || (idx === 0 ? '#852e16' : (idx === 1 ? '#1c1917' : (idx === 2 ? '#b45309' : (idx === 3 ? '#64748b' : '#451a03'))));
        ctx.strokeStyle = horseColor;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        let legFront1 = isRacing ? Math.sin(gallopTime) * 14 : 2;
        let legFront2 = isRacing ? Math.sin(gallopTime + 1.2) * 11 : 0;
        let legBack1 = isRacing ? -Math.cos(gallopTime) * 14 : -2;
        let legBack2 = isRacing ? -Math.cos(gallopTime + 1.2) * 11 : 0;

        // Arka Bacaklar
        ctx.beginPath();
        ctx.moveTo(-10, 4);
        ctx.lineTo(-14 + legBack1, 14);
        ctx.moveTo(-8, 4);
        ctx.lineTo(-12 + legBack2, 14);
        ctx.stroke();

        // Ön Bacaklar
        ctx.beginPath();
        ctx.moveTo(10, 4);
        ctx.lineTo(14 + legFront1, 14);
        ctx.moveTo(8, 4);
        ctx.lineTo(12 + legFront2, 14);
        ctx.stroke();

        // D. AT GÖVDESİ (Thoroughbred Kaslı Gövde)
        ctx.fillStyle = horseColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 19, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // E. AT BOYNU & BAŞI (Aerodynamic Gallop Position)
        ctx.beginPath();
        ctx.moveTo(11, -2);
        ctx.lineTo(18, -13);
        ctx.lineTo(26, -10);
        ctx.lineTo(22, 2);
        ctx.closePath();
        ctx.fill();

        // Kulaklar
        ctx.beginPath();
        ctx.moveTo(17, -13); ctx.lineTo(19, -19); ctx.lineTo(21, -13);
        ctx.fill();

        // Dalgalanan Yele (Mane)
        ctx.strokeStyle = (h.id === 'batangemi') ? "#cbd5e1" : "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(14, -6);
        ctx.lineTo(9, -11 + Math.sin(gallopTime) * 3);
        ctx.moveTo(16, -9);
        ctx.lineTo(12, -14 + Math.sin(gallopTime) * 3);
        ctx.stroke();

        // Dalgalanan Kuyruk (Tail)
        ctx.strokeStyle = (h.id === 'batangemi') ? "#cbd5e1" : "#0f172a";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-18, -2);
        ctx.quadraticCurveTo(-27, -6 + Math.sin(gallopTime) * 7, -35, -3 + Math.sin(gallopTime) * 9);
        ctx.stroke();

        // F. GÖZ & DİZGİN (Reins)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(22, -9, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(22.5, -9, 1, 0, Math.PI * 2);
        ctx.fill();

        // Dizginler
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(24, -6);
        ctx.lineTo(3, -4);
        ctx.stroke();

        // G. JOKEY
        // Jokey Pantolonu (Beyaz)
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.ellipse(-2, -3, 6, 4, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Jokey Çizmesi (Siyah)
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-4, 0, 3, 5);

        // Jokey Forması (Atın Takım Rengi)
        ctx.fillStyle = h.color;
        ctx.beginPath();
        ctx.arc(1, -7, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // Jokey Formasındaki Numara
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(h.number.toString(), 1, -4);

        // Jokey Kaskı
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(4, -13, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = h.color;
        ctx.fillRect(4, -13, 5, 2.5);

        // H. LİDERLİK TACI (Lider olan atın üzerinde parlar)
        let isCurrentLeader = leaderHorse && (h.id === leaderHorse.id);
        if (isRacing && isCurrentLeader && horseProg > 6) {
            ctx.fillStyle = "#facc15";
            ctx.font = "14px sans-serif";
            ctx.fillText("👑", 0, -32);
        }

        // I. AT İSMİ & ORAN ETİKETİ
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.beginPath();
        ctx.roundRect(-25, -28, 50, 14, 4);
        ctx.fill();
        ctx.strokeStyle = isCurrentLeader ? "#facc15" : "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isCurrentLeader ? "#fde047" : "#ffffff";
        ctx.font = "bold 8px sans-serif";
        ctx.fillText(`${h.number}. ${h.name}`, 0, -18);

        ctx.restore();
    });

    // 2.H İÇ GÖLGE / STADYUM DERİNLİĞİ (Vignette & Track Border)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 4;
    ctx.strokeRect(tvX, tvY, tvW, tvH);

    ctx.restore(); // Clip sonu

    // 3. TEPE DİJİTAL JUMBOTRON HUD (LED Skor Tabelası)
    ctx.save();
    let hudW = 340;
    let hudH = 26;
    let hudX = canvas.width / 2 - hudW / 2;
    let hudY = tvY + 4;

    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 6);
    ctx.fill();
    ctx.strokeStyle = isRacing ? "#ef4444" : "#10b981";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (isRacing) {
        let leaderName = leaderHorse ? `#${leaderHorse.number} ${leaderHorse.name}` : '-';
        ctx.fillStyle = "#f87171";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(`🔴 CANLI ${gState.raceNumber}. KOŞU | ⏱️ ${gState.secondsLeft || 0}s | 👑 Lider: ${leaderName} (%${Math.floor(leaderProg)})`, canvas.width / 2, hudY + hudH / 2);
    } else {
        if (gState.lastWinner) {
            ctx.fillStyle = "#facc15";
            ctx.font = "bold 10px sans-serif";
            ctx.fillText(`🟢 BAHİSLER AÇIK (15s) | ⏱️ ${gState.secondsLeft || 0}s | 🏆 Son Kazanan: #${gState.lastWinner.number} ${gState.lastWinner.name}`, canvas.width / 2, hudY + hudH / 2);
        } else {
            ctx.fillStyle = "#34d399";
            ctx.font = "bold 10px sans-serif";
            ctx.fillText(`🟢 ${gState.raceNumber}. KOŞU BAHİSLERİ AÇIK (15s) | ⏱️ ${gState.secondsLeft || 0}s Kaldı`, canvas.width / 2, hudY + hudH / 2);
        }
    }
    ctx.restore();

    // Ganyan Bayii Duvar TV'si (Orta Koridor Duvarında - Büyütülmüş)
    if (typeof drawVenueTV === 'function') {
        drawVenueTV(ctx, 325, 236, 150, 76);
    }

    // 3. HOVER ETKİLEŞİMLERİ (TJK GİŞESİ VE BİNEK HARASI)
    let isTjkHover = (canvasMouseX >= 20 && canvasMouseX <= 265 && canvasMouseY >= 248 && canvasMouseY <= 432);
    let isStableHover = (canvasMouseX >= 525 && canvasMouseX <= 780 && canvasMouseY >= 245 && canvasMouseY <= 440);

    if (isTjkHover) {
        hoveredTableId = 'tjk_counter';
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(20, 248, 245, 184, 14);
        ctx.stroke();

        ctx.fillStyle = "#facc15";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎫 Ganyan Kuponu Yatırmak İçin Tıkla", 142, 240);
    } else if (isStableHover) {
        hoveredTableId = 'horse_stable';
        ctx.strokeStyle = "#86efac";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(525, 245, 255, 187, 14);
        ctx.stroke();

        ctx.fillStyle = "#86efac";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🐎 5 Dakikalık Binek Atı Kirala (200 TL / 2.5X Hız)", 652, 238);
    }

    let isExitDoorHover = (canvasMouseX >= canvas.width / 2 - 45 && canvasMouseX <= canvas.width / 2 + 45 && canvasMouseY >= canvas.height - 75 && canvasMouseY <= canvas.height - 5);
    if (isExitDoorHover) {
        hoveredTableId = 'ganyan_exit';
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width / 2 - 37, canvas.height - 67, 74, 64);
    } else {
        if (hoveredTableId === 'ganyan_exit' || (!isTjkHover && !isStableHover && (hoveredTableId === 'tjk_counter' || hoveredTableId === 'horse_stable'))) {
            hoveredTableId = null;
        }
    }

    setGameCursor((isTjkHover || isStableHover || isExitDoorHover) ? 'pointer' : 'default');
}

// ============================================================================
// 12. YENİ CADDE (CADDE ENVIRONMENT - GANYAN BAYİİ & DEDENİN YERİ CASINO BULVARI)
// ============================================================================

function renderStaticDedeninYeriTo(bctx, width, height) {
    // 1. Zemin: Kraliyet Kırmızısı Altın Geometrik Casino Halısı
    bctx.fillStyle = "#4c0519";
    bctx.fillRect(0, 0, width, height);

    // Kırmızı & Altın Elmas Baklava Deseni
    bctx.strokeStyle = "rgba(250, 204, 21, 0.15)";
    bctx.lineWidth = 1;
    for (let x = -width; x < width * 2; x += 36) {
        bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x + height, height); bctx.stroke();
        bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x - height, height); bctx.stroke();
    }

    // 2. Duvarlar (Maun Wainscoting Panel & Altın Aplikler)
    bctx.fillStyle = "#1e050b";
    bctx.fillRect(0, 0, width, 115);
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 2.5;
    bctx.beginPath(); bctx.moveTo(0, 115); bctx.lineTo(width, 115); bctx.stroke();

    // Altın Çerçeveli Büyük Casino Tabelası
    bctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    bctx.beginPath();
    bctx.roundRect(width / 2 - 230, 16, 460, 66, 12);
    bctx.fill();
    bctx.strokeStyle = "#facc15";
    bctx.lineWidth = 2.5;
    bctx.stroke();

    // Neon Şimşekler ve Tabela Yazısı
    bctx.fillStyle = "#facc15";
    bctx.font = "bold 20px sans-serif";
    bctx.textAlign = "center";
    bctx.fillText("⚡ DEDENİN YERİ CASINO ⚡", width / 2, 45);

    bctx.fillStyle = "#38bdf8";
    bctx.font = "bold 11px sans-serif";
    bctx.fillText("♠️ VIP CANLI BLACKJACK 21 • 3:2 ÖDEME • KASA 17'DE KALIR ♣️", width / 2, 68);

    // 3. Sol Duvar: Işıltılı Retro Slot Makineleri (🎰)
    for (let i = 0; i < 3; i++) {
        let smX = 35 + i * 50;
        let smY = 125;
        // Kasa
        bctx.fillStyle = "#1e293b";
        bctx.beginPath(); bctx.roundRect(smX, smY, 42, 60, 6); bctx.fill();
        bctx.strokeStyle = "#f59e0b"; bctx.lineWidth = 1.5; bctx.stroke();
        // Üst Işık
        bctx.fillStyle = i % 2 === 0 ? "#ef4444" : "#facc15";
        bctx.beginPath(); bctx.arc(smX + 21, smY + 8, 4, 0, Math.PI * 2); bctx.fill();
        // Ekran & Çarklar
        bctx.fillStyle = "#0f172a";
        bctx.fillRect(smX + 6, smY + 16, 30, 22);
        bctx.fillStyle = "#fde047";
        bctx.font = "bold 9px sans-serif";
        bctx.fillText("7 7 7", smX + 21, smY + 31);
        // Jeton Bölmesi
        bctx.fillStyle = "#475569";
        bctx.fillRect(smX + 8, smY + 44, 26, 10);
    }

    // 4. Sağ Duvar: Rulet Masası & VIP Çemberi
    let rX = 635, rY = 135;
    bctx.fillStyle = "#064e3b";
    bctx.beginPath(); bctx.roundRect(rX, rY, 130, 85, 10); bctx.fill();
    bctx.strokeStyle = "#facc15"; bctx.lineWidth = 2; bctx.stroke();

    // Rulet Çarkı
    bctx.fillStyle = "#78350f";
    bctx.beginPath(); bctx.arc(rX + 32, rY + 42, 22, 0, Math.PI * 2); bctx.fill();
    bctx.fillStyle = "#facc15";
    bctx.beginPath(); bctx.arc(rX + 32, rY + 42, 12, 0, Math.PI * 2); bctx.fill();
    bctx.fillStyle = "#ef4444";
    bctx.beginPath(); bctx.arc(rX + 32, rY + 42, 5, 0, Math.PI * 2); bctx.fill();

    // Bahis Izgarası
    bctx.fillStyle = "#ffffff";
    bctx.font = "bold 8px sans-serif";
    bctx.fillText("RULET", rX + 88, rY + 36);
    bctx.fillStyle = "#fde047";
    bctx.fillText("0-36 VIP", rX + 88, rY + 54);

    // 5. Çıkış Kapısı (Orta Altta: Caddeye Açılır)
    drawExitDoor(bctx, width / 2 - 35, height - 65, "🚪 CADDE", 70, 60);
}

function drawDedeninYeriEnvironment() {
    let bg = bgCache.getCanvas('dedenin_yeri', canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);

    // Dedenin Yeri VIP TV Ekranı (Üst Sol Duvarda - Büyütülmüş)
    if (typeof drawVenueTV === 'function') {
        drawVenueTV(ctx, 30, 14, 150, 76);
    }

    // Canlı Blackjack Masası Çizimi (Ortada: x: 310, y: 155, w: 180, h: 135)
    let t = { x: 310, y: 155, w: 180, h: 135 };
    let isTableHover = (canvasMouseX >= t.x && canvasMouseX <= t.x + t.w && canvasMouseY >= t.y && canvasMouseY <= t.y + t.h);
    let isExitHover = (canvasMouseX >= canvas.width / 2 - 45 && canvasMouseX <= canvas.width / 2 + 45 && canvasMouseY >= canvas.height - 75 && canvasMouseY <= canvas.height - 5);

    // Slot Makineleri Sırası (Sol: x: 25..185, y: 115..195)
    let isSlotHover = (canvasMouseX >= 25 && canvasMouseX <= 185 && canvasMouseY >= 115 && canvasMouseY <= 195);

    // Rulet Masası (Sağ: x: 625..775, y: 125..235)
    let isRouletteHover = (canvasMouseX >= 625 && canvasMouseX <= 775 && canvasMouseY >= 125 && canvasMouseY <= 235);

    drawBlackjackTableObj(t.x, t.y, t.w, t.h, isTableHover);

    // Hover Etiketleri & Vurguları
    if (isTableHover) {
        hoveredTableId = 'blackjack';
    } else if (isSlotHover) {
        hoveredTableId = 'slot_machine';
        // Slot Çevresi Parlama Vurgusu
        ctx.save();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(250, 204, 21, 0.8)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(30, 118, 150, 72, 8);
        ctx.stroke();

        // Slot Hover Etiketi
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.beginPath();
        ctx.roundRect(40, 92, 130, 22, 6);
        ctx.fill();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#facc15";
        ctx.font = "bold 9.5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎰 777 Slot (Tıkla / E)", 105, 107);
        ctx.restore();
    } else if (isRouletteHover) {
        hoveredTableId = 'roulette';
        // Rulet Çevresi Parlama Vurgusu
        ctx.save();
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(16, 185, 129, 0.85)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(630, 130, 140, 95, 12);
        ctx.stroke();

        // Rulet Hover Etiketi
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.beginPath();
        ctx.roundRect(635, 102, 130, 22, 6);
        ctx.fill();
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#34d399";
        ctx.font = "bold 9.5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎡 VIP Rulet (Tıkla / E)", 700, 117);
        ctx.restore();
    } else if (isExitHover) {
        hoveredTableId = 'casino_exit';
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width / 2 - 37, canvas.height - 67, 74, 64);
    } else {
        if (hoveredTableId === 'blackjack' || hoveredTableId === 'casino_exit' || hoveredTableId === 'slot_machine' || hoveredTableId === 'roulette') {
            hoveredTableId = null;
        }
    }

    setGameCursor((isTableHover || isExitHover || isSlotHover || isRouletteHover) ? 'pointer' : 'default');
}

// ============================================================================
// 14. PRESTİJ GAYRİMENKUL & EMLAK OFİSİ (EMLAKCI SHOWROOM - MAKETLER & TUR)
// ============================================================================

if (typeof window !== 'undefined') {
    window.renderStaticGanyanTo = renderStaticGanyanTo;
    window.drawGanyanEnvironment = drawGanyanEnvironment;
    window.renderStaticDedeninYeriTo = renderStaticDedeninYeriTo;
    window.drawDedeninYeriEnvironment = drawDedeninYeriEnvironment;
}

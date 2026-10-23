// public/js/renderers/renderSahilV2.js - Sahil v2 (1000x625) Dinamik Gece/Gündüz & Kuğu Kiralama Motoru
(function () {
    // 1. Arka Plan Görselleri (Gündüz & Gece)
    const sahilDayImg = new Image();
    sahilDayImg.src = '/assets/maps/sahilv2_day.jpg?v=2';

    const sahilNightImg = new Image();
    sahilNightImg.src = '/assets/maps/sahilv2_night.jpg?v=2';

    // Kuğu Spritesheet Görseli (4 sütun x 16 satır)
    const swanSpriteImg = new Image();
    swanSpriteImg.src = '/assets/vehicles/swan_spritesheet.png';

    // Kaptan Kuğu ve Mekan Sabitleri (1000x625 Çözünürlüğe Göre)
    const KAPTAN_KUGU = {
        x: 712,
        y: 350,
        name: 'Kaptan Kuğu',
        fee: 20
    };

    const EXIT_SIGN = {
        x: 948,
        y: 566,
        targetRoom: 'meydanv2'
    };

    /**
     * Kıyı Hattı (Shoreline Wave Curve):
     * x < shoreX(y) ve iskele üzerinde değilse -> SU (DENİZ)
     * x >= shoreX(y) -> KUMSAL (KARA)
     */
    function getSahilV2ShoreX(y) {
        if (y <= 120) return 790 - (y / 120) * 35;           // 790 -> 755
        if (y <= 240) return 755 - ((y - 120) / 120) * 115;  // 755 -> 640
        if (y <= 360) return 640 - ((y - 240) / 120) * 155;  // 640 -> 485
        if (y <= 480) return 485 - ((y - 360) / 120) * 170;  // 485 -> 315
        if (y <= 625) return 315 - ((y - 480) / 145) * 165;  // 315 -> 150
        return 150;
    }

    /**
     * İskele üzerinde mi kontrolü (0, 0 noktasından 665, 390 noktasına uzanan ahşap iskele)
     * Gerçek piksel ekseni: y ≈ 6 + 0.576 * x, güverte kalınlığı: ~56px (yarıçap: 28px)
     */
    function isPointOnPier(x, y) {
        if (x < -10 || x > 675 || y < -5 || y > 425) return false;

        let pierCenterY = 6 + 0.576 * x;
        let distY = Math.abs(y - pierCenterY);
        if (distY <= 28) return true; // İskele ana yürüyüş güvertesi

        // İskelenin kumsal ve boardwalk ile birleştiği geniş platform (x: 585..680, y: 320..420)
        if (x >= 585 && x <= 680 && y >= 320 && y <= 420) return true;

        return false;
    }

    /**
     * Boardwalk (Giriş Ahşap Yolu): 640, 350'den 960, 580'e uzanan yol
     */
    function isPointOnBoardwalk(x, y) {
        if (x < 620 || x > 980 || y < 320 || y > 625) return false;
        let bwCenterY = 350 + (230 / 320) * (x - 640);
        return Math.abs(y - bwCenterY) <= 38;
    }

    /**
     * Su / Deniz Zemin Kontrolü
     */
    function isSahilV2Water(x, y) {
        // İskele veya ana ahşap yürüyüş yolu üzerindeyse su değildir!
        if (isPointOnPier(x, y)) return false;
        if (isPointOnBoardwalk(x, y)) return false;

        let shoreX = getSahilV2ShoreX(y);
        return x < shoreX;
    }

    /**
     * Statik Sahil v2 Çizimi (bgCache için tek sefer çizilir, Gece/Gündüz değiştiğinde anında invalidate olur)
     */
    function renderStaticSahilV2To(bctx, width, height) {
        bctx.imageSmoothingEnabled = true;
        bctx.imageSmoothingQuality = 'high';

        let isNight = (typeof isNightMode !== 'undefined' ? isNightMode : (window.isNightMode || false));
        let targetImg = isNight ? sahilNightImg : sahilDayImg;

        if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
            bctx.drawImage(targetImg, 0, 0, width, height);
        } else {
            // Görsel henüz yüklenmediyse şık yedek zemin çiz
            let seaGrad = bctx.createLinearGradient(0, 0, width * 0.6, height);
            seaGrad.addColorStop(0, isNight ? "#064e3b" : "#0284c7");
            seaGrad.addColorStop(1, isNight ? "#022c22" : "#38bdf8");
            bctx.fillStyle = seaGrad;
            bctx.fillRect(0, 0, width, height);

            let sandGrad = bctx.createLinearGradient(width * 0.4, 0, width, height);
            sandGrad.addColorStop(0, isNight ? "#78350f" : "#fef08a");
            sandGrad.addColorStop(1, isNight ? "#451a03" : "#fcd34d");
            bctx.fillStyle = sandGrad;
            bctx.beginPath();
            bctx.moveTo(800, 0);
            bctx.quadraticCurveTo(500, 300, 160, height);
            bctx.lineTo(width, height);
            bctx.lineTo(width, 0);
            bctx.closePath();
            bctx.fill();
        }
    }

    /**
     * Dinamik Sahil v2 Çevre Katmanı (Canlı efektler, Kaptan Kuğu rozeti, dalgalar, ateş, tabelalar)
     */
    function drawSahilV2Environment() {
        if (typeof bgCache === 'undefined' || !canvas || !ctx) return;

        let bg = bgCache.getCanvas('sahilv2', canvas.width, canvas.height);
        if (bg) {
            ctx.drawImage(bg, 0, 0);
        }

        let now = Date.now();
        let isNight = (typeof isNightMode !== 'undefined' ? isNightMode : (window.isNightMode || false));
        let myP = (typeof players !== 'undefined' && typeof myId !== 'undefined') ? players[myId] : null;

        // 1. DENİZ DALGASI VE KÖPÜK PIRILTILARI (Shimmering Water Foam)
        ctx.save();
        for (let i = 0; i < 18; i++) {
            let waveY = 80 + i * 30;
            let sx = getSahilV2ShoreX(waveY);
            let wavePhase = Math.sin(now / 500 + i * 0.9);
            let waveOffset = wavePhase * 12;
            let alpha = Math.max(0.1, 0.45 + wavePhase * 0.3);

            ctx.strokeStyle = isNight ? `rgba(254, 215, 170, ${alpha * 0.5})` : `rgba(255, 255, 255, ${alpha * 0.75})`;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.ellipse(sx - 15 + waveOffset, waveY, 26, 4, -0.45, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        // 2. GECE MODU: KAMP ATEŞİ & FENER IŞILTILARI
        if (isNight) {
            ctx.save();
            // Kamp ateşi sıcak aurası (x: 704, y: 495)
            let fireFlicker = Math.sin(now / 120) * 4 + Math.cos(now / 90) * 3;
            let fireGrad = ctx.createRadialGradient(704, 495, 2, 704, 495, 45 + fireFlicker);
            fireGrad.addColorStop(0, "rgba(251, 146, 60, 0.75)");
            fireGrad.addColorStop(0.5, "rgba(234, 88, 12, 0.35)");
            fireGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
            ctx.fillStyle = fireGrad;
            ctx.beginPath();
            ctx.arc(704, 495, 50 + fireFlicker, 0, Math.PI * 2);
            ctx.fill();

            // Uçuşan ateş kıvılcımları (Embers)
            ctx.fillStyle = "#fef08a";
            for (let e = 0; e < 5; e++) {
                let emberY = 495 - ((now / 20 + e * 35) % 35);
                let emberX = 704 + Math.sin(now / 150 + e) * 12;
                ctx.beginPath();
                ctx.arc(emberX, emberY, 1.4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 3. KAPTAN KUĞU NPC'Sİ & ETKİLEŞİM ROZETİ (Görselden kaldırılan NPC yerine modern avatar)
        drawKaptanKuguNPC(ctx, KAPTAN_KUGU.x, KAPTAN_KUGU.y, now, myP, isNight);

        // 4. YÖN & ÇIKIŞ TABELASI (Meydan Sağ Ok, Sahil Sol Ok)
        drawSahilV2ExitSignpost(ctx, isNight, myP, now);

        // 5. TROPİK SAHİL BARI ETKİLEŞİM ROZETİ (Görseldeki Tropik Bar)
        const TROPIK_BAR_POS = { x: 905, y: 460 };
        let distToBar = myP ? Math.hypot(myP.x - TROPIK_BAR_POS.x, myP.y - TROPIK_BAR_POS.y) : 999;
        let isNearBar = distToBar <= 90;
        let isHoverBar = false;
        if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
            if (Math.hypot(mouseX - TROPIK_BAR_POS.x, mouseY - TROPIK_BAR_POS.y) <= 50) {
                isHoverBar = true;
            }
        }

        if (isNearBar || isHoverBar) {
            ctx.save();
            let barBadgeX = TROPIK_BAR_POS.x;
            let barBadgeY = TROPIK_BAR_POS.y - 48 + Math.sin(now / 200) * 3;

            ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
            ctx.beginPath();
            ctx.roundRect(barBadgeX - 68, barBadgeY - 14, 136, 28, 8);
            ctx.fill();
            ctx.strokeStyle = "#facc15";
            ctx.lineWidth = 1.6;
            ctx.stroke();

            ctx.fillStyle = "#facc15";
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🍹 Tropik Sahil Barı", barBadgeX, barBadgeY - 4);

            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 8.5px sans-serif";
            ctx.fillText(isNearBar ? "[E] Tuşuna Bas veya Tıkla" : "Kokteyl Menüsü", barBadgeX, barBadgeY + 6);
            ctx.restore();
        }
    }

    /**
     * Kaptan Kuğu NPC'si (Karakter Sistemimizle 1:1 Uyumlu Modern Kaptan)
     */
    function drawKaptanKuguNPC(ctx, x, y, now, myP, isNight) {
        let dist = myP ? Math.hypot(myP.x - x, myP.y - y) : 999;
        let isNear = dist <= 85;
        let isHover = (typeof hoveredTableId !== 'undefined' && hoveredTableId === 'sahilv2_kaptan');

        if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
            let mDist = Math.hypot(mouseX - x, mouseY - (y - 15));
            if (mDist <= 40) {
                isHover = true;
                if (typeof hoveredTableId !== 'undefined') hoveredTableId = 'sahilv2_kaptan';
            }
        }

        // Baktığı yön: Oyuncu yakındaysa oyuncuya bakar, uzaktaysa kumsala bakar
        let facing = 'down-right';
        if (myP && dist <= 140) {
            if (typeof calculate8WayFacing === 'function') {
                facing = calculate8WayFacing(myP.x - x, myP.y - y) || 'down-right';
            }
        }

        ctx.save();

        // 1. Zemin Temas Gölgesi
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.beginPath();
        ctx.ellipse(x, y + 13, 14, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Yakındayken / hoverken zemin etkileşim halkası
        if (isNear || isHover) {
            let pulse = Math.sin(now / 180) * 2;
            ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
            ctx.beginPath();
            ctx.ellipse(x, y + 13, 22 + pulse, 9 + pulse * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.4;
            ctx.stroke();
        }

        // 2. Kaptan Kuğu Avatarı (Oyunumuzun Classic-2 Anatomisiyle 1:1 Uyumlu)
        let breathBob = Math.sin(now / 450) * 0.8;
        let pY = y + breathBob;

        let kaptanAvatar = {
            model: 'classic_2',
            skinColor: '#ffd1a4',
            pants: 'pants_classic_black',
            shoes: 'boots',
            outfit: 'outfit_c2_gentleman',
            hat: 'kasket',
            color: '#0f172a',
            action: 'idle'
        };

        if (typeof drawClassic2Avatar === 'function') {
            drawClassic2Avatar(ctx, x, pY, kaptanAvatar, facing, false, 0, 0, false, false);
        } else {
            // Fallback: Standart karakter çizimi
            if (typeof drawAvatarLegsAndShoes === 'function') drawAvatarLegsAndShoes(ctx, x, pY, 0, '#ffd1a4', 'boots', false, false, facing, false, '#0f172a');
            if (typeof drawAvatarBodyAndClothes === 'function') drawAvatarBodyAndClothes(ctx, x, pY, '#0f172a', '#ffd1a4', facing, false);
            if (typeof drawAvatarFaceAndEyes === 'function') drawAvatarFaceAndEyes(ctx, x, pY, 'none', 0, 0, facing);
            if (typeof drawAvatarHairAndHats === 'function') drawAvatarHairAndHats(ctx, x, pY, 'kasket', facing);
        }

        // Kaptan Rozet Detayları (Şapkada Altın Çapa + Cekette Altın Düğmeler)
        ctx.save();
        let capX = x + (facing.includes('left') ? -3 : (facing.includes('right') ? 3 : 0));
        let capY = pY - 26;
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(capX, capY, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(capX, capY - 2); ctx.lineTo(capX, capY + 3);
        ctx.moveTo(capX - 2.5, capY + 1.5); ctx.quadraticCurveTo(capX, capY + 3.5, capX + 2.5, capY + 1.5);
        ctx.stroke();

        // Cekette çift sıra altın düğmeler
        let torsoY = pY - 8;
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(x - 2.5, torsoY - 4, 1.6, 1.6);
        ctx.fillRect(x + 1.5, torsoY - 4, 1.6, 1.6);
        ctx.fillRect(x - 2.5, torsoY, 1.6, 1.6);
        ctx.fillRect(x + 1.5, torsoY, 1.6, 1.6);
        ctx.restore();

        // 3. İsim ve Etkileşim Rozeti
        let pulseOffset = Math.sin(now / 200) * 3;
        let badgeX = x;
        let badgeY = pY - 46 + (isNear ? pulseOffset : 0);

        let isRenting = myP && myP.hasSwanBoat;
        let badgeW = isRenting ? 142 : 136;
        let badgeH = 26;

        ctx.fillStyle = isNear || isHover ? "rgba(15, 23, 42, 0.95)" : "rgba(15, 23, 42, 0.84)";
        ctx.beginPath();
        ctx.roundRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 8);
        ctx.fill();
        ctx.strokeStyle = isNear || isHover ? "#38bdf8" : "rgba(250, 204, 21, 0.85)";
        ctx.lineWidth = isNear || isHover ? 2.0 : 1.2;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (isRenting) {
            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 10px sans-serif";
            let timeLeft = (typeof swanBoatSecondsLeft !== 'undefined' && swanBoatSecondsLeft > 0)
                ? `${Math.floor(swanBoatSecondsLeft / 60)}:${(swanBoatSecondsLeft % 60).toString().padStart(2, '0')}`
                : "Aktif";
            ctx.fillText(`🦢 Kuğu Sürüşü: ${timeLeft}`, badgeX, badgeY);
        } else {
            ctx.fillStyle = isNear ? "#facc15" : "#ffffff";
            ctx.font = "bold 10px sans-serif";
            ctx.fillText("⚓ Kaptan Kuğu (20 TL)", badgeX, badgeY - 5);
            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 8.5px sans-serif";
            ctx.fillText(isNear ? "[E] Tuşuna Bas veya Tıkla" : "Tıkla & Kirala", badgeX, badgeY + 6);
        }

        ctx.restore();
    }

    /**
     * Yön ve Çıkış Tabelası (Meydan Sağ Ok, Sahil Sol Ok)
     */
    function drawSahilV2ExitSignpost(ctx, isNight, myP, now) {
        const poleX = EXIT_SIGN.x;
        const poleGroundY = EXIT_SIGN.y;

        let distToExit = myP ? Math.hypot(myP.x - poleX, myP.y - poleGroundY) : 999;
        let isNearExit = distToExit <= 85;
        let isHoverSign = false;
        if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
            if (Math.hypot(mouseX - poleX, mouseY - 525) <= 45) {
                isHoverSign = true;
            }
        }

        ctx.save();

        // 1. Zemin Temas Gölgesi
        ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
        ctx.beginPath();
        ctx.ellipse(poleX, poleGroundY, 8, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Galvanizli Çelik Direk (Levhaların Arkasında Yer Alır)
        let poleGrad = ctx.createLinearGradient(poleX - 2, 0, poleX + 2, 0);
        poleGrad.addColorStop(0, "#cbd5e1");
        poleGrad.addColorStop(0.4, "#94a3b8");
        poleGrad.addColorStop(1, "#475569");
        ctx.fillStyle = poleGrad;
        ctx.fillRect(poleX - 2, 496, 4, poleGroundY - 496);

        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(poleX - 2, 496, 4, poleGroundY - 496);

        // Direk tepesi yuvarlak başlık
        ctx.beginPath();
        ctx.arc(poleX, 496, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#94a3b8";
        ctx.fill();
        ctx.stroke();

        // Direk Zemin Montaj Pabucu
        ctx.fillStyle = "#334155";
        ctx.fillRect(poleX - 5, poleGroundY - 3, 10, 3);

        // 3. ÜST LEVHA: MEYDAN (SAĞ OK LEVHA ŞEKLİ)
        let topX1 = 918;
        let topX2 = 980;
        let topY = 504, topH = 18;
        let topMidY = topY + topH / 2;
        let topCenterX = 945; // Yazının levha gövdesindeki tam merkezi

        // Levha gölgesi
        ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
        ctx.beginPath();
        ctx.moveTo(topX1 + 2, topY + 2);
        ctx.lineTo(topX2 - 7, topY + 2);
        ctx.lineTo(topX2 + 2, topMidY + 2);
        ctx.lineTo(topX2 - 7, topY + topH + 2);
        ctx.lineTo(topX1 + 2, topY + topH + 2);
        ctx.closePath();
        ctx.fill();

        // Levha mavi zemin
        let signBlue = isNight ? "#1e3a8a" : "#1d4ed8";
        let signBorder = "#0f172a";

        ctx.fillStyle = signBlue;
        ctx.beginPath();
        ctx.moveTo(topX1, topY);
        ctx.lineTo(topX2 - 7, topY);
        ctx.lineTo(topX2, topMidY);
        ctx.lineTo(topX2 - 7, topY + topH);
        ctx.lineTo(topX1, topY + topH);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = signBorder;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Beyaz iç çerçeve
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(topX1 + 2.5, topY + 2.5);
        ctx.lineTo(topX2 - 7.5, topY + 2.5);
        ctx.lineTo(topX2 - 2, topMidY);
        ctx.lineTo(topX2 - 7.5, topY + topH - 2.5);
        ctx.lineTo(topX1 + 2.5, topY + topH - 2.5);
        ctx.closePath();
        ctx.stroke();

        // SADECE "MEYDAN" YAZISI (Temiz, ortalanmış, yanında ek ok işareti yok)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9.5px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("MEYDAN", topCenterX, topMidY + 0.5);

        // 4. ALT LEVHA: SAHİL (SOL OK LEVHA ŞEKLİ)
        let botX1 = 914;
        let botX2 = 976;
        let botY = 527, botH = 18;
        let botMidY = botY + botH / 2;
        let botCenterX = 949; // Yazının levha gövdesindeki tam merkezi

        // Levha gölgesi
        ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
        ctx.beginPath();
        ctx.moveTo(botX1 + 7, botY + 2);
        ctx.lineTo(botX2 + 2, botY + 2);
        ctx.lineTo(botX2 + 2, botY + botH + 2);
        ctx.lineTo(botX1 + 7, botY + botH + 2);
        ctx.lineTo(botX1 - 1, botMidY + 2);
        ctx.closePath();
        ctx.fill();

        // Levha mavi zemin
        ctx.fillStyle = signBlue;
        ctx.beginPath();
        ctx.moveTo(botX1 + 7, botY);
        ctx.lineTo(botX2, botY);
        ctx.lineTo(botX2, botY + botH);
        ctx.lineTo(botX1 + 7, botY + botH);
        ctx.lineTo(botX1, botMidY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = signBorder;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Beyaz iç çerçeve
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(botX1 + 7.5, botY + 2.5);
        ctx.lineTo(botX2 - 2.5, botY + 2.5);
        ctx.lineTo(botX2 - 2.5, botY + botH - 2.5);
        ctx.lineTo(botX1 + 7.5, botY + botH - 2.5);
        ctx.lineTo(botX1 + 2, botMidY);
        ctx.closePath();
        ctx.stroke();

        // SADECE "SAHİL" YAZISI (Temiz, ortalanmış, yanında ek ok işareti yok)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9.5px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("SAHİL", botCenterX, botMidY + 0.5);

        // 5. Yaklaşınca / Hover Olunca İpucu Rozeti
        if (isNearExit || isHoverSign) {
            let hintPulse = Math.sin(now / 180) * 2;
            ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
            ctx.beginPath();
            ctx.roundRect(poleX - 68, topY - 32 + hintPulse, 136, 24, 7);
            ctx.fill();
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.4;
            ctx.stroke();

            ctx.fillStyle = "#38bdf8";
            ctx.font = "bold 9.5px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🏙️ Meydan v2'ye Geç [E]", poleX, topY - 20 + hintPulse);
        }

        ctx.restore();
    }

    /**
     * Sahil v2 Çarpışma / Engel Kontrolü:
     * - Kuğu KİRALANMAMIŞSA: Oyuncu denize yürüyemez (kıyı şeridinde durdurulur). Yalnızca iskele ve kumsalda yürüyebilir.
     * - Kuğu KİRALANMIŞSA: Denizde 2 kat hızla serbestçe yüzer; kumsalda ve iskelede 1 kat hızla pedallar.
     * - Sabit engeller: Kaptan kulübesi, voleybol filesi, kamp ateşi taşları.
     */
    function checkSahilV2Collision(x, y) {
        let onPier = isPointOnPier(x, y);
        let minX = onPier ? 5 : 15;
        let minY = onPier ? 5 : 15;
        if (x < minX || x > 985 || y < minY || y > 610) return true;

        let myP = (typeof players !== 'undefined' && typeof myId !== 'undefined') ? players[myId] : null;
        let hasSwan = myP && myP.hasSwanBoat;

        // 2. Deniz Suyu Kontrolü
        let inWater = isSahilV2Water(x, y);
        if (inWater && !hasSwan) {
            // Kuğu yoksa denize yürüyerek girilemez!
            return true;
        }

        // 3. Sabit Katı Engeller (Kuğu varken de yokken de içinden geçilemez)
        // Kaptan Kuğu Büfesi / Kulübe (x: 730..820, y: 295..365)
        if (x >= 728 && x <= 820 && y >= 295 && y <= 365) return true;

        // Kaptan Kuğu NPC Katı Engeli
        if (Math.hypot(x - KAPTAN_KUGU.x, y - KAPTAN_KUGU.y) <= 12) return true;

        // Çıkış Tabelası Direk Katı Engeli
        if (Math.hypot(x - EXIT_SIGN.x, y - EXIT_SIGN.y) <= 8) return true;

        // Kamp Ateşi Taş Çemberi (x: 675..735, y: 475..518)
        if (x >= 675 && x <= 735 && y >= 475 && y <= 518) return true;

        // Voleybol Filesi Direkleri ve Hattı (x: 480..585, y: 505..525)
        if (x >= 480 && x <= 585 && y >= 505 && y <= 525) return true;

        // Tropik Bar Tezgahı (x: 875..945, y: 435..485) - Tezgahın arkasına geçilmez, önünde durulur
        if (x >= 875 && x <= 945 && y >= 435 && y <= 485) return true;

        return false;
    }

    /**
     * Kaptan Kuğu Etkileşimi (Kuğu Kiralama - 20 TL)
     */
    function interactWithKaptanKugu() {
        let myP = (typeof players !== 'undefined' && typeof myId !== 'undefined') ? players[myId] : null;
        if (!myP) return false;

        let dist = Math.hypot(myP.x - KAPTAN_KUGU.x, myP.y - KAPTAN_KUGU.y);
        if (dist > 95) {
            // Kaptan Kuğu'ya doğru yürüt
            if (typeof targetWalkPos !== 'undefined') {
                targetWalkPos = { x: KAPTAN_KUGU.x + 20, y: KAPTAN_KUGU.y + 20, onReach: interactWithKaptanKugu };
            }
            return false;
        }

        if (myP.hasSwanBoat) {
            if (typeof showGameNotification === 'function') {
                showGameNotification("🦢 Zaten Kuğu Deniz Bisikleti kiraladınız! Denizde 2 kat hızla süzülebilirsiniz.");
            } else if (typeof alert === 'function') {
                alert("🦢 Zaten Kuğu Deniz Bisikleti kiraladınız!");
            }
            return true;
        }

        // Kuğu Kiralama Tetikle (Socket emit)
        if (typeof socket !== 'undefined') {
            socket.emit('rentSwanBoat');
        }
        return true;
    }

    /**
     * Sahil v2 Mouse Tıklama Yöneticisi
     */
    function handleSahilV2Click(clickX, clickY, p) {
        // 1. Kaptan Kuğu veya Büfeye Tıklama
        let distKaptan = Math.hypot(clickX - KAPTAN_KUGU.x, clickY - KAPTAN_KUGU.y);
        let distBooth = Math.hypot(clickX - 765, clickY - 330);
        if (distKaptan <= 65 || distBooth <= 50) {
            interactWithKaptanKugu();
            return true;
        }

        // 2. Tropik Sahil Barına Tıklama
        let distBar = Math.hypot(clickX - 905, clickY - 460);
        if (distBar <= 70 || (clickX >= 860 && clickX <= 960 && clickY >= 415 && clickY <= 510)) {
            if (typeof openCocktailBarModal === 'function') {
                openCocktailBarModal();
            }
            return true;
        }

        // 3. Meydan Çıkış Tabelasına Tıklama
        let distExit = Math.hypot(clickX - EXIT_SIGN.x, clickY - EXIT_SIGN.y);
        if (distExit <= 65 || (clickX >= 910 && clickY >= 530)) {
            if (typeof changeRoom === 'function') {
                changeRoom('meydanv2');
            }
            return true;
        }

        return false;
    }

    /**
     * Sahil v2 "E" Tuşu / Mobil Buton Etkileşimi
     */
    function handleSahilV2MobileInteract(p) {
        if (!p) return false;

        // 1. Kaptan Kuğu Yakınındaysa Kuğu Kirala
        let distKaptan = Math.hypot(p.x - KAPTAN_KUGU.x, p.y - KAPTAN_KUGU.y);
        if (distKaptan <= 90) {
            return interactWithKaptanKugu();
        }

        // 2. Tropik Bar Yakınındaysa Kokteyl Menüsünü Aç
        let distBar = Math.hypot(p.x - 905, p.y - 460);
        if (distBar <= 90) {
            if (typeof openCocktailBarModal === 'function') {
                openCocktailBarModal();
                return true;
            }
        }

        // 3. Çıkış Kapısı / Tabelası Yakınındaysa Meydana Geç
        let distExit = Math.hypot(p.x - EXIT_SIGN.x, p.y - EXIT_SIGN.y);
        if (distExit <= 90 || (p.x >= 910 && p.y >= 530)) {
            if (typeof changeRoom === 'function') {
                changeRoom('meydanv2');
                return true;
            }
        }

        return false;
    }

    /**
     * Kuğu Deniz Bisikleti Renderlayıcı (avatarRenderer veya NPC çizimleri için)
     */
    function drawSahilV2SwanBoat(targetCtx, p, pX, pY, facing, isMoving) {
        if (typeof SwanBoatRenderer !== 'undefined') {
            let inWater = isSahilV2Water(p.x, p.y);
            targetCtx.save();
            targetCtx.translate(pX, pY + 6);
            SwanBoatRenderer.draw(targetCtx, {
                direction: facing,
                isMoving: isMoving,
                inWater: inWater,
                scale: 1.15,
                now: Date.now()
            });
            targetCtx.restore();
        }
    }

    // Global Fonksiyonları Dışa Aktar
    window.renderStaticSahilV2To = renderStaticSahilV2To;
    window.drawSahilV2Environment = drawSahilV2Environment;
    window.checkSahilV2Collision = checkSahilV2Collision;
    window.isSahilV2Water = isSahilV2Water;
    window.interactWithKaptanKugu = interactWithKaptanKugu;
    window.handleSahilV2Click = handleSahilV2Click;
    window.handleSahilV2MobileInteract = handleSahilV2MobileInteract;
    window.drawSahilV2SwanBoat = drawSahilV2SwanBoat;
})();

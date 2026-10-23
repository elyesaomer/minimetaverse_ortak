/**
 * horseMountRenderer.js - Yeni Nesil 8 Yönlü Modern & Sevimli Asil Binek Atı Motoru
 * 
 * Özellikler:
 * - 8 Yön: down, down-left, down-right, left, right, up-left, up-right, up
 * - Sevimli, modern ve asil çizim tarzı (Kestane doru kürk, koyu yele & kuyruk, deri eyer & üzengi, yular)
 * - Çift Katmanlı Derinlik (Dual-Pass Layering):
 *     1. Arka Katman (drawHorseBase): Gövde, arka bacaklar, kuyruk, eyer tabanı -> Karakter eyere biner
 *     2. Ön Katman (drawHorseFront): Boyun, kafa, kulaklar, yele, dizgin kayışları ve üzengi -> Karakterin önünde durur
 * - 4 Bacaklı Dörtnal Koşu Animasyonu (Gallop Cycle):
 *     - Ön ve arka bacakların senkronize salınımı
 *     - Gövdenin dörtnal kalkış ve iniş salınımı (gallopBob)
 *     - Rüzgarda dalgalanan kuyruk ve yele
 *     - Koşarken toynakların altından kalkan hafif toz puf efektleri
 */

(function (global) {
    'use strict';

    const HORSE_PALETTE = {
        coatMain: '#713f12',      // Sıcak zengin kestane doru kürk
        coatLight: '#854d0e',     // Işıklı sırt ve omuz tonu
        coatDark: '#50290a',      // Gövde altı ve kas gölgesi
        coatBelly: '#60310d',     // Karın bölgesi
        mane: '#1e130c',          // Koyu çikolata / siyah yele
        tail: '#1c110a',          // Akıcı koyu kuyruk
        hoof: '#1e293b',          // Sert siyah toynak
        hoofLight: '#334155',     // Toynak parıltısı
        saddlePad: '#dc2626',     // Kırmızı nakışlı eyer altlığı (şabrack)
        saddleLeather: '#3f2212', // Kahverengi deri eyer
        saddleDark: '#29140a',    // Eyer gölgesi
        stirrupIron: '#cbd5e1',   // Metal üzengi demiri
        bridleLeather: '#1e1610', // Deri yular kayışları
        bridleBit: '#94a3b8',     // Metal gem halkası
        eye: '#0f172a',           // Canlı siyah göz
        eyeGlint: '#ffffff',      // Göz ışıltısı
        muzzle: '#45220c',        // Burun ve çene tonu
        nostril: '#1f0d04'        // Burun deliği
    };

    const DIRECTIONS = [
        'down',
        'down-left',
        'down-right',
        'left',
        'right',
        'up-left',
        'up-right',
        'up'
    ];

    class HorseMountRenderer {
        static normalizeDirection(dir) {
            if (!dir) return 'down';
            let d = String(dir).toLowerCase().replace('_', '-').trim();
            if (DIRECTIONS.includes(d)) return d;
            if (d === 's' || d === 'south') return 'down';
            if (d === 'n' || d === 'north') return 'up';
            if (d === 'e' || d === 'east') return 'right';
            if (d === 'w' || d === 'west') return 'left';
            if (d === 'se' || d === 'southeast') return 'down-right';
            if (d === 'sw' || d === 'southwest') return 'down-left';
            if (d === 'ne' || d === 'northeast') return 'up-right';
            if (d === 'nw' || d === 'northwest') return 'up-left';
            return 'down';
        }

        /**
         * Zemin Kontakt Gölgesi ve Koşu Tozu
         */
        static drawGroundShadow(ctx, isMoving, walkCycle) {
            ctx.save();
            let shadowScale = isMoving ? 1.0 + Math.sin(walkCycle * 2) * 0.12 : 1.0;
            ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
            ctx.beginPath();
            ctx.ellipse(0, 22, 25 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();

            // Koşarken arkadan savrulan hafif toz zerrecikleri
            if (isMoving) {
                ctx.fillStyle = "rgba(217, 119, 6, 0.35)";
                for (let i = 0; i < 3; i++) {
                    let puffPhase = (walkCycle * 1.5 + i * 2.1) % (Math.PI * 2);
                    let puffX = -18 - i * 6 + Math.cos(puffPhase) * 4;
                    let puffY = 20 + Math.sin(puffPhase) * 3;
                    let r = Math.max(1, 3.5 - i);
                    ctx.beginPath();
                    ctx.arc(puffX, puffY, r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        /**
         * KATMAN 1: ATIN ARKA BÖLÜMÜ (Oyuncunun arkasında kalan kısım)
         * Gövde, bacaklar, kuyruk, eyer tabanı ve şabrack.
         */
        static drawHorseBase(ctx, dir, isMoving, walkCycle) {
            ctx.save();
            let flip = (dir === 'right' || dir === 'down-right' || dir === 'up-right');
            if (flip) ctx.scale(-1, 1);

            let p = HORSE_PALETTE;
            let gallopBob = isMoving ? Math.sin(walkCycle * 2) * 2.8 : Math.sin(Date.now() / 400) * 0.8;

            ctx.translate(0, gallopBob);

            // Bacak Salınımları (4 bacaklı doğal dörtnal / tırıs salınımı)
            let fL = isMoving ? Math.sin(walkCycle * 1.8) * 9 : 0;
            let fR = isMoving ? -Math.sin(walkCycle * 1.8) * 9 : 0;
            let bL = isMoving ? Math.cos(walkCycle * 1.8) * 8 : 0;
            let bR = isMoving ? -Math.cos(walkCycle * 1.8) * 8 : 0;

            if (dir === 'down') {
                // TAM GÜNEY (Önden görünüm)
                // Arka Bacaklar (İçte hafif gölgede)
                this.drawLeg(ctx, -10, 6, -6, 21, p.coatDark, p.hoof, false);
                this.drawLeg(ctx, 10, 6, 6, 21, p.coatDark, p.hoof, false);

                // Gövde Arkası / Göğüs
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.ellipse(0, 4, 18, 14, 0, 0, Math.PI * 2);
                ctx.fill();

                // Eyer ve Kırmızı Şabrack
                ctx.fillStyle = p.saddlePad;
                ctx.beginPath();
                ctx.roundRect(-15, -4, 30, 8, 3);
                ctx.fill();

                ctx.fillStyle = p.saddleLeather;
                ctx.beginPath();
                ctx.roundRect(-12, -6, 24, 7, 3);
                ctx.fill();

                // Ön Bacaklar
                this.drawLeg(ctx, -9, 8, -9 + fL * 0.4, 23, p.coatMain, p.hoof, true);
                this.drawLeg(ctx, 9, 8, 9 + fR * 0.4, 23, p.coatMain, p.hoof, true);

            } else if (dir === 'up') {
                // TAM KUZEY (Arkadan görünüm)
                // Ön Bacaklar (İleride)
                this.drawLeg(ctx, -8, 6, -8, 22, p.coatDark, p.hoof, false);
                this.drawLeg(ctx, 8, 6, 8, 22, p.coatDark, p.hoof, false);

                // Dolgun Sağrı / Kalça
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.ellipse(0, 4, 19, 15, 0, 0, Math.PI * 2);
                ctx.fill();

                // Dalgalanan Kuyruk (Arka tam merkezde)
                let tailWag = isMoving ? Math.sin(walkCycle * 2.2) * 6 : Math.sin(Date.now() / 320) * 2.5;
                ctx.fillStyle = p.tail;
                ctx.beginPath();
                ctx.moveTo(-4, 4);
                ctx.quadraticCurveTo(-7 + tailWag, 18, -2 + tailWag, 28);
                ctx.quadraticCurveTo(6 + tailWag, 20, 4, 4);
                ctx.closePath();
                ctx.fill();

                // Eyer Arkası
                ctx.fillStyle = p.saddlePad;
                ctx.beginPath();
                ctx.roundRect(-14, -5, 28, 8, 3);
                ctx.fill();

                ctx.fillStyle = p.saddleLeather;
                ctx.beginPath();
                ctx.roundRect(-11, -7, 22, 7, 3);
                ctx.fill();

                // Arka Bacaklar
                this.drawLeg(ctx, -12, 8, -12 + bL * 0.5, 24, p.coatMain, p.hoof, true);
                this.drawLeg(ctx, 12, 8, 12 + bR * 0.5, 24, p.coatMain, p.hoof, true);

                // Kafa & Kulaklar arkadan görünür
                this.drawHorseHeadAndNeck(ctx, dir, isMoving, walkCycle);

            } else if (dir === 'up-left' || dir === 'up-right') {
                // 3/4 ARKA İZOMETRİK
                // Uzak bacaklar
                this.drawLeg(ctx, -14, 5, -16 + bR, 22, p.coatDark, p.hoof, false);
                this.drawLeg(ctx, 6, 6, 8 + fR, 22, p.coatDark, p.hoof, false);

                // Gövde
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.ellipse(-2, 4, 21, 13, -0.15, 0, Math.PI * 2);
                ctx.fill();

                // Kuyruk
                let tailWag = isMoving ? Math.sin(walkCycle * 2.2) * 5 : Math.sin(Date.now() / 350) * 2;
                ctx.fillStyle = p.tail;
                ctx.beginPath();
                ctx.moveTo(-18, 2);
                ctx.quadraticCurveTo(-27 + tailWag, 14, -22 + tailWag, 26);
                ctx.quadraticCurveTo(-15 + tailWag, 18, -14, 6);
                ctx.closePath();
                ctx.fill();

                // Eyer
                ctx.fillStyle = p.saddlePad;
                ctx.beginPath();
                ctx.roundRect(-8, -4, 18, 9, 3);
                ctx.fill();

                ctx.fillStyle = p.saddleLeather;
                ctx.beginPath();
                ctx.roundRect(-6, -6, 15, 7, 3);
                ctx.fill();

                // Yakın bacaklar
                this.drawLeg(ctx, -10, 8, -11 + bL, 24, p.coatMain, p.hoof, true);
                this.drawLeg(ctx, 10, 8, 11 + fL, 24, p.coatMain, p.hoof, true);

                // Kafa & Boyun arkada çizilir
                this.drawHorseHeadAndNeck(ctx, dir, isMoving, walkCycle);

            } else {
                // 3/4 ÖN İZOMETRİK & YAN PROFİL (down-left, down-right, left, right)
                // Uzak Arka & Ön Bacak (Gölgede)
                this.drawLeg(ctx, -14, 5, -16 + bR, 22, p.coatDark, p.hoof, false);
                this.drawLeg(ctx, 8, 6, 10 + fR, 22, p.coatDark, p.hoof, false);

                // Gövde (Kaslı, organik at anatomisi)
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.ellipse(-2, 4, 22, 13, 0.08, 0, Math.PI * 2);
                ctx.fill();

                // Sırt Işıltısı
                ctx.fillStyle = p.coatLight;
                ctx.beginPath();
                ctx.ellipse(-2, 0, 18, 6, 0.08, 0, Math.PI);
                ctx.fill();

                // Dalgalı Asil Kuyruk
                let tailWag = isMoving ? Math.sin(walkCycle * 2) * 6 : Math.sin(Date.now() / 320) * 2;
                ctx.fillStyle = p.tail;
                ctx.beginPath();
                ctx.moveTo(-20, 1);
                ctx.quadraticCurveTo(-30 + tailWag, 10, -25 + tailWag, 24);
                ctx.quadraticCurveTo(-16 + tailWag, 16, -16, 5);
                ctx.closePath();
                ctx.fill();

                // Kırmızı Şabrack (Eyer Altı Çulu)
                ctx.fillStyle = p.saddlePad;
                ctx.beginPath();
                ctx.roundRect(-9, -4, 18, 10, 3);
                ctx.fill();
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 0.8;
                ctx.stroke();

                // Deri Eyer
                ctx.fillStyle = p.saddleLeather;
                ctx.beginPath();
                ctx.roundRect(-7, -6, 15, 8, 3);
                ctx.fill();

                // Yakın Arka & Ön Bacak (Aydınlıkta)
                this.drawLeg(ctx, -9, 8, -10 + bL, 24, p.coatMain, p.hoof, true);
                this.drawLeg(ctx, 13, 8, 14 + fL, 24, p.coatMain, p.hoof, true);
            }

            ctx.restore();
        }

        /**
         * KATMAN 2: ATIN ÖN BÖLÜMÜ (Oyuncunun önünde duran kısım)
         * Baş, boyun, kulaklar, yele, dizgin kayışları ve üzengi askısı.
         */
        static drawHorseFront(ctx, dir, isMoving, walkCycle) {
            ctx.save();
            let flip = (dir === 'right' || dir === 'down-right' || dir === 'up-right');
            if (flip) ctx.scale(-1, 1);

            let gallopBob = isMoving ? Math.sin(walkCycle * 2) * 2.8 : Math.sin(Date.now() / 400) * 0.8;
            ctx.translate(0, gallopBob);

            let p = HORSE_PALETTE;

            // Üzengi Kayışı ve Metal Üzengi Demiri (Karakterin bacağının üstünde sarkar)
            ctx.strokeStyle = p.bridleLeather;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-1, -2);
            ctx.lineTo(-2, 10);
            ctx.stroke();

            ctx.strokeStyle = p.stirrupIron;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(-2, 11, 2.5, 0, Math.PI);
            ctx.stroke();

            // Eğer öne veya yanlara bakıyorsa baş ve boyun karakterin önünde çizilir!
            if (dir !== 'up' && dir !== 'up-left' && dir !== 'up-right') {
                this.drawHorseHeadAndNeck(ctx, dir, isMoving, walkCycle);
            }

            ctx.restore();
        }

        /**
         * Güçlü Bacak ve Toynak Çizici
         */
        static drawLeg(ctx, topX, topY, botX, botY, coatCol, hoofCol, isFront) {
            ctx.save();
            let midX = (topX + botX) / 2 + (isFront ? 1.5 : -1.5);
            let midY = (topY + botY) / 2;

            // Bacak kası & eklemi
            ctx.strokeStyle = coatCol;
            ctx.lineWidth = 4.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(topX, topY);
            ctx.lineTo(midX, midY);
            ctx.lineTo(botX, botY - 3);
            ctx.stroke();

            // Siyah Toynak
            ctx.fillStyle = hoofCol;
            ctx.beginPath();
            ctx.roundRect(botX - 2.5, botY - 3, 5, 4, [1, 1, 0, 0]);
            ctx.fill();

            ctx.restore();
        }

        /**
         * Sevimli ve Asil At Başı, Boyun, Kulaklar, Yele ve Dizginler
         */
        static drawHorseHeadAndNeck(ctx, dir, isMoving, walkCycle) {
            let p = HORSE_PALETTE;
            let headBob = isMoving ? Math.sin(walkCycle * 2 + 0.5) * 1.8 : Math.sin(Date.now() / 400) * 0.5;

            ctx.save();
            ctx.translate(0, headBob);

            if (dir === 'down') {
                // TAM ÖNDEN GÖRÜNÜM
                // Boyun
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.moveTo(-6, 2);
                ctx.lineTo(-7, -12);
                ctx.lineTo(7, -12);
                ctx.lineTo(6, 2);
                ctx.closePath();
                ctx.fill();

                // Dalgalı Alın Yelesi
                ctx.fillStyle = p.mane;
                ctx.beginPath();
                ctx.ellipse(0, -14, 5, 7, 0, 0, Math.PI * 2);
                ctx.fill();

                // Sivri Sevimli Kulaklar
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.moveTo(-6, -18); ctx.lineTo(-4, -28); ctx.lineTo(-1, -19); ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(6, -18); ctx.lineTo(4, -28); ctx.lineTo(1, -19); ctx.closePath(); ctx.fill();

                // Kafa
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.ellipse(0, -17, 7.5, 9, 0, 0, Math.PI * 2);
                ctx.fill();

                // Burun / Muzzle
                ctx.fillStyle = p.muzzle;
                ctx.beginPath();
                ctx.ellipse(0, -11, 5.5, 4.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Burun Delikleri
                ctx.fillStyle = p.nostril;
                ctx.beginPath();
                ctx.arc(-2.2, -11, 1.1, 0, Math.PI * 2);
                ctx.arc(2.2, -11, 1.1, 0, Math.PI * 2);
                ctx.fill();

                // İri Sevimli Gözler (Pet tarzı ışıldayan)
                ctx.fillStyle = p.eye;
                ctx.beginPath();
                ctx.arc(-4.5, -18, 2.0, 0, Math.PI * 2);
                ctx.arc(4.5, -18, 2.0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = p.eyeGlint;
                ctx.beginPath();
                ctx.arc(-4.9, -18.5, 0.8, 0, Math.PI * 2);
                ctx.arc(4.1, -18.5, 0.8, 0, Math.PI * 2);
                ctx.fill();

                // Deri Yular Kayışları
                ctx.strokeStyle = p.bridleLeather;
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.ellipse(0, -13, 6, 2, 0, 0, Math.PI * 2);
                ctx.stroke();

                // Dizginler (Karakterin eline doğru uzanan)
                ctx.strokeStyle = p.bridleLeather;
                ctx.lineWidth = 1.1;
                ctx.beginPath();
                ctx.moveTo(-5, -12); ctx.lineTo(-8, 0);
                ctx.moveTo(5, -12); ctx.lineTo(8, 0);
                ctx.stroke();

            } else if (dir === 'up') {
                // TAM ARKADAN GÖRÜNÜM
                // Boyun arkası
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.moveTo(-5, -2); ctx.lineTo(-6, -14); ctx.lineTo(6, -14); ctx.lineTo(5, -2);
                ctx.closePath(); ctx.fill();

                // Koyu gür yele (arkadan boylu boyunca dökülen)
                ctx.fillStyle = p.mane;
                ctx.beginPath();
                ctx.moveTo(-2, -2); ctx.lineTo(-4, -18); ctx.lineTo(4, -18); ctx.lineTo(2, -2);
                ctx.closePath(); ctx.fill();

                // Kulaklar (arkadan)
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.moveTo(-6, -16); ctx.lineTo(-4, -26); ctx.lineTo(-2, -17); ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(6, -16); ctx.lineTo(4, -26); ctx.lineTo(2, -17); ctx.closePath(); ctx.fill();

            } else if (dir === 'up-left' || dir === 'up-right') {
                // 3/4 ARKA İZOMETRİK
                let neckX = 10, neckY = -6;

                // Boyun
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.moveTo(neckX - 4, neckY + 4);
                ctx.lineTo(neckX + 5, neckY - 14);
                ctx.lineTo(neckX + 11, neckY - 12);
                ctx.lineTo(neckX + 2, neckY + 4);
                ctx.closePath(); ctx.fill();

                // Yele
                ctx.fillStyle = p.mane;
                ctx.beginPath();
                ctx.moveTo(neckX - 3, neckY + 4);
                ctx.quadraticCurveTo(neckX + 2, neckY - 8, neckX + 6, neckY - 16);
                ctx.lineTo(neckX + 10, neckY - 14);
                ctx.closePath(); ctx.fill();

                // Kafa
                let headX = neckX + 9, headY = neckY - 15;
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.ellipse(headX, headY, 6.5, 6, 0.3, 0, Math.PI * 2);
                ctx.fill();

                // Kulaklar
                ctx.beginPath();
                ctx.moveTo(headX - 1, headY - 4); ctx.lineTo(headX + 2, headY - 14); ctx.lineTo(headX + 5, headY - 5);
                ctx.closePath(); ctx.fill();

            } else {
                // 3/4 ÖN İZOMETRİK & YAN PROFİL (down-left, down-right, left, right) - En İkonik Açı!
                let neckBaseX = 10, neckBaseY = 2;

                // 1. ZARİF BOYUN (Güçlü at anatomisi)
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.moveTo(neckBaseX - 3, neckBaseY);
                ctx.quadraticCurveTo(neckBaseX + 6, neckBaseY - 12, neckBaseX + 9, neckBaseY - 20);
                ctx.lineTo(neckBaseX + 17, neckBaseY - 16);
                ctx.quadraticCurveTo(neckBaseX + 12, neckBaseY - 6, neckBaseX + 6, neckBaseY + 2);
                ctx.closePath();
                ctx.fill();

                // Boyun Üstü Işıltısı
                ctx.fillStyle = p.coatLight;
                ctx.beginPath();
                ctx.moveTo(neckBaseX - 2, neckBaseY);
                ctx.quadraticCurveTo(neckBaseX + 5, neckBaseY - 11, neckBaseX + 8, neckBaseY - 19);
                ctx.lineTo(neckBaseX + 12, neckBaseY - 18);
                ctx.quadraticCurveTo(neckBaseX + 8, neckBaseY - 8, neckBaseX + 2, neckBaseY + 1);
                ctx.closePath();
                ctx.fill();

                // 2. AKICI SİYAH YELE (Mane - Rüzgarda salınan)
                let maneSway = isMoving ? Math.sin(walkCycle * 2) * 2.5 : Math.sin(Date.now() / 300) * 1;
                ctx.fillStyle = p.mane;
                ctx.beginPath();
                ctx.moveTo(neckBaseX - 3, neckBaseY - 2);
                ctx.quadraticCurveTo(neckBaseX + 2 - maneSway, neckBaseY - 10, neckBaseX + 6, neckBaseY - 22);
                ctx.lineTo(neckBaseX + 10, neckBaseY - 21);
                ctx.quadraticCurveTo(neckBaseX + 5, neckBaseY - 10, neckBaseX + 2, neckBaseY);
                ctx.closePath();
                ctx.fill();

                // 3. AT BAŞI (Karakteristik sevimli form)
                let headX = neckBaseX + 14, headY = neckBaseY - 19;

                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                // Kafa arkası / yanak
                ctx.ellipse(headX, headY, 7.5, 6.5, 0.35, 0, Math.PI * 2);
                ctx.fill();

                // 4. SİVRİ KULAKLAR
                ctx.fillStyle = p.coatMain;
                ctx.beginPath();
                ctx.moveTo(headX - 3, headY - 4);
                ctx.lineTo(headX - 2, headY - 14);
                ctx.lineTo(headX + 2, headY - 5);
                ctx.closePath();
                ctx.fill();

                // Ön Kulak (İç pembe gölge)
                ctx.fillStyle = '#9a3412';
                ctx.beginPath();
                ctx.moveTo(headX - 1.5, headY - 5);
                ctx.lineTo(headX - 1, headY - 12);
                ctx.lineTo(headX + 1.5, headY - 6);
                ctx.closePath();
                ctx.fill();

                // 5. BURUN VE AĞIZ (Muzzle)
                ctx.fillStyle = p.muzzle;
                ctx.beginPath();
                ctx.ellipse(headX + 8, headY + 5, 5, 4.2, 0.35, 0, Math.PI * 2);
                ctx.fill();

                // Burun Deliği
                ctx.fillStyle = p.nostril;
                ctx.beginPath();
                ctx.arc(headX + 10, headY + 5, 1.2, 0, Math.PI * 2);
                ctx.fill();

                // 6. İRİ SEVİMLİ DOSTANE GÖZ
                ctx.fillStyle = p.eye;
                ctx.beginPath();
                ctx.arc(headX + 1.5, headY - 1.5, 2.3, 0, Math.PI * 2);
                ctx.fill();

                // Göz Parıltısı (Canlı sevimli pet ışıltısı)
                ctx.fillStyle = p.eyeGlint;
                ctx.beginPath();
                ctx.arc(headX + 1.0, headY - 2.2, 0.9, 0, Math.PI * 2);
                ctx.arc(headX + 2.4, headY - 1.0, 0.45, 0, Math.PI * 2);
                ctx.fill();

                // 7. YULAR VE DİZGİN KAYIŞLARI (Bridle Leather)
                ctx.strokeStyle = p.bridleLeather;
                ctx.lineWidth = 1.4;

                // Baş kayışı
                ctx.beginPath();
                ctx.moveTo(headX - 1, headY - 5);
                ctx.lineTo(headX + 4, headY + 4);
                ctx.stroke();

                // Burun kayışı
                ctx.beginPath();
                ctx.moveTo(headX + 5, headY + 2);
                ctx.lineTo(headX + 10, headY + 6);
                ctx.stroke();

                // Metal Gem Halkası
                ctx.strokeStyle = p.bridleBit;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.arc(headX + 5, headY + 4, 1.8, 0, Math.PI * 2);
                ctx.stroke();

                // Dizgin (Gem halkasından karakterin eline uzanan kayış)
                ctx.strokeStyle = p.bridleLeather;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(headX + 5, headY + 4);
                ctx.quadraticCurveTo(headX - 4, headY + 12, 0, -2);
                ctx.stroke();
            }

            ctx.restore();
        }

        /**
         * Bağımsız Tek Çağrıda Çizim (Önizleme ve NPC için)
         */
        static draw(ctx, options = {}) {
            const {
                direction = 'down',
                isMoving = false,
                scale = 1.0,
                walkCycle = 0
            } = options;

            const dir = this.normalizeDirection(direction);

            ctx.save();
            ctx.scale(scale, scale);

            // Kontakt gölgesi
            this.drawGroundShadow(ctx, isMoving, walkCycle);

            // Katman 1: Gövde & Arka
            this.drawHorseBase(ctx, dir, isMoving, walkCycle);

            // Katman 2: Baş & Ön
            this.drawHorseFront(ctx, dir, isMoving, walkCycle);

            ctx.restore();
        }
    }

    global.HorseMountRenderer = HorseMountRenderer;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));

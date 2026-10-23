/**
 * swanBoatRenderer.js - Yeni Yüksek Çözünürlüklü 8 Yönlü Kuğu Deniz Bisikleti Motoru
 * 
 * Özellikler:
 * - 8 Yön: down, down-left, down-right, left, right, up-left, up-right, up
 * - Kusursuz 2.5D İzometrik Sanalika/Habbo Sanat Tarzı (Vektörel & Keskin, Sıfır Pikselleşme ve Sıfır Kırpılma Bug'ı)
 * - Doğal Çift Katmanlama (Dual-pass Layering):
 *     1. Arka Katman (Tekne tabanı, arka kanatlar, koltuklar) -> Karakter koltuğa oturur
 *     2. Ön Katman (Kuğu boynu, turuncu gaga, ön güverte ve tutacaklar) -> Karakterin önünde durur
 * - Canlı Su Efektleri: Dinamik köpüklü su dalgası (wake), motor/pedal çalkantısı ve nefis yüzüş salınımı (bobbing)
 */

(function (global) {
    'use strict';

    const SWAN_PALETTE = {
        hullBase: '#0284c7',       // Derin turkuaz deniz tabanı
        hullBaseDark: '#0369a1',   // Taban gölgesi
        hullBaseLight: '#38bdf8',  // Taban su çizgisi parıltısı
        bodyWhite: '#ffffff',      // Kar beyazı kuğu gövdesi
        bodyShadow: '#e2e8f0',     // Gövde gölge tonu
        bodyDarkShadow: '#cbd5e1', // Derin kıvrım gölgesi
        seatBack: '#64748b',       // Koltuk arkalığı
        seatCushion: '#94a3b8',    // Koltuk minderi
        cockpitFloor: '#475569',   // Kokpit iç tabanı
        beak: '#f97316',           // Turuncu gaga
        beakDark: '#c2410c',       // Gaga alt gölgesi
        mask: '#0f172a',           // Göz maskesi ve kafa detayı
        eyeGlint: '#ffffff',       // Göz ışıltısı
        chromeHandle: '#cbd5e1',   // Metal direksiyon / pedal tutacağı
        outline: '#334155'         // İnce estetik hat çizgisi
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

    class SwanBoatRenderer {
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
         * Su Dalgası ve Köpük Halkaları (Teknenin altında çizilir)
         */
        static drawWaterEffects(ctx, isMoving, now) {
            ctx.save();
            let wavePhase = Math.sin(now / 220);
            let rippleR = 26 + wavePhase * 2.5;

            // Sakin yüzen su aurası
            ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(0, 12, rippleR, 9, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Hareket halindeyken arkada köpüren pedal izleri
            if (isMoving) {
                let wakeTime = now / 120;
                ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
                for (let i = 0; i < 3; i++) {
                    let offY = 16 + i * 5;
                    let offX1 = -14 - i * 4 + Math.sin(wakeTime + i) * 2;
                    let offX2 = 14 + i * 4 - Math.sin(wakeTime + i) * 2;
                    let r = Math.max(1, 4 - i);

                    ctx.beginPath();
                    ctx.arc(offX1, offY, r, 0, Math.PI * 2);
                    ctx.arc(offX2, offY, r, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Dış dalga köpüğü
                ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.ellipse(0, 14, rippleR + 6, 12, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        /**
         * Kumsal / İskele Zemin Gölgesi (Karadayken çizilir)
         */
        static drawGroundShadow(ctx) {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
            ctx.beginPath();
            ctx.ellipse(0, 14, 28, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        /**
         * KATMAN 1: TEKNENİN ARKA BÖLÜMÜ (Oyuncunun arkasında kalan kısım)
         * Taban tekne gövdesi, yan kanatlar, kokpit içi ve koltuklar.
         */
        static drawBoatBase(ctx, dir, isMoving, now) {
            ctx.save();
            let flip = (dir === 'right' || dir === 'down-right' || dir === 'up-right');
            if (flip) ctx.scale(-1, 1);

            let p = SWAN_PALETTE;

            // 1. Mavi Taban Gövde (Waterline Base)
            ctx.fillStyle = p.hullBase;
            ctx.strokeStyle = p.outline;
            ctx.lineWidth = 1.4;

            if (dir === 'down' || dir === 'up') {
                ctx.beginPath();
                ctx.ellipse(0, 8, 25, 15, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Alt gölge bandı
                ctx.fillStyle = p.hullBaseDark;
                ctx.beginPath();
                ctx.ellipse(0, 11, 23, 10, 0, 0, Math.PI);
                ctx.fill();
            } else if (dir === 'left' || dir === 'right') {
                ctx.beginPath();
                ctx.ellipse(0, 8, 28, 13, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = p.hullBaseDark;
                ctx.beginPath();
                ctx.ellipse(0, 11, 26, 8, 0, 0, Math.PI);
                ctx.fill();
            } else {
                // 3/4 Açılar (down-left, up-left vb.)
                ctx.beginPath();
                ctx.ellipse(0, 8, 27, 14, -0.12, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = p.hullBaseDark;
                ctx.beginPath();
                ctx.ellipse(0, 11, 24, 9, -0.12, 0, Math.PI);
                ctx.fill();
            }

            // 2. Beyaz Kuğu Gövde Kabuğu (White Swan Fiberglass Shell)
            ctx.fillStyle = p.bodyWhite;
            ctx.beginPath();
            ctx.ellipse(0, 3, 24, 13, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = p.bodyDarkShadow;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // 3. Kokpit İç Oyuğu (Seat Well)
            ctx.fillStyle = p.cockpitFloor;
            ctx.beginPath();
            ctx.ellipse(0, 2, 17, 9, 0, 0, Math.PI * 2);
            ctx.fill();

            // 4. Çift Kişilik Koltuklar (Twin Bucket Seats)
            // Sol Koltuk (Sürücü) ve Sağ Koltuk
            ctx.fillStyle = p.seatBack;
            ctx.beginPath();
            ctx.roundRect(-14, -4, 12, 7, 2);
            ctx.roundRect(2, -4, 12, 7, 2);
            ctx.fill();

            ctx.fillStyle = p.seatCushion;
            ctx.beginPath();
            ctx.roundRect(-13, 0, 10, 5, 2);
            ctx.roundRect(3, 0, 10, 5, 2);
            ctx.fill();

            // 5. Yan Kanat Kabartmaları (Wing Armrests)
            ctx.fillStyle = p.bodyWhite;
            // Sol Kanat
            ctx.beginPath();
            ctx.moveTo(-24, 4);
            ctx.quadraticCurveTo(-26, -6, -18, -4);
            ctx.quadraticCurveTo(-20, 2, -22, 6);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = p.bodyDarkShadow;
            ctx.stroke();

            // Sağ Kanat
            ctx.beginPath();
            ctx.moveTo(24, 4);
            ctx.quadraticCurveTo(26, -6, 18, -4);
            ctx.quadraticCurveTo(20, 2, 22, 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 6. Eğer arkaya (up / up-left / up-right) bakıyorsa kuğu boynu bu katmanda (arkada) çizilir!
            if (dir === 'up' || dir === 'up-left' || dir === 'up-right') {
                this.drawSwanNeckAndHead(ctx, dir, now);
            }

            ctx.restore();
        }

        /**
         * KATMAN 2: TEKNENİN ÖN BÖLÜMÜ (Oyuncunun önünde duran kısım)
         * Kuğu boynu, başı, turuncu gaga, direksiyon ve ön pruva.
         */
        static drawBoatFront(ctx, dir, isMoving, now) {
            ctx.save();
            let flip = (dir === 'right' || dir === 'down-right' || dir === 'up-right');
            if (flip) ctx.scale(-1, 1);

            let p = SWAN_PALETTE;

            // Ön Kokpit Kenarı & Pruva Güvertesi (Karakterin bacaklarını tekne içinde oturur gösterir)
            if (dir !== 'up' && dir !== 'up-left' && dir !== 'up-right') {
                ctx.fillStyle = p.bodyWhite;
                ctx.beginPath();
                // Dış gövde ön kavisi
                ctx.ellipse(0, 3, 24, 13, 0, 0, Math.PI);
                // Kokpit ön iç kavisi
                ctx.ellipse(0, 2, 17, 9, 0, Math.PI, 0, true);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = p.bodyDarkShadow;
                ctx.lineWidth = 1.1;
                ctx.stroke();

                // Ön güverte açık renk parıltısı
                ctx.strokeStyle = p.hullBaseLight;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.ellipse(0, 5, 20, 8, 0, 0.25, Math.PI - 0.25);
                ctx.stroke();
            }

            // Ön direksiyon mili / tutacak
            ctx.fillStyle = p.chromeHandle;
            ctx.fillRect(-2, 1, 4, 6);
            ctx.beginPath();
            ctx.roundRect(-7, 0, 14, 2.5, 1);
            ctx.fill();

            // Eğer öne veya yanlara bakıyorsa kuğu boynu ve başı oyuncunun önünde durur!
            if (dir !== 'up' && dir !== 'up-left' && dir !== 'up-right') {
                this.drawSwanNeckAndHead(ctx, dir, now);
            }

            ctx.restore();
        }

        /**
         * Zarif Kuğu Boynu, Başı, Turuncu Gagası ve Göz Detayları
         */
        static drawSwanNeckAndHead(ctx, dir, now) {
            let p = SWAN_PALETTE;
            let headBob = Math.sin(now / 350) * 1.2;

            ctx.save();
            ctx.translate(0, headBob);

            if (dir === 'down') {
                // TAM ÖNE (GÜNEY) BAKIŞ
                // Kuğu Boynu (Gövdenin önünden yukarı zarif kavis)
                ctx.fillStyle = p.bodyWhite;
                ctx.strokeStyle = p.bodyDarkShadow;
                ctx.lineWidth = 1.2;

                ctx.beginPath();
                ctx.moveTo(-5, 6);
                ctx.quadraticCurveTo(-7, -8, -4, -18);
                ctx.lineTo(4, -18);
                ctx.quadraticCurveTo(7, -8, 5, 6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Kuğu Başı
                ctx.beginPath();
                ctx.arc(0, -19, 6.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Siyah Göz Maskesi & Alın Yumrusu
                ctx.fillStyle = p.mask;
                ctx.beginPath();
                ctx.ellipse(0, -18, 4.5, 3.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Turuncu Gaga (Öne doğru uzanan)
                ctx.fillStyle = p.beak;
                ctx.beginPath();
                ctx.moveTo(-3.5, -16);
                ctx.lineTo(0, -9);
                ctx.lineTo(3.5, -16);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = p.beakDark;
                ctx.lineWidth = 0.8;
                ctx.stroke();

                // Gözler (İki yanda)
                ctx.fillStyle = p.eyeGlint;
                ctx.beginPath();
                ctx.arc(-3, -19, 1.2, 0, Math.PI * 2);
                ctx.arc(3, -19, 1.2, 0, Math.PI * 2);
                ctx.fill();
            } else if (dir === 'down-left' || dir === 'down-right') {
                // 3/4 ÖNE İZOMETRİK BAKIŞ (En ikonik açı)
                let neckBaseX = -8, neckBaseY = 5;

                // Boyun Gövdesi
                ctx.fillStyle = p.bodyWhite;
                ctx.strokeStyle = p.bodyDarkShadow;
                ctx.lineWidth = 1.2;

                ctx.beginPath();
                ctx.moveTo(neckBaseX + 4, neckBaseY);
                ctx.bezierCurveTo(neckBaseX - 4, -4, neckBaseX - 8, -16, neckBaseX - 10, -22);
                ctx.lineTo(neckBaseX - 3, -24);
                ctx.bezierCurveTo(neckBaseX - 1, -16, neckBaseX + 4, -4, neckBaseX + 8, neckBaseY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Kafa
                let headX = neckBaseX - 7, headY = -22;
                ctx.beginPath();
                ctx.arc(headX, headY, 6.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Siyah Maske
                ctx.fillStyle = p.mask;
                ctx.beginPath();
                ctx.moveTo(headX, headY - 3);
                ctx.lineTo(headX - 5, headY + 1);
                ctx.lineTo(headX - 2, headY + 4);
                ctx.closePath();
                ctx.fill();

                // Turuncu Gaga
                ctx.fillStyle = p.beak;
                ctx.beginPath();
                ctx.moveTo(headX - 4, headY);
                ctx.lineTo(headX - 12, headY + 4);
                ctx.lineTo(headX - 3, headY + 4);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = p.beakDark;
                ctx.lineWidth = 0.8;
                ctx.stroke();

                // Göz
                ctx.fillStyle = p.mask;
                ctx.beginPath();
                ctx.arc(headX - 1, headY - 1, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = p.eyeGlint;
                ctx.beginPath();
                ctx.arc(headX - 1.2, headY - 1.2, 0.7, 0, Math.PI * 2);
                ctx.fill();
            } else if (dir === 'left' || dir === 'right') {
                // TAM YAN PROFİL BAKIŞ
                let neckBaseX = -12, neckBaseY = 6;

                ctx.fillStyle = p.bodyWhite;
                ctx.strokeStyle = p.bodyDarkShadow;
                ctx.lineWidth = 1.2;

                ctx.beginPath();
                ctx.moveTo(neckBaseX + 4, neckBaseY);
                ctx.bezierCurveTo(neckBaseX - 2, -6, neckBaseX - 10, -15, neckBaseX - 8, -23);
                ctx.lineTo(neckBaseX - 2, -23);
                ctx.bezierCurveTo(neckBaseX - 4, -14, neckBaseX + 4, -4, neckBaseX + 8, neckBaseY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Kafa
                let headX = neckBaseX - 6, headY = -23;
                ctx.beginPath();
                ctx.arc(headX, headY, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Siyah Maske
                ctx.fillStyle = p.mask;
                ctx.beginPath();
                ctx.moveTo(headX + 1, headY - 2);
                ctx.lineTo(headX - 5, headY);
                ctx.lineTo(headX - 2, headY + 3);
                ctx.closePath();
                ctx.fill();

                // Turuncu Gaga
                ctx.fillStyle = p.beak;
                ctx.beginPath();
                ctx.moveTo(headX - 4, headY - 1);
                ctx.lineTo(headX - 13, headY + 3);
                ctx.lineTo(headX - 3, headY + 4);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = p.beakDark;
                ctx.lineWidth = 0.8;
                ctx.stroke();

                // Göz
                ctx.fillStyle = p.mask;
                ctx.beginPath();
                ctx.arc(headX, headY - 1, 1.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = p.eyeGlint;
                ctx.beginPath();
                ctx.arc(headX - 0.3, headY - 1.3, 0.6, 0, Math.PI * 2);
                ctx.fill();
            } else if (dir === 'up') {
                // TAM ARKA (KUZEY) BAKIŞ
                ctx.fillStyle = p.bodyWhite;
                ctx.strokeStyle = p.bodyDarkShadow;
                ctx.lineWidth = 1.2;

                ctx.beginPath();
                ctx.moveTo(-4, -6);
                ctx.quadraticCurveTo(-6, -14, -3, -22);
                ctx.lineTo(3, -22);
                ctx.quadraticCurveTo(6, -14, 4, -6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Kafa arkası
                ctx.beginPath();
                ctx.arc(0, -22, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                // 3/4 ARKA İZOMETRİK (up-left / up-right)
                let neckBaseX = -8, neckBaseY = -6;

                ctx.fillStyle = p.bodyWhite;
                ctx.strokeStyle = p.bodyDarkShadow;
                ctx.lineWidth = 1.2;

                ctx.beginPath();
                ctx.moveTo(neckBaseX + 5, neckBaseY + 2);
                ctx.bezierCurveTo(neckBaseX, -12, neckBaseX - 5, -18, neckBaseX - 6, -24);
                ctx.lineTo(neckBaseX, -25);
                ctx.bezierCurveTo(neckBaseX + 2, -18, neckBaseX + 6, -10, neckBaseX + 9, neckBaseY + 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Kafa
                let headX = neckBaseX - 3, headY = -24;
                ctx.beginPath();
                ctx.arc(headX, headY, 5.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Arkadan hafifçe taşan turuncu gaga ucu
                ctx.fillStyle = p.beak;
                ctx.beginPath();
                ctx.moveTo(headX - 4, headY);
                ctx.lineTo(headX - 9, headY + 2);
                ctx.lineTo(headX - 4, headY + 3);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }

        /**
         * Standart Tek Çağrıda Çizim (Önizleme ve NPC çizimleri için)
         */
        static draw(ctx, options = {}) {
            const {
                direction = 'down',
                isMoving = false,
                inWater = true,
                scale = 1.0,
                now = Date.now()
            } = options;

            const dir = this.normalizeDirection(direction);

            ctx.save();
            ctx.scale(scale, scale);

            // Su veya kara zemin efekti
            if (inWater) {
                this.drawWaterEffects(ctx, isMoving, now);
            } else {
                this.drawGroundShadow(ctx);
            }

            // Hafif yüzme / salınım efekti
            let floatY = inWater ? Math.sin(now / 320) * 2.2 : 0;
            ctx.translate(0, floatY);

            // Katman 1: Tekne arka & koltuklar
            this.drawBoatBase(ctx, dir, isMoving, now);

            // Katman 2: Tekne ön & kuğu boynu
            this.drawBoatFront(ctx, dir, isMoving, now);

            ctx.restore();
        }
    }

    global.SwanBoatRenderer = SwanBoatRenderer;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));

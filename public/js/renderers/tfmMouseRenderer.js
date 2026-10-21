/**
 * tfmMouseRenderer.js
 * Transformice (TFM) Tarzı 8 Yönlü Dört Ayaklı Fare (Mouse) Renderer & Sprite Jeneratörü
 * 
 * Özellikler:
 * - Orijinal Transformice sanat tarzı: Çikolata kahvesi kürk, dev kulaklar, sevimli parlak göz, pembe kuyruk & patiler
 * - 4 Ayaklı hareket (Quadrupedal stance & trot)
 * - 8 Yön: down, down-right, right, up-right, up, up-left, left, down-left
 * - 2 Animasyon: Idle (Bekleme - nefes alma, kulak & kuyruk kıpırdama) ve Walk (Yürüme - 4 ayaklı tırıs adım & kuyruk salınımı)
 * - Yüksek çözünürlüklü Canvas vektör çizimi ve dinamik sprite atlas önbelleği
 */

(function (global) {
    'use strict';

    // Stil ve Renk Paleti (Transformice Referansı)
    const TFM_PALETTE = {
        outline: '#261409',
        furDark: '#4a2a14',
        furBase: '#693f21',
        furHighlight: '#83522f',
        furBelly: '#9a6b46',
        innerEar: '#f3c7a5',
        innerEarShadow: '#cb9b78',
        earFold: '#7c4d2d',
        nose: '#e69d87',
        eye: '#0f0a06',
        eyeGlint: '#ffffff',
        eyeSubGlint: 'rgba(255, 255, 255, 0.45)',
        paw: '#dfaf94',
        pawShadow: '#996b52',
        tail: '#deb398',
        tailHighlight: '#edd0bc',
        shadow: 'rgba(0, 0, 0, 0.28)'
    };

    const COMPANION_PALETTES = {
        cat: {
            outline: '#30201a',
            furDark: '#704832',
            furBase: '#c88a58',
            furHighlight: '#e8b47d',
            furBelly: '#f5dfc1',
            innerEar: '#e99791',
            nose: '#d77d7d',
            eye: '#263d35',
            eyeGlint: '#ffffff',
            paw: '#c88a58',
            pawShadow: '#8f6143',
            collar: '#7c3aed',
            tag: '#facc15'
        },
        dog: {
            outline: '#38251b',
            furDark: '#754522',
            furBase: '#bd7940',
            furHighlight: '#e6ae69',
            furBelly: '#f4d7a6',
            innerEar: '#995b4c',
            nose: '#28201c',
            eye: '#211912',
            eyeGlint: '#ffffff',
            paw: '#bd7940',
            pawShadow: '#80532f',
            collar: '#0f766e',
            tag: '#facc15'
        }
    };

    // 8 Yön Listesi (Game standardıyla birebir uyumlu)
    const DIRECTIONS = [
        'down',        // 0: Güney / Öne
        'down-right',  // 1: Güneydoğu / Sağ İleri
        'right',       // 2: Doğu / Sağa
        'up-right',    // 3: Kuzeydoğu / Sağ Geri
        'up',          // 4: Kuzey / Arkaya
        'up-left',     // 5: Kuzeybatı / Sol Geri
        'left',        // 6: Batı / Sola
        'down-left'    // 7: Güneybatı / Sol İleri
    ];

    /**
     * TfmMouseRenderer Sınıfı
     */
    class TfmMouseRenderer {
        constructor() {
            this.palette = TFM_PALETTE;
            this.directions = DIRECTIONS;
            this.frameWidth = 64;
            this.frameHeight = 64;
            this.cacheCanvas = null;
            this.isCacheReady = false;
            this.framesPerAnim = {
                idle: 4,
                walk: 4
            };
        }

        /**
         * Verilen açıya göre 8 yönden birini döndürür
         */
        normalizeDirection(dir) {
            if (!dir) return 'down';
            let d = String(dir).toLowerCase().replace('_', '-').trim();
            if (DIRECTIONS.includes(d)) return d;
            if (d === 's' || d === 'south' || d === 'front') return 'down';
            if (d === 'n' || d === 'north' || d === 'back') return 'up';
            if (d === 'e' || d === 'east') return 'right';
            if (d === 'w' || d === 'west') return 'left';
            if (d === 'se' || d === 'southeast') return 'down-right';
            if (d === 'sw' || d === 'southwest') return 'down-left';
            if (d === 'ne' || d === 'northeast') return 'up-right';
            if (d === 'nw' || d === 'northwest') return 'up-left';
            return 'down';
        }

        /**
         * Farenin zemin gölgesini çizer
         */
        drawShadow(ctx, scale = 1) {
            ctx.save();
            ctx.fillStyle = this.palette.shadow;
            ctx.beginPath();
            ctx.ellipse(0, 10 * scale, 13 * scale, 5 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        /**
         * Dört ayaklı Transformice Faresini belirli bir yön, animasyon ve frame ile çizer.
         * Koordinat (0, 0) farenin ayak tabanlarının merkezidir.
         */
        draw(ctx, options = {}) {
            const {
                direction = 'right',
                animation = 'idle', // 'idle' veya 'walk'
                frame = 0,
                scale = 1,
                showShadow = true,
                species = 'mouse'
            } = options;

            const dir = this.normalizeDirection(direction);
            const anim = animation === 'walk' ? 'walk' : 'idle';
            const frameIdx = Math.floor(frame) % (this.framesPerAnim[anim] || 4);

            if (species === 'cat' || species === 'dog') {
                this.drawCompanion(ctx, species, dir, anim, frameIdx, scale, showShadow);
                return;
            }

            ctx.save();
            if (showShadow) {
                this.drawShadow(ctx, scale);
            }

            ctx.scale(scale, scale);

            // Simetri kontrolü: Sol yönler (left, up-left, down-left) sağ yönlerin aynalanmasıyla çizilir.
            const isFlipped = (dir === 'left' || dir === 'up-left' || dir === 'down-left');
            if (isFlipped) {
                ctx.scale(-1, 1);
            }

            // Temel çizim yönü
            let baseDir = dir;
            if (dir === 'left') baseDir = 'right';
            else if (dir === 'up-left') baseDir = 'up-right';
            else if (dir === 'down-left') baseDir = 'down-right';

            this.renderBaseDirection(ctx, baseDir, anim, frameIdx);

            ctx.restore();
        }

        drawCompanion(ctx, species, direction, animation, frame, scale, showShadow) {
            const P = COMPANION_PALETTES[species];
            const isFlipped = direction === 'left' || direction === 'up-left' || direction === 'down-left';
            const dir = isFlipped
                ? ({ left: 'right', 'up-left': 'up-right', 'down-left': 'down-right' }[direction])
                : direction;
            const phase = animation === 'walk' ? (frame % 4) : frame;
            const bob = animation === 'walk'
                ? (phase % 2 === 1 ? -1.2 : 0)
                : Math.sin((phase / 4) * Math.PI * 2) * 0.55;
            const tailWag = animation === 'walk'
                ? Math.sin((phase / 4) * Math.PI * 2) * 4
                : Math.sin((phase / 4) * Math.PI * 2) * 2.5;
            const step = animation === 'walk' ? Math.sin((phase / 4) * Math.PI * 2) * 2.2 : 0;

            ctx.save();
            if (showShadow) this.drawShadow(ctx, scale);
            ctx.scale(scale, scale);
            if (isFlipped) ctx.scale(-1, 1);
            ctx.translate(0, bob);
            this.drawCompanionView(ctx, P, species, dir, step, tailWag, phase);
            ctx.restore();
        }

        drawCompanionView(ctx, P, species, direction, step, tailWag, phase) {
            const isCat = species === 'cat';
            const isFront = direction === 'down';
            const isBack = direction === 'up' || direction === 'up-right';
            const isQuarter = direction === 'down-right' || direction === 'up-right';
            const headX = isFront || isBack ? 0 : (isQuarter ? 3 : 4);
            const headY = isFront ? -8 : (isBack ? -6 : -8);
            const bodyX = isFront || isBack ? 0 : -5;
            const bodyY = isFront || isBack ? 3 : 2;
            const bodyW = isFront ? 10 : (isCat ? 13 : 14);
            const bodyH = isFront ? 7 : (isCat ? 6.8 : 7.5);
            const tailStartX = isFront ? 0 : -12;
            const tailStartY = isFront ? 5 : 2;

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            this.drawCompanionTail(ctx, P, species, tailStartX, tailStartY, tailWag, isFront, isBack);
            this.drawCompanionLegs(ctx, P, species, isFront, isBack, step);

            ctx.lineWidth = 1.7;
            ctx.strokeStyle = P.outline;
            ctx.fillStyle = P.furBase;
            ctx.beginPath();
            ctx.ellipse(bodyX, bodyY, bodyW, bodyH, isQuarter ? -0.12 : 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = P.furHighlight;
            ctx.beginPath();
            ctx.ellipse(bodyX + (isFront ? -1 : 1), bodyY - 3.2, bodyW * 0.67, 2.1, -0.08, Math.PI, Math.PI * 2);
            ctx.fill();

            if (isCat) {
                this.drawCatMarkings(ctx, P, bodyX, bodyY, isFront, isBack);
            } else {
                this.drawDogMarkings(ctx, P, bodyX, bodyY, isFront, isBack);
            }

            this.drawCompanionCollar(ctx, P, species, direction);
            if (isBack) {
                this.drawCompanionBackHead(ctx, P, species, headX, headY, phase);
            } else {
                this.drawCompanionHead(ctx, P, species, headX, headY, direction, phase);
            }
            ctx.restore();
        }

        drawCompanionTail(ctx, P, species, x, y, wag, isFront, isBack) {
            const isCat = species === 'cat';
            ctx.save();
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = isCat ? 4.0 : 4.8;
            ctx.beginPath();
            ctx.moveTo(x, y);
            if (isCat) {
                const side = isFront ? 1 : -1;
                ctx.bezierCurveTo(x + side * (10 + wag), y - 5, x + side * (9 + wag), y - 21, x + side * (15 + wag), y - 25);
                ctx.stroke();
                ctx.strokeStyle = P.furBase;
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.bezierCurveTo(x + side * (10 + wag), y - 5, x + side * (9 + wag), y - 21, x + side * (15 + wag), y - 25);
                ctx.stroke();
                ctx.fillStyle = P.furDark;
                ctx.beginPath();
                ctx.arc(x + side * (15 + wag), y - 25, 2.1, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.bezierCurveTo(x - 9, y - 4 + wag, x - 18, y - 12 + wag, x - 17, y - 20 + wag);
                ctx.stroke();
                ctx.strokeStyle = P.furBase;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.bezierCurveTo(x - 9, y - 4 + wag, x - 18, y - 12 + wag, x - 17, y - 20 + wag);
                ctx.stroke();
                ctx.fillStyle = P.furHighlight;
                ctx.beginPath();
                ctx.arc(x - 17, y - 20 + wag, 2.3, 0, Math.PI * 2);
                ctx.fill();
            }
            if (isBack) {
                ctx.strokeStyle = P.outline;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(-3, 7);
                ctx.quadraticCurveTo(0, 10, 3, 7);
                ctx.stroke();
            }
            ctx.restore();
        }

        drawCompanionLegs(ctx, P, species, isFront, isBack, step) {
            const isCat = species === 'cat';
            const legColor = P.furDark;
            const legs = isFront
                ? [[-8, 6, -step], [8, 6, step], [-4, 7, step], [4, 7, -step]]
                : [[-12, 6, -step], [-5, 7, step], [4, 7, -step], [11, 6, step]];

            legs.forEach(([x, y, offset], index) => {
                const legX = isFront ? x : x + offset * 0.45;
                const legY = y + offset * 0.35;
                ctx.fillStyle = index < 2 ? P.pawShadow : legColor;
                ctx.beginPath();
                ctx.ellipse(legX, legY, isCat ? 2.8 : 3.2, isCat ? 3.3 : 3.5, offset * 0.035, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = P.outline;
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = P.paw;
                ctx.beginPath();
                ctx.ellipse(legX + 0.4, legY + 1.6, 2.5, 1.6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = P.outline;
                ctx.lineWidth = 0.7;
                ctx.stroke();
                ctx.strokeStyle = P.pawShadow;
                ctx.lineWidth = 0.55;
                ctx.beginPath();
                ctx.moveTo(legX - 0.6, legY + 1);
                ctx.lineTo(legX - 0.6, legY + 2.1);
                ctx.moveTo(legX + 0.8, legY + 1);
                ctx.lineTo(legX + 0.8, legY + 2.1);
                ctx.stroke();
            });
        }

        drawCatMarkings(ctx, P, x, y, isFront, isBack) {
            ctx.save();
            ctx.strokeStyle = P.furDark;
            ctx.lineWidth = 1.3;
            ctx.lineCap = 'round';
            if (!isFront && !isBack) {
                [-7, -3, 1].forEach((stripeX, index) => {
                    ctx.beginPath();
                    ctx.moveTo(x + stripeX, y - 5);
                    ctx.quadraticCurveTo(x + stripeX + 1.2, y - 2, x + stripeX + 0.3, y + 0.2);
                    ctx.stroke();
                });
                ctx.fillStyle = P.furBelly;
                ctx.beginPath();
                ctx.ellipse(x + 6, y + 2, 4.4, 3.2, -0.15, 0, Math.PI * 2);
                ctx.fill();
            } else if (isFront) {
                ctx.fillStyle = P.furBelly;
                ctx.beginPath();
                ctx.ellipse(0, y + 1, 5.2, 4.2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = P.furDark;
                [-3, 0, 3].forEach(xPos => {
                    ctx.beginPath();
                    ctx.moveTo(xPos, y - 5);
                    ctx.lineTo(xPos, y - 2.8);
                    ctx.stroke();
                });
            } else {
                [-6, -2, 2, 6].forEach(stripeX => {
                    ctx.beginPath();
                    ctx.moveTo(stripeX, y - 2);
                    ctx.quadraticCurveTo(stripeX + 1, y + 2, stripeX, y + 4);
                    ctx.stroke();
                });
            }
            ctx.restore();
        }

        drawDogMarkings(ctx, P, x, y, isFront, isBack) {
            ctx.save();
            if (isFront || isBack) {
                ctx.fillStyle = P.furDark;
                ctx.beginPath();
                ctx.ellipse(-5.5, y - 2, 2.2, 3, -0.25, 0, Math.PI * 2);
                ctx.ellipse(5.5, y - 2, 2.2, 3, 0.25, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = P.furBelly;
                ctx.beginPath();
                ctx.ellipse(x + 6, y + 2, 5, 3.6, -0.15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = P.furHighlight;
                ctx.beginPath();
                ctx.ellipse(x - 9, y - 1, 3.2, 3.5, -0.25, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = P.outline;
                ctx.beginPath();
                ctx.arc(x - 9, y - 2.2, 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        drawCompanionHead(ctx, P, species, x, y, direction, phase) {
            const isCat = species === 'cat';
            const isQuarter = direction === 'down-right' || direction === 'up-right';
            ctx.save();
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = P.outline;

            if (isCat) {
                this.drawCatEar(ctx, P, x - 4.5, y - 5.5, -0.12, true);
                this.drawCatEar(ctx, P, x + 4.5, y - 5.5, 0.12, false);
            } else {
                this.drawDogEar(ctx, P, x - 4.5, y - 5, -0.35, true, phase);
                this.drawDogEar(ctx, P, x + 4.5, y - 5, 0.35, false, phase);
            }

            ctx.fillStyle = P.furBase;
            ctx.beginPath();
            ctx.ellipse(x, y, isCat ? 8.2 : 8.6, isCat ? 7.5 : 7.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = P.furHighlight;
            ctx.beginPath();
            ctx.ellipse(x + 1, y - 3.2, 5.8, 3.1, -0.08, Math.PI, Math.PI * 2);
            ctx.fill();

            if (isCat) {
                ctx.fillStyle = P.furDark;
                ctx.beginPath();
                ctx.moveTo(x - 3, y - 6.2);
                ctx.lineTo(x - 1.8, y - 3.4);
                ctx.lineTo(x - 0.4, y - 6.4);
                ctx.fill();
            } else {
                this.drawDogBlaze(ctx, P, x, y);
            }

            const eyeY = y - 1.4;
            if (isQuarter) {
                this.drawPetEye(ctx, P, x + 3.3, eyeY, isCat ? 1.3 : 1.25);
                this.drawPetEye(ctx, P, x - 1.4, eyeY + 0.5, 0.85);
            } else {
                this.drawPetEye(ctx, P, x - 3.1, eyeY, isCat ? 1.35 : 1.25);
                this.drawPetEye(ctx, P, x + 3.1, eyeY, isCat ? 1.35 : 1.25);
            }

            this.drawPetMuzzle(ctx, P, species, x, y + 2.0, isQuarter);
            if (isCat) this.drawCatWhiskers(ctx, P, x, y + 2.2);
            ctx.restore();
        }

        drawCompanionBackHead(ctx, P, species, x, y, phase) {
            const isCat = species === 'cat';
            ctx.save();
            if (isCat) {
                this.drawCatEar(ctx, P, x - 4.8, y - 4, -0.12, true);
                this.drawCatEar(ctx, P, x + 4.8, y - 4, 0.12, false);
            } else {
                this.drawDogEar(ctx, P, x - 5, y - 4, -0.4, true, phase);
                this.drawDogEar(ctx, P, x + 5, y - 4, 0.4, false, phase);
            }
            ctx.fillStyle = P.furBase;
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(x, y + 1, isCat ? 7.5 : 8, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            if (species === 'dog') {
                ctx.fillStyle = P.furDark;
                ctx.beginPath();
                ctx.ellipse(x, y + 6, 3, 1.2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        drawCatEar(ctx, P, x, y, rotation, isFar) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.fillStyle = P.outline;
            ctx.beginPath();
            ctx.moveTo(-4.1, 2.2);
            ctx.lineTo(-2.5, -6.8);
            ctx.quadraticCurveTo(-2.1, -8, -0.8, -6.8);
            ctx.lineTo(4.1, 2.2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = isFar ? P.furDark : P.furBase;
            ctx.beginPath();
            ctx.moveTo(-3.1, 1.3);
            ctx.lineTo(-2.1, -5.5);
            ctx.lineTo(3.1, 1.3);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = P.innerEar;
            ctx.beginPath();
            ctx.moveTo(-1.8, 0.2);
            ctx.lineTo(-1.4, -3.9);
            ctx.lineTo(1.9, 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        drawDogEar(ctx, P, x, y, rotation, isFar, phase) {
            const flap = phase % 2 === 1 ? 0.12 : -0.08;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation + (isFar ? -flap : flap));
            ctx.fillStyle = P.outline;
            ctx.beginPath();
            ctx.ellipse(0, 1.8, 4.2, 7.3, isFar ? -0.18 : 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = isFar ? P.furDark : P.furBase;
            ctx.beginPath();
            ctx.ellipse(0, 1.2, 3.2, 6.2, isFar ? -0.18 : 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = P.innerEar;
            ctx.beginPath();
            ctx.ellipse(0, 2, 1.6, 4.2, isFar ? -0.18 : 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        drawDogBlaze(ctx, P, x, y) {
            ctx.fillStyle = P.furBelly;
            ctx.beginPath();
            ctx.moveTo(x - 1.2, y - 5.5);
            ctx.quadraticCurveTo(x + 0.4, y - 3.4, x - 0.5, y - 1.2);
            ctx.quadraticCurveTo(x + 0.1, y + 0.4, x + 1.2, y + 1.0);
            ctx.lineTo(x + 0.6, y - 5.6);
            ctx.closePath();
            ctx.fill();
        }

        drawPetEye(ctx, P, x, y, radius) {
            ctx.fillStyle = P.eye;
            ctx.beginPath();
            ctx.ellipse(x, y, radius, radius * 1.35, -0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = P.eyeGlint;
            ctx.beginPath();
            ctx.arc(x + radius * 0.28, y - radius * 0.38, radius * 0.38, 0, Math.PI * 2);
            ctx.fill();
        }

        drawPetMuzzle(ctx, P, species, x, y, isQuarter) {
            const isCat = species === 'cat';
            ctx.fillStyle = P.furBelly;
            ctx.beginPath();
            if (isCat) {
                ctx.ellipse(x - 1.5, y, 3.2, 2.2, 0, 0, Math.PI * 2);
                ctx.ellipse(x + 1.5, y, 3.2, 2.2, 0, 0, Math.PI * 2);
            } else {
                ctx.ellipse(x + (isQuarter ? 1.2 : 0), y, 4.3, 3.1, 0, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.fillStyle = P.nose;
            ctx.beginPath();
            if (isCat) {
                ctx.moveTo(x - 1.3, y - 1.2);
                ctx.lineTo(x + 1.3, y - 1.2);
                ctx.lineTo(x, y + 0.4);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.ellipse(x + (isQuarter ? 1.2 : 0), y - 1.2, 1.7, 1.25, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x, y + 0.2);
            ctx.lineTo(x, y + 1.6);
            ctx.quadraticCurveTo(x + 1.1, y + 2.1, x + 2, y + 1.3);
            ctx.stroke();
            if (!isCat) {
                ctx.fillStyle = P.outline;
                ctx.beginPath();
                ctx.arc(x - 2.7, y - 0.2, 0.65, 0, Math.PI * 2);
                ctx.arc(x + 2.7, y - 0.2, 0.65, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        drawCatWhiskers(ctx, P, x, y) {
            ctx.save();
            ctx.strokeStyle = P.furBelly;
            ctx.lineWidth = 0.55;
            [[-1, -1], [-1, 0.3], [1, -1], [1, 0.3]].forEach(([side, offset]) => {
                ctx.beginPath();
                ctx.moveTo(x + side * 2.5, y + offset);
                ctx.lineTo(x + side * 8, y + offset * 1.8);
                ctx.stroke();
            });
            ctx.restore();
        }

        drawCompanionCollar(ctx, P, species, direction) {
            const isFront = direction === 'down';
            const isBack = direction === 'up' || direction === 'up-right';
            ctx.save();
            ctx.strokeStyle = P.collar;
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (isFront || isBack) {
                ctx.arc(0, -2, 7.4, 0.18, Math.PI - 0.18);
            } else {
                ctx.moveTo(-1, -3);
                ctx.quadraticCurveTo(1, 0.5, 5, 2.2);
            }
            ctx.stroke();
            ctx.fillStyle = P.tag;
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            if (isFront || isBack) {
                ctx.moveTo(-1.3, 4.2);
                ctx.lineTo(1.3, 4.2);
                ctx.lineTo(0, 7);
                ctx.closePath();
            } else {
                ctx.arc(4.6, 2.4, species === 'cat' ? 1.5 : 1.8, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        /**
         * Sağ yarı küre yönlerini (down, down-right, right, up-right, up) çizen ana fonksiyon
         */
        renderBaseDirection(ctx, dir, anim, frame) {
            const P = this.palette;

            // Animasyon Parametreleri (Dört ayaklı yürüyüş ve bekleme)
            let bobY = 0;
            let spineAngle = 0;
            let tailWag = 0;
            let earTwitch = 0;

            // 4 Ayak pozisyonları (x, y offsetleri)
            // fl: Front-Left, fr: Front-Right (ön patiler)
            // rl: Rear-Left, rr: Rear-Right (arka patiler)
            let flX = 0, flY = 0, frX = 0, frY = 0;
            let rlX = 0, rlY = 0, rrX = 0, rrY = 0;

            if (anim === 'idle') {
                // Bekleme: Hafif göğüs inip kalkması, kulak ve kuyruk salınımı
                const t = frame / 4; // 0, 0.25, 0.5, 0.75
                bobY = Math.sin(t * Math.PI * 2) * 0.8;
                spineAngle = Math.sin(t * Math.PI * 2) * 0.02;
                tailWag = Math.sin(t * Math.PI * 2) * 4;
                earTwitch = (frame === 2) ? -0.05 : 0;
            } else {
                // 4 Ayaklı Tırıs / Koşma (Quadrupedal Trot):
                // Çapraz ayak çiftleri: [Front-Right + Rear-Left] ve [Front-Left + Rear-Right]
                const step = frame % 4;
                if (step === 0) {
                    bobY = 0;
                    frX = 3.5; frY = -1.5;   // Ön sağ ileri
                    flX = -3.0; flY = 0.5;   // Ön sol geri
                    rlX = 3.0; rlY = -1.0;   // Arka sol ileri
                    rrX = -3.5; rrY = 0.5;   // Arka sağ geri
                    tailWag = -3;
                    spineAngle = 0.04;
                } else if (step === 1) {
                    bobY = -1.5; // Zıplama / havada geçiş
                    frX = 1.0; frY = -1.0;
                    flX = -0.5; flY = -0.5;
                    rlX = 0.5; rlY = -0.8;
                    rrX = -1.0; rrY = -0.5;
                    tailWag = 1;
                    spineAngle = -0.02;
                } else if (step === 2) {
                    bobY = 0;
                    frX = -3.0; frY = 0.5;   // Ön sağ geri
                    flX = 3.5; flY = -1.5;   // Ön sol ileri
                    rlX = -3.5; rlY = 0.5;   // Arka sol geri
                    rrX = 3.0; rrY = -1.0;   // Arka sağ ileri
                    tailWag = 3;
                    spineAngle = 0.04;
                } else if (step === 3) {
                    bobY = -1.5; // Zıplama / havada geçiş
                    frX = -0.5; frY = -0.5;
                    flX = 1.0; flY = -1.0;
                    rlX = -1.0; rlY = -0.5;
                    rrX = 0.5; rrY = -0.8;
                    tailWag = -1;
                    spineAngle = -0.02;
                }
            }

            // Yöne göre çizim bileşenleri
            switch (dir) {
                case 'right':
                    this.drawSideView(ctx, P, bobY, spineAngle, tailWag, earTwitch, flX, flY, frX, frY, rlX, rlY, rrX, rrY);
                    break;
                case 'down-right':
                    this.drawQuarterFrontView(ctx, P, bobY, spineAngle, tailWag, earTwitch, flX, flY, frX, frY, rlX, rlY, rrX, rrY);
                    break;
                case 'down':
                    this.drawFrontView(ctx, P, bobY, spineAngle, tailWag, earTwitch, flX, flY, frX, frY, rlX, rlY, rrX, rrY);
                    break;
                case 'up-right':
                    this.drawQuarterBackView(ctx, P, bobY, spineAngle, tailWag, earTwitch, flX, flY, frX, frY, rlX, rlY, rrX, rrY);
                    break;
                case 'up':
                    this.drawBackView(ctx, P, bobY, spineAngle, tailWag, earTwitch, flX, flY, frX, frY, rlX, rlY, rrX, rrY);
                    break;
            }
        }

        // ==========================================
        // 1. TAM YAN PROFİL (RIGHT / EAST)
        // ==========================================
        drawSideView(ctx, P, bobY, spine, tailWag, earTwitch, flX, flY, frX, frY, rlX, rlY, rrX, rrY) {
            ctx.save();
            ctx.translate(0, bobY);
            ctx.rotate(spine);

            // 1. Uzak Kulak (Arka planda kalan sol kulak)
            this.drawTfmEar(ctx, P, -1, -19 + earTwitch, 4.5, 7.5, -0.2, true);

            // 2. Uzak Arka Ayak (Rear-Left)
            this.drawTfmPaw(ctx, P, -11 + rlX, 6 + rlY, 3.5, 2.8, true);

            // 3. Uzak Ön Ayak (Front-Left)
            this.drawTfmPaw(ctx, P, 3 + flX, 6 + flY, 3.0, 2.6, true);

            // 4. Transformice Uzun Kırbaç Kuyruk (S kıvrımı ve salınım)
            this.drawTfmTail(ctx, P, -12, 1, -26, -11 + tailWag, -22, -22 + tailWag * 1.5, -16, -26 + tailWag * 2);

            // 5. Gövde & Dolgun Kalça (TFM Dört Ayaklı Kavisli Gövde)
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = P.outline;
            ctx.fillStyle = P.furBase;

            // Ana gövde formu (Arka kalça + sırt kavisi + göğüs)
            ctx.beginPath();
            ctx.moveTo(5, 5); // Göğüs altı
            ctx.bezierCurveTo(9, 3, 10, -2, 7, -6); // Ön omuz/boyun
            ctx.bezierCurveTo(4, -8, -1, -6, -6, -4); // Sırt kavisi
            ctx.bezierCurveTo(-11, -2, -15, 0, -15, 4); // Dolgun kalça üstü
            ctx.bezierCurveTo(-15, 8, -11, 8.5, -8, 7.5); // Kalça altı
            ctx.bezierCurveTo(-4, 7, 1, 7.5, 5, 5); // Karın altı
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Karın açık ton parlaması (TFM göbek aydınlatması)
            ctx.fillStyle = P.furBelly;
            ctx.beginPath();
            ctx.moveTo(-6, 6);
            ctx.quadraticCurveTo(0, 4.5, 4, 4);
            ctx.quadraticCurveTo(0, 6.8, -6, 6);
            ctx.fill();

            // Kalça yuvarlağı çizgisi (TFM bacak eklem çizgisi)
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(-8, 3, 5, -Math.PI * 0.7, Math.PI * 0.35);
            ctx.stroke();

            // 6. Yakın Arka Ayak (Rear-Right)
            this.drawTfmPaw(ctx, P, -8 + rrX, 7 + rrY, 4.0, 3.0, false);

            // 7. Yakın Ön Ayak (Front-Right)
            this.drawTfmPaw(ctx, P, 6 + frX, 7 + frY, 3.2, 2.8, false);

            // 8. TFM Kafa & Sivri Sevimli Burun
            ctx.fillStyle = P.furBase;
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(2, -7); // Alın başlangıcı
            ctx.bezierCurveTo(6, -8, 12, -7, 15, -4); // Üst burun köprüsü
            ctx.bezierCurveTo(16.5, -2.5, 16.5, -1, 14, 0); // Burun ucu & ağız
            ctx.bezierCurveTo(10, 1.5, 5, 1, 2, -1); // Çene altı
            ctx.bezierCurveTo(0, -3, 0, -5, 2, -7); // Yanak
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Pembe Burun Düğmesi
            ctx.fillStyle = P.nose;
            ctx.beginPath();
            ctx.arc(15.5, -2.8, 1.3, 0, Math.PI * 2);
            ctx.fill();

            // 9. Büyük İkonik TFM Gözü (Işıltılı)
            this.drawTfmEye(ctx, P, 10, -4, 2.4, 3.2, 0.1);

            // 10. Ön Dev TFM Kulağı (Görkemli iç kıvrımlı)
            this.drawTfmEar(ctx, P, 3, -16 + earTwitch, 7.5, 8.5, 0.15, false);

            ctx.restore();
        }

        // ==========================================
        // 2. ÇAPRAZ ÖN (DOWN-RIGHT / SE)
        // ==========================================
        drawQuarterFrontView(ctx, P, bobY, spine, tailWag, earTwitch, flX, flY, frX, frY, rlX, rlY, rrX, rrY) {
            ctx.save();
            ctx.translate(0, bobY);
            ctx.rotate(spine * 0.7);

            // 1. Uzak Arka Ayak (RL)
            this.drawTfmPaw(ctx, P, -10 + rlX * 0.8, 5.5 + rlY, 3.2, 2.6, true);

            // 2. TFM Kuyruk (Gövdenin sol arkasından yukarı yükselen)
            this.drawTfmTail(ctx, P, -11, 2, -22, -8 + tailWag, -20, -18 + tailWag * 1.3, -14, -24 + tailWag * 1.8);

            // 3. Uzak Sol Kulak (Kafanın sol arka tepesi)
            this.drawTfmEar(ctx, P, -4, -18 + earTwitch, 5.5, 8.0, -0.25, false);

            // 4. Gövde (3/4 Açılı Dolgun Dört Ayaklı Form)
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = P.outline;
            ctx.fillStyle = P.furBase;
            ctx.beginPath();
            ctx.moveTo(4, 5.5);
            ctx.bezierCurveTo(8, 3.5, 9, -2, 6, -5); // Sağ ön omuz
            ctx.bezierCurveTo(3, -7, -3, -6, -8, -3); // Sırt
            ctx.bezierCurveTo(-13, 0, -14, 4, -12, 6.5); // Arka kalça
            ctx.bezierCurveTo(-9, 8.5, -3, 8.5, 4, 5.5); // Karın çizgisi
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Açık Göbek Alanı (3/4 perspektif)
            ctx.fillStyle = P.furBelly;
            ctx.beginPath();
            ctx.ellipse(-1, 5, 5, 2.5, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // 5. Uzak Ön Ayak (FL)
            this.drawTfmPaw(ctx, P, 1 + flX, 6.5 + flY, 3.0, 2.6, false);

            // 6. Yakın Arka Ayak (RR)
            this.drawTfmPaw(ctx, P, -6 + rrX, 7.5 + rrY, 3.8, 3.0, false);

            // Kalça Eklem Çizgisi
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(-7, 3.5, 4.5, -Math.PI * 0.6, Math.PI * 0.3);
            ctx.stroke();

            // 7. Yakın Ön Ayak (FR)
            this.drawTfmPaw(ctx, P, 6 + frX, 7.8 + frY, 3.4, 2.8, false);

            // 8. Kafa (3/4 Öne Bakan TFM Kafası)
            ctx.fillStyle = P.furBase;
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(1, -6);
            ctx.bezierCurveTo(5, -8, 10, -6, 13.5, -3); // Snout
            ctx.bezierCurveTo(15, -1.5, 14, 0.5, 12, 1.5);
            ctx.bezierCurveTo(8, 2.5, 3, 2, 0, -1);
            ctx.bezierCurveTo(-2, -3, -1, -5, 1, -6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Pembe Burun Düğmesi
            ctx.fillStyle = P.nose;
            ctx.beginPath();
            ctx.arc(14, -1.5, 1.3, 0, Math.PI * 2);
            ctx.fill();

            // İki Göz (Biri tam karşı-yan, diğeri ufak açılı)
            // Uzak göz (küçük)
            ctx.fillStyle = P.eye;
            ctx.beginPath();
            ctx.ellipse(6.5, -4.5, 1.4, 2.0, -0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = P.eyeGlint;
            ctx.beginPath();
            ctx.arc(6.8, -5.2, 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Yakın TFM gözü (büyük ve parlak)
            this.drawTfmEye(ctx, P, 10.5, -3.2, 2.3, 3.0, 0.15);

            // 9. Yakın Sağ Kulak (Geniş, pembe iç dokulu)
            this.drawTfmEar(ctx, P, 3, -15 + earTwitch, 7.2, 8.5, 0.2, false);

            ctx.restore();
        }

        // ==========================================
        // 3. TAM ÖN BAKIŞ (DOWN / SOUTH)
        // ==========================================
        drawFrontView(ctx, P, bobY, spine, tailWag, earTwitch, flX, flY, frX, frY, rlX, rlY, rrX, rrY) {
            ctx.save();
            ctx.translate(0, bobY);

            // 1. Kuyruk (Arkadan bir tarafa kıvrılan TFM kuyruğu)
            this.drawTfmTail(ctx, P, 0, 4, 12 + tailWag, -4, 18 + tailWag * 1.5, -14, 16 + tailWag * 2, -22);

            // 2. Arka Ayaklar (İki yana açılmış sağlam duruş)
            this.drawTfmPaw(ctx, P, -10 + rlX * 0.5, 6 + rlY, 3.6, 2.8, false);
            this.drawTfmPaw(ctx, P, 10 + rrX * 0.5, 6 + rrY, 3.6, 2.8, false);

            // 3. Kulaklar (Sol ve Sağ - Görkemli TFM Kulakları)
            this.drawTfmEar(ctx, P, -9, -15 + earTwitch, 7.0, 8.0, -0.3, false);
            this.drawTfmEar(ctx, P, 9, -15 + earTwitch, 7.0, 8.0, 0.3, false);

            // 4. Gövde (Dört ayaklı önden görünüm - tombik sevimli kürk)
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = P.outline;
            ctx.fillStyle = P.furBase;
            ctx.beginPath();
            ctx.ellipse(0, 3, 10.5, 6.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Açık Göğüs/Göbek Kürk Alanı
            ctx.fillStyle = P.furBelly;
            ctx.beginPath();
            ctx.ellipse(0, 4.5, 5.5, 3.8, 0, 0, Math.PI * 2);
            ctx.fill();

            // 5. Ön Ayaklar (Ön merkezde basan patiler)
            this.drawTfmPaw(ctx, P, -4 + flX * 0.6, 7.5 + flY, 3.2, 2.6, false);
            this.drawTfmPaw(ctx, P, 4 + frX * 0.6, 7.5 + frY, 3.2, 2.6, false);

            // 6. Kafa (Önden sevimli armut biçimli TFM kafası)
            ctx.fillStyle = P.furBase;
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-6, -7);
            ctx.bezierCurveTo(-7, -4, -6, 0, -4, 1.5);
            ctx.bezierCurveTo(-2, 3, 2, 3, 4, 1.5);
            ctx.bezierCurveTo(6, 0, 7, -4, 6, -7);
            ctx.bezierCurveTo(4, -9, -4, -9, -6, -7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Sevimli Pembe Burun Düğmesi (Ön merkez)
            ctx.fillStyle = P.nose;
            ctx.beginPath();
            ctx.ellipse(0, 0.5, 1.5, 1.1, 0, 0, Math.PI * 2);
            ctx.fill();

            // İki Parlak Göz (TFM stili)
            this.drawTfmEye(ctx, P, -3.8, -3.5, 2.2, 2.8, -0.05);
            this.drawTfmEye(ctx, P, 3.8, -3.5, 2.2, 2.8, 0.05);

            ctx.restore();
        }

        // ==========================================
        // 4. ÇAPRAZ ARKA (UP-RIGHT / NE)
        // ==========================================
        drawQuarterBackView(ctx, P, bobY, spine, tailWag, earTwitch, flX, flY, frX, frY, rlX, rlY, rrX, rrY) {
            ctx.save();
            ctx.translate(0, bobY);
            ctx.rotate(spine * 0.6);

            // 1. Burun ucu ve yanak ucu (Hafifçe sağ arkadan görünen)
            ctx.fillStyle = P.furBase;
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(8, -6, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = P.nose;
            ctx.beginPath();
            ctx.arc(11.5, -5.5, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // 2. Sol Kulak Dış Kabuğu (Arkadan görünüm)
            this.drawTfmEarBack(ctx, P, -4, -18 + earTwitch, 6.0, 8.0, -0.2);

            // 3. Ön Ayaklar (İleri doğru adım atan)
            this.drawTfmPaw(ctx, P, 1 + flX, 5.5 + flY, 3.0, 2.5, true);
            this.drawTfmPaw(ctx, P, 7 + frX, 6.5 + frY, 3.2, 2.7, true);

            // 4. Dolgun Gövde & Arka Kalça (Arkadan görünüm)
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = P.outline;
            ctx.fillStyle = P.furBase;
            ctx.beginPath();
            ctx.moveTo(-10, 4);
            ctx.bezierCurveTo(-14, 0, -12, -4, -6, -6); // Sol sırt
            ctx.bezierCurveTo(0, -7, 5, -5, 6, -2); // Sağ omuz
            ctx.bezierCurveTo(6, 3, 2, 7, -4, 7.5); // Alt karın
            ctx.bezierCurveTo(-8, 7.5, -10, 6, -10, 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Kalça hatları
            ctx.strokeStyle = P.furDark;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(-4, 3, 5, -Math.PI * 0.7, 0);
            ctx.stroke();

            // 5. Arka Ayaklar
            this.drawTfmPaw(ctx, P, -10 + rlX, 6.5 + rlY, 3.5, 2.8, false);
            this.drawTfmPaw(ctx, P, -3 + rrX, 7.5 + rrY, 3.8, 3.0, false);

            // 6. Sağ Kulak (Arka açılı)
            this.drawTfmEarBack(ctx, P, 4, -17 + earTwitch, 7.0, 8.5, 0.2);

            // 7. Kuyruk (Kalçadan doğrudan yükselen ana kuyruk)
            this.drawTfmTail(ctx, P, -8, 2, -18, -8 + tailWag, -16, -18 + tailWag * 1.4, -10, -25 + tailWag * 1.8);

            ctx.restore();
        }

        // ==========================================
        // 5. TAM ARKA (UP / NORTH)
        // ==========================================
        drawBackView(ctx, P, bobY, spine, tailWag, earTwitch, flX, flY, frX, frY, rlX, rlY, rrX, rrY) {
            ctx.save();
            ctx.translate(0, bobY);

            // 1. Ön Ayaklar (İleri doğru hafifçe görünen)
            this.drawTfmPaw(ctx, P, -5 + flX * 0.7, 5 + flY, 3.0, 2.5, true);
            this.drawTfmPaw(ctx, P, 5 + frX * 0.7, 5 + frY, 3.0, 2.5, true);

            // 2. Arka Ayaklar
            this.drawTfmPaw(ctx, P, -9 + rlX * 0.7, 6.5 + rlY, 3.6, 2.8, false);
            this.drawTfmPaw(ctx, P, 9 + rrX * 0.7, 6.5 + rrY, 3.6, 2.8, false);

            // 3. Arka Gövde & Kalçalar (Yuvarlak sevimli form)
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = P.outline;
            ctx.fillStyle = P.furBase;
            ctx.beginPath();
            ctx.ellipse(0, 3, 10, 6.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Kafa Arkası (Yuvarlak)
            ctx.beginPath();
            ctx.arc(0, -4, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 4. İki Kulak Arkası
            this.drawTfmEarBack(ctx, P, -8, -14 + earTwitch, 6.8, 8.0, -0.25);
            this.drawTfmEarBack(ctx, P, 8, -14 + earTwitch, 6.8, 8.0, 0.25);

            // 5. Kuyruk (Tam omurgadan dik yükselip yana kavis çizen)
            this.drawTfmTail(ctx, P, 0, 2, -5 + tailWag, -10, -8 + tailWag * 1.5, -18, -4 + tailWag * 2, -26);

            ctx.restore();
        }

        // ==========================================
        // YARDIMCI VEKTÖR ÇİZİM FONKSİYONLARI
        // ==========================================

        /**
         * İkonik TFM Kulağı (Geniş yuvarlak, pembe iç dokulu, katlantı çizgili)
         */
        drawTfmEar(ctx, P, x, y, rW, rH, rot, isFar = false) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);

            ctx.lineWidth = 1.6;
            ctx.strokeStyle = P.outline;
            ctx.fillStyle = isFar ? P.furDark : P.furBase;

            // Kulak dış çeperi
            ctx.beginPath();
            ctx.ellipse(0, 0, rW, rH, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Kulak içi pembe doku
            ctx.fillStyle = isFar ? P.innerEarShadow : P.innerEar;
            ctx.beginPath();
            ctx.ellipse(0.5, 1.0, rW * 0.72, rH * 0.72, 0, 0, Math.PI * 2);
            ctx.fill();

            // Transformice iç kulak katlantı yayı
            ctx.strokeStyle = P.earFold;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.arc(-0.5, 2.5, rW * 0.45, -Math.PI * 0.8, -Math.PI * 0.1);
            ctx.stroke();

            ctx.restore();
        }

        /**
         * Kulağın Arkadan Görünümü (Sadece kürk ve gölge)
         */
        drawTfmEarBack(ctx, P, x, y, rW, rH, rot) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);

            ctx.lineWidth = 1.6;
            ctx.strokeStyle = P.outline;
            ctx.fillStyle = P.furBase;

            ctx.beginPath();
            ctx.ellipse(0, 0, rW, rH, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Hafif gölge derinliği
            ctx.fillStyle = P.furDark;
            ctx.beginPath();
            ctx.ellipse(0, 1.5, rW * 0.6, rH * 0.5, 0, 0, Math.PI);
            ctx.fill();

            ctx.restore();
        }

        /**
         * İkonik TFM Gözü (Büyük, siyah oval, parlak beyaz yansıma)
         */
        drawTfmEye(ctx, P, x, y, rW, rH, rot) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);

            // Göz bebeği (Siyah oval)
            ctx.fillStyle = P.eye;
            ctx.beginPath();
            ctx.ellipse(0, 0, rW, rH, 0, 0, Math.PI * 2);
            ctx.fill();

            // Ana Parlak Işıltı (Üst-sağ beyaz nokta)
            ctx.fillStyle = P.eyeGlint;
            ctx.beginPath();
            ctx.arc(rW * 0.35, -rH * 0.35, rW * 0.42, 0, Math.PI * 2);
            ctx.fill();

            // İkincil Minik Işıltı (Alt-sol hafif ışıltı)
            ctx.fillStyle = P.eyeSubGlint;
            ctx.beginPath();
            ctx.arc(-rW * 0.3, rH * 0.35, rW * 0.22, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        /**
         * Pati Çizimi (Dört ayaklı stance için sevimli pençeli pati)
         */
        drawTfmPaw(ctx, P, x, y, w, h, isBack = false) {
            ctx.save();
            ctx.translate(x, y);

            ctx.lineWidth = 1.3;
            ctx.strokeStyle = P.outline;
            ctx.fillStyle = isBack ? P.pawShadow : P.paw;

            // Pati tabanı
            ctx.beginPath();
            ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Parmak ayrımı (2 minik çizgi)
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(-w * 0.2, -h * 0.4); ctx.lineTo(-w * 0.2, h * 0.7);
            ctx.moveTo(w * 0.2, -h * 0.4); ctx.lineTo(w * 0.2, h * 0.7);
            ctx.stroke();

            ctx.restore();
        }

        /**
         * Transformice Uzun Kırbaç Kuyruk (Zarif kavis ve tapering/incelme)
         */
        drawTfmTail(ctx, P, startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY) {
            ctx.save();
            ctx.lineCap = 'round';

            // Dış Kontur (Koyu Çizgi)
            ctx.strokeStyle = P.outline;
            ctx.lineWidth = 3.6;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
            ctx.stroke();

            // İç Pembe Gövde
            ctx.strokeStyle = P.tail;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
            ctx.stroke();

            // Kuyruk ucu aydınlatması
            ctx.strokeStyle = P.tailHighlight;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(cp2X, cp2Y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            ctx.restore();
        }

        /**
         * Tüm yön ve animasyon karelerini tek bir Canvas Sprite Sheet olarak üretir
         * Boyut: (4 frame x 64px = 256px genişlik) x (8 yön x 2 animasyon x 64px = 1024px yükseklik)
         */
        generateSpriteSheetCanvas() {
            const numFrames = 4;
            const animations = ['idle', 'walk'];
            const sheetW = numFrames * this.frameWidth;
            const sheetH = this.directions.length * animations.length * this.frameHeight;

            let canvas;
            if (typeof document !== 'undefined') {
                canvas = document.createElement('canvas');
            } else {
                // Node ortamı desteği için fallback
                return null;
            }

            canvas.width = sheetW;
            canvas.height = sheetH;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;

            let row = 0;
            for (const anim of animations) {
                for (let d = 0; d < this.directions.length; d++) {
                    const dir = this.directions[d];
                    for (let f = 0; f < numFrames; f++) {
                        const cellX = f * this.frameWidth;
                        const cellY = row * this.frameHeight;

                        ctx.save();
                        // Hücre merkezine ötele (kullanılan mouse tabanı (0, 0)'dır)
                        ctx.translate(cellX + this.frameWidth / 2, cellY + this.frameHeight / 2 + 10);
                        this.draw(ctx, {
                            direction: dir,
                            animation: anim,
                            frame: f,
                            scale: 1.0,
                            showShadow: true
                        });
                        ctx.restore();
                    }
                    row++;
                }
            }

            return canvas;
        }
    }

    // Singleton ve Global Register
    const instance = new TfmMouseRenderer();
    if (typeof window !== 'undefined') {
        window.TfmMouseRenderer = instance;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }
})(typeof window !== 'undefined' ? window : global);

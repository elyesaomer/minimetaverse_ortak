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

    // Sprite Yapılandırması: 4 sütun x 16 satır (Toplam 64 kare)
    // 0-7: 8 Yönlü Standart Idle
    // 8-15: 8 Yönlü Yürüme (Walk)
    // Kedide 8. satır (row index 7): İki ayak üstüne kalkıp pati uzatma (Special Idle)
    const SPRITE_CONFIGS = {
        mouse: {
            src: '/assets/pets/tfm_mouse_spritesheet.png',
            cols: 4,
            rows: 16
        },
        cat: {
            src: '/assets/pets/cat_spritesheet.png',
            cols: 4,
            rows: 16
        },
        dog: {
            src: '/assets/pets/dog_spritesheet.png',
            cols: 4,
            rows: 16
        }
    };

    const DIRECTION_ROW_MAP = {
        'down': 0,
        'down-right': 1,
        'right': 2,
        'up-right': 3,
        'up': 4,
        'up-left': 5,
        'left': 6,
        'down-left': 7
    };

    const spriteImages = {};

    function getOrLoadSpriteImage(species) {
        const key = species || 'mouse';
        if (spriteImages[key]) return spriteImages[key];

        const cfg = SPRITE_CONFIGS[key];
        if (!cfg) return null;

        const info = {
            loaded: false,
            img: null,
            config: cfg
        };

        if (typeof Image !== 'undefined') {
            const img = new Image();
            img.onload = () => {
                info.img = img;
                info.loaded = true;
            };
            img.onerror = () => {
                console.warn(`[TfmMouseRenderer] Sprite sheet yüklenemedi: ${cfg.src}`);
            };
            img.src = cfg.src;
        }

        spriteImages[key] = info;
        return info;
    }

    if (typeof window !== 'undefined') {
        getOrLoadSpriteImage('mouse');
        getOrLoadSpriteImage('cat');
        getOrLoadSpriteImage('dog');
    }


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
         * Petin zemin gölgesini çizer (Oyun avatarlarıyla %100 uyumlu zemin elipsi)
         * (0, 0) petin ayak tabanlarının zeminle temas ettiği noktadır
         */
        drawShadow(ctx, scale = 1) {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
            ctx.beginPath();
            ctx.ellipse(0, 0, 11 * scale, 4.2 * scale, 0, 0, Math.PI * 2);
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
                animation = 'idle', // 'idle', 'walk', 'special_idle'
                frame = 0,
                scale = 1,
                showShadow = true,
                species = 'mouse'
            } = options;

            const dir = this.normalizeDirection(direction);
            const spriteInfo = getOrLoadSpriteImage(species);

            // Zemin gölgesi (Avatarlarla uyumlu yumuşak gölge)
            if (showShadow) {
                this.drawShadow(ctx, scale);
            }

            // Kedi ve köpek için sprite sheet'ten dilimleyip çiz
            if (species !== 'mouse' && spriteInfo && spriteInfo.loaded && spriteInfo.img) {
                this.drawFromSpriteSheet(ctx, spriteInfo, species, dir, animation, frame, scale);
                return;
            }

            // Fare (Mouse): Pürüzsüz vektörel Transformice çizimi (şeffaf zemin, sıfır pikselleşme ve deliksiz)
            if (species === 'mouse') {
                ctx.save();
                ctx.scale(scale, scale);

                const isFlipped = (dir === 'left' || dir === 'up-left' || dir === 'down-left');
                if (isFlipped) {
                    ctx.scale(-1, 1);
                }

                let baseDir = dir;
                if (dir === 'left') baseDir = 'right';
                else if (dir === 'up-left') baseDir = 'up-right';
                else if (dir === 'down-left') baseDir = 'down-right';

                const anim = animation === 'walk' ? 'walk' : 'idle';
                const frameIdx = Math.floor(frame) % (this.framesPerAnim[anim] || 4);
                this.renderBaseDirection(ctx, baseDir, anim, frameIdx);

                ctx.restore();
                return;
            }
        }

        /**
         * 4 Sütun x 16 Satırlık Sprite Sayfasından İlgili Kareyi Çizer
         * - 0-7: 8 Yönlü Standart Idle
         * - 8-15: 8 Yönlü Yürüme (Walk)
         * - Kedide 8. Satır (Satır İndeksi 7): 2 Ayak Üstünde Pati Uzatma (Special Idle)
         */
        drawFromSpriteSheet(ctx, spriteInfo, species, direction, animation, frame, scale) {
            const img = spriteInfo.img;
            const cfg = spriteInfo.config;
            const cols = cfg.cols || 4;
            const rows = cfg.rows || 16;
            const cellW = img.width / cols;
            const cellH = img.height / rows;

            let row = 0;
            let flipX = false;

            if (animation === 'special_idle') {
                // Kedinin 8. satırdaki (row 7) 4 karelik iki ayak üstünde pati uzatma animasyonu
                row = 7;
            } else if (animation === 'walk') {
                const dirIdx = DIRECTION_ROW_MAP[direction] !== undefined ? DIRECTION_ROW_MAP[direction] : 0;
                row = 8 + dirIdx;
            } else {
                // Standart Idle
                if (species === 'cat' && direction === 'down-left') {
                    // Kedide 8. satır (row 7) özel pati animasyonu olduğundan,
                    // standart down-left bekleme duruşu için row 1 (down-right) yatay aynalanır.
                    row = 1;
                    flipX = true;
                } else {
                    const dirIdx = DIRECTION_ROW_MAP[direction] !== undefined ? DIRECTION_ROW_MAP[direction] : 0;
                    row = dirIdx;
                }
            }

            // Kedi standart beklemedeyken (idle) arkasını dönüp dönüp durmasın, sabit dursun (frame 0)
            // Sadece animasyona (special_idle veya walk) girince hareket etsin
            let col = Math.floor(frame) % cols;
            if (species === 'cat' && animation === 'idle') {
                col = 0;
            }

            const sx = col * cellW;
            const sy = row * cellH;

            ctx.save();
            ctx.scale(scale, scale);

            if (flipX) {
                ctx.scale(-1, 1);
            }

            // Hücre ortalama: (0, 0) petin ayak tabanlarının merkezidir
            const drawW = cellW;
            const drawH = cellH;
            const drawX = -drawW / 2;
            const drawY = -drawH + 8;

            ctx.drawImage(img, sx, sy, cellW, cellH, drawX, drawY, drawW, drawH);
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

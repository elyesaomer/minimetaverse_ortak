// public/js/seatRegistry.js - Yüksek Performanslı Oturma, Koltuk/Sandalye Kayıt Defteri ve Sıfır-Tahsisli Arama Motoru

/**
 * Statik mekanlardaki tüm koltuk, sandalye, tabure ve bankların önceden hesaplanmış sabit koordinatları.
 * Trigonometrik hesaplamalar (Math.cos/sin) oyun döngüsü dışında bir defa hesaplanmıştır.
 */
const STATIC_ROOM_SEATS = {
    kafe: [
        // Bar Tabureleri (Sol Üst Çay Ocağı)
        { x: 50, y: 64, facing: 'up', label: 'Bar Taburesi' },
        { x: 110, y: 64, facing: 'up', label: 'Bar Taburesi' },
        { x: 170, y: 64, facing: 'up', label: 'Bar Taburesi' },
        // Tavla Masası Sandalyeleri (x: 62, y: 300, w: 105, h: 74 - cx: 115, cy: 337)
        { x: 115, y: 280, facing: 'down', label: 'Tavla Sandalyesi', game: 'tavla', tableId: 'tavla' },
        { x: 115, y: 393, facing: 'up', label: 'Tavla Sandalyesi', game: 'tavla', tableId: 'tavla' },
        // XOX Masası Sandalyeleri (x: 239, y: 120, w: 86, h: 74 - cx: 282, cy: 157)
        { x: 282, y: 102, facing: 'down', label: 'XOX Sandalyesi', game: 'xox', tableId: 'xox' },
        { x: 282, y: 212, facing: 'up', label: 'XOX Sandalyesi', game: 'xox', tableId: 'xox' },
        // Amiral Battı Masası Sandalyeleri (x: 476, y: 120, w: 92, h: 74 - cx: 522, cy: 157)
        { x: 522, y: 102, facing: 'down', label: 'Amiral Battı Sandalyesi', game: 'amiral', tableId: 'amiral' },
        { x: 522, y: 212, facing: 'up', label: 'Amiral Battı Sandalyesi', game: 'amiral', tableId: 'amiral' },
        // Satranç Masası Sandalyeleri (x: 650, y: 220, w: 96, h: 74 - cx: 698, cy: 257)
        { x: 698, y: 198, facing: 'down', label: 'Satranç Sandalyesi', game: 'chess', tableId: 'chess', seatIndex: 0 },
        { x: 698, y: 316, facing: 'up', label: 'Satranç Sandalyesi', game: 'chess', tableId: 'chess', seatIndex: 1 }
    ],
    nargile_cafe: [
        // Sol Üst Nargile Locası (Chesterfield Sedir)
        { x: 110, y: 84, facing: 'down', label: 'Sol Loca Koltuğu', tableId: 'lounge_sol', seatIndex: 0 },
        { x: 155, y: 84, facing: 'down', label: 'Sol Loca Koltuğu', tableId: 'lounge_sol', seatIndex: 1 },
        { x: 54, y: 115, facing: 'right', label: 'Sol Loca Koltuğu', tableId: 'lounge_sol', seatIndex: 2 },
        { x: 54, y: 148, facing: 'right', label: 'Sol Loca Koltuğu', tableId: 'lounge_sol', seatIndex: 3 },
        // Sağ Üst Nargile Locası (Chesterfield Sedir)
        { x: 645, y: 84, facing: 'down', label: 'Sağ Loca Koltuğu', tableId: 'lounge_sag', seatIndex: 0 },
        { x: 690, y: 84, facing: 'down', label: 'Sağ Loca Koltuğu', tableId: 'lounge_sag', seatIndex: 1 },
        { x: 746, y: 115, facing: 'left', label: 'Sağ Loca Koltuğu', tableId: 'lounge_sag', seatIndex: 2 },
        { x: 746, y: 148, facing: 'left', label: 'Sağ Loca Koltuğu', tableId: 'lounge_sag', seatIndex: 3 },
        // Tekli 101 Okey Sandalyeleri (E basınca oturur ve 101 Okey açılır)
        { x: 255, y: 155, facing: 'down', label: 'Tekli 101 Sandalyesi', tableId: 'okey101_tekli', game: 'okey101_tekli', seatIndex: 0 },
        { x: 370, y: 242, facing: 'left', label: 'Tekli 101 Sandalyesi', tableId: 'okey101_tekli', game: 'okey101_tekli', seatIndex: 1 },
        { x: 255, y: 330, facing: 'up', label: 'Tekli 101 Sandalyesi', tableId: 'okey101_tekli', game: 'okey101_tekli', seatIndex: 2 },
        { x: 140, y: 242, facing: 'right', label: 'Tekli 101 Sandalyesi', tableId: 'okey101_tekli', game: 'okey101_tekli', seatIndex: 3 },
        // Eşli 101 Okey Sandalyeleri (E basınca oturur ve 101 Okey açılır)
        { x: 545, y: 155, facing: 'down', label: 'Eşli 101 Sandalyesi', tableId: 'okey101', game: 'okey101', seatIndex: 0 },
        { x: 660, y: 242, facing: 'left', label: 'Eşli 101 Sandalyesi', tableId: 'okey101', game: 'okey101', seatIndex: 1 },
        { x: 545, y: 330, facing: 'up', label: 'Eşli 101 Sandalyesi', tableId: 'okey101', game: 'okey101', seatIndex: 2 },
        { x: 430, y: 242, facing: 'right', label: 'Eşli 101 Sandalyesi', tableId: 'okey101', game: 'okey101', seatIndex: 3 }
    ],
    sokak: [
        { x: 292, y: 218, facing: 'down', label: 'Meydan Bankı' },
        { x: 512, y: 218, facing: 'down', label: 'Meydan Bankı' }
    ],
    cadde: [
        { x: 282, y: 226, facing: 'down', label: 'Bulvar Bankı (Sol)' },
        { x: 302, y: 226, facing: 'down', label: 'Bulvar Bankı (Sağ)' },
        { x: 452, y: 226, facing: 'down', label: 'Bulvar Bankı (Sol)' },
        { x: 472, y: 226, facing: 'down', label: 'Bulvar Bankı (Sağ)' }
    ],
    emlakci: [
        { x: 55, y: 425, facing: 'right', label: 'Müşteri Kanepe Koltuğu' },
        { x: 400, y: 68, facing: 'down', label: 'Danışman Koltuğu' }
    ],
    dedenin_yeri: [
        // Blackjack Masası Koltukları (E basınca oturur ve Blackjack açılır)
        { x: 364, y: 250, facing: 'up', label: 'Blackjack Koltuğu 1', tableId: 'blackjack', game: 'blackjack', seatIndex: 0 },
        { x: 400, y: 258, facing: 'up', label: 'Blackjack Koltuğu 2', tableId: 'blackjack', game: 'blackjack', seatIndex: 1 },
        { x: 436, y: 250, facing: 'up', label: 'Blackjack Koltuğu 3', tableId: 'blackjack', game: 'blackjack', seatIndex: 2 }
    ],
    market: [
        { x: 135, y: 183, facing: 'down', label: 'Showroom Koltuğu' },
        { x: 640, y: 280, facing: 'down', label: 'Showroom Sediri' },
        { x: 410, y: 392, facing: 'up', label: 'Showroom Sandalyesi' },
        { x: 415, y: 212, facing: 'up', label: 'Showroom Berjeri' }
    ],
    sahil: [
        // Tropik Bar Önü Tabureleri (Oturunca Kokteyl Menüsü Açılır)
        { x: 678, y: 462, facing: 'up', label: 'Tropik Bar Taburesi', game: 'cocktail_bar' },
        { x: 712, y: 462, facing: 'up', label: 'Tropik Bar Taburesi', game: 'cocktail_bar' },
        { x: 746, y: 462, facing: 'up', label: 'Tropik Bar Taburesi', game: 'cocktail_bar' },
        // Plaj Şezlongları
        { x: 600, y: 330, facing: 'right', label: 'Plaj Şezlongu' },
        { x: 606, y: 356, facing: 'right', label: 'Plaj Şezlongu' }
    ],
    sanalika_cadde: [
        // 1. Cadde & Durak Bankları
        { x: 440, y: 585, facing: 'down', label: '10. Cadde Durak Bankı' },
        { x: 520, y: 380, facing: 'down', label: '1. Cadde Bulvar Bankı' },
        { x: 790, y: 335, facing: 'down', label: 'Sonbahar Park Bankı' },
        { x: 910, y: 560, facing: 'left', label: 'Meydan Bankı' },
        // Sahil & Plaj Şezlongları
        { x: 1220, y: 760, facing: 'right', label: '1. Cadde Plaj Şezlongu' },
        { x: 1260, y: 810, facing: 'right', label: '1. Cadde Plaj Şezlongu' },
        { x: 1330, y: 840, facing: 'right', label: '1. Cadde Plaj Şezlongu' }
    ],
    star_caddesi: [
        // Star Bistro Açık Teras Sandalyeleri
        { x: 90, y: 152, facing: 'down', label: 'Bistro Sandalyesi' },
        { x: 90, y: 172, facing: 'up', label: 'Bistro Sandalyesi' },
        { x: 205, y: 152, facing: 'down', label: 'Bistro Sandalyesi' },
        { x: 205, y: 172, facing: 'up', label: 'Bistro Sandalyesi' },
        // Star Park & Süs Havuzu Bankları
        { x: 190, y: 510, facing: 'right', label: 'Star Park Bankı' },
        { x: 395, y: 510, facing: 'left', label: 'Star Park Bankı' },
        // Sahil Şezlongları
        { x: 900, y: 435, facing: 'down', label: 'Plaj Şezlongu' },
        { x: 945, y: 435, facing: 'down', label: 'Plaj Şezlongu' }
    ],
    meydanv2: [
        { x: 235, y: 195, facing: 'down', label: 'Bulvar Park Bankı' },
        { x: 440, y: 285, facing: 'down', label: 'Fıskiye Meydan Bankı' },
        { x: 590, y: 285, facing: 'down', label: 'Billboard Önü Bankı' },
        { x: 360, y: 405, facing: 'up', label: 'Çınar Altı Park Bankı' }
    ],
    sahilv2: [
        // Tropik Bar Önü Tabureleri (Oturunca Kokteyl Menüsü Otomatik Açılır)
        { x: 880, y: 446, facing: 'up', label: 'Tropik Bar Taburesi', game: 'cocktail_bar' },
        { x: 909, y: 446, facing: 'up', label: 'Tropik Bar Taburesi', game: 'cocktail_bar' },
        { x: 938, y: 446, facing: 'up', label: 'Tropik Bar Taburesi', game: 'cocktail_bar' },
        // Ahşap İskele Seyir & Balıkçı Bankları (İskele Ahşap Güverte Üzerinde)
        { x: 186, y: 110, facing: 'down-right', label: 'İskele Seyir Bankı' },
        { x: 356, y: 208, facing: 'down-right', label: 'İskele Balıkçı Bankı' },
        // Kamp Ateşi Ahşap Kütük Koltukları
        { x: 682, y: 486, facing: 'right', label: 'Kamp Ateşi Kütüğü' },
        { x: 746, y: 486, facing: 'left', label: 'Kamp Ateşi Kütüğü' },
        // Kumsal Güneşlenme Havluları
        { x: 585, y: 480, facing: 'down-right', label: 'Güneşlenme Havlusu' },
        { x: 610, y: 470, facing: 'down-right', label: 'Güneşlenme Havlusu' },
        { x: 745, y: 590, facing: 'down-left', label: 'Güneşlenme Havlusu' },
        { x: 772, y: 575, facing: 'down-left', label: 'Güneşlenme Havlusu' },
        { x: 885, y: 210, facing: 'down-left', label: 'Plaj Şemsiye Havlusu' }
    ],
    dostlar_kiraathanesi: [
        // 4 Kişilik Normal Batak Masası Sandalyeleri (cx: 320, cy: 230)
        { x: 320, y: 165, facing: 'down', label: 'Batak Masası Sandalyesi (Kuzey)', game: 'batak4', tableId: 'batak4' },
        { x: 320, y: 295, facing: 'up', label: 'Batak Masası Sandalyesi (Güney)', game: 'batak4', tableId: 'batak4' },
        { x: 255, y: 230, facing: 'right', label: 'Batak Masası Sandalyesi (Batı)', game: 'batak4', tableId: 'batak4' },
        { x: 385, y: 230, facing: 'left', label: 'Batak Masası Sandalyesi (Doğu)', game: 'batak4', tableId: 'batak4' },

        // 3 Kişilik Gömmeli Batak Masası Sandalyeleri (cx: 320, cy: 440)
        { x: 320, y: 380, facing: 'down', label: 'Gömmeli Batak Sandalyesi (Kuzey)', game: 'batak', tableId: 'batak' },
        { x: 375, y: 475, facing: 'left', label: 'Gömmeli Batak Sandalyesi (Güneydoğu)', game: 'batak', tableId: 'batak' },
        { x: 265, y: 475, facing: 'right', label: 'Gömmeli Batak Sandalyesi (Güneybatı)', game: 'batak', tableId: 'batak' },

        // 4 Kişilik Klasik Dost Kazığı Masası Sandalyeleri (cx: 720, cy: 230)
        { x: 720, y: 165, facing: 'down', label: 'Dost Kazığı Sandalyesi (Kuzey)', game: 'dost_kazigi', tableId: 'dost_kazigi' },
        { x: 720, y: 295, facing: 'up', label: 'Dost Kazığı Sandalyesi (Güney)', game: 'dost_kazigi', tableId: 'dost_kazigi' },
        { x: 655, y: 230, facing: 'right', label: 'Dost Kazığı Sandalyesi (Batı)', game: 'dost_kazigi', tableId: 'dost_kazigi' },
        { x: 785, y: 230, facing: 'left', label: 'Dost Kazığı Sandalyesi (Doğu)', game: 'dost_kazigi', tableId: 'dost_kazigi' },

        // 3 Kişilik Dost Kazığı Masası Sandalyeleri (cx: 720, cy: 440)
        { x: 720, y: 380, facing: 'down', label: '3 Kişilik Dost Kazığı Sandalyesi (Kuzey)', game: 'dost_kazigi_3p', tableId: 'dost_kazigi_3p' },
        { x: 775, y: 475, facing: 'left', label: '3 Kişilik Dost Kazığı Sandalyesi (Güneydoğu)', game: 'dost_kazigi_3p', tableId: 'dost_kazigi_3p' },
        { x: 665, y: 475, facing: 'right', label: '3 Kişilik Dost Kazığı Sandalyesi (Güneybatı)', game: 'dost_kazigi_3p', tableId: 'dost_kazigi_3p' },

        // Çay Ocağı Tezgah Tabureleri (x: 70, 130, 180, y: 162 - Oturunca İçecek Menüsü Açılır)
        { x: 70, y: 162, facing: 'up', label: 'Kıraathane Taburesi', game: 'kiraathane_bar' },
        { x: 130, y: 162, facing: 'up', label: 'Kıraathane Taburesi', game: 'kiraathane_bar' },
        { x: 180, y: 162, facing: 'up', label: 'Kıraathane Taburesi', game: 'kiraathane_bar' },

        // Sedir Dinlenme Alanı (Sağ Duvar)
        { x: 945, y: 250, facing: 'left', label: 'Kıraathane Sediri' },
        { x: 945, y: 330, facing: 'left', label: 'Kıraathane Sediri' }
    ]
};

const MAX_SIT_DIST = 62;
const MAX_SIT_DIST_SQ = MAX_SIT_DIST * MAX_SIT_DIST; // 3844

/**
 * 60 FPS Animasyon Döngüsünde Sıfır-Tahsis (Zero Garbage Collection) çalışan en yakın koltuğu bulma fonksiyonu.
 * Bellekte gereksiz dizi açmaz, sort çalıştırmaz; O(N) tek geçişte minimum kare mesafeyi bulur.
 */
function findNearestSittableSeat() {
    if (typeof players === 'undefined' || typeof myId === 'undefined' || !players[myId]) return null;
    let p = players[myId];
    let room = typeof currentRoom !== 'undefined' ? currentRoom : '';

    // 1. Statik Mekan Koltukları Kontrolü
    let staticSeats = STATIC_ROOM_SEATS[room];
    if (staticSeats) {
        let bestSeat = null;
        let minDistSq = MAX_SIT_DIST_SQ;
        for (let i = 0; i < staticSeats.length; i++) {
            let s = staticSeats[i];
            let dx = p.x - s.x;
            let dy = p.y - s.y;
            let d2 = dx * dx + dy * dy;
            if (d2 < minDistSq) {
                minDistSq = d2;
                bestSeat = s;
            }
        }
        return bestSeat;
    }

    // 2. Dinamik Ev Mobilyaları Kontrolü (house_*)
    if (room.startsWith("house_")) {
        let house = (typeof getCurrentViewingHouse === 'function') ? getCurrentViewingHouse() : null;
        if (!house || !house.furniture || house.furniture.length === 0) return null;

        let catTable = window.FURNITURE_CATALOG || {};
        let bestSeat = null;
        let minDistSq = MAX_SIT_DIST_SQ;

        for (let i = 0; i < house.furniture.length; i++) {
            let item = house.furniture[i];
            let cat = catTable[item.id] || { w: 60, h: 50 };
            let rot = ((item.rotation || 0) % 4 + 4) % 4;
            let isTransposed = (rot === 1 || rot === 3);
            let effW = isTransposed ? cat.h : cat.w;
            let effH = isTransposed ? cat.w : cat.h;
            let left = item.x - effW / 2;
            let right = item.x + effW / 2;
            let top = item.y - effH / 2;
            let bottom = item.y + effH / 2;

            let sitX = item.x;
            let sitY = item.y;
            let facing = 'down';
            let label = 'Mobilya';

            if (item.id === 'sedir') {
                if (rot === 0) {
                    sitX = Math.max(left + 16, Math.min(right - 16, p.x));
                    sitY = Math.round(item.y - 2);
                    facing = 'down';
                } else if (rot === 1) {
                    sitX = Math.round(item.x + 8);
                    sitY = Math.max(top + 16, Math.min(bottom - 16, p.y));
                    facing = 'right';
                } else if (rot === 2) {
                    sitX = Math.max(left + 16, Math.min(right - 16, p.x));
                    sitY = Math.round(item.y + 12);
                    facing = 'up';
                } else if (rot === 3) {
                    sitX = Math.round(item.x - 8);
                    sitY = Math.max(top + 16, Math.min(bottom - 16, p.y));
                    facing = 'left';
                }
                label = 'Sedir';
            } else if (item.id === 'berjer') {
                let dirs = ['down', 'right', 'up', 'left'];
                facing = dirs[rot];
                label = 'Berjer';
            } else if (item.id === 'bilgisayar') {
                let dirs = ['up', 'left', 'down', 'right'];
                let offX = [0, 16, 0, -16][rot];
                let offY = [16, 0, -16, 0][rot];
                sitX = item.x + offX;
                sitY = item.y + offY;
                facing = dirs[rot];
                label = 'Çalışma Koltuğu';
            } else if (item.id === 'piyano') {
                sitX = item.x;
                sitY = item.y + 18;
                facing = 'up';
                label = 'Piyano Taburesi';
            } else if (item.id === 'yemek_masasi') {
                let isTop = (p.y < item.y);
                sitX = p.x < item.x ? item.x - 20 : item.x + 20;
                sitY = isTop ? item.y - 18 : item.y + 18;
                facing = isTop ? 'down' : 'up';
                label = 'Yemek Sandalyesi';
            } else {
                continue;
            }

            let dx = p.x - sitX;
            let dy = p.y - sitY;
            let d2 = dx * dx + dy * dy;
            if (d2 < minDistSq) {
                minDistSq = d2;
                bestSeat = { x: sitX, y: sitY, facing: facing, label: label, dist: Math.sqrt(d2) };
            }
        }
        return bestSeat;
    }

    return null;
}

/**
 * Koltuğa oturulduğunda ilgili oyun ekranını/menüsünü otomatik olarak açar.
 */
function openGameForSeat(seat) {
    if (!seat) return;
    let gameType = seat.game || seat.tableId;
    if (!gameType) return;

    if (gameType === 'blackjack') {
        if (typeof openBlackjackModal === 'function') {
            openBlackjackModal();
            let timerFn = (typeof setTimeout !== 'undefined') ? setTimeout : (typeof window !== 'undefined' ? window.setTimeout : null);
            if (timerFn && seat.seatIndex !== undefined && window.socket) {
                timerFn(() => {
                    if (typeof bjTakeSeat === 'function') bjTakeSeat(seat.seatIndex);
                    else if (window.socket) window.socket.emit('blackjack_sit', { seatIndex: seat.seatIndex });
                }, 150);
            }
        }
    } else if (gameType === 'batak' || gameType === 'batak4' || gameType === 'tavla' || gameType === 'chess' || gameType === 'okey101' || gameType === 'okey101_tekli' || gameType === 'billiard' || gameType === 'xox' || gameType === 'amiral' || gameType === 'dost_kazigi' || gameType === 'dost_kazigi_3p') {
        if (window.socket) {
            window.socket.emit('requestTableOptions', gameType);
        } else if (gameType === 'xox' && typeof openXoxModal === 'function') {
            openXoxModal();
        } else if (gameType === 'amiral' && typeof openAmiralBattiModal === 'function') {
            openAmiralBattiModal();
        }
    } else if (gameType === 'cocktail_bar') {
        if (typeof openCocktailBarModal === 'function') {
            openCocktailBarModal();
        }
    } else if (gameType === 'kiraathane_bar') {
        if (typeof openKiraathaneBarModal === 'function') {
            openKiraathaneBarModal();
        }
    }
}
window.openGameForSeat = openGameForSeat;

/**
 * Oyuncuyu tespit edilen en yakın koltuğa oturtur ve oyun masasıysa ekranını açar.
 * @returns {boolean} Oturma gerçekleştiyse true
 */
function checkAndSitOnNearestFurnitureOrChair() {
    let seat = findNearestSittableSeat();
    if (seat && typeof sitPlayerAt === 'function') {
        sitPlayerAt(seat.x, seat.y, seat.facing);
        openGameForSeat(seat);
        return true;
    }
    return false;
}

// Global Erişim İçin window Nesnesine Kaydet
window.STATIC_ROOM_SEATS = STATIC_ROOM_SEATS;
window.findNearestSittableSeat = findNearestSittableSeat;
window.checkAndSitOnNearestFurnitureOrChair = checkAndSitOnNearestFurnitureOrChair;

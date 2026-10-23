// src/config.js - Mini Metaverse Konfigürasyon ve Sabitleri
const path = require('path');
const economyPrices = require('../public/js/economyPrices');

module.exports = {
    // Port ve Ağ
    PORT: process.env.PORT || 3000,

    // Kalıcı Veri Yolları
    DATA_FILE: path.resolve(__dirname, '../data.json'),
    BACKUP_FILE: path.resolve(__dirname, '../data.json.bak'),
    TEMP_FILE: path.resolve(__dirname, '../data.json.tmp'),



    // Başlangıç Masa Şablonları
    BASE_TABLE_CONFIGS: {
        billiard: { min: 2, name: '8-Ball Bilardo', type: 'billiard' },
        batak: { min: 3, name: 'Gömmeli Batak (3 Kişi)', type: 'batak' },
        batak4: { min: 4, name: 'Normal Batak (4 Kişi)', type: 'batak4' },
        tavla: { min: 2, name: 'Klasik Tavla', type: 'tavla' },
        xox: { min: 2, name: 'XOX Düellosu', type: 'xox' },
        amiral: { min: 2, name: 'Amiral Battı', type: 'amiral' },
        okey101: { min: 4, name: '101 Okey (Çiftli / Eşli)', type: 'okey101', mode: 'esli' },
        okey101_tekli: { min: 4, name: '101 Okey (Tekli)', type: 'okey101_tekli', mode: 'tekli' },
        dost_kazigi: { min: 4, name: 'Dost kazığı (4 kişilik)', type: 'dost_kazigi', mode: 'tek_deste', deckMode: 'tek_deste' },
        dost_kazigi_3p: { min: 3, name: 'Dost kazığı (3 kişilik)', type: 'dost_kazigi_3p', mode: 'tek_deste', deckMode: 'tek_deste' },
        chess: { min: 2, name: 'Satranç', type: 'chess' }
    },

    // Varsayılan Masalar
    DEFAULT_TABLES: {
        billiard: { id: 'billiard', baseType: 'billiard', name: '8-Ball Bilardo', min: 2, bet: 0, pot: 0, players: [], spectators: [] },
        batak: { id: 'batak', baseType: 'batak', name: 'Gömmeli Batak (3 Kişi)', min: 3, bet: 0, pot: 0, players: [], spectators: [] },
        batak4: { id: 'batak4', baseType: 'batak4', name: 'Normal Batak (4 Kişi)', min: 4, bet: 0, pot: 0, players: [], spectators: [] },
        tavla: { id: 'tavla', baseType: 'tavla', name: 'Klasik Tavla', min: 2, bet: 0, pot: 0, players: [], spectators: [] },
        xox: { id: 'xox', baseType: 'xox', name: 'XOX Düellosu', min: 2, bet: 0, pot: 0, players: [], spectators: [] },
        amiral: { id: 'amiral', baseType: 'amiral', name: 'Amiral Battı', min: 2, bet: 0, pot: 0, players: [], spectators: [] },
        chess: { id: 'chess', baseType: 'chess', name: 'Satranç Masası', min: 2, bet: 0, pot: 0, timeMode: '10m', players: [], spectators: [] },
        okey101: { id: 'okey101', baseType: 'okey101', name: '101 Okey (Çiftli / Eşli)', min: 4, bet: 0, pot: 0, mode: 'esli', players: [], spectators: [] },
        okey101_tekli: { id: 'okey101_tekli', baseType: 'okey101_tekli', name: '101 Okey (Tekli)', min: 4, bet: 0, pot: 0, mode: 'tekli', players: [], spectators: [] },
        dost_kazigi: { id: 'dost_kazigi', baseType: 'dost_kazigi', name: 'Dost kazığı (4 kişilik)', min: 4, bet: 0, pot: 0, mode: 'tek_deste', deckMode: 'tek_deste', players: [], spectators: [] },
        dost_kazigi_3p: { id: 'dost_kazigi_3p', baseType: 'dost_kazigi_3p', name: 'Dost kazığı (3 kişilik)', min: 3, bet: 0, pot: 0, mode: 'tek_deste', deckMode: 'tek_deste', players: [], spectators: [] }
    },

    // Sunucu satın alımları ve tarayıcı katalogları ortak fiyat kaynağını kullanır.
    WARDROBE_ITEM_PRICES: economyPrices.WARDROBE_ITEM_PRICES,
    DAILY_QUEST_REWARDS: economyPrices.DAILY_QUEST_REWARDS,

    // Konut Fiyatları & İsimleri
    HOUSE_PRICES: economyPrices.HOUSE_PRICES,
    HOUSE_NAMES: {
        'standart': 'Standart Şehir Dairesi',
        'garden': 'Verandalı Bahçeli Ev',
        'pool': 'Bahçeli & Havuzlu Villa'
    },

    // Mobilya Fiyatları
    FURNITURE_PRICES: economyPrices.FURNITURE_PRICES,

    // Balık Tutma Ganimet Tablosu (Kıyıdan)
    FISH_LOOT_TABLE: [
        { id: 'cizme', name: "Eski Çizme", emoji: "🥾", value: 0, weight: 18, desc: "Eski bir çizme çektin! Deniz temizliği için teşekkürler." },
        { id: 'hamsi', name: "Karadeniz Hamsisi", emoji: "🐟", value: 1, weight: 26, desc: "Taze bir Karadeniz Hamsisi yakaladın!" },
        { id: 'istavrit', name: "Gümüş İstavrit", emoji: "🐟", value: 3, weight: 18, desc: "Çıtır bir Gümüş İstavrit yakaladın!" },
        { id: 'lufer', name: "Boğaz Lüferi", emoji: "🐟", value: 8, weight: 16, desc: "Harika! Boğazın sultanı taze bir Lüfer yakaladın!" },
        { id: 'cipura', name: "Ege Çipurası", emoji: "🐠", value: 10, weight: 13, desc: "Nefis bir Ege Çipurası tuttun!" },
        { id: 'levrek', name: "Deniz Levreği", emoji: "🐟", value: 20, weight: 8, desc: "Büyük bir Deniz Levreği çektin!" },
        { id: 'ahtapot', name: "Kaya Ahtapotu", emoji: "🐙", value: 35, weight: 5, desc: "Kolları kıpır kıpır bir Kaya Ahtapotu yakaladın!" },
        { id: 'inci', name: "Nadir İnci", emoji: "🦪", value: 50, weight: 3, desc: "✨ EFSANEVİ! İstiridye içinden parıldayan Nadir İnci çıktı!" }
    ],

    // Kuğu Bisikleti İle Açık Deniz Ganimet Tablosu
    SWAN_BOAT_LOOT_TABLE: [
        { id: 'hamsi', name: "Karadeniz Hamsisi", emoji: "🐟", value: 1, weight: 8, desc: "Taze bir Karadeniz Hamsisi yakaladın!" },
        { id: 'istavrit', name: "Gümüş İstavrit", emoji: "🐟", value: 3, weight: 10, desc: "Çıtır bir Gümüş İstavrit yakaladın!" },
        { id: 'lufer', name: "Boğaz Lüferi", emoji: "🐟", value: 8, weight: 14, desc: "Harika! Boğazın sultanı taze bir Lüfer yakaladın!" },
        { id: 'cipura', name: "Ege Çipurası", emoji: "🐠", value: 10, weight: 15, desc: "Nefis bir Ege Çipurası tuttun!" },
        { id: 'levrek', name: "Deniz Levreği", emoji: "🐟", value: 20, weight: 15, desc: "Büyük bir Deniz Levreği çektin!" },
        { id: 'ahtapot', name: "Kaya Ahtapotu", emoji: "🐙", value: 35, weight: 14, desc: "Kolları kıpır kıpır bir Kaya Ahtapotu yakaladın!" },
        { id: 'inci', name: "Nadir İnci", emoji: "🦪", value: 50, weight: 14, desc: "✨ EFSANEVİ! İstiridye içinden parıldayan Nadir İnci çıktı!" },
        { id: 'mercan', name: "Altın Mercan", emoji: "🪸", value: 75, weight: 10, desc: "🌟 Muhteşem parıltı! Derin sulardan Altın Mercan çıkardın!" },
        { id: 'hazine', name: "Antik Hazine Sandığı", emoji: "🪙", value: 100, weight: 8, desc: "👑 İNANILMAZ! Kuğu bisikletiyle açık denizden altın dolu Antik Hazine Sandığı çektin!" },
        { id: 'baban', name: "Baban", emoji: "🧔‍♂️", value: 300, weight: 3, desc: "🌊 Denizden baban çıktı! 'Denizden babam çıksa yerim' deyimi gerçek oldu!" }
    ]
};

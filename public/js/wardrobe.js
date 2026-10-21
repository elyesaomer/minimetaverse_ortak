// public/js/wardrobe.js - Gardırop, Kıyafet Kataloğu ve Özelleştirme Arayüzü

let myMoney = 2000;
let myInventory = {
    hats: ['none', 'bere'],
    faces: ['none'],
    skins: ['#facc15'],
    outfits: ['outfit_camo_set', 'outfit_c2_gentleman'],
    tshirts: ['tshirt_divalar', '#3b82f6'],
    pants: ['pants_camo_cargo', 'pants_classic_jeans'],
    shirts: ['#3b82f6'],
    shoes: ['none', 'sneakers'],
    watches: ['none'],
    props: ['none']
};
let myAvatar = {
    model: 'classic_2',
    hat: 'bere',
    face: 'none',
    skinColor: '#facc15',
    color: '#3b82f6',
    shirt: '#3b82f6',
    pants: 'pants_classic_jeans',
    outfit: null,
    watch: 'none',
    heldItem: 'none',
    shoes: 'sneakers'
};

const WARDROBE_CATALOG = {
    hats: [
        { id: 'none', name: 'Yok', cost: 0, icon: '🚫', model: 'all' },
        // 2.5D İzometrik Saç Koleksiyonu
        { id: 'hair_sanalika_dreadlocks', name: 'Kızıl Rasta & Bandana', cost: 0, icon: '🧑‍🦰', model: 'sanalika_v2' },
        { id: 'hair_sanalika_street', name: 'Sokak Diken Saç', cost: 220, icon: '💇‍♂️', model: 'sanalika_v2' },
        { id: 'hair_sanalika_wavy', name: 'Dalgalı Salaş Saç', cost: 250, icon: '💇', model: 'sanalika_v2' },
        // Klasik & Klasik 2 Şapkalar & Saç Modelleri
        { id: 'bere', name: 'Kırmızı Bere', cost: 200, icon: '🔴', gender: 'male', model: ['classic', 'classic_2'] },
        { id: 'kasket', name: 'Kıraathane Kasketi', cost: 260, icon: '🧢', gender: 'male', model: ['classic', 'classic_2'] },
        { id: 'fes', name: 'Osmanlı Fesi', cost: 320, icon: '🏮', gender: 'male', model: ['classic', 'classic_2'] },
        { id: 'cowboy', name: 'Kovboy Şapkası', cost: 380, icon: '🤠', gender: 'male', model: ['classic', 'classic_2'] },
        { id: 'korsan', name: 'Korsan Kaptanı', cost: 420, icon: '🏴‍☠️', model: ['classic', 'classic_2'] },
        { id: 'sihirbaz', name: 'Sihirbaz Silindiri', cost: 360, icon: '🎩', model: ['classic', 'classic_2'] },
        { id: 'kulaklik', name: 'DJ Kulaklığı', cost: 250, icon: '🎧', model: ['classic', 'classic_2'] },
        // Kadın Saç Modelleri & Şapkalar
        { id: 'hair_long', name: 'Uzun Düz Saç', cost: 260, icon: '👩', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'hair_wavy', name: 'Dalgalı Saç', cost: 320, icon: '💇‍♀️', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'hair_ponytail', name: 'At Kuyruğu', cost: 280, icon: '👱‍♀️', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'hair_braids', name: 'Örgülü Saç', cost: 290, icon: '👧', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'hair_bob', name: 'Küt Kesim Saç', cost: 240, icon: '👩‍🦰', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'hair_hijab', name: 'Şık Başörtüsü', cost: 250, icon: '🧕', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'beret_pink', name: 'Pembe Fransız Bere', cost: 260, icon: '🌸', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'crown', name: 'Prenses Tacı', cost: 480, icon: '👑', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'hair_blonde_curls', name: 'Altın Bukleli Uzun Saç', cost: 310, icon: '👱‍♀️', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'hair_bun_chopsticks', name: 'Zarif Topuz & Çiçekli Toka', cost: 290, icon: '🌸', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'hair_redhead_wavy', name: 'Kızıl Dalgalı Romantik Saç', cost: 300, icon: '👩‍🦰', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'hair_pigtails_ribbon', name: 'Kurdeleli İkili Yan Saç', cost: 280, icon: '🎀', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'hair_curly_brown', name: 'Kıvırcık Kahverengi Saç', cost: 290, icon: '👩‍🦱', gender: 'female', model: ['classic', 'classic_2'] }
    ],
    faces: [
        { id: 'none', name: 'Sade', cost: 0, icon: '🙂', model: 'all' },
        { id: 'mustache', name: 'Pala Bıyık', cost: 240, icon: '🥸', gender: 'male', model: 'all' },
        { id: 'sunglasses', name: 'Havalı Gözlük', cost: 300, icon: '🕶️', model: 'all' },
        { id: 'beard', name: 'Kirli Sakal', cost: 360, icon: '🧔', gender: 'male', model: 'all' }
    ],
    skins: [
        { id: '#facc15', name: 'Klasik Sarı', cost: 0, color: '#facc15', model: 'all' },
        { id: '#ffd1a4', name: 'Açık Ten', cost: 240, color: '#ffd1a4', model: 'all' },
        { id: '#d2996c', name: 'Buğday Ten', cost: 300, color: '#d2996c', model: 'all' },
        { id: '#8d5524', name: 'Esmer Ten', cost: 360, color: '#8d5524', model: 'all' }
    ],
    // 1. KIYAFET / TAKIM (Hem Alt Hem Üst Set)
    outfits: [
        // 2.5D İzometrik Setler
        { id: 'outfit_camo_set', name: 'Siyah Tişört & Kargo Seti', cost: 0, color: '#18181b', icon: '🩳', isOutfit: true, model: 'sanalika_v2' },
        { id: 'outfit_street_tracksuit', name: 'Sokak Eşofman Takımı', cost: 260, color: '#312e81', icon: '🏃', isOutfit: true, model: 'sanalika_v2' },
        { id: 'overalls_blue', name: 'Mavi İşçi Tulumu', cost: 280, color: '#2563eb', icon: '🧑‍🔧', isOutfit: true, model: 'sanalika_v2' },
        
        // Klasik 2 Özel Tasarım Setler (Yeni Model için Özel Kombinler)
        { id: 'outfit_c2_gentleman', name: 'Beyefendi Yelekli Takım', cost: 380, color: '#334155', icon: '🤵', isOutfit: true, model: 'classic_2', description: 'Yelekli şık ceket, kravat ve kumaş pantolon' },
        { id: 'outfit_c2_street_cool', name: 'Sokak Stili Bomber & Jean', cost: 340, color: '#0f766e', icon: '🧥', isOutfit: true, model: 'classic_2', description: 'Yeşil bomber ceket, beyaz tişört ve rahat jean' },
        { id: 'outfit_c2_casual_polo', name: 'Marin Çizgili Polo & Chino', cost: 310, color: '#1e3a8a', icon: '👕', isOutfit: true, model: 'classic_2', description: 'Lacivert-beyaz marin polo ve bej chino pantolon' },
        { id: 'outfit_c2_femme_chic', name: 'Zarif Pastel Blazer Takım', cost: 360, color: '#ec4899', icon: '💃', gender: 'female', isOutfit: true, model: 'classic_2', description: 'Pastel pembe şık blazer ceket ve kalem etek' },

        // Klasik & Klasik 2 Kadın Elbiseleri
        { id: 'dress_pink', name: 'Pembe Çiçekli Elbise', cost: 280, color: '#ec4899', icon: '👗', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'dress_black', name: 'Zarif Siyah Gece Elbisesi', cost: 380, color: '#18181b', icon: '👗', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'dress_red', name: 'Kırmızı Kokteyl Elbisesi', cost: 310, color: '#e11d48', icon: '💃', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'dress_emerald', name: 'Zümrüt Yeşil İpek Elbise', cost: 340, color: '#059669', icon: '👗', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'dress_lavender', name: 'Lavanta Bahar Elbisesi', cost: 290, color: '#c084fc', icon: '🌸', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'dress_bridal', name: 'Masalsı Beyaz Gelinlik', cost: 490, color: '#ffffff', icon: '👰', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'outfit_goth', name: 'Gotik Elbise Kombini', cost: 360, color: '#581c87', icon: '🖤', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'outfit_business', name: 'Pudra Şık Kadın Takımı', cost: 330, color: '#fb7185', icon: '🧥', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'outfit_boho', name: 'Bohem Şifon Elbise & Yelek', cost: 280, color: '#ea580c', icon: '🌻', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'outfit_sporty', name: 'Pastel Fitness Takımı', cost: 250, color: '#38bdf8', icon: '🎽', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'dress_vintage_polka', name: 'Vintage Puantiyeli Elbise', cost: 300, color: '#dc2626', icon: '💃', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'dress_ocean_blue', name: 'Okyanus Mavisi Elbise', cost: 270, color: '#06b6d4', icon: '🌊', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] },
        { id: 'outfit_turtleneck_skirt', name: 'Krem Balıkçı & Ekose Takım', cost: 290, color: '#fef3c7', icon: '🧣', gender: 'female', isOutfit: true, model: ['classic', 'classic_2'] }
    ],
    // 2. TİŞÖRT / ÜST (Sadece Üst)
    tshirts: [
        // 2.5D İzometrik Modele Özel Tişörtler (Klasik modelden kaldırıldı)
        { id: 'tshirt_divalar', name: '"Divalar Yemek Yapmaz" Tişört', cost: 0, color: '#ffffff', icon: '✨', description: 'Özel baskılı beyaz tişört', model: 'sanalika_v2' },
        { id: 'tshirt_black_fitted', name: 'Fitted Siyah Tişört', cost: 120, color: '#18181b', icon: '👕', model: 'sanalika_v2' },
        { id: 'tshirt_hoodie_purple', name: 'Mor Sokak Hoodie', cost: 240, color: '#581c87', icon: '🧥', model: 'sanalika_v2' },
        { id: 'tshirt_polo_striped', name: 'Çizgili Retro Polo Yaka', cost: 200, color: '#f8fafc', icon: '👕', model: 'sanalika_v2' },
        { id: 'tshirt_leather_jacket', name: 'Motorcu Deri Ceket', cost: 350, color: '#09090b', icon: '🥼', model: 'sanalika_v2' },

        // Klasik & Klasik 2 Tişörtler ve Üstler
        { id: '#3b82f6', name: 'Mavi Tişört', cost: 0, color: '#3b82f6', icon: '👕', model: ['classic', 'classic_2'] },
        { id: '#ef4444', name: 'Kırmızı Tişört', cost: 100, color: '#ef4444', icon: '👕', model: ['classic', 'classic_2'] },
        { id: '#10b981', name: 'Yeşil Tişört', cost: 100, color: '#10b981', icon: '👕', model: ['classic', 'classic_2'] },
        { id: '#8b5cf6', name: 'Mor Tişört', cost: 100, color: '#8b5cf6', icon: '👕', model: ['classic', 'classic_2'] },
        { id: '#f59e0b', name: 'Turuncu Tişört', cost: 100, color: '#f59e0b', icon: '👕', model: ['classic', 'classic_2'] },
        { id: '#0f172a', name: 'Gece Siyahı Tişört', cost: 100, color: '#0f172a', icon: '👕', model: ['classic', 'classic_2'] },
        { id: 'polo', name: 'Beyaz Polo Yaka', cost: 160, color: '#f8fafc', icon: '👔', model: ['classic', 'classic_2'] },
        { id: 'hoodie', name: 'Oversize Hoodie', cost: 220, color: '#6366f1', icon: '🧥', model: ['classic', 'classic_2'] },
        { id: 'leather', name: 'Klasik Deri Ceket', cost: 350, color: '#18181b', icon: '🥼', model: ['classic', 'classic_2'] },
        { id: 'skirt_crop', name: 'Pembe Crop Üst', cost: 220, color: '#f43f5e', icon: '👚', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'skirt_denim', name: 'Kot Ceket & Üst', cost: 240, color: '#38bdf8', icon: '🎽', gender: 'female', model: ['classic', 'classic_2'] }
    ],
    // 3. PANTOLON / ALT (Sadece Alt)
    pants: [
        // 2.5D İzometrik Pantolonlar (Klasik modelden ayrıldı)
        { id: 'pants_camo_cargo', name: 'Kamuflaj Kargo Şort', cost: 0, color: '#4b5563', icon: '🩳', model: 'sanalika_v2' },
        { id: 'pants_jeans_street', name: 'Yırtık Sokak Jean Pantolon', cost: 190, color: '#3b82f6', icon: '👖', model: 'sanalika_v2' },
        { id: 'pants_chino_beige', name: 'Bej Chino Pantolon', cost: 160, color: '#d97706', icon: '👖', model: 'sanalika_v2' },
        { id: 'pants_jogger_black', name: 'Siyah Sokak Jogger', cost: 200, color: '#18181b', icon: '👖', model: 'sanalika_v2' },
        { id: 'pants_skirt_crop', name: 'Pileli Mini Etek', cost: 220, color: '#f43f5e', icon: '👗', gender: 'female', model: 'sanalika_v2' },
        { id: 'pants_skirt_denim', name: 'Kot Mini Etek', cost: 210, color: '#3b82f6', icon: '👗', gender: 'female', model: 'sanalika_v2' },

        // Klasik & Klasik 2 Pantolonlar (Klasik Vücut Oranlarına Özel)
        { id: 'pants_classic_jeans', name: 'Klasik Mavi Jean', cost: 0, color: '#2563eb', icon: '👖', model: ['classic', 'classic_2'], description: 'Rahat kesim klasik mavi kot pantolon' },
        { id: 'pants_classic_black', name: 'Klasik Kumaş Siyah', cost: 190, color: '#1e293b', icon: '👖', model: ['classic', 'classic_2'], description: 'Resmi ve şık siyah kumaş pantolon' },
        { id: 'pants_classic_beige', name: 'Klasik Bej Chino', cost: 170, color: '#d4b996', icon: '👖', model: ['classic', 'classic_2'], description: 'Zarif bej keten chino pantolon' },
        { id: 'pants_classic_cargo_olive', name: 'Zeytin Yeşili Kargo', cost: 200, color: '#4d5d3b', icon: '👖', model: ['classic', 'classic_2'], description: 'Çok cepli rahat zeytin yeşili kargo' },
        { id: 'pants_classic_white_skirt', name: 'Klasik Beyaz Pileli Etek', cost: 210, color: '#ffffff', icon: '👗', gender: 'female', model: ['classic', 'classic_2'], description: 'Zarif beyaz mini pileli etek' }
    ],
    // 4. KOL SAATLERİ (Klasik 2 Özel Koleksiyonu)
    watches: [
        { id: 'none', name: 'Saat Yok', cost: 0, icon: '🚫', model: 'classic_2' },
        { id: 'watch_gold_rolex', name: 'Altın Prestij Saat', cost: 500, icon: '⌚', color: '#facc15', model: 'classic_2', description: 'Lüks altın kaplama kordonlu prestij saati' },
        { id: 'watch_leather_classic', name: 'Deri Kordonlu Klasik Saat', cost: 350, icon: '⌚', color: '#78350f', model: 'classic_2', description: 'Klasik kahverengi deri kordonlu saat' },
        { id: 'watch_cyber_sport', name: 'Neon Spor Kronometre', cost: 420, icon: '⏱️', color: '#06b6d4', model: 'classic_2', description: 'Turkuaz neon dijital ekranlı spor saat' }
    ],
    shoes: [
        { id: 'none', name: 'Yalınayak', cost: 0, icon: '🦶', model: 'all' },
        { id: 'sanalika_white_sneakers', name: 'Beyaz Sokak Sneaker', cost: 0, icon: '👟', model: 'sanalika_v2' },
        { id: 'sanalika_skate_shoes', name: 'Sokak Kaykay Ayakkabısı', cost: 180, icon: '🛹', model: 'sanalika_v2' },
        { id: 'sneakers', name: 'Spor Sneaker', cost: 180, icon: '👟', model: ['classic', 'classic_2'] },
        { id: 'classic', name: 'Kösele Klasik Ayakkabı', cost: 240, icon: '👞', model: ['classic', 'classic_2'] },
        { id: 'boots', name: 'Kışlık Bot', cost: 280, icon: '🥾', model: ['classic', 'classic_2'] },
        { id: 'heels', name: 'Topuklu Stiletto', cost: 320, icon: '👠', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'heels_gold', name: 'Altın Simli Stiletto', cost: 340, icon: '👠', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'boots_thigh_high', name: 'Diz Üstü Süet Çizme', cost: 350, icon: '👢', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'sandals_gladiator', name: 'İncili Gladyatör Sandalet', cost: 220, icon: '👡', gender: 'female', model: ['classic', 'classic_2'] },
        { id: 'flats', name: 'Babet & Düz Ayakkabı', cost: 190, icon: '🥿', gender: 'female', model: ['classic', 'classic_2'] }
    ],
    props: [
        { id: 'none', name: 'Boş El', cost: 0, icon: '✋', model: 'all' },
        { id: 'baglama', name: 'Anadolu Bağlaması', cost: 440, icon: '🪕', model: 'all' },
        { id: 'gitar', name: 'Akustik Gitar', cost: 700, icon: '🎸', model: 'all' },
        { id: 'sirtcantasi', name: 'Gezgin Sırt Çantası', cost: 440, icon: '🎒', model: 'all' },
        { id: 'nargile', name: 'Tüten Nargile', cost: 1400, icon: '💨', model: 'all' },
        { id: 'cay', name: 'İnce Belli Çay', cost: 200, icon: '☕', model: 'all' },
        { id: 'oralet', name: 'Sıcak Kıraathane Oraleti', cost: 300, icon: '🍵', model: 'all' },
        { id: 'kahve', name: 'Közde Türk Kahvesi', cost: 220, icon: '☕', model: 'all' },
        { id: 'balon', name: 'Uçan Balon', cost: 240, icon: '🎈', model: 'all' },
        { id: 'gazoz', name: 'Nostaljik Gazoz', cost: 280, icon: '🍾', model: 'all' },
        { id: 'tespih', name: 'Kehribar Tespih', cost: 800, icon: '📿', model: 'all' },
        { id: 'tespih2', name: 'Çift Katmanlı Tespih', cost: 900, icon: '📿', model: 'all' },
        { id: 'olta', name: 'Balıkçı Oltası', cost: 400, icon: '🎣', model: 'all' },
        { id: 'asagold', name: 'Yıldızlı Büyü Asası', cost: 520, icon: '🪄', model: 'all' },
        { id: 'kupa', name: 'Şampiyonluk Kupası', cost: 580, icon: '🏆', model: 'all' },
        { id: 'kilic', name: 'Orta Çağ Kılıcı', cost: 500, icon: '🗡️', model: 'all' },
        { id: 'oyuncak_araba', name: 'Küçük Oyuncak Araba', cost: 600, icon: '🚗', model: 'all' },
        { id: 'sigara', name: 'Tüten Sigara', cost: 10000, icon: '🚬', model: 'all', description: 'Hafif dumanı tüten karizmatik el sigarası.' }
    ]
};
for (const [category, items] of Object.entries(WARDROBE_CATALOG)) {
    if (category === 'shirts') continue;
    for (const item of items) {
        const priceKey = `${category}_${item.id}`;
        const price = window.METAVERSE_PRICES.WARDROBE_ITEM_PRICES[priceKey];
        if (price === undefined) {
            throw new Error(`Missing shared wardrobe price: ${priceKey}`);
        }
        item.cost = price;
    }
}
WARDROBE_CATALOG.shirts = WARDROBE_CATALOG.tshirts;

let currentWardrobeTab = 'hats';
let wardrobeGenderFilter = 'all';

function setWardrobeGenderFilter(filter) {
    wardrobeGenderFilter = filter;
    document.querySelectorAll('.wardrobe-gender-btn').forEach(btn => btn.classList.remove('active'));
    if (filter === 'female') document.getElementById('genderFilterFemale')?.classList.add('active');
    else if (filter === 'male') document.getElementById('genderFilterMale')?.classList.add('active');
    else document.getElementById('genderFilterAll')?.classList.add('active');
    renderWardrobeActiveGrid();
}
window.setWardrobeGenderFilter = setWardrobeGenderFilter;
let isWardrobeOpen = false;

function updateMoneyDisplay(amount) {
    myMoney = amount;
    window.myMoney = amount;
    const badge = document.getElementById('moneyDisplay');
    const uBadge = document.getElementById('userMoneyDisplay');
    const wBadge = document.getElementById('wardrobeMoneyDisplay');
    const mBadge = document.getElementById('marketMoneyDisplay');
    if (badge) badge.innerText = myMoney;
    if (uBadge) uBadge.innerText = myMoney;
    if (wBadge) wBadge.innerText = myMoney;
    if (mBadge) mBadge.innerText = myMoney;
}

let previewAvatar = {
    model: 'classic_2',
    hat: 'bere',
    face: 'none',
    skinColor: '#facc15',
    color: '#3b82f6',
    shirt: '#3b82f6',
    pants: 'pants_classic_jeans',
    outfit: null,
    watch: 'none',
    heldItem: 'none',
    shoes: 'sneakers'
};

function itemMatchesModel(itemModel, currentModel) {
    if (!itemModel || itemModel === 'all') return true;
    if (Array.isArray(itemModel)) {
        return itemModel.includes(currentModel);
    }
    return itemModel === currentModel;
}

function sanitizeAvatarForModel(av, targetModel) {
    if (!av) return;
    if (targetModel === 'classic') targetModel = 'classic_2';
    if (targetModel === 'sanalika_v2') {
        let hatItem = WARDROBE_CATALOG.hats.find(h => h.id === av.hat);
        if (!hatItem || !itemMatchesModel(hatItem.model, 'sanalika_v2')) {
            av.hat = 'hair_sanalika_dreadlocks';
        }
        let shoeItem = (WARDROBE_CATALOG.shoes || []).find(s => s.id === av.shoes);
        if (!shoeItem || !itemMatchesModel(shoeItem.model, 'sanalika_v2')) {
            av.shoes = 'sanalika_white_sneakers';
        }
        if (av.outfit) {
            let outItem = (WARDROBE_CATALOG.outfits || []).find(o => o.id === av.outfit);
            if (outItem && !itemMatchesModel(outItem.model, 'sanalika_v2')) {
                av.outfit = null;
                av.shirt = 'tshirt_divalar';
                av.color = 'tshirt_divalar';
                av.pants = 'pants_camo_cargo';
            }
        }
        let shirtItem = (WARDROBE_CATALOG.tshirts || []).find(t => t.id === av.shirt || t.id === av.color);
        if (shirtItem && !itemMatchesModel(shirtItem.model, 'sanalika_v2')) {
            av.shirt = 'tshirt_divalar';
            av.color = 'tshirt_divalar';
        }
        let pantsItem = (WARDROBE_CATALOG.pants || []).find(p => p.id === av.pants);
        if (pantsItem && !itemMatchesModel(pantsItem.model, 'sanalika_v2')) {
            av.pants = 'pants_camo_cargo';
        }
    } else if (targetModel === 'classic_2') {
        let hatItem = WARDROBE_CATALOG.hats.find(h => h.id === av.hat);
        if (hatItem && !itemMatchesModel(hatItem.model, 'classic_2')) {
            av.hat = 'bere';
        }
        let shoeItem = (WARDROBE_CATALOG.shoes || []).find(s => s.id === av.shoes);
        if (shoeItem && !itemMatchesModel(shoeItem.model, 'classic_2')) {
            av.shoes = 'sneakers';
        }
        let shirtItem = (WARDROBE_CATALOG.tshirts || []).find(t => t.id === av.shirt || t.id === av.color);
        if (shirtItem && !itemMatchesModel(shirtItem.model, 'classic_2')) {
            av.shirt = '#3b82f6';
            av.color = '#3b82f6';
        }
        let pantsItem = (WARDROBE_CATALOG.pants || []).find(p => p.id === av.pants);
        if (pantsItem && !itemMatchesModel(pantsItem.model, 'classic_2')) {
            av.pants = 'pants_classic_jeans';
        }
        if (av.outfit) {
            let outItem = (WARDROBE_CATALOG.outfits || []).find(o => o.id === av.outfit);
            if (outItem && !itemMatchesModel(outItem.model, 'classic_2')) {
                av.outfit = 'outfit_c2_gentleman';
            }
        }
        if (!av.watch) av.watch = 'none';
    }
}
window.sanitizeAvatarForModel = sanitizeAvatarForModel;

function selectAvatarBodyModel(modelId) {
    if (modelId !== 'sanalika_v2') modelId = 'classic_2';
    if (!previewAvatar) previewAvatar = { ...myAvatar };
    previewAvatar.model = modelId;
    myAvatar.model = modelId;

    // Seçilen modele uyumlu olmayan kıyafetleri otomatik uyarla
    sanitizeAvatarForModel(previewAvatar, modelId);
    sanitizeAvatarForModel(myAvatar, modelId);

    if (typeof players !== 'undefined' && players[myId]) {
        players[myId].model = modelId;
        Object.assign(players[myId], myAvatar);
    }
    if (typeof socket !== 'undefined' && socket.emit) {
        socket.emit('setAvatarModel', { model: modelId });
    }
    updateModelSelectorUI();
    renderWardrobeUI(); // Rozetleri ve filtreli ürün ızgarasını derhal yenile
    if (typeof drawAvatarPreview === 'function') drawAvatarPreview();
}
window.selectAvatarBodyModel = selectAvatarBodyModel;

function updateModelSelectorUI() {
    let curModel = (previewAvatar && previewAvatar.model) || (myAvatar && myAvatar.model) || 'classic_2';
    if (curModel === 'classic') curModel = 'classic_2';

    let btnClassic2 = document.getElementById('bodyModelBtnClassic2');
    let btnIsometric = document.getElementById('bodyModelBtnIsometric') || document.getElementById('bodyModelBtnSanalika');

    const setBtnActive = (btn, gradient, border, glow) => {
        if (!btn) return;
        btn.style.background = gradient;
        btn.style.borderColor = border;
        btn.style.color = '#ffffff';
        btn.style.boxShadow = `0 0 12px ${glow}`;
    };
    const setBtnInactive = (btn) => {
        if (!btn) return;
        btn.style.background = 'rgba(30, 41, 59, 0.6)';
        btn.style.borderColor = 'rgba(255,255,255,0.15)';
        btn.style.color = '#94a3b8';
        btn.style.boxShadow = 'none';
    };

    setBtnInactive(btnClassic2);
    setBtnInactive(btnIsometric);

    if (curModel === 'sanalika_v2') {
        setBtnActive(btnIsometric, 'linear-gradient(135deg, #ec4899, #8b5cf6)', '#f472b6', 'rgba(236,72,153,0.5)');
    } else {
        setBtnActive(btnClassic2, 'linear-gradient(135deg, #10b981, #059669)', '#34d399', 'rgba(16,185,129,0.5)');
    }

    let modelBadge = document.getElementById('currentModelBadge');
    if (modelBadge) {
        if (curModel === 'sanalika_v2') {
            modelBadge.innerText = '🌟 2.5D İzometrik';
            modelBadge.style.color = '#f472b6';
        } else {
            modelBadge.innerText = '🚶 Klasik';
            modelBadge.style.color = '#34d399';
        }
    }
}
window.updateModelSelectorUI = updateModelSelectorUI;

function isItemOwned(category, id) {
    if (id === 'none' || id === 'watch_none' || id === '#facc15' || id === '#3b82f6') return true;
    if (id === 'hair_sanalika_dreadlocks' || id === 'sanalika_camo_cargo' || id === 'sanalika_white_sneakers') return true;
    if (id === 'tshirt_divalar' || id === 'pants_camo_cargo' || id === 'pants_classic_jeans' || id === 'outfit_camo_set' || id === 'outfit_c2_gentleman') return true;
    let normCat = (category === 'watch' || category === 'watches') ? 'watches' : (category.endsWith('s') ? category : (category + 's'));
    let key = `${normCat}_${id}`;
    if (normCat === 'props') {
        let propInv = window.myPropInventory || {};
        return (propInv[key] && propInv[key] > 0);
    }
    if (normCat === 'watches' && id === 'none') return true;
    if (normCat === 'shoes' && (id === 'none' || id === 'sneakers' || id === 'flats' || id === 'sanalika_white_sneakers')) return true;
    if (Array.isArray(myInventory)) {
        if (myInventory.includes(key)) return true;
        if (myInventory.includes(id)) return true;
        let altKey = id.startsWith(normCat + '_') ? id : null;
        if (altKey && myInventory.includes(altKey)) return true;
    } else if (myInventory && myInventory[normCat]) {
        return myInventory[normCat].includes(id);
    }
    return false;
}

function openWardrobe() {
    isWardrobeOpen = true;
    previewAvatar = { ...myAvatar };
    if (!wardrobeGenderFilter || wardrobeGenderFilter === 'all') {
        if (window.myGender === 'female' || window.selectedGender === 'female') {
            wardrobeGenderFilter = 'female';
        }
    }
    setWardrobeGenderFilter(wardrobeGenderFilter || 'all');
    renderWardrobeUI();
    const modal = document.getElementById('wardrobeModal');
    if (modal) modal.style.display = 'flex';
    requestAnimationFrame(avatarPreviewLoop);
}

function closeWardrobe() {
    isWardrobeOpen = false;
    previewAvatar = { ...myAvatar };
    const modal = document.getElementById('wardrobeModal');
    if (modal) modal.style.display = 'none';
}

function switchWardrobeTab(tabName) {
    currentWardrobeTab = tabName;
    ['tabHats', 'tabFaces', 'tabSkins', 'tabOutfits', 'tabTshirts', 'tabPants', 'tabShoes', 'tabWatches', 'tabProps', 'tabMysteryBoxes'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });
    if (tabName === 'hats') document.getElementById('tabHats')?.classList.add('active');
    if (tabName === 'faces') document.getElementById('tabFaces')?.classList.add('active');
    if (tabName === 'skins') document.getElementById('tabSkins')?.classList.add('active');
    if (tabName === 'outfits') document.getElementById('tabOutfits')?.classList.add('active');
    if (tabName === 'tshirts' || tabName === 'shirts') document.getElementById('tabTshirts')?.classList.add('active');
    if (tabName === 'pants') document.getElementById('tabPants')?.classList.add('active');
    if (tabName === 'shoes') document.getElementById('tabShoes')?.classList.add('active');
    if (tabName === 'watches') document.getElementById('tabWatches')?.classList.add('active');
    if (tabName === 'props') document.getElementById('tabProps')?.classList.add('active');
    if (tabName === 'boxes') document.getElementById('tabMysteryBoxes')?.classList.add('active');

    const genderBar = document.getElementById('wardrobeGenderBar');
    if (genderBar) {
        genderBar.style.display = (tabName === 'boxes') ? 'none' : 'flex';
    }

    renderWardrobeActiveGrid();
}

function previewWardrobeItem(category, id) {
    if (category === 'hats') previewAvatar.hat = id;
    else if (category === 'faces') previewAvatar.face = id;
    else if (category === 'skins') previewAvatar.skinColor = id;
    else if (category === 'outfits') {
        previewAvatar.outfit = id;
        previewAvatar.color = id;
    }
    else if (category === 'tshirts' || category === 'shirts') {
        previewAvatar.shirt = id;
        previewAvatar.color = id;
        previewAvatar.outfit = null; // Tişört seçilince tam takım devreden çıkar
    }
    else if (category === 'pants') {
        previewAvatar.pants = id;
        previewAvatar.outfit = null; // Pantolon seçilince tam takım devreden çıkar
    }
    else if (category === 'shoes') previewAvatar.shoes = id;
    else if (category === 'watches') previewAvatar.watch = id;
    else if (category === 'props') previewAvatar.heldItem = id;
    renderWardrobeUI();
}

function renderWardrobeUI() {
    updateMoneyDisplay(myMoney);

    // Rozetleri ve isimleri güncelle
    const pName = players[myId] ? players[myId].name : "Kivre";
    const nameElem = document.getElementById('previewPlayerName');
    if (nameElem) nameElem.innerText = pName;

    const hatItem = WARDROBE_CATALOG.hats.find(h => h.id === previewAvatar.hat);
    const faceItem = WARDROBE_CATALOG.faces.find(f => f.id === previewAvatar.face);
    const skinItem = WARDROBE_CATALOG.skins.find(s => s.id === previewAvatar.skinColor);
    const outfitItem = (WARDROBE_CATALOG.outfits || []).find(o => o.id === previewAvatar.outfit);
    const tshirtItem = (WARDROBE_CATALOG.tshirts || []).find(t => t.id === (previewAvatar.shirt || previewAvatar.color));
    const pantsItem = (WARDROBE_CATALOG.pants || []).find(p => p.id === previewAvatar.pants);
    const shoeItem = (WARDROBE_CATALOG.shoes || []).find(s => s.id === previewAvatar.shoes);
    const watchItem = (WARDROBE_CATALOG.watches || []).find(w => w.id === previewAvatar.watch);
    const propItem = WARDROBE_CATALOG.props.find(p => p.id === previewAvatar.heldItem);

    const hBadge = document.getElementById('currentHatBadge');
    const fBadge = document.getElementById('currentFaceBadge');
    const sBadge = document.getElementById('currentSkinBadge');
    const outBadge = document.getElementById('currentOutfitBadge');
    const tsBadge = document.getElementById('currentTshirtBadge');
    const ptBadge = document.getElementById('currentPantsBadge');
    const shBadge = document.getElementById('currentShoeBadge');
    const wBadge = document.getElementById('currentWatchBadge');
    const pBadge = document.getElementById('currentPropBadge');

    if (hBadge) hBadge.innerText = hatItem ? `${hatItem.icon} ${hatItem.name}` : 'Yok';
    if (fBadge) fBadge.innerText = faceItem ? `${faceItem.icon} ${faceItem.name}` : 'Sade';
    if (sBadge) sBadge.innerText = skinItem ? skinItem.name : 'Klasik Sarı';
    if (outBadge) outBadge.innerText = outfitItem ? `${outfitItem.icon || '👗'} ${outfitItem.name}` : (previewAvatar.outfit ? previewAvatar.outfit : '-');
    if (tsBadge) tsBadge.innerText = tshirtItem ? `${tshirtItem.icon || '👕'} ${tshirtItem.name}` : (previewAvatar.shirt ? previewAvatar.shirt : '-');
    if (ptBadge) ptBadge.innerText = pantsItem ? `${pantsItem.icon || '👖'} ${pantsItem.name}` : (previewAvatar.pants ? previewAvatar.pants : '-');
    if (shBadge) shBadge.innerText = shoeItem ? `${shoeItem.icon} ${shoeItem.name}` : 'Sneaker';
    if (wBadge) wBadge.innerText = watchItem ? `${watchItem.icon || '⌚'} ${watchItem.name}` : 'Yok';
    if (pBadge) pBadge.innerText = propItem ? `${propItem.icon} ${propItem.name}` : 'Boş El';
    updateModelSelectorUI();
    renderWardrobeActiveGrid();
}

function renderWardrobeActiveGrid() {
    const grid = document.getElementById('wardrobeActiveGrid');
    if (!grid) return;

    if (currentWardrobeTab === 'boxes') {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; display:flex; flex-direction:column; gap:14px; width:100%; padding:4px 0;">
                <div style="font-size:12px; color:#cbd5e1; background:rgba(15,23,42,0.6); padding:8px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.1);">
                    🎁 <b>Şanslı Kutu Sistemi:</b> Her kutudan değerli ve nadir eşyalar çıkabilir! Pet kutusunda tüm petler eşit (%33.3) şansa sahipken, diğer kutularda ürünlerin fiyatına göre özel dinamik şans algoritması çalışır.
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; width:100%;">
                    
                    <!-- 1. KIYAFET KUTUSU -->
                    <div class="wardrobe-item-card" style="background: linear-gradient(145deg, rgba(30, 27, 75, 0.85), rgba(15, 23, 42, 0.95)); border: 2px solid #818cf8; border-radius: 14px; padding: 16px; text-align: center; display:flex; flex-direction:column; justify-content:space-between; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);">
                        <div>
                            <div style="font-size: 48px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); margin-bottom: 6px;">🎁👗</div>
                            <div style="font-weight: 800; font-size: 15px; color: #c7d2fe;">Kıyafet Kutusu</div>
                            <div style="display:inline-block; font-size: 10px; font-weight: 800; background: rgba(99, 102, 241, 0.3); color: #818cf8; padding: 2px 8px; border-radius: 8px; margin: 4px 0 8px 0; border: 1px solid rgba(99, 102, 241, 0.4);">
                                Tüm Giysiler Dahil
                            </div>
                            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4; margin-bottom: 12px;">
                                Şapkalar, takım elbiseler, tişörtler, pantolonlar, ayakkabılar ve lüks kol saatleri arasından çıkar!
                            </div>
                        </div>
                        <button onclick="openMysteryBox('clothes')" style="width: 100%; padding: 10px; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #4f46e5); border: none; color: white; font-weight: 800; font-size: 12px; cursor: pointer; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); transition: transform 0.15s;">
                            🛒 500 TL ile Aç
                        </button>
                    </div>

                    <!-- 2. EL EŞYALARI KUTUSU -->
                    <div class="wardrobe-item-card" style="background: linear-gradient(145deg, rgba(69, 26, 3, 0.85), rgba(15, 23, 42, 0.95)); border: 2px solid #f59e0b; border-radius: 14px; padding: 16px; text-align: center; display:flex; flex-direction:column; justify-content:space-between; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25); position:relative;">
                        <div style="position:absolute; top:-10px; right:10px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 10px; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5);">
                            🔥 10.000 TL SİGARA ŞANSI!
                        </div>
                        <div>
                            <div style="font-size: 48px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); margin-bottom: 6px;">🎁🚬</div>
                            <div style="font-weight: 800; font-size: 15px; color: #fde68a;">El Eşyaları Kutusu</div>
                            <div style="display:inline-block; font-size: 10px; font-weight: 800; background: rgba(245, 158, 11, 0.3); color: #fbbf24; padding: 2px 8px; border-radius: 8px; margin: 4px 0 8px 0; border: 1px solid rgba(245, 158, 11, 0.4);">
                                Aksesuarlar & Tüten Sigara
                            </div>
                            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4; margin-bottom: 12px;">
                                10.000 TL'lik Tüten Sigara, Nargile, Oltu Kehribar Tespihler, Gitarlar ve tüm el eşyaları arasından çıkar!
                            </div>
                        </div>
                        <button onclick="openMysteryBox('props')" style="width: 100%; padding: 10px; border-radius: 8px; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: white; font-weight: 800; font-size: 12px; cursor: pointer; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4); transition: transform 0.15s;">
                            🛒 1.500 TL ile Aç
                        </button>
                    </div>

                    <!-- 3. PET KUTUSU -->
                    <div class="wardrobe-item-card" style="background: linear-gradient(145deg, rgba(80, 7, 36, 0.85), rgba(15, 23, 42, 0.95)); border: 2px solid #ec4899; border-radius: 14px; padding: 16px; text-align: center; display:flex; flex-direction:column; justify-content:space-between; box-shadow: 0 8px 24px rgba(236, 72, 153, 0.25); position:relative;">
                        <div style="position:absolute; top:-10px; right:10px; background: linear-gradient(135deg, #10b981, #059669); color: white; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 10px; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.5);">
                            🐾 15 DAKİKA SÜRELİ
                        </div>
                        <div>
                            <div style="font-size: 48px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); margin-bottom: 6px;">🎁🐾</div>
                            <div style="font-weight: 800; font-size: 15px; color: #fbcfe8;">15 Dk Pet Kutusu</div>
                            <div style="display:inline-block; font-size: 10px; font-weight: 800; background: rgba(236, 72, 153, 0.3); color: #f472b6; padding: 2px 8px; border-radius: 8px; margin: 4px 0 8px 0; border: 1px solid rgba(236, 72, 153, 0.4);">
                                Eşit İhtimal (%33.3)
                            </div>
                            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4; margin-bottom: 12px;">
                                Sevimli Kedi 🐱, Sadık Köpek 🐶 veya Hızlı Fare 🐭! 15 dakika boyunca yanından ayrılmayacak.
                            </div>
                        </div>
                        <button onclick="openMysteryBox('pet')" style="width: 100%; padding: 10px; border-radius: 8px; background: linear-gradient(135deg, #ec4899, #db2777); border: none; color: white; font-weight: 800; font-size: 12px; cursor: pointer; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4); transition: transform 0.15s;">
                            🛒 1.750 TL ile Aç
                        </button>
                    </div>

                </div>
            </div>
        `;
        return;
    }

    let allItems = WARDROBE_CATALOG[currentWardrobeTab] || [];
    let curModel = (previewAvatar && previewAvatar.model) || (myAvatar && myAvatar.model) || 'classic_2';
    let items = allItems.filter(item => {
        // Model uyumluluğu filtrelemesi: Karakter 2.5D İzometrik, Klasik veya Klasik 2 modundayken sadece onunla uyumlu olanlar kalsın
        if (!itemMatchesModel(item.model, curModel)) {
            return false;
        }
        if (!item.gender) return true;
        if (wardrobeGenderFilter === 'all') return true;
        return item.gender === wardrobeGenderFilter;
    });

    grid.innerHTML = items.map(item => {
        let isEquippedActive = false;
        let isBeingPreviewed = false;

        if (currentWardrobeTab === 'hats') {
            isEquippedActive = (myAvatar.hat === item.id);
            isBeingPreviewed = (previewAvatar.hat === item.id);
        } else if (currentWardrobeTab === 'faces') {
            isEquippedActive = (myAvatar.face === item.id);
            isBeingPreviewed = (previewAvatar.face === item.id);
        } else if (currentWardrobeTab === 'skins') {
            isEquippedActive = (myAvatar.skinColor === item.id);
            isBeingPreviewed = (previewAvatar.skinColor === item.id);
        } else if (currentWardrobeTab === 'outfits') {
            isEquippedActive = (myAvatar.outfit === item.id);
            isBeingPreviewed = (previewAvatar.outfit === item.id);
        } else if (currentWardrobeTab === 'tshirts' || currentWardrobeTab === 'shirts') {
            isEquippedActive = (!myAvatar.outfit && (myAvatar.shirt === item.id || myAvatar.color === item.id));
            isBeingPreviewed = (!previewAvatar.outfit && (previewAvatar.shirt === item.id || previewAvatar.color === item.id));
        } else if (currentWardrobeTab === 'pants') {
            isEquippedActive = (!myAvatar.outfit && myAvatar.pants === item.id);
            isBeingPreviewed = (!previewAvatar.outfit && previewAvatar.pants === item.id);
        } else if (currentWardrobeTab === 'shoes') {
            isEquippedActive = (myAvatar.shoes === item.id);
            isBeingPreviewed = (previewAvatar.shoes === item.id);
        } else if (currentWardrobeTab === 'watches') {
            isEquippedActive = (myAvatar.watch === item.id || (!myAvatar.watch && item.id === 'none'));
            isBeingPreviewed = (previewAvatar.watch === item.id || (!previewAvatar.watch && item.id === 'none'));
        } else if (currentWardrobeTab === 'props') {
            isEquippedActive = (myAvatar.heldItem === item.id || ((!myAvatar.heldItem || myAvatar.heldItem === 'none') && item.id === 'none'));
            isBeingPreviewed = (previewAvatar.heldItem === item.id || ((!previewAvatar.heldItem || previewAvatar.heldItem === 'none') && item.id === 'none'));
        }

        let owned = isItemOwned(currentWardrobeTab, item.id);

        let visualHtml = "";
        if (item.icon) {
            visualHtml = `<div style="font-size:32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${item.icon}</div>`;
        } else if (item.color) {
            let isRound = currentWardrobeTab === 'skins';
            visualHtml = `<div style="width:36px; height:36px; border-radius:${isRound ? '50%' : '8px'}; background:${item.color}; border:2px solid rgba(255,255,255,0.6); box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`;
        }

        let buttonHtml = "";
        let propCount = 0;
        if (currentWardrobeTab === 'props' && item.id === 'none') {
            if (isEquippedActive) {
                buttonHtml = `<button disabled style="width:100%; padding:6px; border-radius:6px; background:rgba(56,189,248,0.25); border:1px solid #38bdf8; color:#38bdf8; font-weight:800; font-size:11px; cursor:default;">⭐ Boş El (Aktif)</button>`;
            } else {
                buttonHtml = `<button onclick="event.stopPropagation(); unequipCurrentProp();" style="width:100%; padding:6px; border-radius:6px; background:linear-gradient(135deg, #10b981, #059669); border:none; color:white; font-weight:800; font-size:11px; cursor:pointer; box-shadow:0 2px 6px rgba(16,185,129,0.3);">✋ Boş Eli Kuşan</button>`;
            }
        } else if (currentWardrobeTab === 'props' && item.id !== 'none') {
            let pKey = `props_${item.id}`;
            propCount = (window.myPropInventory && window.myPropInventory[pKey]) || 0;
            if (isEquippedActive) {
                buttonHtml = `
                    <button onclick="event.stopPropagation(); if (typeof equipPropItem==='function') equipPropItem('${pKey}')" style="width:100%; padding:5px; border-radius:6px; background:rgba(56,189,248,0.25); border:1px solid #38bdf8; color:#38bdf8; font-weight:800; font-size:11px; cursor:pointer;">🖐️ Elde (Bırak)</button>
                    <button onclick="event.stopPropagation(); buyWardrobeItem('props', '${item.id}')" style="width:100%; margin-top:3px; padding:4px; border-radius:6px; background:linear-gradient(135deg, #f59e0b, #d97706); border:none; color:white; font-weight:800; font-size:10px; cursor:pointer;">+1 Al (${item.cost} TL)</button>
                `;
            } else if (propCount > 0) {
                buttonHtml = `
                    <button onclick="event.stopPropagation(); if (typeof equipPropItem==='function') equipPropItem('${pKey}')" style="width:100%; padding:5px; border-radius:6px; background:linear-gradient(135deg, #10b981, #059669); border:none; color:white; font-weight:800; font-size:11px; cursor:pointer;">🖐️ Eline Al</button>
                    <button onclick="event.stopPropagation(); buyWardrobeItem('props', '${item.id}')" style="width:100%; margin-top:3px; padding:4px; border-radius:6px; background:linear-gradient(135deg, #f59e0b, #d97706); border:none; color:white; font-weight:800; font-size:10px; cursor:pointer;">+1 Al (${item.cost} TL)</button>
                `;
            } else {
                buttonHtml = `<button onclick="event.stopPropagation(); buyWardrobeItem('props', '${item.id}')" style="width:100%; padding:6px; border-radius:6px; background:linear-gradient(135deg, #f59e0b, #d97706); border:none; color:white; font-weight:800; font-size:11px; cursor:pointer; box-shadow:0 2px 6px rgba(245,158,11,0.3);">🛒 Satın Al (${item.cost} TL)</button>`;
            }
        } else {
            if (isEquippedActive) {
                buttonHtml = `<button disabled style="width:100%; padding:6px; border-radius:6px; background:rgba(56,189,248,0.25); border:1px solid #38bdf8; color:#38bdf8; font-weight:800; font-size:11px; cursor:default;">⭐ Üzerinde</button>`;
            } else if (owned) {
                buttonHtml = `<button onclick="event.stopPropagation(); buyWardrobeItem('${currentWardrobeTab}', '${item.id}')" style="width:100%; padding:6px; border-radius:6px; background:linear-gradient(135deg, #10b981, #059669); border:none; color:white; font-weight:800; font-size:11px; cursor:pointer; box-shadow:0 2px 6px rgba(16,185,129,0.3);">✅ Kuşan</button>`;
            } else {
                buttonHtml = `<button onclick="event.stopPropagation(); buyWardrobeItem('${currentWardrobeTab}', '${item.id}')" style="width:100%; padding:6px; border-radius:6px; background:linear-gradient(135deg, #f59e0b, #d97706); border:none; color:white; font-weight:800; font-size:11px; cursor:pointer; box-shadow:0 2px 6px rgba(245,158,11,0.3);">🛒 Satın Al (${item.cost} TL)</button>`;
            }
        }

        let previewBadge = isBeingPreviewed ? `<div style="font-size:10px; color:#facc15; font-weight:bold; margin-top:2px;">👀 Deneniyor</div>` : '';
        let countTag = propCount > 0 ? `<span style="background:linear-gradient(135deg, #f59e0b, #d97706); color:white; font-size:10px; font-weight:800; padding:1px 6px; border-radius:8px; margin-left:4px;">x${propCount}</span>` : '';

        return `
        <div class="wardrobe-item-card ${isEquippedActive ? 'equipped' : ''} ${isBeingPreviewed ? 'previewing' : ''}" 
             onclick="previewWardrobeItem('${currentWardrobeTab}', '${item.id}')" 
             style="cursor:pointer; padding:10px; background:rgba(15,23,42,0.65); display:flex; flex-direction:column; justify-content:space-between; align-items:center; min-height:125px;">
            ${visualHtml}
            <div style="font-size:12px; font-weight:700; margin-top:4px; color:#f8fafc; text-align:center;">${item.name} ${countTag}</div>
            ${previewBadge}
            <div style="width:100%; margin-top:6px;">${buttonHtml}</div>
        </div>`;
    }).join('');
}

function unequipCurrentProp() {
    previewAvatar.heldItem = 'none';
    if (typeof equipPropItem === 'function') {
        equipPropItem('props_none');
    }
    buyWardrobeItem('props', 'none');
}
window.unequipCurrentProp = unequipCurrentProp;

function buyWardrobeItem(category, id) {
    socket.emit('buyWardrobeItem', { category: category, id: id });
}

socket.on('wardrobeUpdate', (data) => {
    if (data.inventory) myInventory = data.inventory;
    if (data.skinSets) {
        mySkinSets = { ...mySkinSets, ...data.skinSets };
        window.mySkinSets = mySkinSets;
    }
    if (data.activeSlot) {
        currentSkinSlot = data.activeSlot;
        window.currentSkinSlot = currentSkinSlot;
    }
    if (data.avatar) {
        myAvatar = data.avatar;
        if (!myAvatar.shoes) myAvatar.shoes = (window.myGender === 'female' ? 'flats' : 'sneakers');
        if (myAvatar.model !== 'sanalika_v2') myAvatar.model = 'classic_2';
        if (!myAvatar.shirt) myAvatar.shirt = myAvatar.color || '#3b82f6';
        if (!myAvatar.pants) myAvatar.pants = (myAvatar.model === 'sanalika_v2') ? 'pants_camo_cargo' : 'pants_classic_jeans';
        if (!myAvatar.watch) myAvatar.watch = 'none';
        previewAvatar = { ...myAvatar };
        if (players[myId]) Object.assign(players[myId], myAvatar);
    }
    updateSkinSetsUI();
    renderWardrobeUI();
});

socket.on('playerAvatarChange', (data) => {
    let av = data.avatar || {
        model: data.model === 'sanalika_v2' ? 'sanalika_v2' : 'classic_2',
        hat: data.hat,
        face: data.face,
        skinColor: data.skinColor,
        color: data.color,
        shirt: data.shirt || data.color,
        pants: data.pants,
        outfit: data.outfit,
        watch: data.watch || 'none',
        heldItem: data.heldItem,
        shoes: data.shoes || 'sneakers'
    };
    av.model = av.model === 'sanalika_v2' ? 'sanalika_v2' : 'classic_2';
    if (!av.shirt) av.shirt = av.color || '#3b82f6';
    if (!av.pants) av.pants = (av.model === 'sanalika_v2') ? 'pants_camo_cargo' : 'pants_classic_jeans';
    if (!av.watch) av.watch = data.watch || 'none';

    if (players[data.id]) {
        Object.assign(players[data.id], av);
    }
    if (data.id === myId) {
        myAvatar = { ...myAvatar, ...av };
        previewAvatar = { ...myAvatar };
        renderWardrobeUI();
    }
});

// --- 8 AÇILI AVATAR ÖNİZLEME DÖNDÜRME SİSTEMİ ---
const PREVIEW_FACING_ANGLES = [
    { key: 'down', label: 'Ön (Güney)' },
    { key: 'down-right', label: 'Sağ İleri' },
    { key: 'right', label: 'Sağ Profil' },
    { key: 'up-right', label: 'Sağ Geri' },
    { key: 'up', label: 'Tam Arka' },
    { key: 'up-left', label: 'Sol Geri' },
    { key: 'left', label: 'Sol Profil' },
    { key: 'down-left', label: 'Sol İleri' }
];
const PREVIEW_FACING_ANGLES_4WAY = [
    { key: 'down', label: 'Ön (Nostaljik)' },
    { key: 'right', label: 'Sağ Profil' },
    { key: 'up', label: 'Tam Arka' },
    { key: 'left', label: 'Sol Profil' }
];
window.previewFacing = 'down';

function rotateAvatarPreview(delta) {
    let curModel = (previewAvatar && previewAvatar.model) || (myAvatar && myAvatar.model) || 'classic_2';
    let isClassic = (curModel !== 'classic_2' && curModel !== 'sanalika_v2');
    let anglesList = isClassic ? PREVIEW_FACING_ANGLES_4WAY : PREVIEW_FACING_ANGLES;

    let curIdx = anglesList.findIndex(a => a.key === (window.previewFacing || 'down'));
    if (curIdx === -1) curIdx = 0;
    let nextIdx = (curIdx + delta + anglesList.length) % anglesList.length;
    window.previewFacing = anglesList[nextIdx].key;
    let badge = document.getElementById('previewFacingBadge');
    if (badge) badge.innerText = anglesList[nextIdx].label;
    if (typeof drawAvatarPreview === 'function') drawAvatarPreview();
}
window.rotateAvatarPreview = rotateAvatarPreview;

(function setupPreviewCanvasDrag() {
    function initDrag() {
        let canvas = document.getElementById('avatarPreviewCanvas');
        if (!canvas) return;
        let isDragging = false;
        let startX = 0;

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let diffX = e.clientX - startX;
            if (Math.abs(diffX) > 22) {
                rotateAvatarPreview(diffX > 0 ? 1 : -1);
                startX = e.clientX;
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                canvas.style.cursor = 'grab';
            }
        });
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initDrag);
    } else {
        initDrag();
    }
})();

// --- AION 2 TARZI SKİN SETLERİ (PRESET 1 - 2 - 3) VE ŞANSLI KUTU SİSTEMİ ---
let currentSkinSlot = 1;
window.currentSkinSlot = 1;
let mySkinSets = {
    1: { name: 'Racon' },
    2: { name: 'Sahil' },
    3: { name: 'Şık' }
};
window.mySkinSets = mySkinSets;

function selectSkinSetSlot(slot) {
    slot = parseInt(slot) || 1;
    currentSkinSlot = slot;
    window.currentSkinSlot = slot;
    updateSkinSetsUI();

    let saved = mySkinSets && mySkinSets[slot];
    let isSlotSaved = saved && (saved.isSaved || saved.hat || saved.shirt || saved.model);
    if (isSlotSaved) {
        socket.emit('applySkinSet', { slot: slot });
        if (typeof previewAvatar !== 'undefined') {
            previewAvatar = {
                ...previewAvatar,
                model: saved.model === 'sanalika_v2' ? 'sanalika_v2' : 'classic_2',
                hat: saved.hat || 'bere',
                face: saved.face || 'none',
                skinColor: saved.skinColor || '#facc15',
                color: saved.color || '#3b82f6',
                shirt: saved.shirt || '#3b82f6',
                pants: saved.pants || 'pants_classic_jeans',
                outfit: saved.outfit || null,
                watch: saved.watch || 'none',
                heldItem: saved.heldItem || 'none',
                shoes: saved.shoes || 'sneakers'
            };
            if (typeof renderAvatarPreview === 'function') renderAvatarPreview();
        }
    } else {
        if (typeof showFloatingToast === 'function') {
            showFloatingToast(`ℹ️ ${slot}. Set henüz boş. Kombinini yapıp "Sete Kaydet"e bas!`);
        } else if (typeof showFloatingText === 'function') {
            showFloatingText(`ℹ️ ${slot}. Set henüz boş. Kombinini yapıp "Sete Kaydet"e bas!`, '#38bdf8');
        }
    }
}
window.selectSkinSetSlot = selectSkinSetSlot;

function saveCurrentSkinSet() {
    let slot = currentSkinSlot || 1;
    let avToSave = previewAvatar ? { ...previewAvatar } : { ...myAvatar };
    let defaultNames = { 1: 'Racon', 2: 'Sahil', 3: 'Şık' };
    let setName = (mySkinSets && mySkinSets[slot] && mySkinSets[slot].name) || defaultNames[slot] || ('Set ' + slot);

    let setPayload = {
        model: avToSave.model === 'sanalika_v2' ? 'sanalika_v2' : 'classic_2',
        hat: avToSave.hat || 'bere',
        face: avToSave.face || 'none',
        skinColor: avToSave.skinColor || '#facc15',
        color: avToSave.color || '#3b82f6',
        shirt: avToSave.shirt || avToSave.color || '#3b82f6',
        pants: avToSave.pants || 'pants_classic_jeans',
        outfit: avToSave.outfit || null,
        watch: avToSave.watch || 'none',
        heldItem: avToSave.heldItem || 'none',
        shoes: avToSave.shoes || 'sneakers',
        name: setName,
        isSaved: true
    };

    socket.emit('saveSkinSet', {
        slot: slot,
        avatar: setPayload,
        name: setName
    });

    if (!mySkinSets) mySkinSets = {};
    mySkinSets[slot] = setPayload;
    window.mySkinSets = mySkinSets;
    updateSkinSetsUI();

    if (typeof showSocialNotificationToast === 'function') {
        showSocialNotificationToast('💾', `${slot}. Skin Seti Kaydedildi`, `${setName} kombinin başarıyla saklandı.`);
    } else if (typeof showFloatingToast === 'function') {
        showFloatingToast(`💾 ${slot}. Set başarıyla kaydedildi!`);
    }
}
window.saveCurrentSkinSet = saveCurrentSkinSet;

function updateSkinSetsUI() {
    [1, 2, 3].forEach(slot => {
        let btn = document.getElementById(`skinSetSlot${slot}`);
        if (!btn) return;
        let isActive = (currentSkinSlot === slot);
        let saved = mySkinSets && mySkinSets[slot];
        let hasData = saved && (saved.isSaved || saved.hat || saved.shirt || saved.model);

        if (isActive) {
            btn.style.borderColor = '#facc15';
            btn.style.background = 'linear-gradient(135deg, rgba(250, 204, 21, 0.4), rgba(202, 138, 4, 0.4))';
            btn.style.color = '#fef08a';
            btn.style.boxShadow = '0 0 12px rgba(250, 204, 21, 0.5)';
            btn.innerHTML = `${slot} ${hasData ? '⭐' : ''}`;
        } else {
            btn.style.borderColor = hasData ? '#38bdf8' : 'rgba(255,255,255,0.15)';
            btn.style.background = hasData ? 'rgba(14, 165, 233, 0.18)' : 'rgba(30, 41, 59, 0.6)';
            btn.style.color = hasData ? '#7dd3fc' : '#94a3b8';
            btn.style.boxShadow = 'none';
            btn.innerHTML = `${slot} ${hasData ? '✓' : ''}`;
        }
    });
}
window.updateSkinSetsUI = updateSkinSetsUI;

// --- ŞANSLI KUTU SATIN ALMA VE ÖDÜL KONTROLÜ ---
let lastBoxReward = null;

function openMysteryBox(type) {
    if (!socket || !socket.emit) return;
    socket.emit('openMysteryBox', { type: type });
}
window.openMysteryBox = openMysteryBox;

socket.on('skinSetsUpdate', (data) => {
    if (data.skinSets) {
        mySkinSets = { ...mySkinSets, ...data.skinSets };
        window.mySkinSets = mySkinSets;
    }
    if (data.activeSlot) {
        currentSkinSlot = data.activeSlot;
        window.currentSkinSlot = currentSkinSlot;
    }
    updateSkinSetsUI();
});

socket.on('loginSuccess', (data) => {
    if (data && data.skinSets) {
        mySkinSets = { ...mySkinSets, ...data.skinSets };
        window.mySkinSets = mySkinSets;
        updateSkinSetsUI();
    }
});

socket.on('skinSetsUpdate', (data) => {
    if (data && data.skinSets) {
        mySkinSets = data.skinSets;
        window.mySkinSets = mySkinSets;
        if (data.activeSlot !== undefined) {
            currentSkinSlot = data.activeSlot;
        }
        updateSkinSetsUI();
    }
});

socket.on('mysteryBoxReward', (data) => {
    lastBoxReward = data.reward;
    const modal = document.getElementById('mysteryBoxRewardModal');
    if (!modal) return;

    const r = data.reward;
    const titleElem = document.getElementById('mbrBoxTitle');
    const badgeElem = document.getElementById('mbrRarityBadge');
    const iconElem = document.getElementById('mbrItemIcon');
    const nameElem = document.getElementById('mbrItemName');
    const costElem = document.getElementById('mbrItemCost');
    const noticeElem = document.getElementById('mbrNoticeText');
    const equipBtn = document.getElementById('mbrEquipBtn');

    if (titleElem) {
        titleElem.innerText = data.boxType === 'pet' ? '🐾 ŞANSLI PET ÇIKTI!' : (data.boxType === 'props' ? '🖐️ EL EŞYASI KAZANDIN!' : '👗 KIYAFET KAZANDIN!');
    }

    if (badgeElem) {
        badgeElem.innerText = r.rarity || 'Nadir';
        if (r.isJackpot || r.cost >= 5000) {
            badgeElem.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
            badgeElem.innerText = '🔥 EFSANEVİ JACKPOT!';
        } else if (r.rarity === 'Efsanevi' || r.isPet) {
            badgeElem.style.background = 'linear-gradient(135deg, #ec4899, #8b5cf6)';
        } else {
            badgeElem.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        }
    }

    if (iconElem) iconElem.innerText = r.icon || '🎁';
    if (nameElem) nameElem.innerText = r.name || 'Özel Eşya';
    if (costElem) costElem.innerText = (r.cost || 0).toLocaleString() + ' TL';

    if (noticeElem) {
        if (r.isPet) {
            noticeElem.innerHTML = '🐾 <b>15 Dakika</b> boyunca yanından ayrılmayacak ve seninle gezecek!';
            if (equipBtn) equipBtn.style.display = 'none';
        } else {
            noticeElem.innerHTML = r.alreadyOwned ? '💡 Bu eşyaya zaten sahiptin, gardırobunda mevcut!' : '🎉 Envanterine başarıyla eklendi!';
            if (equipBtn) {
                equipBtn.style.display = 'block';
                equipBtn.innerText = '⚡ Hemen Kuşan';
            }
        }
    }

    modal.style.display = 'flex';
    renderWardrobeUI();
});

function equipRewardFromBox() {
    if (!lastBoxReward) {
        closeMysteryBoxRewardModal();
        return;
    }
    const r = lastBoxReward;
    if (r.category && r.id) {
        buyWardrobeItem(r.category, r.id);
    }
    closeMysteryBoxRewardModal();
}
window.equipRewardFromBox = equipRewardFromBox;

function closeMysteryBoxRewardModal() {
    const modal = document.getElementById('mysteryBoxRewardModal');
    if (modal) modal.style.display = 'none';
    lastBoxReward = null;
}
window.closeMysteryBoxRewardModal = closeMysteryBoxRewardModal;

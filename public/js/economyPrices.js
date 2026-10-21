(function(root) {
    const PRICE_RULES = {
        clothingMultiplier: 2,
        watchMultiplier: 8,
        houseMultiplier: 3,
        slotMachineMultiplier: 7,
        pokerTableMultiplier: 7,
        lemonadeStandMultiplier: 3,
        handheldItemAddition: 100,
        dailyQuestMultiplier: 3
    };

    const baseWardrobePrices = {
        hats_none: 0, hats_bere: 200, hats_kasket: 260, hats_fes: 320, hats_cowboy: 380,
        hats_hair_sanalika_dreadlocks: 0, hats_hair_sanalika_street: 220, hats_hair_sanalika_wavy: 250,
        hats_korsan: 420, hats_sihirbaz: 360, hats_kulaklik: 250,
        hats_hair_long: 260, hats_hair_wavy: 320, hats_hair_ponytail: 280, hats_hair_braids: 290,
        hats_hair_bob: 240, hats_hair_hijab: 250, hats_beret_pink: 260, hats_crown: 480,
        hats_hair_blonde_curls: 310, hats_hair_bun_chopsticks: 290, hats_hair_redhead_wavy: 300,
        hats_hair_pigtails_ribbon: 280, hats_hair_curly_brown: 290,
        faces_none: 0, faces_mustache: 240, faces_sunglasses: 300, faces_beard: 360,
        'skins_#facc15': 0, 'skins_#ffd1a4': 240, 'skins_#d2996c': 300, 'skins_#8d5524': 360,
        outfits_outfit_camo_set: 0, outfits_camo_set: 0,
        outfits_outfit_overalls_blue: 280, outfits_overalls_blue: 280,
        outfits_outfit_street_tracksuit: 260, outfits_street_tracksuit: 260,
        outfits_outfit_c2_gentleman: 380, outfits_c2_gentleman: 380,
        outfits_outfit_c2_street_cool: 340, outfits_c2_street_cool: 340,
        outfits_outfit_c2_casual_polo: 310, outfits_c2_casual_polo: 310,
        outfits_outfit_c2_femme_chic: 360, outfits_c2_femme_chic: 360,
        outfits_outfit_dress_pink: 280, outfits_dress_pink: 280,
        outfits_outfit_dress_black: 380, outfits_dress_black: 380,
        outfits_outfit_dress_red: 310, outfits_dress_red: 310,
        outfits_outfit_dress_bridal: 490, outfits_dress_bridal: 490,
        outfits_outfit_goth: 360, outfits_goth: 360,
        outfits_outfit_business: 330, outfits_business: 330,
        outfits_outfit_boho: 280, outfits_boho: 280,
        outfits_outfit_sporty: 250, outfits_sporty: 250,
        outfits_dress_emerald: 340, outfits_dress_lavender: 290,
        outfits_dress_vintage_polka: 300, outfits_dress_ocean_blue: 270,
        outfits_outfit_turtleneck_skirt: 290, outfits_turtleneck_skirt: 290,
        outfits_sanalika_camo_cargo: 0,
        tshirts_tshirt_divalar: 0, tshirts_divalar: 0,
        tshirts_tshirt_black_fitted: 120, tshirts_black_fitted: 120,
        tshirts_tshirt_hoodie_purple: 240, tshirts_hoodie_purple: 240,
        tshirts_tshirt_polo_striped: 200, tshirts_polo_striped: 200,
        tshirts_tshirt_leather_jacket: 350, tshirts_leather_jacket: 350,
        'tshirts_#3b82f6': 0, 'tshirts_#ef4444': 100, 'tshirts_#10b981': 100,
        'tshirts_#8b5cf6': 100, 'tshirts_#f59e0b': 100, 'tshirts_#0f172a': 100,
        tshirts_polo: 160, tshirts_hoodie: 220, tshirts_leather: 350,
        tshirts_skirt_crop: 220, tshirts_skirt_denim: 240,
        pants_pants_camo_cargo: 0, pants_camo_cargo: 0,
        pants_pants_jeans_street: 190, pants_jeans_street: 190,
        pants_pants_chino_beige: 160, pants_chino_beige: 160,
        pants_pants_jogger_black: 200, pants_jogger_black: 200,
        pants_pants_skirt_crop: 220, pants_skirt_crop: 220,
        pants_pants_skirt_denim: 190, pants_skirt_denim: 190,
        pants_pants_classic_jeans: 0, pants_classic_jeans: 0,
        pants_pants_classic_black: 190, pants_classic_black: 190,
        pants_pants_classic_beige: 170, pants_classic_beige: 170,
        pants_pants_classic_cargo_olive: 200, pants_classic_cargo_olive: 200,
        pants_pants_classic_white_skirt: 210, pants_classic_white_skirt: 210,
        watches_none: 0, watches_watch_none: 0, watch_none: 0,
        watches_watch_gold_rolex: 500, watch_gold_rolex: 500,
        watches_watch_leather_classic: 350, watch_leather_classic: 350,
        watches_watch_cyber_sport: 420, watch_cyber_sport: 420,
        shirts_sanalika_camo_cargo: 0, shirts_sanalika_hoodie_street: 240,
        shirts_sanalika_striped_polo: 200, shirts_tshirt_divalar: 0,
        'shirts_#3b82f6': 0, 'shirts_#ef4444': 100, 'shirts_#10b981': 100,
        'shirts_#8b5cf6': 100, 'shirts_#f59e0b': 100, 'shirts_#0f172a': 100,
        shirts_polo: 160, shirts_hoodie: 220, shirts_leather: 350, shirts_overalls_blue: 280,
        shirts_dress_pink: 280, shirts_dress_black: 380, shirts_dress_red: 310,
        shirts_skirt_crop: 260, shirts_skirt_denim: 240,
        shirts_dress_emerald: 340, shirts_dress_lavender: 290, shirts_dress_bridal: 490,
        shirts_outfit_goth: 360, shirts_outfit_business: 330, shirts_outfit_boho: 280,
        shirts_outfit_sporty: 250, shirts_dress_vintage_polka: 300, shirts_dress_ocean_blue: 270,
        shirts_outfit_turtleneck_skirt: 290,
        shoes_none: 0, shoes_sanalika_white_sneakers: 0, shoes_sanalika_skate_shoes: 180,
        shoes_sneakers: 180, shoes_classic: 240, shoes_boots: 280, shoes_heels: 320,
        shoes_flats: 190, shoes_heels_gold: 340, shoes_boots_thigh_high: 350, shoes_sandals_gladiator: 220,
        props_none: 0, props_nargile: 700, props_cay: 100, props_oralet: 300, props_kahve: 110, props_balon: 120,
        props_kilic: 250, props_oyuncak_araba: 300, props_gazoz: 140, props_tespih: 400,
        props_tespih2: 450, props_olta: 200, props_baglama: 220, props_asagold: 260,
        props_kupa: 290, props_gitar: 350, props_sirtcantasi: 220, props_sigara: 9900
    };

    const wardrobeItemPrices = Object.fromEntries(
        Object.entries(baseWardrobePrices).map(([key, price]) => {
            if (key.startsWith('outfits_') || key.startsWith('tshirts_') ||
                key.startsWith('shirts_') || key.startsWith('pants_') || key.startsWith('shoes_')) {
                return [key, price * PRICE_RULES.clothingMultiplier];
            }
            if (key.startsWith('watches_') || key.startsWith('watch_')) {
                return [key, price * PRICE_RULES.watchMultiplier];
            }
            if (key.startsWith('props_') && price > 0) {
                return [key, price + PRICE_RULES.handheldItemAddition];
            }
            return [key, price];
        })
    );

    const baseHousePrices = { standart: 1375, garden: 2750, pool: 4125 };
    const housePrices = Object.fromEntries(
        Object.entries(baseHousePrices).map(([type, price]) => [type, price * PRICE_RULES.houseMultiplier])
    );

    const baseFurniturePrices = {
        bitki: 200, hali: 240, sedir: 280, kitaplik: 320, berjer: 360,
        yemek_masasi: 400, akvaryum: 440, tv: 480, gramofon: 520, somine: 550,
        bilgisayar: 570, arcade: 590, piyano: 600, meyve_arabasi: 490,
        slot_machine: 750, roulette_table: 850
    };
    const furniturePrices = { ...baseFurniturePrices };
    furniturePrices.meyve_arabasi *= PRICE_RULES.lemonadeStandMultiplier;
    furniturePrices.slot_machine *= PRICE_RULES.slotMachineMultiplier;
    furniturePrices.roulette_table *= PRICE_RULES.pokerTableMultiplier;

    const baseDailyQuestRewards = {
        okey101_play: 60, batak_play: 50, tavla_play: 40, drink_tea: 20, go_fishing: 30
    };
    const dailyQuestRewards = Object.fromEntries(
        Object.entries(baseDailyQuestRewards).map(([questId, reward]) => [
            questId,
            reward * PRICE_RULES.dailyQuestMultiplier
        ])
    );

    const priceBook = {
        PRICE_RULES,
        WARDROBE_ITEM_PRICES: wardrobeItemPrices,
        HOUSE_PRICES: housePrices,
        FURNITURE_PRICES: furniturePrices,
        DAILY_QUEST_REWARDS: dailyQuestRewards
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = priceBook;
    }
    if (root) {
        root.METAVERSE_PRICES = priceBook;
    }
})(typeof window !== 'undefined' ? window : globalThis);

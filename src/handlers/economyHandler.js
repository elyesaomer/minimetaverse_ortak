const config = require('../config');
const dataManager = require('../dataManager');
const petManager = require('../petManager');
const fatherPetManager = require('../fatherPetManager');
const { checkRateLimit } = require('../utils/securityUtils');

// Kuğu Bisikleti 5 Dakikalık Kiralama Zamanlayıcıları Havuzu
const playerSwanTimers = {};
// Dostlar Kıraathanesi İçecek 3 Dakikalık Elde Tutma Zamanlayıcıları
const playerKiraathaneDrinkTimers = {};
// Tropik Sahil Barı Kokteyl 5 Dakikalık (300sn) Elde Tutma Zamanlayıcıları
const playerCocktailTimers = {};

function registerEconomyHandlers(io, socket, players, helpers) {
    const { playerFishingTimers, playerTeaTimers, givePlayerTeaWithTimer, getAdminOnlineUsers, getAdminSanctionsList, getPlayersInRoom } = helpers;

    // 1. GARDIROR VE KIYAFET SATIN ALMA
    socket.on('buyWardrobeItem', (data) => {
        if (!players[socket.id] || !data) return;
        if (!checkRateLimit(socket, 'buyWardrobe', 5, 2000)) return;
        let username = players[socket.id].name;
        let uKey = (dataManager.findUserKey ? dataManager.findUserKey(username) : null) || username;
        let userData = dataManager.persistentData.users[uKey];
        if (!userData) return;

        let cat = data.category;
        let normCat = (cat === 'watch' || cat === 'watches') ? 'watches' : (cat.endsWith('s') ? cat : (cat + 's'));
        let singleCat = (cat === 'watches' || cat === 'watch') ? 'watch' : (cat.endsWith('s') ? cat.slice(0, -1) : cat);
        let itemId = data.id;

        let itemKey = `${normCat}_${itemId}`;
        let altKey = itemId.startsWith(normCat + '_') ? itemId : null;
        let itemCost = 5;
        if (config.WARDROBE_ITEM_PRICES[itemKey] !== undefined) {
            itemCost = config.WARDROBE_ITEM_PRICES[itemKey];
        } else if (altKey && config.WARDROBE_ITEM_PRICES[altKey] !== undefined) {
            itemCost = config.WARDROBE_ITEM_PRICES[altKey];
            itemKey = altKey;
        } else if (config.WARDROBE_ITEM_PRICES[itemId] !== undefined) {
            itemCost = config.WARDROBE_ITEM_PRICES[itemId];
        }
        let isFree = (itemCost === 0 || itemId === 'none' || itemId === 'watch_none' || itemId === '#facc15' || itemId === '#3b82f6' || itemId === 'tshirt_divalar' || itemId === 'pants_camo_cargo' || itemId === 'pants_classic_jeans' || itemId === 'outfit_camo_set' || itemId === 'hair_sanalika_dreadlocks');

        if (normCat === 'props' && itemId !== 'none') {
            if (userData.money < itemCost) {
                socket.emit('gameError', `Yetersiz bakiye! Bu eşya ${itemCost} TL. Bakiyeniz: ${userData.money} TL.`);
                return;
            }
            userData.money -= itemCost;
            if (!userData.propInventory) userData.propInventory = {};
            userData.propInventory[itemKey] = (userData.propInventory[itemKey] || 0) + 1;

            if (!userData.inventory) userData.inventory = [];
            if (!userData.inventory.includes(itemKey)) userData.inventory.push(itemKey);

            if (itemId === 'cay') {
                givePlayerTeaWithTimer(socket.id, username, 300000);
                dataManager.recordQuestProgress(username, 'drink_tea', 1);
            } else {
                userData.avatar.heldItem = itemId;
                players[socket.id].heldItem = itemId;
            }

            dataManager.savePersistentData();
            socket.emit('moneyUpdate', userData.money);
            socket.emit('propInventoryUpdate', userData.propInventory);
            socket.emit('wardrobeUpdate', { avatar: userData.avatar, inventory: userData.inventory });
            io.to(players[socket.id].room).emit('playerAvatarChange', {
                id: socket.id,
                avatar: userData.avatar,
                heldItem: players[socket.id].heldItem
            });
            socket.emit('systemMessage', `✅ 1 adet ${itemId} satın aldın! Çantandaki toplam: ${userData.propInventory[itemKey]} adet.`);
            return;
        }

        let isAlreadyOwned = isFree || (userData.inventory && userData.inventory.includes(itemKey));

        if (!isAlreadyOwned) {
            if (userData.money < itemCost) {
                socket.emit('gameError', `Yetersiz bakiye! Bu eşya ${itemCost} TL. Bakiyeniz: ${userData.money} TL.`);
                return;
            }
            userData.money -= itemCost;
            if (!userData.inventory) userData.inventory = [];
            userData.inventory.push(itemKey);
        }

        if (singleCat === 'hat') {
            userData.avatar.hat = itemId;
            players[socket.id].hat = itemId;
        } else if (singleCat === 'face') {
            userData.avatar.face = itemId;
            players[socket.id].face = itemId;
        } else if (singleCat === 'skin') {
            userData.avatar.skinColor = itemId;
            players[socket.id].skinColor = itemId;
        } else if (singleCat === 'outfit') {
            userData.avatar.outfit = itemId;
            userData.avatar.shirtColor = itemId;
            userData.avatar.color = itemId;
            players[socket.id].outfit = itemId;
            players[socket.id].color = itemId;
        } else if (singleCat === 'tshirt' || singleCat === 'shirt') {
            userData.avatar.shirt = itemId;
            userData.avatar.shirtColor = itemId;
            userData.avatar.color = itemId;
            userData.avatar.outfit = null;
            players[socket.id].shirt = itemId;
            players[socket.id].color = itemId;
            players[socket.id].outfit = null;
        } else if (singleCat === 'pant') {
            userData.avatar.pants = itemId;
            userData.avatar.outfit = null;
            players[socket.id].pants = itemId;
            players[socket.id].outfit = null;
        } else if (singleCat === 'shoe') {
            userData.avatar.shoes = itemId;
            players[socket.id].shoes = itemId;
        } else if (singleCat === 'watch') {
            userData.avatar.watch = itemId;
            players[socket.id].watch = itemId;
        } else if (singleCat === 'prop' || normCat === 'props') {
            userData.avatar.heldItem = itemId;
            players[socket.id].heldItem = itemId;
            if (itemId === 'none') {
                if (players[socket.id].hasTea) players[socket.id].hasTea = false;
                if (playerTeaTimers && playerTeaTimers[socket.id]) {
                    clearTimeout(playerTeaTimers[socket.id]);
                    delete playerTeaTimers[socket.id];
                }
                userData.teaExpiresAt = null;
                socket.emit('systemMessage', "✋ Elindeki eşyayı bıraktın.");
            }
        }

        dataManager.savePersistentData();

        socket.emit('moneyUpdate', userData.money);
        socket.emit('wardrobeUpdate', { avatar: userData.avatar, inventory: userData.inventory });
        if (normCat === 'props') {
            socket.emit('propInventoryUpdate', userData.propInventory || {});
        }

        let updatedAvatar = userData.avatar;
        io.to(players[socket.id].room).emit('playerAvatarChange', {
            id: socket.id,
            avatar: updatedAvatar,
            model: updatedAvatar.model || 'classic_2',
            hat: updatedAvatar.hat,
            face: updatedAvatar.face,
            skinColor: updatedAvatar.skinColor,
            color: updatedAvatar.color,
            shirt: updatedAvatar.shirt,
            pants: updatedAvatar.pants,
            outfit: updatedAvatar.outfit,
            heldItem: updatedAvatar.heldItem,
            shoes: updatedAvatar.shoes,
            watch: updatedAvatar.watch,
            gender: updatedAvatar.gender
        });
    });

    // 1.1 AVATAR VÜCUT MODELİ SEÇİMİ (KLASİK, KLASİK 2 vs 2.5D İZOMETRİK)
    socket.on('setAvatarModel', (data) => {
        if (!players[socket.id] || !data || !data.model) return;
        let username = players[socket.id].name;
        let userData = dataManager.persistentData.users[username];
        if (!userData) return;

        let model = data.model === 'sanalika_v2' ? 'sanalika_v2' : 'classic_2';
        if (!userData.avatar) userData.avatar = {};
        userData.avatar.model = model;
        players[socket.id].model = model;

        dataManager.savePersistentData();

        socket.emit('wardrobeUpdate', { avatar: userData.avatar, inventory: userData.inventory });
        io.to(players[socket.id].room).emit('playerAvatarChange', {
            id: socket.id,
            avatar: userData.avatar,
            model: model,
            shirt: userData.avatar.shirt,
            pants: userData.avatar.pants,
            outfit: userData.avatar.outfit,
            watch: userData.avatar.watch
        });
    });

    // 2. KUĞU DENİZ BİSİKLETİ KİRALAMA (5 DAKİKA SÜRE)
    socket.on('rentSwanBoat', () => {
        if (!players[socket.id]) return;
        if (!checkRateLimit(socket, 'rentSwanBoat', 2, 5000)) return;
        let username = players[socket.id].name;
        let userData = dataManager.persistentData.users[username];
        if (!userData) return;

        if (players[socket.id].hasSwanBoat) {
            socket.emit('gameError', "Zaten Kuğu Deniz Bisikleti kiraladınız!");
            return;
        }
        if (userData.money < 20) {
            socket.emit('gameError', "Kuğu Deniz Bisikleti kiralamak için 20 TL gerekiyor! Bakiyeniz yetersiz.");
            return;
        }

        userData.money -= 20;
        players[socket.id].money = userData.money;
        players[socket.id].hasSwanBoat = true;
        dataManager.savePersistentData();

        const SWAN_DURATION_SECONDS = 300; // 5 dakika (5 * 60)
        if (playerSwanTimers[socket.id]) {
            clearTimeout(playerSwanTimers[socket.id]);
        }

        playerSwanTimers[socket.id] = setTimeout(() => {
            if (!players[socket.id]) return;
            players[socket.id].hasSwanBoat = false;
            delete playerSwanTimers[socket.id];

            io.to(players[socket.id].room).emit('playerSwanBoatUpdate', { id: socket.id, hasSwanBoat: false });
            socket.emit('swanBoatExpired');
            socket.emit('systemMessage', "🦢 Kuğu bisikleti kiralama süreniz (5 dakika) sona erdi!");

            // Eğer oyuncu denizdeyse, suda mahsur kalmaması için güvenle iskeleye/kumsala al
            if (players[socket.id].room === 'sahil') {
                let px = players[socket.id].x;
                let py = players[socket.id].y;
                let onPier = (px >= 70 && px <= 555 && py >= 150 && py <= 235);
                let onSand = (py >= 370 && px >= 210) || (py >= 260 && px >= 340) || (py >= 180 && px >= 440) || (py >= 120 && px >= 550) || (px >= 640);
                if (!onPier && !onSand) {
                    players[socket.id].x = 420;
                    players[socket.id].y = 350;
                    io.to('sahil').emit('playerMoved', { id: socket.id, x: 420, y: 350 });
                }
            } else if (players[socket.id].room === 'sahilv2') {
                players[socket.id].x = 740;
                players[socket.id].y = 390;
                io.to('sahilv2').emit('playerMoved', { id: socket.id, x: 740, y: 390 });
            }
        }, SWAN_DURATION_SECONDS * 1000);

        socket.emit('moneyUpdate', userData.money);
        socket.emit('swanBoatRented', { duration: SWAN_DURATION_SECONDS });
        io.to(players[socket.id].room).emit('playerSwanBoatUpdate', { id: socket.id, hasSwanBoat: true });
        socket.emit('systemMessage', "🦢 Tebrikler! 20 TL'ye Kuğu Deniz Bisikleti kiraladın. (Süre: 5 Dakika)");
    });

    // 2.1 TROPİK SAHİL KOKTEYL BARI SATIN ALMA
    socket.on('buyCocktail', (data) => {
        if (!players[socket.id] || !data) return;
        if (!checkRateLimit(socket, 'buyCocktail', 5, 2000)) return;
        let username = players[socket.id].name;
        let uKey = (dataManager.findUserKey ? dataManager.findUserKey(username) : null) || username;
        let userData = dataManager.persistentData.users[uKey];
        if (!userData) return;

        const COCKTAILS = {
            'coconut': { name: 'Tropik Hindistan Cevizi Kokteyli', price: 25, icon: '🥥', chatText: 'Buz gibi Tropik Hindistan Cevizi Kokteyli yudumluyorum! 🌴' },
            'pineapple': { name: 'Buzlu Ananaslı Frappé', price: 30, icon: '🍍', chatText: 'Taze Buzlu Ananaslı Frappé harika! 🍍' },
            'mojito': { name: 'Çilekli Sahil Mojito', price: 35, icon: '🍓', chatText: 'Çilekli Sahil Mojito ile serinliyorum! 🍓' },
            'sunset': { name: 'Sunset Horizon (Güneş Batımı)', price: 45, icon: '🍹', chatText: 'Lüks Sunset Horizon kokteyli yudumluyorum! 🌅' },
            'lemonade': { name: 'Buzlu Nane & Limonata', price: 20, icon: '🍋', chatText: 'Buz gibi nane limonatamı yudumluyorum! 🍋' }
        };

        let item = COCKTAILS[data.id];
        if (!item) return;

        if ((userData.money || 0) < item.price) {
            socket.emit('gameError', `Yetersiz bakiye! Bu içecek ${item.price} TL. Bakiyeniz: ${userData.money || 0} TL.`);
            return;
        }

        userData.money = Math.max(0, (userData.money || 0) - item.price);
        players[socket.id].money = userData.money;

        // Oyuncunun eline içeceği ver
        userData.avatar = userData.avatar || {};
        userData.avatar.heldItem = 'cocktail_' + data.id;
        players[socket.id].heldItem = 'cocktail_' + data.id;

        dataManager.savePersistentData();

        // 5 Dakikalık (300 saniye) Geçici İçecek Zamanlayıcısı
        const COCKTAIL_DURATION_MS = 5 * 60 * 1000;
        if (playerCocktailTimers[socket.id]) {
            clearTimeout(playerCocktailTimers[socket.id]);
        }
        playerCocktailTimers[socket.id] = setTimeout(() => {
            if (!players[socket.id]) return;
            delete playerCocktailTimers[socket.id];

            if (players[socket.id].heldItem === 'cocktail_' + data.id) {
                players[socket.id].heldItem = 'none';
                if (userData && userData.avatar) {
                    userData.avatar.heldItem = 'none';
                }
                dataManager.savePersistentData();
                io.to(players[socket.id].room).emit('playerAvatarChange', {
                    id: socket.id,
                    avatar: userData ? userData.avatar : {},
                    heldItem: 'none'
                });
                socket.emit('systemMessage', `🍹 Tropik ${item.name} kokteylinizi keyifle bitirdiniz!`);
            }
        }, COCKTAIL_DURATION_MS);

        socket.emit('moneyUpdate', userData.money);
        socket.emit('cocktailPurchasedSuccess', item);
        socket.emit('systemMessage', `${item.icon} [${item.name}] satın aldınız! Elinizde 5 dakika boyunca ferahlatıcı kokteyliniz duracaktır. (-${item.price} TL)`);

        let room = players[socket.id].room;
        io.to(room).emit('playerAvatarChange', { id: socket.id, avatar: userData.avatar, heldItem: players[socket.id].heldItem });

        // Karakterin odada chat mesajı ve balonu çıkarmasını sağla
        let chatMsg = `${item.icon} ${item.chatText}`;
        io.to(room).emit('chatUpdate', {
            id: socket.id,
            msg: chatMsg
        });
    });

    // 2.2 DOSTLAR KIRAATHANESİ İÇECEK STANDI (ÇAYCI HÜSEYİN USTA)
    socket.on('buyKiraathaneDrink', (data) => {
        if (!players[socket.id] || !data) return;
        if (!checkRateLimit(socket, 'buyKiraathaneDrink', 5, 2000)) return;
        let username = players[socket.id].name;
        let uKey = (dataManager.findUserKey ? dataManager.findUserKey(username) : null) || username;
        let userData = dataManager.persistentData.users[uKey];
        if (!userData) return;

        const KIRAATHANE_DRINKS = {
            'cay': { name: 'Taze Tavşan Kanı İnce Belli Çay', price: 5, icon: '☕', heldItem: 'cay', chatText: 'Tavşan kanı sıcacık çayımdan bir yudum aldım, afiyet olsun!' },
            'kahve': { name: 'Közde Bol Köpüklü Türk Kahvesi', price: 15, icon: '☕', heldItem: 'kahve', chatText: 'Közde pişmiş bol köpüklü Türk kahvemi yudumluyorum! 😋' },
            'gazoz': { name: 'Nostaljik Şişe Gazoz (Zafer / Niğde)', price: 12, icon: '🧊', heldItem: 'gazoz', chatText: 'Buz gibi nostaljik cam şişe gazozumu içiyorum, ferahlık bu!' },
            'limonata': { name: 'Buzlu Taze Limonata', price: 15, icon: '🍋', heldItem: 'limonata', chatText: 'Taze nane yapraklı buz gibi limonatamı yudumluyorum!' },
            'oralet': { name: 'Sıcak Kuşburnu & Oralet', price: 10, icon: '🍵', heldItem: 'oralet', chatText: 'Kıraathanenin meşhur sıcak oraletini yudumluyorum!' },
            'coconut': { name: 'Tropik Hindistan Cevizi Kokteyli', price: 25, icon: '🥥', heldItem: 'cocktail_coconut', chatText: 'Tropik hindistan cevizi içeceğimi yudumluyorum! 🌴' }
        };

        let item = KIRAATHANE_DRINKS[data.id];
        if (!item) return;

        if ((userData.money || 0) < item.price) {
            socket.emit('gameError', `Yetersiz bakiye! Bu içecek ${item.price} TL. Bakiyeniz: ${userData.money || 0} TL.`);
            return;
        }

        userData.money = Math.max(0, (userData.money || 0) - item.price);
        players[socket.id].money = userData.money;

        userData.avatar = userData.avatar || {};
        userData.avatar.heldItem = item.heldItem;
        players[socket.id].heldItem = item.heldItem;
        players[socket.id].isKiraathaneDrink = true;

        if (item.heldItem === 'cay') {
            givePlayerTeaWithTimer(socket.id, username, 180000);
            dataManager.recordQuestProgress(username, 'drink_tea', 1);
        }

        // Önceki kıraathane içecek zamanlayıcısı varsa temizle
        if (playerKiraathaneDrinkTimers[socket.id]) {
            clearTimeout(playerKiraathaneDrinkTimers[socket.id]);
            delete playerKiraathaneDrinkTimers[socket.id];
        }

        // İçeceği tam 3 dakika (180.000 ms) boyunca elinde tut, süre bitince elinden silinsin
        const DRINK_HOLD_DURATION_MS = 180000;
        playerKiraathaneDrinkTimers[socket.id] = setTimeout(() => {
            delete playerKiraathaneDrinkTimers[socket.id];
            if (!players[socket.id]) return;

            // Eğer oyuncu hala aynı içeceği tutuyorsa elinden al
            if (players[socket.id].heldItem === item.heldItem) {
                players[socket.id].heldItem = 'none';
                players[socket.id].isKiraathaneDrink = false;
                if (item.heldItem === 'cay') players[socket.id].hasTea = false;
                if (userData.avatar) userData.avatar.heldItem = 'none';
                dataManager.savePersistentData();

                let curRoom = players[socket.id].room;
                io.to(curRoom).emit('playerAvatarChange', { 
                    id: socket.id, 
                    avatar: userData.avatar, 
                    heldItem: 'none' 
                });
                socket.emit('kiraathaneDrinkExpired', { id: data.id, name: item.name });
                socket.emit('systemMessage', `☕ [${item.name}] içeceğinizi 3 dakika boyunca afiyetle bitirdiniz, bardağınızı bıraktınız.`);
            }
        }, DRINK_HOLD_DURATION_MS);

        dataManager.savePersistentData();

        socket.emit('moneyUpdate', userData.money);
        socket.emit('kiraathaneDrinkSuccess', item);
        socket.emit('systemMessage', `${item.icon} [${item.name}] satın aldınız! (3 dakika boyunca elinizde olacak) (-${item.price} TL)`);

        let room = players[socket.id].room;
        io.to(room).emit('playerAvatarChange', { id: socket.id, avatar: userData.avatar, heldItem: players[socket.id].heldItem });

        let chatMsg = `${item.icon} ${item.chatText}`;
        io.to(room).emit('chatUpdate', {
            id: socket.id,
            msg: chatMsg
        });
    });

    // 3. SAHİL & SAHİL V2 BALIK TUTMA
    socket.on('startFishing', () => {
        if (!players[socket.id]) return;
        let room = players[socket.id].room;
        if (room !== 'sahil' && room !== 'sahilv2') return;
        if (!checkRateLimit(socket, 'startFishing', 3, 4000)) return;
        if (players[socket.id].isFishing) {
            socket.emit('gameError', "Zaten oltan denizde! Balığın vurmasını bekle...");
            return;
        }

        // Sahil v2 için su/iskele/kumsal konumu kontrolü
        if (room === 'sahilv2') {
            let px = players[socket.id].x;
            let py = players[socket.id].y;
            let hasSwan = !!players[socket.id].hasSwanBoat;
            // İskele kontrolü (y ≈ 6 + 0.576 * x)
            let onPier = (px >= 0 && px <= 675 && Math.abs(py - (6 + 0.576 * px)) <= 32);
            // Kıyı şeridi
            let shoreX = (py <= 120 ? 790 - (py/120)*35 : (py <= 240 ? 755 - ((py-120)/120)*115 : (py <= 360 ? 640 - ((py-240)/120)*155 : (py <= 480 ? 485 - ((py-360)/120)*170 : 315 - ((py-480)/145)*165))));
            let nearWater = (px <= shoreX + 45);

            if (!hasSwan && !onPier && !nearWater) {
                socket.emit('gameError', "Oltanı suya atabilmek için deniz kenarına, iskeleye gitmeli veya kuğu bisikleti kiralamalısın!");
                return;
            }
        }

        players[socket.id].isFishing = true;
        io.to(room).emit('playerFishingState', { id: socket.id, isFishing: true });
        socket.emit('fishingStarted', { duration: 10 });

        if (playerFishingTimers[socket.id]) clearTimeout(playerFishingTimers[socket.id]);

        playerFishingTimers[socket.id] = setTimeout(() => {
            if (!players[socket.id] || !players[socket.id].isFishing) return;
            players[socket.id].isFishing = false;
            delete playerFishingTimers[socket.id];

            let currentLootTable = players[socket.id].hasSwanBoat 
                ? config.SWAN_BOAT_LOOT_TABLE 
                : config.FISH_LOOT_TABLE;

            let totalWeight = currentLootTable.reduce((sum, item) => sum + item.weight, 0);
            let rand = Math.random() * totalWeight;
            let chosen = currentLootTable[0];
            let acc = 0;
            for (let item of currentLootTable) {
                acc += item.weight;
                if (rand <= acc) {
                    chosen = item;
                    break;
                }
            }

            let uName = players[socket.id].name;

            // Çok nadir "Denizden babam çıktı" deyimi kontrolü
            if (chosen.id === 'baban') {
                dataManager.recordQuestProgress(uName, 'go_fishing', 1);
                io.to(room).emit('playerFishingState', { id: socket.id, isFishing: false });
                players[socket.id].pendingFatherChoice = true;
                socket.emit('fatherCaughtPrompt', {
                    title: "Denizden Baban Çıktı!",
                    proverb: "Denizden babam çıksa yerim...",
                    description: "Oltana takılan şey bir balık değil... Baban! Ne yapmak istersin?",
                    eatReward: 300,
                    playerGender: players[socket.id].gender || 'male'
                });
                return;
            }

            let earned = chosen.value;
            let activePet = (typeof petManager !== 'undefined') ? (petManager.getPetByUsername(uName) || petManager.getPetByOwnerId(socket.id)) : null;
            let hasDogBonus = !!(activePet && activePet.petType === 'dog');
            if (hasDogBonus && earned > 0) {
                earned = Math.round(earned * 1.5);
            }

            let uData = dataManager.persistentData.users[uName];
            if (uData) {
                uData.money = (uData.money || 0) + earned;
                players[socket.id].money = uData.money;
                dataManager.savePersistentData();
                dataManager.recordQuestProgress(uName, 'go_fishing', 1);
                socket.emit('moneyUpdate', players[socket.id].money);
            }

            socket.emit('fishingResult', {
                loot: chosen,
                earned: earned,
                dogBonus: hasDogBonus,
                money: players[socket.id].money
            });

            io.to(room).emit('playerFishingState', { id: socket.id, isFishing: false });

            if (['levrek', 'ahtapot', 'inci', 'mercan', 'hazine'].includes(chosen.id)) {
                io.to(room).emit('systemMessage', `🎣 VAY CANINA! ${uName} denizden ${chosen.emoji} ${chosen.name} tuttu! (+${earned} TL${hasDogBonus ? ' 🐶 x1.5 Köpek Bonusu!' : ''})`);
            }
        }, 10000);
    });

    // "Denizden Baban Çıktı" Seçim Olayı
    socket.on('fatherChoice', (data) => {
        if (!players[socket.id]) return;
        const choice = (data && data.choice) ? data.choice : 'spare';
        fatherPetManager.handleFatherChoice(socket, choice);
    });

    socket.on('cancelFishing', () => {
        if (players[socket.id] && players[socket.id].isFishing) {
            players[socket.id].isFishing = false;
            if (playerFishingTimers[socket.id]) {
                clearTimeout(playerFishingTimers[socket.id]);
                delete playerFishingTimers[socket.id];
            }
            let r = players[socket.id].room;
            if (r) {
                io.to(r).emit('playerFishingState', { id: socket.id, isFishing: false });
            }
        }
    });

    // 4. LİDERLİK TABLOSU
    socket.on('getLeaderboard', () => {
        const isHuman = (name) => name && !name.startsWith('🤖') && !name.startsWith('bot_') && !name.includes('🤖') && !name.toLowerCase().includes('dayı') && !name.toLowerCase().includes('ismail') && !name.toLowerCase().includes('emmi');

        let topBilliard = Object.entries(dataManager.persistentData.leaderboard.billiard || {})
            .filter(([name]) => isHuman(name))
            .map(([name, wins]) => ({ name, wins }))
            .sort((a, b) => b.wins - a.wins).slice(0, 5);

        let topBatak = Object.entries(dataManager.persistentData.leaderboard.batak || {})
            .filter(([name]) => isHuman(name))
            .map(([name, score]) => ({ name, score }))
            .sort((a, b) => b.score - a.score).slice(0, 5);

        let topTavla = Object.entries(dataManager.persistentData.leaderboard.tavla || {})
            .filter(([name]) => isHuman(name))
            .map(([name, wins]) => ({ name, wins }))
            .sort((a, b) => b.wins - a.wins).slice(0, 5);

        let topOkey101 = Object.entries(dataManager.persistentData.leaderboard.okey101 || {})
            .filter(([name]) => isHuman(name))
            .map(([name, wins]) => ({ name, wins }))
            .sort((a, b) => b.wins - a.wins).slice(0, 5);

        let topChess = Object.entries(dataManager.persistentData.leaderboard.chess || {})
            .filter(([name]) => isHuman(name))
            .map(([name, wins]) => ({ name, wins }))
            .sort((a, b) => b.wins - a.wins).slice(0, 5);

        socket.emit('leaderboardData', {
            billiard: topBilliard,
            batak: topBatak,
            tavla: topTavla,
            okey101: topOkey101,
            chess: topChess
        });
    });

    // 6. GÜNLÜK GÖREVLER (DAILY QUESTS)
    socket.on('getDailyQuests', async () => {
        if (!players[socket.id]) return;
        let username = players[socket.id].name;
        let quests = await dataManager.getUserDailyQuests(username);
        socket.emit('dailyQuestsData', quests);
    });

    socket.on('claimDailyQuest', async (questId) => {
        if (!players[socket.id] || !questId) return;
        if (!checkRateLimit(socket, 'claimDailyQuest', 5, 3000)) return;
        let username = players[socket.id].name;
        let res = await dataManager.claimQuestReward(username, questId);
        if (res.success) {
            socket.emit('moneyUpdate', res.newMoney);
            socket.emit('dailyQuestsData', res.quests);
            socket.emit('systemMessage', res.msg);
        } else {
            socket.emit('gameError', res.msg);
        }
    });

    // 7. SKİN SETLERİ (AION 2 PRESET 1 - 2 - 3)
    socket.on('saveSkinSet', (data) => {
        if (!players[socket.id] || !data) return;
        if (!checkRateLimit(socket, 'saveSkinSet', 10, 2000)) return;
        let username = players[socket.id].name;
        let uKey = (dataManager.findUserKey ? dataManager.findUserKey(username) : null) || username;
        let userData = dataManager.persistentData.users[uKey];
        if (!userData) return;

        let slot = parseInt(data.slot) || 1;
        if (slot < 1 || slot > 3) slot = 1;

        if (!userData.skinSets) userData.skinSets = {};

        // Verilen avatar kombinini ya da kullanıcının mevcut avatarını slot'a kaydet
        let currentAv = data.avatar || userData.avatar;
        userData.skinSets[slot] = {
            model: currentAv.model || 'classic_2',
            hat: currentAv.hat || 'bere',
            face: currentAv.face || 'none',
            skinColor: currentAv.skinColor || '#facc15',
            color: currentAv.color || '#3b82f6',
            shirt: currentAv.shirt || currentAv.color || '#3b82f6',
            pants: currentAv.pants || 'pants_classic_jeans',
            outfit: currentAv.outfit || null,
            watch: currentAv.watch || 'none',
            heldItem: currentAv.heldItem || 'none',
            shoes: currentAv.shoes || 'sneakers',
            isSaved: true,
            name: data.name || (slot === 1 ? 'Masa / Racon' : slot === 2 ? 'Sahil / Rahat' : 'Şehir / Özel')
        };

        dataManager.savePersistentData();
        socket.emit('skinSetsUpdate', { skinSets: userData.skinSets, activeSlot: slot });
        socket.emit('systemMessage', `💾 Mevcut kombinin ${slot}. Skin Setine başarıyla kaydedildi!`);
    });

    socket.on('applySkinSet', (data) => {
        if (!players[socket.id] || !data) return;
        if (!checkRateLimit(socket, 'applySkinSet', 10, 1000)) return;
        let username = players[socket.id].name;
        let uKey = (dataManager.findUserKey ? dataManager.findUserKey(username) : null) || username;
        let userData = dataManager.persistentData.users[uKey];
        if (!userData) return;

        let slot = parseInt(data.slot) || 1;
        if (!userData.skinSets || !userData.skinSets[slot]) {
            socket.emit('gameError', `${slot}. Skin Seti henüz oluşturulmamış! Önce gardıroptan bu sete bir kombin kaydedin.`);
            return;
        }

        let chosenSet = userData.skinSets[slot];
        userData.avatar = {
            ...userData.avatar,
            model: chosenSet.model === 'sanalika_v2' ? 'sanalika_v2' : 'classic_2',
            hat: chosenSet.hat || 'bere',
            face: chosenSet.face || 'none',
            skinColor: chosenSet.skinColor || '#facc15',
            color: chosenSet.color || '#3b82f6',
            shirt: chosenSet.shirt || '#3b82f6',
            pants: chosenSet.pants || 'pants_classic_jeans',
            outfit: chosenSet.outfit || null,
            watch: chosenSet.watch || 'none',
            heldItem: chosenSet.heldItem || 'none',
            shoes: chosenSet.shoes || 'sneakers'
        };

        players[socket.id] = {
            ...players[socket.id],
            model: userData.avatar.model,
            hat: userData.avatar.hat,
            face: userData.avatar.face,
            skinColor: userData.avatar.skinColor,
            color: userData.avatar.color,
            shirt: userData.avatar.shirt,
            pants: userData.avatar.pants,
            outfit: userData.avatar.outfit,
            watch: userData.avatar.watch,
            heldItem: userData.avatar.heldItem,
            shoes: userData.avatar.shoes
        };

        dataManager.savePersistentData();

        socket.emit('wardrobeUpdate', {
            avatar: userData.avatar,
            inventory: userData.inventory,
            skinSets: userData.skinSets,
            activeSlot: slot
        });

        io.to(players[socket.id].room).emit('playerAvatarChange', {
            id: socket.id,
            avatar: userData.avatar,
            model: userData.avatar.model,
            hat: userData.avatar.hat,
            face: userData.avatar.face,
            skinColor: userData.avatar.skinColor,
            color: userData.avatar.color,
            shirt: userData.avatar.shirt,
            pants: userData.avatar.pants,
            outfit: userData.avatar.outfit,
            watch: userData.avatar.watch,
            heldItem: userData.avatar.heldItem,
            shoes: userData.avatar.shoes
        });

        socket.emit('systemMessage', `⚡ ${slot}. Skin Seti kuşandın: "${chosenSet.name || ('Set ' + slot)}"`);
    });

    // 8. ŞANSLI KUTU (MYSTERY BOX) MEKANİĞİ & DİNAMİK FİYATA BAĞLI RNG ALGORİTMASI
    const CLOTHES_POOL = [
        // Şapkalar
        { cat: 'hats', id: 'hair_sanalika_street', name: 'Sokak Diken Saç', icon: '💇‍♂️' },
        { cat: 'hats', id: 'hair_sanalika_wavy', name: 'Dalgalı Salaş Saç', icon: '💇' },
        { cat: 'hats', id: 'bere', name: 'Kırmızı Bere', icon: '🔴' },
        { cat: 'hats', id: 'kasket', name: 'Kıraathane Kasketi', icon: '🧢' },
        { cat: 'hats', id: 'fes', name: 'Osmanlı Fesi', icon: '🏮' },
        { cat: 'hats', id: 'cowboy', name: 'Kovboy Şapkası', icon: '🤠' },
        { cat: 'hats', id: 'korsan', name: 'Korsan Kaptanı', icon: '🏴‍☠️' },
        { cat: 'hats', id: 'sihirbaz', name: 'Sihirbaz Silindiri', icon: '🎩' },
        { cat: 'hats', id: 'kulaklik', name: 'DJ Kulaklığı', icon: '🎧' },
        { cat: 'hats', id: 'hair_long', name: 'Uzun Düz Saç', icon: '👩' },
        { cat: 'hats', id: 'hair_wavy', name: 'Dalgalı Saç', icon: '💇‍♀️' },
        { cat: 'hats', id: 'hair_ponytail', name: 'At Kuyruğu', icon: '👱‍♀️' },
        { cat: 'hats', id: 'hair_braids', name: 'Örgülü Saç', icon: '👧' },
        { cat: 'hats', id: 'hair_bob', name: 'Küt Kesim Saç', icon: '👩‍🦰' },
        { cat: 'hats', id: 'hair_hijab', name: 'Şık Başörtüsü', icon: '🧕' },
        { cat: 'hats', id: 'beret_pink', name: 'Pembe Fransız Bere', icon: '🌸' },
        { cat: 'hats', id: 'crown', name: 'Prenses Tacı', icon: '👑' },
        { cat: 'hats', id: 'hair_blonde_curls', name: 'Altın Bukleli Saç', icon: '👱‍♀️' },
        { cat: 'hats', id: 'hair_bun_chopsticks', name: 'Zarif Topuz & Toka', icon: '🌸' },
        { cat: 'hats', id: 'hair_redhead_wavy', name: 'Kızıl Dalgalı Saç', icon: '👩‍🦰' },
        { cat: 'hats', id: 'hair_pigtails_ribbon', name: 'Kurdeleli Saç', icon: '🎀' },
        { cat: 'hats', id: 'hair_curly_brown', name: 'Kıvırcık Kahve Saç', icon: '👩‍🦱' },
        // Yüz
        { cat: 'faces', id: 'mustache', name: 'Pala Bıyık', icon: '🥸' },
        { cat: 'faces', id: 'sunglasses', name: 'Havalı Gözlük', icon: '🕶️' },
        { cat: 'faces', id: 'beard', name: 'Kirli Sakal', icon: '🧔' },
        // Kıyafet Takımları
        { cat: 'outfits', id: 'outfit_street_tracksuit', name: 'Sokak Eşofman Takımı', icon: '🏃' },
        { cat: 'outfits', id: 'overalls_blue', name: 'Mavi İşçi Tulumu', icon: '🧑‍🔧' },
        { cat: 'outfits', id: 'outfit_c2_gentleman', name: 'Beyefendi Yelekli Takım', icon: '🤵' },
        { cat: 'outfits', id: 'outfit_c2_street_cool', name: 'Sokak Bomber & Jean', icon: '🧥' },
        { cat: 'outfits', id: 'outfit_c2_casual_polo', name: 'Marin Polo & Chino', icon: '👕' },
        { cat: 'outfits', id: 'outfit_c2_femme_chic', name: 'Pastel Blazer Takım', icon: '💃' },
        { cat: 'outfits', id: 'dress_pink', name: 'Pembe Çiçekli Elbise', icon: '👗' },
        { cat: 'outfits', id: 'dress_black', name: 'Zarif Siyah Gece Elbisesi', icon: '👗' },
        { cat: 'outfits', id: 'dress_red', name: 'Kırmızı Kokteyl Elbisesi', icon: '💃' },
        { cat: 'outfits', id: 'dress_emerald', name: 'Zümrüt Yeşil İpek Elbise', icon: '👗' },
        { cat: 'outfits', id: 'dress_lavender', name: 'Lavanta Bahar Elbisesi', icon: '🌸' },
        { cat: 'outfits', id: 'dress_bridal', name: 'Masalsı Beyaz Gelinlik', icon: '👰' },
        { cat: 'outfits', id: 'outfit_goth', name: 'Gotik Elbise Kombini', icon: '🖤' },
        { cat: 'outfits', id: 'outfit_business', name: 'Pudra Şık Kadın Takımı', icon: '🧥' },
        { cat: 'outfits', id: 'outfit_boho', name: 'Bohem Şifon Elbise', icon: '🌻' },
        { cat: 'outfits', id: 'outfit_sporty', name: 'Pastel Fitness Takımı', icon: '🎽' },
        { cat: 'outfits', id: 'dress_vintage_polka', name: 'Vintage Puantiye Elbise', icon: '💃' },
        { cat: 'outfits', id: 'dress_ocean_blue', name: 'Okyanus Mavisi Elbise', icon: '🌊' },
        { cat: 'outfits', id: 'outfit_turtleneck_skirt', name: 'Krem Balıkçı & Ekose', icon: '🧣' },
        // Tişörtler
        { cat: 'tshirts', id: 'tshirt_black_fitted', name: 'Fitted Siyah Tişört', icon: '👕' },
        { cat: 'tshirts', id: 'tshirt_hoodie_purple', name: 'Mor Sokak Hoodie', icon: '🧥' },
        { cat: 'tshirts', id: 'tshirt_polo_striped', name: 'Çizgili Retro Polo', icon: '👕' },
        { cat: 'tshirts', id: 'tshirt_leather_jacket', name: 'Motorcu Deri Ceket', icon: '🥼' },
        { cat: 'tshirts', id: 'polo', name: 'Beyaz Polo Yaka', icon: '👔' },
        { cat: 'tshirts', id: 'hoodie', name: 'Oversize Hoodie', icon: '🧥' },
        { cat: 'tshirts', id: 'leather', name: 'Klasik Deri Ceket', icon: '🥼' },
        { cat: 'tshirts', id: 'skirt_crop', name: 'Pembe Crop Üst', icon: '👚' },
        { cat: 'tshirts', id: 'skirt_denim', name: 'Kot Ceket & Üst', icon: '🎽' },
        // Pantolonlar
        { cat: 'pants', id: 'pants_jeans_street', name: 'Yırtık Sokak Jean', icon: '👖' },
        { cat: 'pants', id: 'pants_chino_beige', name: 'Bej Chino Pantolon', icon: '👖' },
        { cat: 'pants', id: 'pants_jogger_black', name: 'Siyah Sokak Jogger', icon: '👖' },
        { cat: 'pants', id: 'pants_skirt_crop', name: 'Pileli Mini Etek', icon: '👗' },
        { cat: 'pants', id: 'pants_skirt_denim', name: 'Kot Mini Etek', icon: '👗' },
        { cat: 'pants', id: 'pants_classic_black', name: 'Klasik Kumaş Siyah', icon: '👖' },
        { cat: 'pants', id: 'pants_classic_beige', name: 'Klasik Bej Chino', icon: '👖' },
        { cat: 'pants', id: 'pants_classic_cargo_olive', name: 'Zeytin Yeşili Kargo', icon: '👖' },
        { cat: 'pants', id: 'pants_classic_white_skirt', name: 'Beyaz Pileli Etek', icon: '👗' },
        // Ayakkabılar
        { cat: 'shoes', id: 'sanalika_skate_shoes', name: 'Sokak Kaykay Ayakkabısı', icon: '🛹' },
        { cat: 'shoes', id: 'classic', name: 'Kösele Klasik Ayakkabı', icon: '👞' },
        { cat: 'shoes', id: 'boots', name: 'Kışlık Bot', icon: '🥾' },
        { cat: 'shoes', id: 'heels', name: 'Topuklu Stiletto', icon: '👠' },
        { cat: 'shoes', id: 'heels_gold', name: 'Altın Simli Stiletto', icon: '👠' },
        { cat: 'shoes', id: 'boots_thigh_high', name: 'Diz Üstü Süet Çizme', icon: '👢' },
        { cat: 'shoes', id: 'sandals_gladiator', name: 'Gladyatör Sandalet', icon: '👡' },
        // Saatler
        { cat: 'watches', id: 'watch_gold_rolex', name: 'Altın Prestij Saat', icon: '⌚' },
        { cat: 'watches', id: 'watch_leather_classic', name: 'Deri Kordonlu Saat', icon: '⌚' },
        { cat: 'watches', id: 'watch_cyber_sport', name: 'Neon Spor Saat', icon: '⏱️' }
    ];

    const PROPS_POOL = [
        { cat: 'props', id: 'sigara', name: 'Tüten Sigara', icon: '🚬' }, // 10.000 TL Jackpot
        { cat: 'props', id: 'nargile', name: 'Tüten Nargile', icon: '💨' },
        { cat: 'props', id: 'tespih2', name: 'Çift Katmanlı Tespih', icon: '📿' },
        { cat: 'props', id: 'tespih', name: 'Kehribar Tespih', icon: '📿' },
        { cat: 'props', id: 'gitar', name: 'Akustik Gitar', icon: '🎸' },
        { cat: 'props', id: 'oyuncak_araba', name: 'Küçük Oyuncak Araba', icon: '🚗' },
        { cat: 'props', id: 'kupa', name: 'Şampiyonluk Kupası', icon: '🏆' },
        { cat: 'props', id: 'asagold', name: 'Yıldızlı Büyü Asası', icon: '🪄' },
        { cat: 'props', id: 'kilic', name: 'Orta Çağ Kılıcı', icon: '🗡️' },
        { cat: 'props', id: 'baglama', name: 'Anadolu Bağlaması', icon: '🪕' },
        { cat: 'props', id: 'sirtcantasi', name: 'Gezgin Sırt Çantası', icon: '🎒' },
        { cat: 'props', id: 'olta', name: 'Balıkçı Oltası', icon: '🎣' },
        { cat: 'props', id: 'gazoz', name: 'Nostaljik Gazoz', icon: '🍾' },
        { cat: 'props', id: 'balon', name: 'Uçan Balon', icon: '🎈' },
        { cat: 'props', id: 'kahve', name: 'Közde Türk Kahvesi', icon: '☕' },
        { cat: 'props', id: 'cay', name: 'İnce Belli Çay', icon: '☕' },
        { cat: 'props', id: 'oralet', name: 'Sıcak Kıraathane Oraleti', icon: '🍵' }
    ];

    function getDynamicPrice(category, id) {
        let normCat = (category === 'watch' || category === 'watches') ? 'watches' : (category.endsWith('s') ? category : (category + 's'));
        let itemKey = `${normCat}_${id}`;
        let altKey = id.startsWith(normCat + '_') ? id : null;
        if (config.WARDROBE_ITEM_PRICES[itemKey] !== undefined) return config.WARDROBE_ITEM_PRICES[itemKey];
        if (altKey && config.WARDROBE_ITEM_PRICES[altKey] !== undefined) return config.WARDROBE_ITEM_PRICES[altKey];
        if (config.WARDROBE_ITEM_PRICES[id] !== undefined) return config.WARDROBE_ITEM_PRICES[id];
        return 150;
    }

    // Fiyatlara bağlı dinamik ters orantılı RNG algoritması
    function rollWeightedDynamicItem(pool) {
        let weighted = pool.map(item => {
            let cost = getDynamicPrice(item.cat, item.id);
            // Ürün fiyatı ne kadar yüksekse çıkma olasılığı o kadar düşük olur
            // Gelecekte fiyatlar ne kadar değişirse değişsin anlık fiyat üzerinden dinamik hesaplanır
            let weight = 1 / Math.pow(Math.max(cost, 50), 0.75);
            // Sigaranın RNG'sini bi tık manuel arttır (3.5 kat ağırlık bonusu)
            if (item.id === 'sigara') {
                weight *= 3.5;
            }
            return { item, cost, weight };
        });

        let total = weighted.reduce((acc, curr) => acc + curr.weight, 0);
        let rand = Math.random() * total;
        let running = 0;

        for (const w of weighted) {
            running += w.weight;
            if (rand <= running) {
                return { ...w.item, cost: w.cost };
            }
        }
        return { ...weighted[0].item, cost: weighted[0].cost };
    }

    function isPropOwned(userData, item) {
        if (!userData) return false;
        const itemKey = `props_${item.id}`;
        const pInv = userData.propInventory || {};
        const inv = userData.inventory || [];
        if ((pInv[itemKey] && pInv[itemKey] > 0) || (pInv[item.id] && pInv[item.id] > 0)) return true;
        if (inv.includes(itemKey) || inv.includes(item.id)) return true;
        if (userData.heldItem === item.id || userData.heldItem === itemKey) return true;
        return false;
    }

    function isClothesOwned(userData, item) {
        if (!userData) return false;
        const normCat = (item.cat === 'watch' || item.cat === 'watches') ? 'watches' : (item.cat.endsWith('s') ? item.cat : (item.cat + 's'));
        const itemKey = `${normCat}_${item.id}`;
        const altKey = item.id.startsWith(normCat + '_') ? item.id : null;
        const inv = userData.inventory || [];
        if (inv.includes(itemKey) || (altKey && inv.includes(altKey)) || inv.includes(item.id)) return true;
        const singleCat = normCat.endsWith('s') ? normCat.slice(0, -1) : normCat;
        if (userData.avatar && (userData.avatar[singleCat] === item.id || userData.avatar[normCat] === item.id)) return true;
        return false;
    }

    socket.on('openMysteryBox', (data) => {
        if (!players[socket.id] || !data) return;
        if (!checkRateLimit(socket, 'openMysteryBox', 5, 2000)) return;
        let username = players[socket.id].name;
        let userData = dataManager.persistentData.users[username];
        if (!userData) return;

        let boxType = data.type; // 'clothes', 'props', 'pet'
        const BOX_COSTS = config.MYSTERY_BOX_PRICES || { clothes: 500, props: 1500, pet: 1750 };
        const boxCost = BOX_COSTS[boxType];

        if (!boxCost) {
            socket.emit('gameError', 'Geçersiz kutu tipi!');
            return;
        }

        if (userData.money < boxCost) {
            socket.emit('gameError', `Yetersiz bakiye! Bu kutu ${boxCost.toLocaleString()} TL. Mevcut bakiyeniz: ${userData.money.toLocaleString()} TL.`);
            return;
        }

        // Parayı tahsil et
        userData.money -= boxCost;
        players[socket.id].money = userData.money;

        if (boxType === 'pet') {
            // 3. Pet Kutusu: 1750 TL, tüm petler eşit ihtimalle (%33.33)
            const petOptions = [
                { type: 'cat', name: 'Sevimli Kedi', emoji: '🐱', desc: '15 dakika boyunca yanından ayrılmaz' },
                { type: 'dog', name: 'Sadık Köpek', emoji: '🐶', desc: '15 dakika boyunca yanından ayrılmaz' },
                { type: 'mouse', name: 'Hızlı Fare', emoji: '🐭', desc: '15 dakika boyunca yanından ayrılmaz' }
            ];
            const chosenPet = petOptions[Math.floor(Math.random() * petOptions.length)];

            // Pet'i 15 dakikalığına doğur
            const newPet = petManager.spawnPet(socket.id, username, chosenPet.type);

            dataManager.savePersistentData();
            socket.emit('moneyUpdate', userData.money);
            socket.emit('mysteryBoxReward', {
                boxType: 'pet',
                boxCost: boxCost,
                reward: {
                    type: chosenPet.type,
                    name: chosenPet.name,
                    icon: chosenPet.emoji,
                    cost: 2500,
                    isPet: true,
                    durationMin: 15,
                    rarity: 'Efsanevi Yoldaş'
                }
            });

            socket.emit('systemMessage', `🎁 Şanslı Pet Kutusunu açtın! Tebrikler, 15 dakikalık ${chosenPet.name} (${chosenPet.emoji}) kazandın!`);
            io.to(players[socket.id].room).emit('systemMessage', `✨ ${username} Şanslı Pet Kutusundan 15 dakikalık ${chosenPet.name} çıkardı! 🐾`);
            return;
        }

        if (boxType === 'props') {
            // 2. El Eşyaları Kutusu: 1500 TL (ZATEN SAHİP OLUNAN EŞYALAR ÇIKMAZ)
            let unownedProps = PROPS_POOL.filter(p => !isPropOwned(userData, p));

            if (unownedProps.length === 0) {
                // Oyuncu tüm el eşyalarına zaten sahip! Parayı iade et
                userData.money += boxCost;
                players[socket.id].money = userData.money;
                dataManager.savePersistentData();
                socket.emit('moneyUpdate', userData.money);
                socket.emit('gameError', 'Tebrikler! Oyundaki tüm el eşyalarına zaten sahipsiniz!');
                return;
            }

            let chosen = rollWeightedDynamicItem(unownedProps);
            let itemKey = `props_${chosen.id}`;

            if (!userData.propInventory) userData.propInventory = {};
            userData.propInventory[itemKey] = (userData.propInventory[itemKey] || 0) + 1;

            if (!userData.inventory) userData.inventory = [];
            if (!userData.inventory.includes(itemKey)) userData.inventory.push(itemKey);

            dataManager.savePersistentData();
            socket.emit('moneyUpdate', userData.money);
            socket.emit('propInventoryUpdate', userData.propInventory);
            socket.emit('wardrobeUpdate', { avatar: userData.avatar, inventory: userData.inventory });

            let rarity = chosen.cost >= 5000 ? 'Efsanevi Jackpot' : (chosen.cost >= 400 ? 'Nadir' : 'Yaygın');

            socket.emit('mysteryBoxReward', {
                boxType: 'props',
                boxCost: boxCost,
                reward: {
                    category: 'props',
                    id: chosen.id,
                    name: chosen.name,
                    icon: chosen.icon,
                    cost: chosen.cost,
                    rarity: rarity,
                    isJackpot: chosen.id === 'sigara',
                    alreadyOwned: false
                }
            });

            if (chosen.id === 'sigara') {
                io.to(players[socket.id].room).emit('systemMessage', `🔥 JACKPOT! ${username} Şanslı Kutudan 10.000 TL değerinde TÜTEN SİGARA (🚬) çıkardı! 🎉`);
            } else {
                socket.emit('systemMessage', `🎁 Şanslı El Eşyası Kutusunu açtın! Kazandığın: ${chosen.name} (${chosen.icon}) - Değeri: ${chosen.cost.toLocaleString()} TL.`);
            }
            return;
        }

        if (boxType === 'clothes') {
            // 1. Kıyafet Kutusu: 500 TL (ZATEN SAHİP OLUNAN KIYAFETLER ÇIKMAZ)
            let unownedClothes = CLOTHES_POOL.filter(item => !isClothesOwned(userData, item));

            if (unownedClothes.length === 0) {
                // Oyuncu tüm kıyafet modellerine zaten sahip! Parayı iade et
                userData.money += boxCost;
                players[socket.id].money = userData.money;
                dataManager.savePersistentData();
                socket.emit('moneyUpdate', userData.money);
                socket.emit('gameError', 'Tebrikler! Oyundaki tüm kıyafet modellerine zaten sahipsiniz!');
                return;
            }

            let chosen = rollWeightedDynamicItem(unownedClothes);
            let normCat = (chosen.cat === 'watch' || chosen.cat === 'watches') ? 'watches' : (chosen.cat.endsWith('s') ? chosen.cat : (chosen.cat + 's'));
            let itemKey = `${normCat}_${chosen.id}`;

            if (!userData.inventory) userData.inventory = [];
            if (!userData.inventory.includes(itemKey)) {
                userData.inventory.push(itemKey);
            }

            dataManager.savePersistentData();
            socket.emit('moneyUpdate', userData.money);
            socket.emit('wardrobeUpdate', { avatar: userData.avatar, inventory: userData.inventory });

            let rarity = chosen.cost >= 400 ? 'Efsanevi' : (chosen.cost >= 250 ? 'Nadir' : 'Klasik');

            socket.emit('mysteryBoxReward', {
                boxType: 'clothes',
                boxCost: boxCost,
                reward: {
                    category: chosen.cat,
                    id: chosen.id,
                    name: chosen.name,
                    icon: chosen.icon,
                    cost: chosen.cost,
                    rarity: rarity,
                    alreadyOwned: false
                }
            });

            socket.emit('systemMessage', `🎁 Şanslı Kıyafet Kutusunu açtın! Kazandığın: ${chosen.name} (${chosen.icon}) - Değeri: ${chosen.cost.toLocaleString()} TL.`);
            return;
        }
    });

    socket.on('disconnect', () => {
        if (playerKiraathaneDrinkTimers[socket.id]) {
            clearTimeout(playerKiraathaneDrinkTimers[socket.id]);
            delete playerKiraathaneDrinkTimers[socket.id];
        }
        if (playerCocktailTimers[socket.id]) {
            clearTimeout(playerCocktailTimers[socket.id]);
            delete playerCocktailTimers[socket.id];
        }
    });
}

function clearKiraathaneDrinkForPlayer(io, players, socketId, silent = false) {
    if (playerKiraathaneDrinkTimers[socketId]) {
        clearTimeout(playerKiraathaneDrinkTimers[socketId]);
        delete playerKiraathaneDrinkTimers[socketId];
    }
    if (!players || !players[socketId]) return;

    let p = players[socketId];
    const KIRAATHANE_HELD_ITEMS = ['cay', 'kahve', 'gazoz', 'limonata', 'kupa', 'cocktail_coconut'];
    let held = p.heldItem;
    let isKiraathaneItem = p.isKiraathaneDrink || KIRAATHANE_HELD_ITEMS.includes(held);

    if (isKiraathaneItem) {
        p.heldItem = 'none';
        p.isKiraathaneDrink = false;
        if (held === 'cay') p.hasTea = false;

        let username = p.name;
        let uKey = (dataManager.findUserKey ? dataManager.findUserKey(username) : null) || username;
        let userData = dataManager.persistentData.users[uKey];
        if (userData && userData.avatar) {
            userData.avatar.heldItem = 'none';
        }
        dataManager.savePersistentData();

        let curRoom = p.room;
        if (io) {
            io.to(curRoom).emit('playerAvatarChange', { 
                id: socketId, 
                avatar: userData ? userData.avatar : {}, 
                heldItem: 'none' 
            });
            let sock = io.sockets.sockets.get ? io.sockets.sockets.get(socketId) : null;
            if (sock) {
                sock.emit('kiraathaneDrinkCleared');
                if (!silent) {
                    sock.emit('systemMessage', '☕ Kıraathane içecekleri sadece o mekana özeldir, mekandan çıktığınız için içeceğiniz masada bırakıldı.');
                }
            }
        }
    }
}

module.exports = { registerEconomyHandlers, playerSwanTimers, playerKiraathaneDrinkTimers, clearKiraathaneDrinkForPlayer };

// src/engines/dostKazigi.js - Dost Kazığı Oyun Motoru (4 Kişilik Eşli & 3 Kişilik Tekli, Tek/Çift Deste)
// Kural Yöneticisi, Deste Dağıtımı, Ceza Hesaplamaları ve Hamle Doğrulama

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Kart Ceza Puanları (Kural Tablosu):
// 3: 30 Puan (En Yüksek Ceza!)
// J: 20 Puan
// Q: 10 Puan
// K: 10 Puan
// A: 10 Puan
// 2 - 10 (3 hariç): Kendi Sayı Değeri
function getCardPenalty(card) {
    if (!card || !card.value) return 0;
    const v = String(card.value);
    if (v === '3') return 30;
    if (v === 'J') return 20;
    if (v === 'Q') return 10;
    if (v === 'K') return 10;
    if (v === 'A') return 10;
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
}

function calculateStackPenalty(stack) {
    if (!Array.isArray(stack)) return 0;
    return stack.reduce((sum, c) => sum + getCardPenalty(c), 0);
}

/**
 * Deste oluşturur ve karıştırır.
 * @param {string} deckMode - 'tek_deste' (52 kart) | 'cift_deste' (104 kart)
 */
function createAndShuffleDeck(deckMode = 'tek_deste') {
    const deckCount = (deckMode === 'cift_deste') ? 2 : 1;
    let deck = [];

    for (let d = 1; d <= deckCount; d++) {
        for (const s of SUITS) {
            for (const r of RANKS) {
                deck.push({
                    suit: s,
                    value: r,
                    deckNum: d,
                    id: `${s}_${r}_d${d}_${Math.random().toString(36).substr(2, 6)}`
                });
            }
        }
    }

    // Fisher-Yates Karıştırma
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

/**
 * Dost Kazığı Oyununu Başlatır (4 Kişilik Eşli veya 3 Kişilik Tekli)
 * @param {Array<string>} players - 3 veya 4 Oyuncunun Socket ID listesi
 * @param {number} handNumber - 1..5 arasındaki el numarası
 * @param {Object} existingCumulative - Önceki ellerden gelen birikmiş cezalar
 * @param {number} starterIndex - Eli başlatacak oyuncu indeksi
 * @param {string} deckMode - 'tek_deste' (52) | 'cift_deste' (104)
 */
function startDostKazigiGame(players, handNumber = 1, existingCumulative = null, starterIndex = 0, deckMode = 'tek_deste') {
    const pCount = players.length;
    const is3P = (pCount === 3);
    const resolvedDeckMode = is3P ? 'tek_deste' : (deckMode === 'cift_deste' ? 'cift_deste' : 'tek_deste');

    const deck = createAndShuffleDeck(resolvedDeckMode);

    // 1. Ortaya 4 AÇIK KART konur
    const centerCards = deck.splice(0, 4);

    // 2. Her oyuncuya ilk dağıtımda 4 kapalı kart dağıtılır
    const hands = {};
    players.forEach(pid => {
        hands[pid] = deck.splice(0, 4);
    });

    // 3. Orta 5. kart / Atılan kartlar yığını (Başlangıçta boş)
    const centerPile = [];

    // 4. Kalan kartlar kapalı stok çekme destesi
    // 4P Tek Deste: 52 - 4 - 16 = 32 kart (2 dağıtım daha, toplam 3 dağıtım)
    // 4P Çift Deste: 104 - 4 - 16 = 84 kart (4 dağıtım 4'erli + 6. son el 5'erli, toplam 6 dağıtım)
    // 3P Tek Deste: 52 - 4 - 12 = 36 kart (3 dağıtım daha, toplam 4 dağıtım)
    const stock = deck;

    let totalDeals = 3;
    if (resolvedDeckMode === 'cift_deste') {
        totalDeals = 6;
    } else if (is3P) {
        totalDeals = 4;
    }

    // 5. Her oyuncunun Kasa / Ön Alan açık kartlar yığını
    const frontStacks = {};
    players.forEach(pid => {
        frontStacks[pid] = [];
    });

    let cumulativeScores;
    if (is3P) {
        cumulativeScores = existingCumulative || {};
        players.forEach(pid => {
            if (cumulativeScores[pid] === undefined) cumulativeScores[pid] = 0;
        });
    } else {
        cumulativeScores = existingCumulative || {
            teamA: 0, // Oyuncu 0 & Oyuncu 2
            teamB: 0  // Oyuncu 1 & Oyuncu 3
        };
    }

    return {
        tableId: null,
        baseType: is3P ? 'dost_kazigi_3p' : 'dost_kazigi',
        gameType: 'dost_kazigi',
        is3P: is3P,
        deckMode: resolvedDeckMode,
        players: [...players],
        hands: hands,
        centerCards: centerCards, // Ortadaki 4 açık başlangıç kartı
        centerPile: centerPile,   // 5. kart ve üzerine atılanlar yığını
        stock: stock,
        frontStacks: frontStacks,
        turnIndex: starterIndex % pCount,
        starterIndex: starterIndex % pCount,
        currentHand: handNumber,   // 1..5 el
        totalHands: 5,
        currentDeal: 1,           // 1..totalDeals dağıtım
        totalDeals: totalDeals,
        phase: 'play',            // 'play' | 'hand_over' | 'game_over'
        cumulativeTeamPenalties: (!is3P) ? cumulativeScores : null,
        cumulativePlayerPenalties: is3P ? cumulativeScores : null,
        handHistory: [],
        lastAction: null,
        waitingNextHand: false,
        rematchVotes: {}
    };
}

/**
 * Sıradaki oyuncunun yapabileceği tüm yasal hamleleri hesaplar.
 * Masadaki 4 açık kart, orta yığın ve tüm oyuncuların kasalarındaki en üst kartlarla eşleşme kontrol edilir.
 */
function getLegalMovesForPlayer(game, pid) {
    const pIdx = game.players.indexOf(pid);
    const pCount = game.players.length;
    if (pIdx === -1 || pIdx !== game.turnIndex) return { hasAnyMatch: false, cardMoves: [] };

    const hand = game.hands[pid] || [];
    const is3P = (pCount === 3);

    // Saat yönünde koltuk hedefleri:
    // Sol Rakip: (pIdx + 1) % pCount
    // 4 Kişilikte Eş: (pIdx + 2) % 4
    // Sağ Rakip: 4P'de (pIdx + 3) % 4, 3P'de (pIdx + 2) % 3
    const leftIdx = (pIdx + 1) % pCount;
    const leftPid = game.players[leftIdx];

    let partnerIdx = null;
    let partnerPid = null;
    let rightIdx = null;
    let rightPid = null;

    if (!is3P) {
        partnerIdx = (pIdx + 2) % 4;
        partnerPid = game.players[partnerIdx];
        rightIdx = (pIdx + 3) % 4;
        rightPid = game.players[rightIdx];
    } else {
        rightIdx = (pIdx + 2) % 3;
        rightPid = game.players[rightIdx];
    }

    // Olası hedef seçenekleri listesi
    const targetChoices = [
        { seat: leftIdx, pid: leftPid, label: '👈 Sol Rakibe Kilitle', role: 'left' },
        { seat: rightIdx, pid: rightPid, label: '👉 Sağ Rakibe Kilitle', role: 'right' }
    ];
    if (!is3P && partnerPid) {
        targetChoices.push({ seat: partnerIdx, pid: partnerPid, label: '⬆️ Eşine Kilitle', role: 'partner' });
    }

    // Orta yığının (5. kart yığını) en üst kartı
    const topCenterPile = (game.centerPile && game.centerPile.length > 0)
        ? game.centerPile[game.centerPile.length - 1]
        : null;

    // Her oyuncunun kasasındaki en üst kart
    const topStackCards = {};
    game.players.forEach((otherPid, otherIdx) => {
        const st = game.frontStacks[otherPid];
        if (st && st.length > 0) {
            topStackCards[otherPid] = {
                seatIndex: otherIdx,
                card: st[st.length - 1],
                stackCount: st.length
            };
        }
    });

    const cardMoves = hand.map((card, cardIndex) => {
        const matches = [];

        // 1. Ortadaki 4 Açık Kartla Eşleşme
        if (Array.isArray(game.centerCards)) {
            game.centerCards.forEach((cCard, cIdx) => {
                if (cCard && cCard.value === card.value) {
                    matches.push({
                        actionType: 'match_center_card',
                        centerCardIndex: cIdx,
                        matchedCard: cCard,
                        label: `🎯 Ortadaki Açık ${cCard.value}${cCard.suit} Kartını Al & Kazık At`,
                        needsTargetChoice: true,
                        targetChoices: targetChoices
                    });
                }
            });
        }

        // 2. Ortadaki 5. Kart / Yığın (Center Pile) ile Eşleşme
        if (topCenterPile && topCenterPile.value === card.value) {
            matches.push({
                actionType: 'match_center_pile',
                matchedCard: topCenterPile,
                pileCount: game.centerPile.length,
                label: `💥 Ortadaki Yığını Patlat (${topCenterPile.value}) & Kazık At`,
                needsTargetChoice: true,
                targetChoices: targetChoices
            });
        }

        // 3. Oyuncuların Kasalarındaki (Ön Alan) Açık Kartlarla Eşleşme
        game.players.forEach((otherPid, otherIdx) => {
            const stInfo = topStackCards[otherPid];
            if (stInfo && stInfo.card && stInfo.card.value === card.value) {
                let whoLabel = "";
                if (otherIdx === leftIdx) whoLabel = "Sol Rakibin";
                else if (otherIdx === rightIdx) whoLabel = "Sağ Rakibin";
                else if (!is3P && otherIdx === partnerIdx) whoLabel = "Eşinin";
                else whoLabel = "Kendi";

                matches.push({
                    actionType: 'match_stack',
                    sourcePid: otherPid,
                    sourceSeat: otherIdx,
                    matchedCard: stInfo.card,
                    label: `⚡ ${whoLabel} Önündeki ${stInfo.card.value}${stInfo.card.suit} Kartına Kazık At`,
                    needsTargetChoice: true,
                    targetChoices: targetChoices
                });
            }
        });

        return {
            cardIndex: cardIndex,
            card: card,
            matches: matches,
            hasMatch: matches.length > 0
        };
    });

    const hasAnyMatch = cardMoves.some(cm => cm.hasMatch);

    return {
        hasAnyMatch: hasAnyMatch,
        cardMoves: cardMoves,
        targetChoices: targetChoices,
        leftPid: leftPid,
        rightPid: rightPid,
        partnerPid: partnerPid
    };
}

/**
 * Oyuncu hamlesini yürütür.
 * @param {Object} game - Aktif oyun nesnesi
 * @param {string} pid - Hamleyi yapan oyuncunun socket ID'si
 * @param {number} cardIndex - Oyuncunun elindeki kart indeksi
 * @param {string} actionType - 'discard_center' | 'match_center_card' | 'match_center_pile' | 'match_stack' (veya eski hit_center, lock_right, lock_left, support_partner)
 * @param {number|string} targetSeatOrPid - Kazığın kitleneceği hedef koltuk indeksi veya socket ID
 * @param {number} extraParam - centerCardIndex veya sourceSeat
 */
function playCardMove(game, pid, cardIndex, actionType, targetSeatOrPid = null, extraParam = null) {
    if (game.phase !== 'play') return { success: false, error: 'Oyun şu anda kart oynama aşamasında değil!' };

    const pIdx = game.players.indexOf(pid);
    const pCount = game.players.length;
    const is3P = (pCount === 3);

    if (pIdx === -1 || pIdx !== game.turnIndex) {
        return { success: false, error: 'Şu anda sizin sıranız değil!' };
    }

    const hand = game.hands[pid];
    if (!hand || cardIndex < 0 || cardIndex >= hand.length) {
        return { success: false, error: 'Geçersiz kart seçimi!' };
    }

    const legal = getLegalMovesForPlayer(game, pid);
    const cardInfo = legal.cardMoves[cardIndex];
    if (!cardInfo) return { success: false, error: 'Kart bilgisi bulunamadı!' };

    // Zorunluluk kuralı kontrolü: Masada eşleşen kart varken eşleşmeyen kart atılamaz!
    if (legal.hasAnyMatch && !cardInfo.hasMatch) {
        return { success: false, error: 'Elinizde masadaki kartlarla eşleşen kart varken boş kart atamazsınız! Eşleşen kartınızı oynamalısınız.' };
    }

    // Hedef koltuk çözümleme (Sol / Sağ / Eş)
    const leftIdx = (pIdx + 1) % pCount;
    const rightIdx = is3P ? ((pIdx + 2) % 3) : ((pIdx + 3) % 4);
    const partnerIdx = is3P ? null : ((pIdx + 2) % 4);

    let resolvedTargetSeat = leftIdx; // Varsayılan: Sol Rakip
    if (typeof targetSeatOrPid === 'number') {
        resolvedTargetSeat = targetSeatOrPid % pCount;
    } else if (typeof targetSeatOrPid === 'string') {
        const foundSeat = game.players.indexOf(targetSeatOrPid);
        if (foundSeat !== -1) resolvedTargetSeat = foundSeat;
    }

    const targetPid = game.players[resolvedTargetSeat];
    const playedCard = hand.splice(cardIndex, 1)[0];

    let actionDesc = "";
    let affectedPid = null;
    let lockedCards = [];

    // Eski aksiyon isimleriyle geriye dönük uyumluluk
    let resolvedAction = actionType;
    if (actionType === 'hit_center') resolvedAction = 'match_center_pile';
    else if (actionType === 'lock_right') { resolvedAction = 'match_stack'; resolvedTargetSeat = rightIdx; }
    else if (actionType === 'lock_left') { resolvedAction = 'match_stack'; resolvedTargetSeat = leftIdx; }
    else if (actionType === 'support_partner') resolvedAction = 'match_stack';

    // 1. Ortadaki 4 Açık Başlangıç Kartlarından Biriyle Eşleşme
    if (resolvedAction === 'match_center_card') {
        let centerIdx = (extraParam !== null && extraParam !== undefined) ? parseInt(extraParam, 10) : -1;
        if (centerIdx < 0 || !game.centerCards[centerIdx] || game.centerCards[centerIdx].value !== playedCard.value) {
            // Değere göre bul
            centerIdx = game.centerCards.findIndex(c => c && c.value === playedCard.value);
        }

        if (centerIdx !== -1 && game.centerCards[centerIdx]) {
            const matchedCard = game.centerCards[centerIdx];
            game.centerCards.splice(centerIdx, 1); // Ortadan kaldır
            lockedCards = [matchedCard, playedCard];

            if (!game.frontStacks[targetPid]) game.frontStacks[targetPid] = [];
            game.frontStacks[targetPid].push(...lockedCards);
            affectedPid = targetPid;

            const tName = (resolvedTargetSeat === leftIdx) ? "Sol Rakibe" : (resolvedTargetSeat === rightIdx ? "Sağ Rakibe" : "Eşe");
            actionDesc = `🎯 Ortadaki açık ${matchedCard.value}${matchedCard.suit} kartını eşledi ve ${tName} DOST KAZIĞI attı!`;
        } else {
            // Eşleşen kart kalmadıysa ortaya bırak
            game.centerPile.push(playedCard);
            actionDesc = `🎴 Ortaya kart bıraktı (${playedCard.value}${playedCard.suit})`;
        }
    }
    // 2. Ortadaki 5. Kart / Yığın (Center Pile) ile Eşleşme (Patlatma)
    else if (resolvedAction === 'match_center_pile') {
        lockedCards = [...game.centerPile, playedCard];
        game.centerPile = [];

        if (!game.frontStacks[targetPid]) game.frontStacks[targetPid] = [];
        game.frontStacks[targetPid].push(...lockedCards);
        affectedPid = targetPid;

        const tName = (resolvedTargetSeat === leftIdx) ? "Sol Rakibe" : (resolvedTargetSeat === rightIdx ? "Sağ Rakibe" : "Eşe");
        actionDesc = `💥 Ortadaki ${lockedCards.length} kartlık yığını patlattı ve ${tName} kilitledi!`;
    }
    // 3. Bir Oyuncunun Önündeki Kasa Kartlarıyla Eşleşme (Kazık Atma / Kurtarma)
    else if (resolvedAction === 'match_stack') {
        // Hangi oyuncunun önündeki kartla eşleştiğini bul
        let sourcePid = null;
        if (extraParam !== null && extraParam !== undefined) {
            if (typeof extraParam === 'number') sourcePid = game.players[extraParam % pCount];
            else if (typeof extraParam === 'string') sourcePid = extraParam;
        }

        if (!sourcePid || !game.frontStacks[sourcePid] || game.frontStacks[sourcePid].length === 0) {
            // Değeri tutan ilk kasayı bul (önce rakipler sonra eş)
            for (const checkPid of game.players) {
                const st = game.frontStacks[checkPid];
                if (st && st.length > 0 && st[st.length - 1].value === playedCard.value) {
                    sourcePid = checkPid;
                    break;
                }
            }
        }

        if (sourcePid && game.frontStacks[sourcePid] && game.frontStacks[sourcePid].length > 0) {
            const srcStack = game.frontStacks[sourcePid];
            // Kasanın üstündeki aynı değerdeki ardışık kartları al
            let matchCount = 0;
            for (let i = srcStack.length - 1; i >= 0; i--) {
                if (srcStack[i].value === playedCard.value) matchCount++;
                else break;
            }
            const rescuedCards = srcStack.splice(srcStack.length - matchCount, matchCount);
            lockedCards = [...rescuedCards, playedCard];

            if (!game.frontStacks[targetPid]) game.frontStacks[targetPid] = [];
            game.frontStacks[targetPid].push(...lockedCards);
            affectedPid = targetPid;

            const tName = (resolvedTargetSeat === leftIdx) ? "Sol Rakibe" : (resolvedTargetSeat === rightIdx ? "Sağ Rakibe" : "Eşe");
            actionDesc = `🎯 Kasadaki kartları (${playedCard.value}) eşledi ve ${tName} DOST KAZIĞI attı! (${lockedCards.length} Kart)`;
        } else {
            game.centerPile.push(playedCard);
            actionDesc = `🎴 Ortaya kart bıraktı (${playedCard.value}${playedCard.suit})`;
        }
    }
    // 4. Eşleşme Yok: Ortaya Kart Bırak (5. Kart veya 5. Kart Üzerine)
    else {
        game.centerPile.push(playedCard);
        if (game.centerPile.length === 1 && game.centerCards.length > 0) {
            actionDesc = `🎴 Ortadaki açık kartların yanına 5. KART olarak bıraktı (${playedCard.value}${playedCard.suit})`;
        } else {
            actionDesc = `🎴 Ortadaki 5. kartın üzerine attı (${playedCard.value}${playedCard.suit})`;
        }
    }

    game.lastAction = {
        playerId: pid,
        card: playedCard,
        actionType: resolvedAction,
        description: actionDesc,
        affectedPid: affectedPid,
        lockedCount: lockedCards.length
    };

    // Sırayı saat yönünde ilerlet
    game.turnIndex = (game.turnIndex + 1) % pCount;

    // Dağıtım / Tur kontrolü: Tüm oyuncuların ellerindeki kartlar bitti mi?
    const allHandsEmpty = game.players.every(p => !game.hands[p] || game.hands[p].length === 0);

    if (allHandsEmpty) {
        checkAndAdvanceDeal(game);
    }

    return { success: true, game: game };
}

/**
 * Dağıtım turunu kontrol eder. Eldeki kartlar bittiyse stoktan yeni kart dağıtır veya eli bitirir.
 */
function checkAndAdvanceDeal(game) {
    const pCount = game.players.length;
    const isCiftDeste = (game.deckMode === 'cift_deste');

    // 4P Çift Deste Kuralı:
    // Toplam 104 kart var. 4 kart ortaya bırakıldı. 100 kart kaldı.
    // 5 el boyunca 4'er kart (5 x 16 = 80 kart).
    // Kalan 20 kart son 6. elde masadaki oyunculara 5'er kart olarak birer birer dağıtılır.
    if (isCiftDeste && game.currentDeal === 5 && game.stock.length >= 20) {
        game.currentDeal = 6;
        game.players.forEach(p => {
            game.hands[p] = game.stock.splice(0, 5);
        });
        return;
    }

    const cardsNeeded = pCount * 4;
    if (game.stock.length >= cardsNeeded) {
        game.currentDeal++;
        game.players.forEach(p => {
            game.hands[p] = game.stock.splice(0, 4);
        });
    } else {
        // Deste tamamen bitti! El tamamlandı -> Ceza ve Puan Hesaplamaları
        finalizeHand(game);
    }
}

/**
 * El bittiğinde ceza puanlarını ve özel ceza kurallarını hesaplar:
 * 1. Tek Deste (52 Kart):
 *    - Önündeki kartların ceza puanı 200'ü geçerse: +100 ek ceza puanı eklenir!
 *    - Önü tamamen boşsa (0 kart): 100 ceza puanı silinir (-100 puan)!
 * 2. Çift Deste (104 Kart):
 *    - Cezalar 2 ile çarpılır.
 *    - Önündeki ceza puanı 400'ü geçerse: +200 ek ceza puanı eklenir!
 *    - Önü tamamen boşsa (0 kart): 200 ceza puanı silinir (-200 puan)!
 */
function finalizeHand(game) {
    const isCift = (game.deckMode === 'cift_deste');
    const threshold = isCift ? 400 : 200;
    const bonusPenalty = isCift ? 200 : 100;
    const emptyDiscount = isCift ? -200 : -100;

    const playerDetails = {};
    const playerFinalPenalties = {};

    game.players.forEach(pid => {
        const stack = game.frontStacks[pid] || [];
        const basePen = calculateStackPenalty(stack);
        let bonus = 0;
        let bonusReason = null;

        if (stack.length === 0) {
            bonus = emptyDiscount;
            bonusReason = isCift ? 'Temiz Kasa Ödülü (-200 Puan Silindi!)' : 'Temiz Kasa Ödülü (-100 Puan Silindi!)';
        } else if (basePen > threshold) {
            bonus = bonusPenalty;
            bonusReason = isCift ? `400 Puanı Aştı (+200 Ek Ceza!)` : `200 Puanı Aştı (+100 Ek Ceza!)`;
        }

        const finalPen = basePen + bonus;
        playerDetails[pid] = {
            cardCount: stack.length,
            basePenalty: basePen,
            bonus: bonus,
            bonusReason: bonusReason,
            totalPenalty: finalPen
        };
        playerFinalPenalties[pid] = finalPen;
    });

    let handSummary;

    if (!game.is3P) {
        // 4 Kişilik Eşli Oyun:
        // Takım A = Oyuncu 0 + Oyuncu 2
        // Takım B = Oyuncu 1 + Oyuncu 3
        const p0 = game.players[0];
        const p1 = game.players[1];
        const p2 = game.players[2];
        const p3 = game.players[3];

        const teamAPen = (playerFinalPenalties[p0] || 0) + (playerFinalPenalties[p2] || 0);
        const teamBPen = (playerFinalPenalties[p1] || 0) + (playerFinalPenalties[p3] || 0);

        game.cumulativeTeamPenalties.teamA += teamAPen;
        game.cumulativeTeamPenalties.teamB += teamBPen;

        handSummary = {
            handNumber: game.currentHand,
            is3P: false,
            deckMode: game.deckMode,
            playerDetails: playerDetails,
            teamPenalties: {
                teamA: teamAPen,
                teamB: teamBPen
            },
            cumulative: { ...game.cumulativeTeamPenalties },
            winnerTeam: teamAPen < teamBPen ? 'Takım A' : (teamBPen < teamAPen ? 'Takım B' : 'Berabere')
        };
    } else {
        // 3 Kişilik Tekli Oyun:
        game.players.forEach(pid => {
            game.cumulativePlayerPenalties[pid] = (game.cumulativePlayerPenalties[pid] || 0) + playerFinalPenalties[pid];
        });

        // En düşük ceza alan oyuncuyu bul
        let lowestPid = game.players[0];
        let lowestScore = game.cumulativePlayerPenalties[lowestPid];
        game.players.forEach(pid => {
            if (game.cumulativePlayerPenalties[pid] < lowestScore) {
                lowestScore = game.cumulativePlayerPenalties[pid];
                lowestPid = pid;
            }
        });

        handSummary = {
            handNumber: game.currentHand,
            is3P: true,
            deckMode: game.deckMode,
            playerDetails: playerDetails,
            cumulative: { ...game.cumulativePlayerPenalties },
            bestPlayerPid: lowestPid
        };
    }

    game.handHistory.push(handSummary);

    if (game.currentHand >= game.totalHands) {
        // 5 El Tamamlandı -> Oyun Bitti
        game.phase = 'game_over';
        if (!game.is3P) {
            game.finalWinner = game.cumulativeTeamPenalties.teamA < game.cumulativeTeamPenalties.teamB
                ? 'Takım A' : (game.cumulativeTeamPenalties.teamB < game.cumulativeTeamPenalties.teamA ? 'Takım B' : 'Berabere');
        } else {
            let winPid = game.players[0];
            let minP = game.cumulativePlayerPenalties[winPid];
            game.players.forEach(pid => {
                if (game.cumulativePlayerPenalties[pid] < minP) {
                    minP = game.cumulativePlayerPenalties[pid];
                    winPid = pid;
                }
            });
            game.finalWinner = winPid;
        }
    } else {
        game.phase = 'hand_over';
        game.waitingNextHand = true;
    }
}

/**
 * Bir sonraki ele geçer (Toplam 5 el)
 */
function nextHand(game) {
    if (game.phase !== 'hand_over') return false;
    const nextHandNumber = game.currentHand + 1;
    const nextStarter = (game.starterIndex + 1) % game.players.length;
    const prevCum = game.is3P ? game.cumulativePlayerPenalties : game.cumulativeTeamPenalties;

    const fresh = startDostKazigiGame(game.players, nextHandNumber, prevCum, nextStarter, game.deckMode);
    fresh.tableId = game.tableId;
    fresh.baseType = game.baseType;
    fresh.bet = game.bet;
    fresh.pot = game.pot;
    fresh.paidPlayers = game.paidPlayers;
    fresh.spectators = game.spectators;
    fresh.playerProfiles = game.playerProfiles;
    fresh.disconnectedPlayers = game.disconnectedPlayers;
    fresh.handHistory = [...game.handHistory];

    Object.assign(game, fresh);
    return true;
}

module.exports = {
    RANKS,
    SUITS,
    getCardPenalty,
    calculateStackPenalty,
    createAndShuffleDeck,
    startDostKazigiGame,
    getLegalMovesForPlayer,
    playCardMove,
    finalizeHand,
    nextHand
};

// src/coordinators/dostKazigiCoordinator.js - Dost Kazığı Oyun Koordinatörü
// 4 Kişilik Eşli & 3 Kişilik Tekli, Tek/Çift Deste Lobi ve Oyun Yönetimi
const dostKazigiEngine = require('../engines/dostKazigi.js');
const dataManager = require('../dataManager');
const { activeGames } = require('./gameState');

const dostKazigiAfkTimers = {};

function clearDostKazigiAfkTimer(tableId) {
    if (dostKazigiAfkTimers[tableId]) {
        clearTimeout(dostKazigiAfkTimers[tableId]);
        delete dostKazigiAfkTimers[tableId];
    }
}

function startDostKazigiAfkTimer(game, io, players) {
    if (!game || game.phase !== 'play') return;
    const gid = game.tableId;
    clearDostKazigiAfkTimer(gid);

    const currentPid = game.players[game.turnIndex];
    const isBot = currentPid.startsWith('bot_') || !!game.playerProfiles?.[currentPid]?.isBot || !!game.disconnectedPlayers?.[currentPid];
    const delay = isBot ? 1200 : 40000;

    dostKazigiAfkTimers[gid] = setTimeout(() => {
        makeDostKazigiAiMove(game, currentPid, isBot, io, players);
    }, delay);
}

function makeDostKazigiAiMove(game, pid, isBot, io, players) {
    if (!game || game.phase !== 'play') return;
    const currentPid = game.players[game.turnIndex];
    if (currentPid !== pid) return;

    const legal = dostKazigiEngine.getLegalMovesForPlayer(game, pid);
    const hand = game.hands[pid] || [];
    if (hand.length === 0) return;

    let chosenCardIndex = 0;
    let chosenAction = 'discard_center';
    let chosenTargetSeat = null;
    let chosenExtraParam = null;

    if (legal.hasAnyMatch) {
        // Eşleşen kartlardan birini seç
        const matchingMoves = legal.cardMoves.filter(cm => cm.hasMatch);
        if (matchingMoves.length > 0) {
            // Taktiksel Öncelik:
            // 1. Ortadaki açık kart veya yığını patlatıp rakibe kilitle
            // 2. Kasalardaki kartlara kazık at
            const pick = matchingMoves[0];
            chosenCardIndex = pick.cardIndex;
            const selectedMatch = pick.matches[0];
            chosenAction = selectedMatch.actionType;

            if (selectedMatch.centerCardIndex !== undefined) {
                chosenExtraParam = selectedMatch.centerCardIndex;
            } else if (selectedMatch.sourceSeat !== undefined) {
                chosenExtraParam = selectedMatch.sourceSeat;
            }

            if (selectedMatch.needsTargetChoice && selectedMatch.targetChoices && selectedMatch.targetChoices.length > 0) {
                // Önünde daha az kart/ceza olan veya ilk rakibe kilitle
                const choice = selectedMatch.targetChoices[0];
                chosenTargetSeat = choice.seat;
            } else if (selectedMatch.targetSeat !== undefined) {
                chosenTargetSeat = selectedMatch.targetSeat;
            }
        }
    } else {
        // Eşleşme yok:
        // Ceza puanı en düşük kartı ortaya bırak
        let lowestPenaltyIdx = 0;
        let lowestPenaltyVal = 999;
        hand.forEach((card, idx) => {
            let p = dostKazigiEngine.getCardPenalty(card);
            if (p < lowestPenaltyVal) {
                lowestPenaltyVal = p;
                lowestPenaltyIdx = idx;
            }
        });
        chosenCardIndex = lowestPenaltyIdx;
        chosenAction = 'discard_center';
    }

    const result = dostKazigiEngine.playCardMove(game, pid, chosenCardIndex, chosenAction, chosenTargetSeat, chosenExtraParam);
    if (result.success) {
        handleDostKazigiCardPlayed(game, io, players);
    }
}

function handleDostKazigiCardPlayed(game, io, players) {
    clearDostKazigiAfkTimer(game.tableId);

    if (game.phase === 'hand_over') {
        // El Tamamlandı!
        const lastHist = game.handHistory[game.handHistory.length - 1];
        let summaryText = "";

        if (!game.is3P) {
            const teamAMsg = `Takım A: ${lastHist.teamPenalties.teamA} Ceza (Toplam: ${game.cumulativeTeamPenalties.teamA})`;
            const teamBMsg = `Takım B: ${lastHist.teamPenalties.teamB} Ceza (Toplam: ${game.cumulativeTeamPenalties.teamB})`;
            const winnerMsg = `🏆 ${game.currentHand}. Eli kazanan: ${lastHist.winnerTeam}!`;
            summaryText = `🔔 ${game.currentHand}. El Bitti!\n${teamAMsg}\n${teamBMsg}\n${winnerMsg}`;
        } else {
            const scoresList = game.players.map((pid, idx) => {
                const name = (players[pid] ? players[pid].name : game.playerProfiles?.[pid]?.name) || `Oyuncu ${idx + 1}`;
                return `${name}: ${game.cumulativePlayerPenalties[pid]} Ceza`;
            }).join(' | ');
            summaryText = `🔔 ${game.currentHand}. El Bitti!\nSkorlar: ${scoresList}`;
        }

        game.players.forEach(pid => io.to(pid).emit('systemMessage', summaryText));
        if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', summaryText));

        sendDostKazigiUpdate(game, io, players);

        // 5 saniye sonra otomatik bir sonraki ele geç
        setTimeout(() => {
            if (game && game.phase === 'hand_over' && game.currentHand < game.totalHands) {
                startNextDostKazigiHand(game, io, players);
            }
        }, 5000);
    }
    else if (game.phase === 'game_over') {
        // 5 El Tamamlandı -> Oyun Bitti!
        let winnerDesc = "";

        if (!game.is3P) {
            const totalA = game.cumulativeTeamPenalties.teamA;
            const totalB = game.cumulativeTeamPenalties.teamB;

            if (totalA < totalB) {
                winnerDesc = `🏆 TAKIM A KAZANDI! (Takım A: ${totalA} - Takım B: ${totalB} Ceza)`;
                distributeDostKazigiPot(game, [game.players[0], game.players[2]], io, players);
            } else if (totalB < totalA) {
                winnerDesc = `🏆 TAKIM B KAZANDI! (Takım B: ${totalB} - Takım A: ${totalA} Ceza)`;
                distributeDostKazigiPot(game, [game.players[1], game.players[3]], io, players);
            } else {
                winnerDesc = `🤝 BERABERE! (Takım A: ${totalA} - Takım B: ${totalB} Ceza)`;
                distributeDostKazigiPot(game, game.players, io, players, true);
            }
        } else {
            const winnerPid = game.finalWinner;
            const winnerName = (players[winnerPid] ? players[winnerPid].name : game.playerProfiles?.[winnerPid]?.name) || "Kazanan Oyuncu";
            winnerDesc = `🏆 ${winnerName.toUpperCase()} KAZANDI! (Toplam Ceza: ${game.cumulativePlayerPenalties[winnerPid]})`;
            distributeDostKazigiPot(game, [winnerPid], io, players);
        }

        const gameEndMsg = `🎉 DOST KAZIĞI OYUNU TAMAMLANDI!\n${winnerDesc}`;
        game.players.forEach(pid => io.to(pid).emit('systemMessage', gameEndMsg));
        if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', gameEndMsg));

        sendDostKazigiUpdate(game, io, players);
    }
    else {
        sendDostKazigiUpdate(game, io, players);
        startDostKazigiAfkTimer(game, io, players);
    }
}

function distributeDostKazigiPot(game, winnerPids, io, players, isTie = false) {
    if (!game.pot || game.pot <= 0) return;
    const totalPot = game.pot;
    const splitCount = winnerPids.length;
    const share = Math.floor(totalPot / splitCount);

    winnerPids.forEach(wPid => {
        const pName = players[wPid]?.name || game.playerProfiles?.[wPid]?.name;
        const isBot = wPid.startsWith('bot_') || game.playerProfiles?.[wPid]?.isBot;
        if (!isBot && pName && dataManager.persistentData.users[pName]) {
            dataManager.persistentData.users[pName].money = (dataManager.persistentData.users[pName].money || 0) + share;
            io.to(wPid).emit('moneyUpdate', dataManager.persistentData.users[pName].money);
            io.to(wPid).emit('systemMessage', `💰 Tebrikler! Masadaki ödülden payınıza düşen ${share} TL hesabınıza eklendi!`);
        }
    });

    dataManager.savePersistentData();
    game.pot = 0;
}

function startNextDostKazigiHand(game, io, players) {
    if (!game || game.phase !== 'hand_over') return;
    clearDostKazigiAfkTimer(game.tableId);

    const ok = dostKazigiEngine.nextHand(game);
    if (!ok) return;

    const startNotice = `📢 ${game.currentHand} / ${game.totalHands}. El Başladı! Kartlar dağıtıldı.`;
    game.players.forEach(pid => io.to(pid).emit('systemMessage', startNotice));
    if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', startNotice));

    sendDostKazigiUpdate(game, io, players);
    startDostKazigiAfkTimer(game, io, players);
}

function sendDostKazigiUpdate(game, io, players) {
    if (!game || !game.players) return;

    const is3P = !!game.is3P;
    const playerInfos = {};

    game.players.forEach((pid, idx) => {
        const pName = (players[pid] ? players[pid].name : game.playerProfiles?.[pid]?.name) || `Oyuncu ${idx + 1}`;
        const stack = game.frontStacks[pid] || [];
        const isTeamA = !is3P && (idx === 0 || idx === 2);

        // Kullanıcı İsteği: "Hangi rakibin üstünde güncel kaç ceza puanı olduğu yazmasın oyun sonunda hesaplansın ki zevki kaçmasın"
        // Bu yüzden oyun oynanırken stackPenalty null gönderilir, sadece el bittiğinde hesaplanıp gösterilir!
        const livePenalty = (game.phase === 'play') ? null : dostKazigiEngine.calculateStackPenalty(stack);

        playerInfos[pid] = {
            name: pName,
            color: (players[pid] ? players[pid].color : game.playerProfiles?.[pid]?.color) || (is3P ? '#38bdf8' : (isTeamA ? '#3b82f6' : '#ef4444')),
            isBot: pid.startsWith('bot_') || !!game.playerProfiles?.[pid]?.isBot,
            isDisconnected: !!game.disconnectedPlayers?.[pid],
            seatIndex: idx,
            team: is3P ? 'Solo' : (isTeamA ? 'Team A' : 'Team B'),
            teamLabel: is3P ? 'Bireysel' : (isTeamA ? 'Takım A' : 'Takım B'),
            handCount: (game.hands[pid] || []).length,
            frontStack: stack,
            stackCount: stack.length,
            stackPenalty: livePenalty
        };
    });

    const currentTurnPid = game.players[game.turnIndex];
    const currentTurnName = playerInfos[currentTurnPid]?.name || "Biri";

    const commonState = {
        tableId: game.tableId,
        baseType: game.baseType,
        is3P: is3P,
        deckMode: game.deckMode || 'tek_deste',
        phase: game.phase,
        currentHand: game.currentHand,
        totalHands: game.totalHands,
        currentDeal: game.currentDeal,
        totalDeals: game.totalDeals,
        turnIndex: game.turnIndex,
        turnPlayerName: currentTurnName,
        turnTimeout: 40,
        players: game.players,
        playerInfos: playerInfos,
        centerCards: game.centerCards || [], // Ortadaki açık kartlar
        centerPile: game.centerPile || [],   // 5. kart ve atılanlar yığını
        stockCount: game.stock ? game.stock.length : 0,
        frontStacks: game.frontStacks,
        cumulativeTeamPenalties: game.cumulativeTeamPenalties,
        cumulativePlayerPenalties: game.cumulativePlayerPenalties,
        lastAction: game.lastAction,
        handHistory: game.handHistory,
        finalWinner: game.finalWinner,
        bet: game.bet || 0,
        pot: game.pot || 0,
        rematchVotes: game.rematchVotes || {}
    };

    game.players.forEach((pid) => {
        if (game.disconnectedPlayers && game.disconnectedPlayers[pid]) return;
        const isMyTurn = (game.phase === 'play' && game.players[game.turnIndex] === pid);
        let myLegalMoves = null;
        if (isMyTurn) {
            myLegalMoves = dostKazigiEngine.getLegalMovesForPlayer(game, pid);
        }

        io.to(pid).emit('dostKazigiUpdate', {
            ...commonState,
            hand: game.hands[pid] || [],
            myTurn: isMyTurn,
            myLegalMoves: myLegalMoves,
            isSpectator: false
        });
    });

    if (game.spectators && game.spectators.length > 0) {
        game.spectators.forEach(sid => {
            io.to(sid).emit('dostKazigiUpdate', {
                ...commonState,
                hand: [],
                myTurn: false,
                myLegalMoves: null,
                isSpectator: true
            });
        });
    }
}

function handleDostKazigiVoteRematch(game, socketId, vote, io, players) {
    if (!game || game.phase !== 'game_over') return;
    if (!game.rematchVotes) game.rematchVotes = {};
    game.rematchVotes[socketId] = vote;

    sendDostKazigiUpdate(game, io, players);

    const activePids = game.players.filter(pid => !game.disconnectedPlayers?.[pid]);
    const allVoted = activePids.every(pid => {
        const isBot = pid.startsWith('bot_') || game.playerProfiles?.[pid]?.isBot;
        return isBot || game.rematchVotes[pid];
    });

    if (allVoted) {
        const anyNo = activePids.some(pid => game.rematchVotes[pid] === 'no');
        if (!anyNo) {
            // Herkes evet dedi -> Yeni oyun başlat
            const fresh = dostKazigiEngine.startDostKazigiGame(game.players, 1, null, 0, game.deckMode);
            fresh.tableId = game.tableId;
            fresh.baseType = game.baseType;
            fresh.bet = game.bet;
            fresh.pot = (game.bet || 0) * game.players.length;
            fresh.paidPlayers = { ...game.paidPlayers };
            fresh.spectators = game.spectators;
            fresh.playerProfiles = game.playerProfiles;
            fresh.disconnectedPlayers = {};
            fresh.rematchVotes = {};

            Object.assign(game, fresh);
            sendDostKazigiUpdate(game, io, players);
            startDostKazigiAfkTimer(game, io, players);
        }
    }
}

function handleDostKazigiPlayerDisconnect(game, socketId, io, players) {
    if (!game) return;
    if (!game.disconnectedPlayers) game.disconnectedPlayers = {};
    const seatIdx = game.players.indexOf(socketId);
    if (seatIdx !== -1) {
        game.disconnectedPlayers[socketId] = {
            name: players[socketId]?.name || game.playerProfiles?.[socketId]?.name || "Oyuncu",
            seatIndex: seatIdx
        };
    }
    sendDostKazigiUpdate(game, io, players);
}

function handleDostKazigiSeatTakeover(game, oldSocketId, newSocketId, io, players) {
    if (!game) return false;
    const seatIdx = game.players.indexOf(oldSocketId);
    if (seatIdx === -1) return false;

    game.players[seatIdx] = newSocketId;
    if (game.hands[oldSocketId]) {
        game.hands[newSocketId] = game.hands[oldSocketId];
        delete game.hands[oldSocketId];
    }
    if (game.frontStacks[oldSocketId]) {
        game.frontStacks[newSocketId] = game.frontStacks[oldSocketId];
        delete game.frontStacks[oldSocketId];
    }
    if (game.is3P && game.cumulativePlayerPenalties) {
        game.cumulativePlayerPenalties[newSocketId] = game.cumulativePlayerPenalties[oldSocketId] || 0;
        delete game.cumulativePlayerPenalties[oldSocketId];
    }
    if (game.disconnectedPlayers?.[oldSocketId]) {
        delete game.disconnectedPlayers[oldSocketId];
    }
    if (game.playerProfiles) {
        game.playerProfiles[newSocketId] = {
            name: players[newSocketId]?.name || "Yeni Oyuncu",
            color: players[newSocketId]?.color || "#fff",
            isBot: !!players[newSocketId]?.isBot
        };
        delete game.playerProfiles[oldSocketId];
    }

    sendDostKazigiUpdate(game, io, players);
    return true;
}

module.exports = {
    startDostKazigiAfkTimer,
    clearDostKazigiAfkTimer,
    makeDostKazigiAiMove,
    handleDostKazigiCardPlayed,
    startNextDostKazigiHand,
    sendDostKazigiUpdate,
    handleDostKazigiVoteRematch,
    handleDostKazigiPlayerDisconnect,
    handleDostKazigiSeatTakeover
};

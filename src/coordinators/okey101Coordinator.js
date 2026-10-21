// src/coordinators/okey101Coordinator.js - 101 Yüzbir Okey (Tekli & Eşli) Oyun Koordinatörü
const okey101Engine = require('../engines/okey101.js');
const dataManager = require('../dataManager');
const { activeGames } = require('./gameState');

const okey101AfkTimers = {};

function sendOkey101Update(game, io, players) {
    if (!game || !game.hands || !game.players) return;
    let playerInfos = {};
    game.players.forEach(pid => {
        let pName = "Kayıtsız";
        if (players[pid]) pName = players[pid].name;
        else if (game.playerProfiles && game.playerProfiles[pid]) pName = game.playerProfiles[pid].name;

        playerInfos[pid] = {
            name: pName,
            color: game.playerProfiles && game.playerProfiles[pid] ? game.playerProfiles[pid].color : "#fff",
            score: (game.scores && game.scores[pid] !== undefined) ? game.scores[pid] : 0,
            penalties: (game.roundPenalties && game.roundPenalties[pid] !== undefined) ? game.roundPenalties[pid] : 0,
            hasOpened: !!(game.hasOpened && game.hasOpened[pid]),
            openedType: game.openedType ? game.openedType[pid] : null,
            tileCount: game.hands && game.hands[pid] ? game.hands[pid].length : 0,
            lastDiscard: game.discardPiles && game.discardPiles[pid] && game.discardPiles[pid].length > 0 ? game.discardPiles[pid][game.discardPiles[pid].length - 1] : null,
            isDisconnected: (game.disconnectedPlayers && !!game.disconnectedPlayers[pid]),
            isBot: !!(game.playerProfiles && game.playerProfiles[pid]?.isBot)
        };
    });

    let currentPid = game.players[game.turnIndex];
    let currentPlayerName = playerInfos[currentPid] ? playerInfos[currentPid].name : "Biri";

    game.players.forEach((pid) => {
        if (game.disconnectedPlayers && game.disconnectedPlayers[pid]) return;
        let prevPid = game.players[(game.turnIndex + 3) % 4];
        let partnerPid = okey101Engine.getPartnerId(game, pid);
        let partnerOpened = partnerPid && game.hasOpened && !!game.hasOpened[partnerPid];
        let canTakeDiscard = (game.players[game.turnIndex] === pid) && !game.drawnThisTurn && !!(game.discardPiles && game.discardPiles[prevPid] && game.discardPiles[prevPid].length > 0);

        let isMyTurn = (game.players[game.turnIndex] === pid);
        let myDiscardTaken = isMyTurn && !!game.lastDiscardTaken;
        let takenDiscardTileId = myDiscardTaken ? game.takenDiscardTileId : null;
        let lastDrawnTileId = (isMyTurn && game.drawnThisTurn && game.lastDrawnTileId) ? game.lastDrawnTileId[pid] : null;
        let lastDrawnTile = (isMyTurn && game.drawnThisTurn && game.lastDrawnTile) ? game.lastDrawnTile[pid] : null;

        let hasDrawnEver = !!(game.hasDrawnEver && game.hasDrawnEver[pid]);
        let hand = (game.hands && game.hands[pid]) || [];
        let matchingGostergeTile = hand.find(t => 
            !t.isFakeOkey && 
            t.color === game.gosterge.color && 
            t.value === game.gosterge.value && 
            (game.initialGostergeOwners && game.initialGostergeOwners[pid] && game.initialGostergeOwners[pid].includes(t.id))
        );
        let isFirstPlayerWith22 = (game.players[0] === pid && (!game.discardPiles[pid] || game.discardPiles[pid].length === 0));
        let canRevealGosterge = (!hasDrawnEver || isFirstPlayerWith22) && !!matchingGostergeTile && !(game.revealedGosterge && game.revealedGosterge[pid]);
        let myRevealedGostergeTileId = (game.revealedGosterge && game.revealedGosterge[pid]) || null;

        io.to(pid).emit('okey101Update', {
            hand: hand,
            myTurn: isMyTurn,
            turnIndex: game.turnIndex,
            players: game.players,
            turnPlayerName: currentPlayerName,
            gosterge: game.gosterge,
            okeyDef: game.okeyDef,
            drawPileCount: game.drawPile ? game.drawPile.length : 0,
            tableOpenedPers: game.tableOpenedPers || [],
            playerInfos: playerInfos,
            drawnThisTurn: game.drawnThisTurn,
            lastDiscardTaken: myDiscardTaken,
            takenDiscardTileId: takenDiscardTileId,
            lastDrawnTileId: lastDrawnTileId,
            lastDrawnTile: lastDrawnTile,
            canTakeDiscard: canTakeDiscard,
            canRevealGosterge: canRevealGosterge,
            revealedGosterge: game.revealedGosterge || {},
            myRevealedGostergeTileId: myRevealedGostergeTileId,
            disconnectedPlayers: game.disconnectedPlayers || {},
            roundNumber: game.roundNumber || 1,
            mode: game.mode || 'esli',
            yazboz: game.yazboz || null,
            partnerId: partnerPid,
            partnerOpened: partnerOpened,
            teamIdx: okey101Engine.getTeamIndex(game, pid),
            isSpectator: false,
            tableId: game.tableId,
            turnTimeout: 40,
            gameOver: game.gameOver,
            winner: game.winner
        });
    });

    if (game.spectators && game.spectators.length > 0) {
        game.spectators.forEach((sid) => {
            io.to(sid).emit('okey101Update', {
                hand: [],
                myTurn: false,
                turnIndex: game.turnIndex,
                players: game.players,
                turnPlayerName: currentPlayerName,
                gosterge: game.gosterge,
                okeyDef: game.okeyDef,
                drawPileCount: game.drawPile ? game.drawPile.length : 0,
                tableOpenedPers: game.tableOpenedPers || [],
                playerInfos: playerInfos,
                drawnThisTurn: game.drawnThisTurn,
                lastDiscardTaken: game.lastDiscardTaken,
                canTakeDiscard: false,
                canRevealGosterge: false,
                revealedGosterge: game.revealedGosterge || {},
                disconnectedPlayers: game.disconnectedPlayers || {},
                roundNumber: game.roundNumber || 1,
                mode: game.mode || 'esli',
                yazboz: game.yazboz || null,
                isSpectator: true,
                tableId: game.tableId,
                turnTimeout: 40,
                gameOver: game.gameOver,
                winner: game.winner
            });
        });
    }

    if (game.gameOver) {
        checkOkey101RoundEnd(game, io, players);
        if (game.winner && !game.winnerRecorded) {
            game.winnerRecorded = true;
            let wName = game.playerProfiles[game.winner]?.name;
            if (wName) {
                let isHuman = !game.winner.startsWith('bot_') && !wName.startsWith('🤖');
                if (isHuman) {
                    dataManager.persistentData.leaderboard.okey101[wName] = (dataManager.persistentData.leaderboard.okey101[wName] || 0) + 1;
                }
                game.players.forEach(pid => {
                    let pName = game.playerProfiles[pid]?.name;
                    if (pName && !pid.startsWith('bot_') && !pName.startsWith('🤖')) {
                        dataManager.recordQuestProgress(pName, 'okey101_play', 1);
                    }
                });
                let winPrize = 25;
                if (game.pot && game.pot > 0) {
                    winPrize += game.pot;
                    let potMsg = `💰 TEBRİKLER! ${wName} 101 Okey masasındaki ${game.pot} TL'lik potu kazandı!`;
                    game.players.forEach(pid => io.to(pid).emit('systemMessage', potMsg));
                    if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', potMsg));
                    game.pot = 0;
                }
                if (isHuman && dataManager.persistentData.users[wName]) {
                    dataManager.persistentData.users[wName].money = (dataManager.persistentData.users[wName].money || 100) + winPrize;
                    io.to(game.winner).emit('moneyUpdate', dataManager.persistentData.users[wName].money);
                }
                dataManager.savePersistentData();
            }
        }
    } else {
        startOkey101AfkTimer(game, io, players);
    }
}

function startOkey101AfkTimer(game, io, players) {
    if (!game || game.gameOver) return;
    let gid = game.tableId;
    if (okey101AfkTimers[gid]) {
        clearTimeout(okey101AfkTimers[gid]);
        delete okey101AfkTimers[gid];
    }

    let currentPid = game.players[game.turnIndex];
    let isBot = game.playerProfiles[currentPid]?.isBot || currentPid.startsWith('bot_');
    let delay = isBot ? 1400 : 40000;

    okey101AfkTimers[gid] = setTimeout(() => {
        delete okey101AfkTimers[gid];
        if (game.players[game.turnIndex] === currentPid && !game.gameOver) {
            okey101Engine.makeBotMove(game, currentPid);
            sendOkey101Update(game, io, players);
            if (game.gameOver) {
                checkOkey101RoundEnd(game, io, players);
            }
        }
    }, delay);
}

function startNextOkey101Round(oldGame, io, players) {
    if (!oldGame || !oldGame.tableId) return;
    let tableId = oldGame.tableId;

    if (oldGame.nextRoundTimer) {
        clearTimeout(oldGame.nextRoundTimer);
        delete oldGame.nextRoundTimer;
    }
    oldGame.nextRoundScheduled = false;

    let nextRoundNum = (oldGame.roundNumber || 1) + 1;
    let scores = oldGame.scores;
    let yazboz = oldGame.yazboz;

    // 11 El tamamlandığında maç biter ve yeni oyun başlar
    if (oldGame.roundNumber >= 11) {
        nextRoundNum = 1;
        scores = null;
        yazboz = null;

        let champName = "Oyuncu";
        let minScore = 999999;
        if (oldGame.mode === 'esli' && oldGame.yazboz) {
            let t1 = (oldGame.yazboz.team1 && oldGame.yazboz.team1.totalScore !== undefined) ? oldGame.yazboz.team1.totalScore : 0;
            let t2 = (oldGame.yazboz.team2 && oldGame.yazboz.team2.totalScore !== undefined) ? oldGame.yazboz.team2.totalScore : 0;
            if (t1 <= t2) {
                champName = "1. Grup (Oyuncu 1 & 3)";
                minScore = t1;
            } else {
                champName = "2. Grup (Oyuncu 2 & 4)";
                minScore = t2;
            }
        } else if (oldGame.scores) {
            for (let pid in oldGame.scores) {
                let sc = oldGame.scores[pid];
                if (sc < minScore) {
                    minScore = sc;
                    champName = oldGame.playerProfiles?.[pid]?.name || players[pid]?.name || "Oyuncu";
                }
            }
        }

        let champMsg = `🏆 101 OKEY MAÇI TAMAMLANDI! 11 El sonucunda ŞAMPİYON: ${champName} (Toplam ${minScore} Ceza)! Yeni maç başlıyor...`;
        oldGame.players.forEach(pid => io.to(pid).emit('systemMessage', champMsg));
        if (oldGame.spectators) oldGame.spectators.forEach(sid => io.to(sid).emit('systemMessage', champMsg));
    }

    let nextGame = okey101Engine.startOkey101Game(
        oldGame.players,
        scores,
        nextRoundNum,
        oldGame.mode || 'esli',
        yazboz
    );
    nextGame.tableId = tableId;
    nextGame.mode = oldGame.mode;
    nextGame.bet = oldGame.bet;
    nextGame.pot = oldGame.pot || 0;
    nextGame.spectators = oldGame.spectators || [];
    nextGame.disconnectedPlayers = oldGame.disconnectedPlayers || {};
    nextGame.playerProfiles = oldGame.playerProfiles || {};
    nextGame.paidPlayers = oldGame.paidPlayers || {};

    activeGames[tableId] = nextGame;
    sendOkey101Update(nextGame, io, players);
}

function checkOkey101RoundEnd(game, io, players) {
    if (!game || !game.gameOver || game.nextRoundScheduled) return;
    game.nextRoundScheduled = true;
    if (game.nextRoundTimer) {
        clearTimeout(game.nextRoundTimer);
    }
    game.nextRoundTimer = setTimeout(() => {
        if (game.tableId && activeGames[game.tableId] && activeGames[game.tableId].gameOver) {
            startNextOkey101Round(activeGames[game.tableId], io, players);
        }
    }, 8000);
}

function executeVoidHandOkey101(game, io, players) {
    if (okey101AfkTimers[game.tableId]) {
        clearTimeout(okey101AfkTimers[game.tableId]);
        delete okey101AfkTimers[game.tableId];
    }

    let newGame = okey101Engine.startOkey101Game(
        game.players,
        game.scores,
        game.roundNumber || 1,
        game.mode || 'esli',
        game.yazboz
    );

    game.gosterge = newGame.gosterge;
    game.okeyDef = newGame.okeyDef;
    game.drawPile = newGame.drawPile;
    game.tableOpenedPers = [];
    game.hands = newGame.hands;
    game.hasOpened = newGame.hasOpened;
    game.openedType = newGame.openedType;
    game.roundPenalties = newGame.roundPenalties;
    game.discardPiles = newGame.discardPiles;
    game.drawnThisTurn = newGame.drawnThisTurn;
    game.lastDiscardTaken = false;
    game.takenDiscardTile = null;
    game.takenDiscardTileId = null;
    game.takenDiscardTileProcessed = false;
    game.lastDiscard = null;
    game.pendingDiscardTaker = null;
    game.turnIndex = newGame.turnIndex;
    game.lastDrawnTileId = newGame.lastDrawnTileId;
    game.lastDrawnTile = newGame.lastDrawnTile;
    game.initialGostergeOwners = newGame.initialGostergeOwners;
    game.revealedGosterge = newGame.revealedGosterge;
    game.hasDrawnEver = newGame.hasDrawnEver;
    game.gameOver = false;
    game.winner = null;

    let msg = "🔄 Tüm oyuncular kabul etti! El geçersiz sayıldı ve taşlar yeniden dağıtıldı (Yeniden para alınmadı).";
    game.players.forEach(pid => {
        io.to(pid).emit('voidHandSuccess', { message: msg, gameType: 'okey101' });
        io.to(pid).emit('systemMessage', msg);
    });
    if (game.spectators) {
        game.spectators.forEach(sid => io.to(sid).emit('voidHandSuccess', { message: msg, gameType: 'okey101' }));
    }

    sendOkey101Update(game, io, players);
    startOkey101AfkTimer(game, io, players);
}

module.exports = {
    okey101AfkTimers,
    sendOkey101Update,
    startOkey101AfkTimer,
    startNextOkey101Round,
    checkOkey101RoundEnd,
    executeVoidHandOkey101
};

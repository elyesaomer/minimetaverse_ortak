// src/coordinators/batakCoordinator.js - Batak (Gömmeli 3 Kişilik & Normal 4 Kişilik) Oyun Koordinatörü
const batakEngine = require('../engines/batak.js');
const batak4Engine = require('../engines/batak4.js');
const dataManager = require('../dataManager');
const { activeGames } = require('./gameState');

const batakAfkTimers = {};

function startBatakAfkTimer(game, io, players) {
    if (!game || game.gameOver || game.waitingTrickClear) return;
    let gid = game.tableId;
    if (batakAfkTimers[gid]) {
        clearTimeout(batakAfkTimers[gid]);
        delete batakAfkTimers[gid];
    }

    let currentPid = game.players[game.turnIndex];
    let isBot = game.playerProfiles[currentPid]?.isBot || (game.disconnectedPlayers && !!game.disconnectedPlayers[currentPid]);
    let delay = isBot ? 1200 : 40000;

    batakAfkTimers[gid] = setTimeout(() => {
        makeBatakAiMove(game, currentPid, isBot, io, players);
    }, delay);
}

function makeBatakAiMove(game, pid, isBot, io, players) {
    if (!game || game.gameOver || game.waitingTrickClear) return;
    let engine = game.isBatak4 ? batak4Engine : batakEngine;

    if (game.phase === 'ihale') {
        let hand = game.hands[pid] || [];
        let highCount = hand.filter(c => c.value === 'A' || c.value === 'K' || c.value === 'Q').length;
        let minBid = (game.bid.highestBidder === null) ? (game.isBatak4 ? 4 : 8) : (game.bid.current + 1);
        let maxBotBid = game.isBatak4 ? 7 : 9;
        if (highCount >= (game.isBatak4 ? 4 : 5) && minBid <= maxBotBid) {
            engine.handleBid(game, pid, minBid);
        } else {
            engine.handleBid(game, pid, 'pas');
        }
        sendBatakUpdate(game, io, players);
    }
    else if (game.phase === 'koz_secimi') {
        let hand = game.hands[pid] || [];
        let suitCounts = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };
        hand.forEach(c => { if (suitCounts[c.suit] !== undefined) suitCounts[c.suit]++; });
        let bestSuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b, '♠');
        engine.setTrump(game, pid, bestSuit);
        sendBatakUpdate(game, io, players);
    }
    else if (game.phase === 'gomme') {
        let hand = game.hands[pid] || [];
        let nonTrumpIndices = [];
        hand.forEach((c, idx) => {
            if (c.suit !== game.trump) nonTrumpIndices.push(idx);
        });
        let discardIndices = nonTrumpIndices.slice(0, 4);
        while (discardIndices.length < 4) {
            let nextIdx = hand.findIndex((_, i) => !discardIndices.includes(i));
            if (nextIdx !== -1) discardIndices.push(nextIdx);
            else break;
        }
        engine.discardCards(game, pid, discardIndices);
        sendBatakUpdate(game, io, players);
    }
    else if (game.phase === 'oyun') {
        if (game.waitingTrickClear || (game.tableCards && game.tableCards.length >= (game.isBatak4 ? 4 : 3))) return;
        let hand = game.hands[pid] || [];
        for (let i = 0; i < hand.length; i++) {
            let color = players[pid]?.color || game.playerProfiles[pid]?.color || '#fff';
            let testResult = engine.playCard(game, pid, i, color);
            if (testResult.success) {
                handleBatakCardPlayed(game, engine, testResult, io, players);
                break;
            }
        }
    }
}

function handleBatakCardPlayed(game, engine, result, io, players) {
    if (batakAfkTimers[game.tableId]) {
        clearTimeout(batakAfkTimers[game.tableId]);
        delete batakAfkTimers[game.tableId];
    }

    if (result.trickWinner !== null) {
        game.waitingTrickClear = true;
        sendBatakUpdate(game, io, players);

        let winnerName = (players[result.trickWinner] ? players[result.trickWinner].name : game.playerProfiles[result.trickWinner]?.name) || "Biri";

        game.players.forEach(pid => io.to(pid).emit('systemMessage', `Eli ${winnerName} aldı!`));
        if (game.spectators) {
            game.spectators.forEach(sid => io.to(sid).emit('systemMessage', `Eli ${winnerName} aldı!`));
        }

        setTimeout(() => {
            game.tableCards = [];
            game.waitingTrickClear = false;

            if (result.roundEnded) {
                // 1. Bu elde alınan net puanları hesapla
                let handScores = {};
                game.players.forEach(pid => {
                    let curScore = game.scores[pid] || 0;
                    let prevScore = (game.lastScores && game.lastScores[pid] !== undefined) ? game.lastScores[pid] : 0;
                    handScores[pid] = curScore - prevScore;
                });
                game.lastScores = { ...game.scores };

                let currentRoundInSet = game.setRound || 1;
                if (!game.currentSetRounds) game.currentSetRounds = [];
                game.currentSetRounds.push({
                    roundNum: currentRoundInSet,
                    isTieBreaker: !!game.isTieBreaker,
                    handScores: { ...handScores },
                    totalScores: { ...game.scores }
                });

                // Görev ilerlemesi
                game.players.forEach(pid => {
                    let pName = game.playerProfiles[pid]?.name;
                    let isBot = pid.startsWith('bot_') || (pName && (pName.startsWith('🤖') || pName.includes('🤖'))) || game.playerProfiles[pid]?.isBot;
                    if (pName && !isBot) {
                        dataManager.recordQuestProgress(pName, 'batak_play', 1);
                    }
                });

                // 2. Set Kontrolleri: 5. Tur ve Eşitlik Bozma (6. Tur) Mantığı
                if (currentRoundInSet < 5) {
                    let nextRoundNum = currentRoundInSet + 1;
                    let roundMsg = `TUR BİTTİ! (${currentRoundInSet}. El). Puanlar kaydedildi, ${nextRoundNum}. el dağıtılıyor...`;
                    game.players.forEach(pid => io.to(pid).emit('systemMessage', roundMsg));
                    if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', roundMsg));

                    setTimeout(() => {
                        let oldScores = game.scores;
                        let nextRound = (game.roundNumber || 1) + 1;

                        let newGame = engine.startBatakGame(game.players, oldScores, nextRound);
                        newGame.isBatak4 = game.isBatak4;
                        newGame.tableId = game.tableId;
                        newGame.bet = game.bet || 0;
                        newGame.pot = game.pot || 0;
                        newGame.spectators = game.spectators || [];
                        newGame.playerProfiles = game.playerProfiles;
                        newGame.disconnectedPlayers = game.disconnectedPlayers || {};
                        newGame.paidPlayers = game.paidPlayers || {};
                        newGame.currentSet = game.currentSet || 1;
                        newGame.setRound = nextRoundNum;
                        newGame.isTieBreaker = !!game.isTieBreaker;
                        newGame.currentSetRounds = game.currentSetRounds;
                        newGame.setsHistory = game.setsHistory || [];
                        newGame.cumulativeSetPoints = game.cumulativeSetPoints || {};
                        newGame.rematchVotes = {};
                        newGame.lastScores = game.lastScores;

                        activeGames[game.tableId] = newGame;
                        sendBatakUpdate(newGame, io, players);
                    }, 3500);
                } else if (currentRoundInSet === 5) {
                    // 5. Tur Bitti! Zirvede puan eşitliği var mı kontrol et
                    let maxScore = -999999;
                    game.players.forEach(pid => {
                        let sc = game.scores[pid] || 0;
                        if (sc > maxScore) maxScore = sc;
                    });
                    let topPlayers = game.players.filter(pid => (game.scores[pid] || 0) === maxScore);

                    if (topPlayers.length >= 2) {
                        // Eşitlik var -> 6. Tur (Eşitlik Bozma Oyunu) ekle!
                        game.isTieBreaker = true;
                        game.setRound = 6;

                        let topNames = topPlayers.map(p => game.playerProfiles[p]?.name || "Oyuncu").join(" ve ");
                        let tieMsg = `⚡ EŞİTLİK BOZMA OYUNU! 5. tur sonunda ${topNames} eşit puanla (${maxScore}) berabere kaldı! Kazananı belirlemek için 6. tur (Eşitlik Bozma Oyunu) başlıyor!`;
                        game.players.forEach(pid => io.to(pid).emit('systemMessage', tieMsg));
                        if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', tieMsg));

                        setTimeout(() => {
                            let oldScores = game.scores;
                            let nextRound = (game.roundNumber || 1) + 1;

                            let newGame = engine.startBatakGame(game.players, oldScores, nextRound);
                            newGame.isBatak4 = game.isBatak4;
                            newGame.tableId = game.tableId;
                            newGame.bet = game.bet || 0;
                            newGame.pot = game.pot || 0;
                            newGame.spectators = game.spectators || [];
                            newGame.playerProfiles = game.playerProfiles;
                            newGame.disconnectedPlayers = game.disconnectedPlayers || {};
                            newGame.paidPlayers = game.paidPlayers || {};
                            newGame.currentSet = game.currentSet || 1;
                            newGame.setRound = 6;
                            newGame.isTieBreaker = true;
                            newGame.currentSetRounds = game.currentSetRounds;
                            newGame.setsHistory = game.setsHistory || [];
                            newGame.cumulativeSetPoints = game.cumulativeSetPoints || {};
                            newGame.rematchVotes = {};
                            newGame.lastScores = game.lastScores;

                            activeGames[game.tableId] = newGame;
                            sendBatakUpdate(newGame, io, players);
                        }, 4000);
                    } else {
                        // Tek birinci var, 5. tur sonunda set bitti!
                        finalizeBatakSet(game, engine, io, players);
                    }
                } else if (currentRoundInSet === 6) {
                    // 6. Tur (Eşitlik Bozma) Bitti! Seti tamamla
                    finalizeBatakSet(game, engine, io, players);
                }
            } else {
                sendBatakUpdate(game, io, players);
            }
        }, 2000);
    } else {
        sendBatakUpdate(game, io, players);
    }
}

function finalizeBatakSet(game, engine, io, players) {
    if (!game) return;

    // 1. Oyuncuları set puanlarına göre sırala (azalan sırayla)
    let ranked = [...game.players].map(pid => {
        let pName = game.playerProfiles[pid]?.name || (players[pid] ? players[pid].name : "Oyuncu");
        let score = game.scores[pid] || 0;
        let isBot = pid.startsWith('bot_') || (pName && (pName.startsWith('🤖') || pName.includes('🤖'))) || game.playerProfiles[pid]?.isBot;
        return { pid, name: pName, score, isBot };
    }).sort((a, b) => b.score - a.score);

    // 2. Set Sıralaması ve Set Puanları: 1. -> 3 puan, 2. -> 2 puan, 3. -> 1 puan (4. varsa -> 0)
    let setPointsTable = [3, 2, 1, 0];
    if (!game.cumulativeSetPoints) game.cumulativeSetPoints = {};
    ranked.forEach((item, index) => {
        item.rank = index + 1;
        item.setPoints = setPointsTable[index] !== undefined ? setPointsTable[index] : 0;
        game.cumulativeSetPoints[item.pid] = (game.cumulativeSetPoints[item.pid] || 0) + item.setPoints;
    });

    let winner = ranked[0];
    let winPid = winner.pid;
    let winName = winner.name;

    // Leaderboard güncellemesi
    if (!winner.isBot && winName) {
        dataManager.persistentData.leaderboard.batak[winName] = (dataManager.persistentData.leaderboard.batak[winName] || 0) + (winner.score > 0 ? winner.score : 1);
    }

    // 3. Pot Ödülü: Set sonundaki EN YÜKSEK kişi potun TAMAMINI (örn. 3.000 TL) tek başına kazanır!
    let winPrize = 0;
    if (game.pot && game.pot > 0) {
        winPrize = game.pot;
        game.pot = 0;
        if (!winner.isBot && dataManager.persistentData.users[winName]) {
            dataManager.persistentData.users[winName].money = (dataManager.persistentData.users[winName].money || 0) + winPrize;
            if (players[winPid]) players[winPid].money = dataManager.persistentData.users[winName].money;
            io.to(winPid).emit('moneyUpdate', dataManager.persistentData.users[winName].money);
        }
        dataManager.savePersistentData();

        let potMsg = `💰 TEBRİKLER! ${winName} ${game.currentSet || 1}. Seti ${winner.score} puanla zirvede tamamlayarak ${winPrize} TL'lik dev potu tek başına kazandı!`;
        game.players.forEach(pid => io.to(pid).emit('systemMessage', potMsg));
        if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', potMsg));
    } else {
        let setMsg = `🏆 ${game.currentSet || 1}. SET BİTTİ! Şampiyon: ${winName} (${winner.score} puan | +3 Set Puanı kazandı)`;
        game.players.forEach(pid => io.to(pid).emit('systemMessage', setMsg));
        if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', setMsg));
    }

    // 4. Set Geçmişine Kaydet
    if (!game.setsHistory) game.setsHistory = [];
    game.setsHistory.push({
        setNumber: game.currentSet || 1,
        rounds: [...(game.currentSetRounds || [])],
        finalScores: { ...game.scores },
        rankings: ranked.map(r => ({ ...r })),
        winnerId: winPid,
        winnerName: winName,
        isTieBreaker: !!game.isTieBreaker,
        potAwarded: winPrize
    });

    game.setEnded = true;
    game.rematchVotes = {};

    // 5. batakSetCompleted Event'ini Yayınla
    let setCompletedPayload = {
        tableId: game.tableId,
        setNumber: game.currentSet || 1,
        rankings: ranked,
        winner: winner,
        potAwarded: winPrize,
        setsHistory: game.setsHistory,
        cumulativeSetPoints: game.cumulativeSetPoints,
        isTieBreaker: !!game.isTieBreaker,
        bet: game.bet || 0
    };

    game.players.forEach(pid => {
        io.to(pid).emit('batakSetCompleted', setCompletedPayload);
    });
    if (game.spectators) {
        game.spectators.forEach(sid => io.to(sid).emit('batakSetCompleted', setCompletedPayload));
    }

    sendBatakUpdate(game, io, players);

    // 6. Botlar için otomatik rövanş oyu
    game.players.forEach(pid => {
        let isBot = pid.startsWith('bot_') || game.playerProfiles[pid]?.isBot;
        if (isBot) {
            setTimeout(() => {
                handleBatakVoteRematch(game, pid, true, io, players);
            }, 1500);
        }
    });
}

function handleBatakVoteRematch(game, pid, vote, io, players) {
    if (!game || !game.setEnded) return;
    if (!game.rematchVotes) game.rematchVotes = {};
    game.rematchVotes[pid] = !!vote;

    let pName = game.playerProfiles[pid]?.name || (players[pid] ? players[pid].name : "Oyuncu");

    let votePayload = {
        playerId: pid,
        playerName: pName,
        agreed: !!vote,
        votes: game.rematchVotes,
        totalPlayers: game.players.length
    };
    game.players.forEach(p => io.to(p).emit('batakRematchStatus', votePayload));
    if (game.spectators) game.spectators.forEach(s => io.to(s).emit('batakRematchStatus', votePayload));

    let allAgreed = game.players.every(p => game.rematchVotes[p]);
    if (allAgreed) {
        let bet = game.bet || 0;
        if (bet > 0) {
            let brokePlayers = [];
            game.players.forEach(p => {
                if (!p.startsWith('bot_') && players[p]) {
                    let uName = players[p].name;
                    let curMoney = (dataManager.persistentData.users[uName]?.money !== undefined)
                        ? dataManager.persistentData.users[uName].money
                        : (players[p].money || 0);
                    if (curMoney < bet) {
                        brokePlayers.push({ pid: p, name: uName, money: curMoney });
                    }
                }
            });

            if (brokePlayers.length > 0) {
                let warningMsg = "Paranız bu masada oynamaya yetmiyor isterseniz ücretsiz masalara geçiş yapabilirsiniz.";
                brokePlayers.forEach(bp => {
                    io.to(bp.pid).emit('insufficientFundsWarning', {
                        message: warningMsg,
                        requiredBet: bet,
                        currentMoney: bp.money
                    });
                    io.to(bp.pid).emit('systemMessage', `⚠️ ${warningMsg}`);
                });
                game.players.filter(p => !brokePlayers.some(bp => bp.pid === p)).forEach(otherPid => {
                    io.to(otherPid).emit('systemMessage', `⚠️ Masadaki oyunculardan birinin bakiyesi yeni set bahsini karşılamaya yetmedi.`);
                });
                game.rematchVotes = {};
                return;
            }

            let newPot = 0;
            game.players.forEach(p => {
                if (!p.startsWith('bot_') && players[p]) {
                    let uName = players[p].name;
                    dataManager.persistentData.users[uName].money = Math.max(0, (dataManager.persistentData.users[uName].money || 0) - bet);
                    players[p].money = dataManager.persistentData.users[uName].money;
                    io.to(p).emit('moneyUpdate', players[p].money);
                }
                newPot += bet;
            });
            dataManager.savePersistentData();
            game.pot = newPot;
        }

        // Yeni set başlat
        game.currentSet = (game.currentSet || 1) + 1;
        game.setRound = 1;
        game.isTieBreaker = false;
        game.setEnded = false;
        game.rematchVotes = {};
        game.currentSetRounds = [];
        game.lastScores = {};
        game.scores = {};
        game.players.forEach(p => { game.scores[p] = 0; });

        let engine = game.isBatak4 ? batak4Engine : batakEngine;
        let nextRound = (game.roundNumber || 5) + 1;
        let newGame = engine.startBatakGame(game.players, game.scores, nextRound);
        newGame.isBatak4 = game.isBatak4;
        newGame.tableId = game.tableId;
        newGame.bet = game.bet || 0;
        newGame.pot = game.pot || 0;
        newGame.spectators = game.spectators || [];
        newGame.playerProfiles = game.playerProfiles;
        newGame.disconnectedPlayers = game.disconnectedPlayers || {};
        newGame.paidPlayers = game.paidPlayers || {};
        newGame.currentSet = game.currentSet;
        newGame.setRound = 1;
        newGame.isTieBreaker = false;
        newGame.currentSetRounds = [];
        newGame.setsHistory = game.setsHistory;
        newGame.cumulativeSetPoints = game.cumulativeSetPoints;
        newGame.rematchVotes = {};
        newGame.lastScores = {};

        activeGames[game.tableId] = newGame;

        let startNotice = `📢 ${newGame.currentSet}. Set Başladı!${bet > 0 ? ` (Set Bahsi: ${bet} TL | Pot: ${newGame.pot} TL)` : ''}`;
        newGame.players.forEach(pid => {
            io.to(pid).emit('systemMessage', startNotice);
            io.to(pid).emit('batakNewSetStarted', {
                setNumber: newGame.currentSet,
                pot: newGame.pot,
                bet: newGame.bet
            });
        });
        if (newGame.spectators) {
            newGame.spectators.forEach(sid => io.to(sid).emit('systemMessage', startNotice));
        }

        sendBatakUpdate(newGame, io, players);
    }
}

function sendBatakUpdate(game, io, players) {
    if (!game || !game.hands || !game.players) return;
    let playerInfos = {};
    game.players.forEach(pid => {
        let pName = "Kayıtsız";
        if (players[pid]) pName = players[pid].name;
        else if (game.playerProfiles && game.playerProfiles[pid]) pName = game.playerProfiles[pid].name;

        playerInfos[pid] = {
            name: pName,
            score: (game.scores && game.scores[pid] !== undefined) ? game.scores[pid] : 0,
            tricks: (game.tricksTaken && game.tricksTaken[pid] !== undefined) ? game.tricksTaken[pid] : 0,
            isDisconnected: (game.disconnectedPlayers && !!game.disconnectedPlayers[pid])
        };
    });

    let currentPid = game.players[game.turnIndex];
    let currentPlayerName = playerInfos[currentPid] ? playerInfos[currentPid].name : "Biri";

    let commonState = {
        phase: game.phase,
        table: game.tableCards,
        turnIndex: game.turnIndex,
        players: game.players,
        turnPlayerName: currentPlayerName,
        trump: game.trump,
        bidInfo: game.bid,
        playerInfos: playerInfos,
        roundNumber: game.roundNumber || 1,
        tableId: game.tableId,
        turnTimeout: 40,
        currentSet: game.currentSet || 1,
        setRound: game.setRound || 1,
        isTieBreaker: !!game.isTieBreaker,
        currentSetRounds: game.currentSetRounds || [],
        setsHistory: game.setsHistory || [],
        cumulativeSetPoints: game.cumulativeSetPoints || {},
        bet: game.bet || 0,
        pot: game.pot || 0,
        isBatak4: !!game.isBatak4,
        setEnded: !!game.setEnded,
        rematchVotes: game.rematchVotes || {}
    };

    game.players.forEach((pid) => {
        if (game.disconnectedPlayers && game.disconnectedPlayers[pid]) return;
        io.to(pid).emit('batakUpdate', {
            ...commonState,
            hand: (game.hands && game.hands[pid]) || [],
            myTurn: !game.waitingTrickClear && (game.players[game.turnIndex] === pid),
            tricks: (game.tricksTaken && game.tricksTaken[pid] !== undefined) ? game.tricksTaken[pid] : 0,
            isSpectator: false
        });
    });

    if (game.spectators && game.spectators.length > 0) {
        game.spectators.forEach((sid) => {
            io.to(sid).emit('batakUpdate', {
                ...commonState,
                hand: [],
                myTurn: false,
                tricks: 0,
                isSpectator: true
            });
        });
    }

    if (!game.waitingTrickClear) {
        startBatakAfkTimer(game, io, players);
    }
}

function executeVoidHandBatak(game, io, players) {
    if (batakAfkTimers[game.tableId]) {
        clearTimeout(batakAfkTimers[game.tableId]);
        delete batakAfkTimers[game.tableId];
    }

    let engine = game.isBatak4 ? batak4Engine : batakEngine;
    let newGame = engine.startBatakGame(game.players, game.scores, game.roundNumber || 1);

    game.phase = newGame.phase;
    game.hands = newGame.hands;
    game.hiddenCards = newGame.hiddenCards || [];
    game.tableCards = [];
    game.turnIndex = newGame.turnIndex;
    game.forcedPlayerIndex = newGame.forcedPlayerIndex;
    game.bid = newGame.bid;
    game.passedPlayers = [];
    game.trump = null;
    game.tricksTaken = newGame.tricksTaken;
    game.starterIndex = newGame.starterIndex;
    game.trumpBroken = false;
    game.waitingTrickClear = false;
    game.gameOver = false;
    game.setEnded = false;

    let msg = "🔄 Tüm oyuncular kabul etti! El geçersiz sayıldı ve kartlar yeniden dağıtıldı (Yeniden para alınmadı).";
    game.players.forEach(pid => {
        io.to(pid).emit('voidHandSuccess', { message: msg, gameType: 'batak' });
        io.to(pid).emit('systemMessage', msg);
    });
    if (game.spectators) {
        game.spectators.forEach(sid => io.to(sid).emit('voidHandSuccess', { message: msg, gameType: 'batak' }));
    }

    sendBatakUpdate(game, io, players);
    startBatakAfkTimer(game, io, players);
}

module.exports = {
    batakAfkTimers,
    startBatakAfkTimer,
    makeBatakAiMove,
    handleBatakCardPlayed,
    finalizeBatakSet,
    handleBatakVoteRematch,
    sendBatakUpdate,
    executeVoidHandBatak
};

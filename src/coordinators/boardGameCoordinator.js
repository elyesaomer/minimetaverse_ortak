// src/coordinators/boardGameCoordinator.js - Masa & Kutu Oyunları Koordinatörü (Tavla, XOX, Amiral Battı)
const tavlaEngine = require('../engines/tavla');
const xoxEngine = require('../engines/xox');
const amiralEngine = require('../engines/amiral');
const chessEngine = require('../engines/chessEngine');
const dataManager = require('../dataManager');

const xoxBotTimers = {};
const amiralBotTimers = {};
const chessBotTimers = {};
const chessClockIntervals = {};

// --- TAVLA SİSTEMİ ---
function sendTavlaUpdate(game, io) {
    if (!game || !game.players) return;
    let stateObj = {
        tableId: game.tableId,
        players: game.players,
        playerColors: game.playerColors,
        turnIndex: game.turnIndex,
        board: game.board,
        bar: game.bar,
        borneOff: game.borneOff,
        dice: game.dice,
        remainingMoves: game.remainingMoves,
        hasRolled: game.hasRolled,
        noMoves: !!game.noMoves,
        winner: game.winner,
        gameOver: game.gameOver,
        playerProfiles: game.playerProfiles,
        disconnectedPlayers: game.disconnectedPlayers || {}
    };

    game.players.forEach(pid => {
        io.to(pid).emit('tavlaUpdate', { ...stateObj, isSpectator: false });
    });

    if (game.spectators && game.spectators.length > 0) {
        game.spectators.forEach(sid => {
            io.to(sid).emit('tavlaUpdate', { ...stateObj, isSpectator: true });
        });
    }

    if (!game.gameOver) {
        // Eğer oyuncu zar attıysa fakat oynayacak hamlesi yoksa, 1.6 saniye sonra sırayı devret
        if (game.noMoves) {
            setTimeout(() => {
                if (game.noMoves && !game.gameOver) {
                    tavlaEngine.passTurn(game);
                    sendTavlaUpdate(game, io);
                }
            }, 1600);
            return;
        }

        let currentPid = game.players[game.turnIndex];
        let isBot = currentPid && (currentPid.startsWith('bot_') || game.playerProfiles?.[currentPid]?.isBot);
        if (isBot) {
            setTimeout(() => {
                if (game.players[game.turnIndex] === currentPid && !game.gameOver) {
                    tavlaEngine.makeTavlaBotMove(game, currentPid);
                    sendTavlaUpdate(game, io);
                }
            }, 1200);
        }
    }
}

// --- XOX (TİC-TAC-TOE) SİSTEMİ ---
function sendXoxUpdate(game, io) {
    if (!game || !game.players) return;
    let stateObj = {
        tableId: game.tableId,
        players: game.players,
        playerSymbols: game.playerSymbols,
        turnIndex: game.turnIndex,
        turnSymbol: game.playerSymbols[game.players[game.turnIndex]],
        board: game.board,
        winner: game.winner,
        winningCombo: game.winningCombo,
        gameOver: game.gameOver,
        status: game.gameOver ? 'ended' : 'playing',
        scores: game.scores,
        turnTimeout: 25,
        bet: game.bet || 0,
        pot: game.pot || 0,
        playerProfiles: game.playerProfiles,
        disconnectedPlayers: game.disconnectedPlayers || {},
        rematchVotes: game.rematchVotes || {}
    };

    game.players.forEach(pid => {
        if (game.disconnectedPlayers && game.disconnectedPlayers[pid]) return;
        io.to(pid).emit('xoxUpdate', { ...stateObj, isSpectator: false, mySymbol: game.playerSymbols[pid] });
    });

    if (game.spectators && game.spectators.length > 0) {
        game.spectators.forEach(sid => {
            io.to(sid).emit('xoxUpdate', { ...stateObj, isSpectator: true, mySymbol: null });
        });
    }

    if (game.gameOver && game.winner && !game.winnerRecorded) {
        game.winnerRecorded = true;
        let isTie = game.winner === 'tie';
        if (isTie) {
            let tieMsg = `🤝 XOX Düellosu BERABERE bitti!`;
            game.players.forEach(pid => io.to(pid).emit('systemMessage', tieMsg));
            if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', tieMsg));
            if (game.pot && game.pot > 0) {
                let refund = Math.floor(game.pot / 2);
                game.players.forEach(pid => {
                    let pName = game.playerProfiles[pid]?.name;
                    let isBot = pid.startsWith('bot_') || game.playerProfiles[pid]?.isBot;
                    if (!isBot && pName && dataManager.persistentData.users[pName]) {
                        dataManager.persistentData.users[pName].money = (dataManager.persistentData.users[pName].money || 0) + refund;
                        io.to(pid).emit('moneyUpdate', dataManager.persistentData.users[pName].money);
                    }
                });
                game.pot = 0;
                dataManager.savePersistentData();
            }
        } else {
            let winPid = game.players.find(p => game.playerSymbols[p] === game.winner);
            let wName = winPid ? game.playerProfiles[winPid]?.name : "Oyuncu";
            let isHuman = winPid && !winPid.startsWith('bot_') && !game.playerProfiles[winPid]?.isBot;
            let winPrize = 15;
            if (game.pot && game.pot > 0) {
                winPrize += game.pot;
                let potMsg = `💰 TEBRİKLER! ${wName} XOX masasındaki ${game.pot} TL'lik potu kazandı!`;
                game.players.forEach(pid => io.to(pid).emit('systemMessage', potMsg));
                if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', potMsg));
                game.pot = 0;
            } else {
                let winMsg = `🏆 XOX Düellosunu ${wName} kazandı!`;
                game.players.forEach(pid => io.to(pid).emit('systemMessage', winMsg));
                if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', winMsg));
            }

            if (wName) {
                if (!dataManager.persistentData.leaderboard.xox) dataManager.persistentData.leaderboard.xox = {};
                if (isHuman) {
                    dataManager.persistentData.leaderboard.xox[wName] = (dataManager.persistentData.leaderboard.xox[wName] || 0) + 1;
                }
                if (isHuman && dataManager.persistentData.users[wName]) {
                    dataManager.persistentData.users[wName].money = (dataManager.persistentData.users[wName].money || 100) + winPrize;
                    io.to(winPid).emit('moneyUpdate', dataManager.persistentData.users[wName].money);
                }
                dataManager.savePersistentData();
            }
        }

        // Bot otomatik rövanş oyu
        game.players.forEach(pid => {
            let isBot = pid.startsWith('bot_') || game.playerProfiles[pid]?.isBot;
            if (isBot) {
                setTimeout(() => {
                    handleXoxVoteRematch(game, pid, true, io);
                }, 1400);
            }
        });
    } else if (!game.gameOver) {
        let currentPid = game.players[game.turnIndex];
        let isBot = currentPid && (currentPid.startsWith('bot_') || game.playerProfiles?.[currentPid]?.isBot);
        if (isBot) {
            if (xoxBotTimers[game.tableId]) clearTimeout(xoxBotTimers[game.tableId]);
            xoxBotTimers[game.tableId] = setTimeout(() => {
                delete xoxBotTimers[game.tableId];
                if (game.players[game.turnIndex] === currentPid && !game.gameOver) {
                    xoxEngine.makeXoxBotMove(game, currentPid);
                    sendXoxUpdate(game, io);
                }
            }, 1000);
        }
    }
}

function handleXoxVoteRematch(game, pid, vote, io, players = {}) {
    if (!game || !game.gameOver) return;
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
    game.players.forEach(p => io.to(p).emit('xoxRematchStatus', votePayload));
    if (game.spectators) game.spectators.forEach(s => io.to(s).emit('xoxRematchStatus', votePayload));

    let allAgreed = game.players.every(p => game.rematchVotes[p]);
    if (allAgreed) {
        let bet = game.bet || 0;
        if (bet > 0) {
            let brokePlayers = [];
            game.players.forEach(p => {
                if (!p.startsWith('bot_')) {
                    let uName = game.playerProfiles[p]?.name;
                    let curMoney = (uName && dataManager.persistentData.users[uName]?.money !== undefined)
                        ? dataManager.persistentData.users[uName].money
                        : ((players[p] && players[p].money) || 0);
                    if (curMoney < bet) {
                        brokePlayers.push({ pid: p, name: uName, money: curMoney });
                    }
                }
            });

            if (brokePlayers.length > 0) {
                let warningMsg = "Paranız bu masada oynamaya yetmiyor isterseniz ücretsiz masalara geçiş yapabilirsiniz.";
                brokePlayers.forEach(bp => {
                    io.to(bp.pid).emit('insufficientFundsWarning', { message: warningMsg, requiredBet: bet, currentMoney: bp.money });
                    io.to(bp.pid).emit('systemMessage', `⚠️ ${warningMsg}`);
                });
                game.rematchVotes = {};
                return;
            }

            let newPot = 0;
            game.players.forEach(p => {
                if (!p.startsWith('bot_')) {
                    let uName = game.playerProfiles[p]?.name;
                    if (uName && dataManager.persistentData.users[uName]) {
                        dataManager.persistentData.users[uName].money = Math.max(0, (dataManager.persistentData.users[uName].money || 0) - bet);
                        if (players[p]) players[p].money = dataManager.persistentData.users[uName].money;
                        io.to(p).emit('moneyUpdate', dataManager.persistentData.users[uName].money);
                    }
                }
                newPot += bet;
            });
            dataManager.savePersistentData();
            game.pot = newPot;
        }

        let fresh = xoxEngine.startXoxGame(game.players);
        game.startingTurnIndex = (game.startingTurnIndex !== undefined) ? (1 - game.startingTurnIndex) : 1;
        game.board = fresh.board;
        game.turnIndex = game.startingTurnIndex;
        game.playerSymbols = fresh.playerSymbols;
        game.winner = null;
        game.winningCombo = null;
        game.gameOver = false;
        game.winnerRecorded = false;
        game.rematchVotes = {};

        let startNotice = `⚔️ Yeni XOX Düellosu Başladı!${bet > 0 ? ` (Masa Bahsi: ${bet} TL | Pot: ${game.pot} TL)` : ''}`;
        game.players.forEach(pid => io.to(pid).emit('systemMessage', startNotice));
        if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', startNotice));

        sendXoxUpdate(game, io);
    }
}

// --- AMİRAL BATTI SİSTEMİ ---
function sendAmiralUpdate(game, io) {
    if (!game || !game.players) return;

    let baseState = {
        tableId: game.tableId,
        players: game.players,
        phase: game.phase,
        turnIndex: game.turnIndex,
        ready: game.ready,
        lastShotResult: game.lastShotResult,
        winner: game.winner,
        gameOver: game.gameOver,
        status: game.gameOver ? 'ended' : 'playing',
        turnTimeout: 30,
        bet: game.bet || 0,
        pot: game.pot || 0,
        stats: game.stats,
        playerProfiles: game.playerProfiles,
        disconnectedPlayers: game.disconnectedPlayers || {},
        rematchVotes: game.rematchVotes || {}
    };

    game.players.forEach(pid => {
        if (game.disconnectedPlayers && game.disconnectedPlayers[pid]) return;
        let oppId = game.players.find(p => p !== pid);
        let oppShipsStatus = (oppId && game.ships[oppId]) 
            ? game.ships[oppId].map(s => ({ id: s.id, name: s.name, size: s.size, sunk: !!s.sunk, color: s.color }))
            : [];

        io.to(pid).emit('amiralUpdate', {
            ...baseState,
            isSpectator: false,
            myShips: game.ships[pid] || [],
            myGrid: game.grids[pid] || [],
            oppShots: game.shots[pid] || [],
            oppShipsStatus: oppShipsStatus,
            isMyTurn: (game.phase === 'BATTLE' && game.players[game.turnIndex] === pid)
        });
    });

    if (game.spectators && game.spectators.length > 0) {
        let p1 = game.players[0];
        let p2 = game.players[1];
        game.spectators.forEach(sid => {
            io.to(sid).emit('amiralUpdate', {
                ...baseState,
                isSpectator: true,
                p1Shots: game.shots[p1] || [],
                p2Shots: game.shots[p2] || [],
                p1ShipsStatus: (game.ships[p1] || []).map(s => ({ id: s.id, name: s.name, size: s.size, sunk: !!s.sunk })),
                p2ShipsStatus: (game.ships[p2] || []).map(s => ({ id: s.id, name: s.name, size: s.size, sunk: !!s.sunk })),
                isMyTurn: false
            });
        });
    }

    if (game.gameOver && game.winner && !game.winnerRecorded) {
        game.winnerRecorded = true;
        let wName = game.playerProfiles[game.winner]?.name || "Oyuncu";
        let isHuman = !game.winner.startsWith('bot_') && !game.playerProfiles[game.winner]?.isBot;
        let winPrize = 25;
        if (game.pot && game.pot > 0) {
            winPrize += game.pot;
            let potMsg = `⚓ ZAFER! ${wName} rakip donanmayı tamamen batırarak ${game.pot} TL'lik ödül potunu kazandı!`;
            game.players.forEach(pid => io.to(pid).emit('systemMessage', potMsg));
            if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', potMsg));
            game.pot = 0;
        } else {
            let winMsg = `⚓ ZAFER! ${wName} rakibin tüm gemilerini batırarak Amiral Battı deniz muharebesini kazandı!`;
            game.players.forEach(pid => io.to(pid).emit('systemMessage', winMsg));
            if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', winMsg));
        }

        if (wName) {
            if (!dataManager.persistentData.leaderboard.amiral) dataManager.persistentData.leaderboard.amiral = {};
            if (isHuman) {
                dataManager.persistentData.leaderboard.amiral[wName] = (dataManager.persistentData.leaderboard.amiral[wName] || 0) + 1;
            }
            if (isHuman && dataManager.persistentData.users[wName]) {
                dataManager.persistentData.users[wName].money = (dataManager.persistentData.users[wName].money || 100) + winPrize;
                io.to(game.winner).emit('moneyUpdate', dataManager.persistentData.users[wName].money);
            }
            dataManager.savePersistentData();
        }

        // Bot otomatik rövanş oyu
        game.players.forEach(pid => {
            let isBot = pid.startsWith('bot_') || game.playerProfiles[pid]?.isBot;
            if (isBot) {
                setTimeout(() => {
                    handleAmiralVoteRematch(game, pid, true, io);
                }, 1500);
            }
        });
    } else if (game.phase === 'BATTLE' && !game.gameOver) {
        let currentPid = game.players[game.turnIndex];
        let isBot = currentPid && (currentPid.startsWith('bot_') || game.playerProfiles?.[currentPid]?.isBot);
        if (isBot) {
            if (amiralBotTimers[game.tableId]) clearTimeout(amiralBotTimers[game.tableId]);
            amiralBotTimers[game.tableId] = setTimeout(() => {
                delete amiralBotTimers[game.tableId];
                if (game.phase === 'BATTLE' && game.players[game.turnIndex] === currentPid && !game.gameOver) {
                    amiralEngine.makeAmiralBotMove(game, currentPid);
                    sendAmiralUpdate(game, io);
                }
            }, 1200);
        }
    }
}

function handleAmiralVoteRematch(game, pid, vote, io, players = {}) {
    if (!game || !game.gameOver) return;
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
    game.players.forEach(p => io.to(p).emit('amiralRematchStatus', votePayload));
    if (game.spectators) game.spectators.forEach(s => io.to(s).emit('amiralRematchStatus', votePayload));

    let allAgreed = game.players.every(p => game.rematchVotes[p]);
    if (allAgreed) {
        let bet = game.bet || 0;
        if (bet > 0) {
            let brokePlayers = [];
            game.players.forEach(p => {
                if (!p.startsWith('bot_')) {
                    let uName = game.playerProfiles[p]?.name;
                    let curMoney = (uName && dataManager.persistentData.users[uName]?.money !== undefined)
                        ? dataManager.persistentData.users[uName].money
                        : ((players[p] && players[p].money) || 0);
                    if (curMoney < bet) {
                        brokePlayers.push({ pid: p, name: uName, money: curMoney });
                    }
                }
            });

            if (brokePlayers.length > 0) {
                let warningMsg = "Paranız bu masada oynamaya yetmiyor isterseniz ücretsiz masalara geçiş yapabilirsiniz.";
                brokePlayers.forEach(bp => {
                    io.to(bp.pid).emit('insufficientFundsWarning', { message: warningMsg, requiredBet: bet, currentMoney: bp.money });
                    io.to(bp.pid).emit('systemMessage', `⚠️ ${warningMsg}`);
                });
                game.rematchVotes = {};
                return;
            }

            let newPot = 0;
            game.players.forEach(p => {
                if (!p.startsWith('bot_')) {
                    let uName = game.playerProfiles[p]?.name;
                    if (uName && dataManager.persistentData.users[uName]) {
                        dataManager.persistentData.users[uName].money = Math.max(0, (dataManager.persistentData.users[uName].money || 0) - bet);
                        if (players[p]) players[p].money = dataManager.persistentData.users[uName].money;
                        io.to(p).emit('moneyUpdate', dataManager.persistentData.users[uName].money);
                    }
                }
                newPot += bet;
            });
            dataManager.savePersistentData();
            game.pot = newPot;
        }

        let fresh = amiralEngine.startAmiralGame(game.players);
        game.startingTurnIndex = (game.startingTurnIndex !== undefined) ? (1 - game.startingTurnIndex) : 1;
        fresh.startingTurnIndex = game.startingTurnIndex;
        game.phase = fresh.phase;
        game.ready = fresh.ready;
        game.ships = fresh.ships;
        game.grids = fresh.grids;
        game.shots = fresh.shots;
        game.turnIndex = game.startingTurnIndex;
        game.winner = null;
        game.gameOver = false;
        game.winnerRecorded = false;
        game.lastShotResult = null;
        game.stats = fresh.stats;
        game.rematchVotes = {};

        // Bot oyuncusu varsa donanmasını otomatik yerleştir ve hazır yap
        game.players.forEach(pid => {
            let isBot = pid.startsWith('bot_') || game.playerProfiles?.[pid]?.isBot;
            if (isBot) {
                let randomFleet = amiralEngine.generateRandomFleet();
                amiralEngine.setPlayerFleet(game, pid, randomFleet.ships, randomFleet.grid);
            }
        });

        let startNotice = `⚓ Yeni Amiral Battı Muharebesi Başladı! Donanmanızı yerleştirin veya Rastgele Dağıt'a basın.${bet > 0 ? ` (Masa Bahsi: ${bet} TL | Pot: ${game.pot} TL)` : ''}`;
        game.players.forEach(pid => io.to(pid).emit('systemMessage', startNotice));
        if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', startNotice));

        sendAmiralUpdate(game, io);
    }
}

// --- SATRANÇ (CHESS) SİSTEMİ ---
function clearChessTimers(tableId) {
    if (chessBotTimers[tableId]) {
        clearTimeout(chessBotTimers[tableId]);
        delete chessBotTimers[tableId];
    }
    if (chessClockIntervals[tableId]) {
        clearInterval(chessClockIntervals[tableId]);
        delete chessClockIntervals[tableId];
    }
}

function sendChessUpdate(game, io) {
    if (!game || !game.players) return;

    const now = Date.now();
    let currentWhiteTime = game.whiteTime;
    let currentBlackTime = game.blackTime;

    if (game.timeMode === '10m' && !game.gameOver) {
        const elapsed = Math.max(0, (now - game.lastMoveTimestamp) / 1000);
        if (game.turn === 'w') {
            currentWhiteTime = Math.max(0, game.whiteTime - elapsed);
            if (currentWhiteTime <= 0) {
                game.gameOver = true;
                game.winner = 'b';
                game.winReason = 'timeout';
            }
        } else {
            currentBlackTime = Math.max(0, game.blackTime - elapsed);
            if (currentBlackTime <= 0) {
                game.gameOver = true;
                game.winner = 'w';
                game.winReason = 'timeout';
            }
        }
    }

    const stateObj = {
        tableId: game.tableId,
        players: game.players,
        playerColors: game.playerColors,
        turn: game.turn,
        fen: game.fen,
        history: game.moveHistory,
        capturedPieces: game.capturedPieces,
        inCheck: game.inCheck,
        gameOver: game.gameOver,
        winner: game.winner,
        winReason: game.winReason,
        timeMode: game.timeMode,
        whiteTime: Math.round(currentWhiteTime),
        blackTime: Math.round(currentBlackTime),
        legalMoves: (game.chessInstance && !game.gameOver) ? game.chessInstance.moves({ verbose: true }) : [],
        bet: game.bet || 0,
        pot: game.pot || 0,
        playerProfiles: game.playerProfiles,
        disconnectedPlayers: game.disconnectedPlayers || {},
        rematchVotes: game.rematchVotes || {}
    };

    game.players.forEach(pid => {
        if (game.disconnectedPlayers && game.disconnectedPlayers[pid]) return;
        io.to(pid).emit('chessUpdate', { ...stateObj, isSpectator: false, myColor: game.playerColors[pid] });
    });

    if (game.spectators && game.spectators.length > 0) {
        game.spectators.forEach(sid => {
            io.to(sid).emit('chessUpdate', { ...stateObj, isSpectator: true, myColor: null });
        });
    }

    // Oyun bitti mi kontrolü
    if (game.gameOver) {
        clearChessTimers(game.tableId);

        if (!game.winnerRecorded) {
            game.winnerRecorded = true;
            let isDraw = game.winner === 'draw' || game.winner === 'tie';

            if (isDraw) {
                let reasonTr = "Beraberlik";
                if (game.winReason === 'stalemate') reasonTr = "Pat (Şah tehlikede değil ve yasal hamle yok)";
                else if (game.winReason === 'insufficient_material') reasonTr = "Yetersiz Taş";
                else if (game.winReason === 'threefold_repetition') reasonTr = "Üç Konum Tekrarı";

                let drawMsg = `🤝 Satranç Karşılaşması BERABERE bitti! (${reasonTr})`;
                game.players.forEach(pid => io.to(pid).emit('systemMessage', drawMsg));
                if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', drawMsg));

                // Pot iadesi
                if (game.pot && game.pot > 0) {
                    let refund = Math.floor(game.pot / 2);
                    game.players.forEach(pid => {
                        let pName = game.playerProfiles[pid]?.name;
                        let isBot = pid.startsWith('bot_') || game.playerProfiles[pid]?.isBot;
                        if (!isBot && pName && dataManager.persistentData.users[pName]) {
                            dataManager.persistentData.users[pName].money = (dataManager.persistentData.users[pName].money || 0) + refund;
                            io.to(pid).emit('moneyUpdate', dataManager.persistentData.users[pName].money);
                        }
                    });
                    game.pot = 0;
                    dataManager.savePersistentData();
                }
            } else {
                let winPid = game.players.find(p => game.playerColors[p] === game.winner);
                let wName = winPid ? (game.playerProfiles[winPid]?.name || "Oyuncu") : "Oyuncu";
                let isHuman = winPid && !winPid.startsWith('bot_') && !game.playerProfiles[winPid]?.isBot;
                let winPrize = 25; // Satranç galibiyet taban ödülü

                let reasonText = "Şah & Mat";
                if (game.winReason === 'timeout') reasonText = "Zaman Aşımı (Bayrak Düştü)";
                else if (game.winReason === 'resignation') reasonText = "Terk / Teslim";

                if (game.pot && game.pot > 0) {
                    winPrize += game.pot;
                    let potMsg = `💰 TEBRİKLER! ${wName} satranç masasındaki ${game.pot} TL'lik potu kazandı! (${reasonText})`;
                    game.players.forEach(pid => io.to(pid).emit('systemMessage', potMsg));
                    if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', potMsg));
                    game.pot = 0;
                } else {
                    let winMsg = `🏆 TEBRİKLER! Satranç karşılaşmasını ${wName} kazandı! (${reasonText})`;
                    game.players.forEach(pid => io.to(pid).emit('systemMessage', winMsg));
                    if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', winMsg));
                }

                if (wName) {
                    if (!dataManager.persistentData.leaderboard.chess) dataManager.persistentData.leaderboard.chess = {};
                    if (isHuman) {
                        dataManager.persistentData.leaderboard.chess[wName] = (dataManager.persistentData.leaderboard.chess[wName] || 0) + 1;
                    }
                    if (isHuman && dataManager.persistentData.users[wName]) {
                        dataManager.persistentData.users[wName].money = (dataManager.persistentData.users[wName].money || 100) + winPrize;
                        io.to(winPid).emit('moneyUpdate', dataManager.persistentData.users[wName].money);
                    }
                    dataManager.savePersistentData();
                }
            }

            // Bot otomatik rövanş oyu
            game.players.forEach(pid => {
                let isBot = pid.startsWith('bot_') || game.playerProfiles[pid]?.isBot;
                if (isBot) {
                    setTimeout(() => {
                        handleChessVoteRematch(game, pid, true, io);
                    }, 1500);
                }
            });
        }
    } else {
        // Oyun devam ediyor: Süreli modda 1 saniyelik saat döngüsü başlat
        if (game.timeMode === '10m' && !chessClockIntervals[game.tableId]) {
            chessClockIntervals[game.tableId] = setInterval(() => {
                if (!game || game.gameOver) {
                    if (chessClockIntervals[game.tableId]) {
                        clearInterval(chessClockIntervals[game.tableId]);
                        delete chessClockIntervals[game.tableId];
                    }
                    return;
                }

                const tickNow = Date.now();
                const tickElapsed = Math.max(0, (tickNow - game.lastMoveTimestamp) / 1000);
                let wRem = game.whiteTime;
                let bRem = game.blackTime;

                if (game.turn === 'w') {
                    wRem = Math.max(0, game.whiteTime - tickElapsed);
                    if (wRem <= 0) {
                        game.whiteTime = 0;
                        game.gameOver = true;
                        game.winner = 'b';
                        game.winReason = 'timeout';
                        sendChessUpdate(game, io);
                        return;
                    }
                } else {
                    bRem = Math.max(0, game.blackTime - tickElapsed);
                    if (bRem <= 0) {
                        game.blackTime = 0;
                        game.gameOver = true;
                        game.winner = 'w';
                        game.winReason = 'timeout';
                        sendChessUpdate(game, io);
                        return;
                    }
                }

                // Canlı saat güncellemesini taraflara ve izleyicilere yayınla
                const clockPayload = {
                    tableId: game.tableId,
                    whiteTime: Math.round(wRem),
                    blackTime: Math.round(bRem),
                    turn: game.turn
                };
                game.players.forEach(pid => io.to(pid).emit('chessClockTick', clockPayload));
                if (game.spectators && game.spectators.length > 0) {
                    game.spectators.forEach(sid => io.to(sid).emit('chessClockTick', clockPayload));
                }
            }, 1000);
        }

        // Sıradaki oyuncu bot mu kontrolü
        let currentPid = game.players.find(p => game.playerColors[p] === game.turn);
        let isBot = currentPid && (currentPid.startsWith('bot_') || game.playerProfiles?.[currentPid]?.isBot);
        if (isBot) {
            if (chessBotTimers[game.tableId]) clearTimeout(chessBotTimers[game.tableId]);
            chessBotTimers[game.tableId] = setTimeout(() => {
                delete chessBotTimers[game.tableId];
                if (!game.gameOver && game.players.find(p => game.playerColors[p] === game.turn) === currentPid) {
                    let botMove = chessEngine.getBestBotChessMove(game, currentPid);
                    if (botMove) {
                        chessEngine.makeChessMove(game, currentPid, {
                            from: botMove.from,
                            to: botMove.to,
                            promotion: botMove.promotion || 'q'
                        });
                        sendChessUpdate(game, io);
                    }
                }
            }, 1200);
        }
    }
}

function handleChessMove(game, socketId, moveData, io) {
    if (!game || game.gameOver) return { success: false, message: "Oyun aktif değil." };
    let res = chessEngine.makeChessMove(game, socketId, moveData);
    if (res.success) {
        sendChessUpdate(game, io);
    }
    return res;
}

function handleChessResign(game, socketId, io) {
    if (!game || game.gameOver) return { success: false, message: "Oyun aktif değil." };
    let res = chessEngine.resignChessGame(game, socketId);
    if (res.success) {
        sendChessUpdate(game, io);
    }
    return res;
}

function handleChessVoteRematch(game, pid, vote, io, players = {}) {
    if (!game || !game.gameOver) return;
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
    game.players.forEach(p => io.to(p).emit('chessRematchStatus', votePayload));
    if (game.spectators) game.spectators.forEach(s => io.to(s).emit('chessRematchStatus', votePayload));

    let allAgreed = game.players.every(p => game.rematchVotes[p]);
    if (allAgreed) {
        let bet = game.bet || 0;
        if (bet > 0) {
            let brokePlayers = [];
            game.players.forEach(p => {
                if (!p.startsWith('bot_')) {
                    let uName = game.playerProfiles[p]?.name;
                    let curMoney = (uName && dataManager.persistentData.users[uName]?.money !== undefined)
                        ? dataManager.persistentData.users[uName].money
                        : ((players[p] && players[p].money) || 0);
                    if (curMoney < bet) {
                        brokePlayers.push({ pid: p, name: uName, money: curMoney });
                    }
                }
            });

            if (brokePlayers.length > 0) {
                let warningMsg = "Paranız bu masada oynamaya yetmiyor isterseniz ücretsiz masalara geçiş yapabilirsiniz.";
                brokePlayers.forEach(bp => {
                    io.to(bp.pid).emit('insufficientFundsWarning', { message: warningMsg, requiredBet: bet, currentMoney: bp.money });
                    io.to(bp.pid).emit('systemMessage', `⚠️ ${warningMsg}`);
                });
                game.rematchVotes = {};
                return;
            }

            let newPot = 0;
            game.players.forEach(p => {
                if (!p.startsWith('bot_')) {
                    let uName = game.playerProfiles[p]?.name;
                    if (uName && dataManager.persistentData.users[uName]) {
                        dataManager.persistentData.users[uName].money = Math.max(0, (dataManager.persistentData.users[uName].money || 0) - bet);
                        if (players[p]) players[p].money = dataManager.persistentData.users[uName].money;
                        io.to(p).emit('moneyUpdate', dataManager.persistentData.users[uName].money);
                    }
                }
                newPot += bet;
            });
            dataManager.savePersistentData();
            game.pot = newPot;
        }

        // Renkleri takas et (Önceki beyaz şimdi siyah, önceki siyah şimdi beyaz)
        let oldP1Color = game.playerColors[game.players[0]] || 'w';
        let newP1Color = (oldP1Color === 'w') ? 'b' : 'w';
        let newP2Color = (newP1Color === 'w') ? 'b' : 'w';

        let fresh = chessEngine.startChessGame(game.players, { timeMode: game.timeMode, bet: bet, pot: game.pot });
        game.chessInstance = fresh.chessInstance;
        game.fen = fresh.fen;
        game.turn = 'w';
        game.playerColors = {
            [game.players[0]]: newP1Color,
            [game.players[1]]: newP2Color
        };
        game.whiteTime = fresh.whiteTime;
        game.blackTime = fresh.blackTime;
        game.lastMoveTimestamp = Date.now();
        game.turnStartTime = Date.now();
        game.moveHistory = [];
        game.capturedPieces = { w: [], b: [] };
        game.inCheck = false;
        game.gameOver = false;
        game.winner = null;
        game.winReason = null;
        game.winnerRecorded = false;
        game.rematchVotes = {};

        let startNotice = `♟️ Yeni Satranç Karşılaşması Başladı! Renkler değişti.${bet > 0 ? ` (Masa Bahsi: ${bet} TL | Pot: ${game.pot} TL)` : ''}`;
        game.players.forEach(pid => io.to(pid).emit('systemMessage', startNotice));
        if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', startNotice));

        sendChessUpdate(game, io);
    }
}

module.exports = {
    tavlaEngine,
    xoxEngine,
    amiralEngine,
    chessEngine,
    xoxBotTimers,
    amiralBotTimers,
    chessBotTimers,
    chessClockIntervals,
    clearChessTimers,
    sendTavlaUpdate,
    sendXoxUpdate,
    handleXoxVoteRematch,
    sendAmiralUpdate,
    handleAmiralVoteRematch,
    sendChessUpdate,
    handleChessMove,
    handleChessResign,
    handleChessVoteRematch
};

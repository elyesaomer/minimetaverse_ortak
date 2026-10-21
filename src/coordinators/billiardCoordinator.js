// src/coordinators/billiardCoordinator.js - 8-Ball Amerikan Bilardo Koordinatörü & Fizik Döngüsü
const billiardEngine = require('../engines/billiard.js');
const dataManager = require('../dataManager');
const { activeGames } = require('./gameState');

const billiardBotTimers = {};

function makeBilliardBotShot(game, botId) {
    if (!game || game.gameOver || game.players[game.turnIndex] !== botId) return;

    if (game.ballInHand) {
        let placed = false;
        let testPositions = [
            { x: 150, y: 150 }, { x: 140, y: 100 }, { x: 140, y: 200 },
            { x: 180, y: 150 }, { x: 120, y: 150 }, { x: 200, y: 120 }
        ];
        for (let pos of testPositions) {
            if (billiardEngine.placeWhiteBall(game, botId, pos.x, pos.y)) {
                placed = true;
                break;
            }
        }
        if (!placed) {
            game.balls.white.x = 150;
            game.balls.white.y = 150;
            game.balls.white.vx = 0;
            game.balls.white.vy = 0;
            game.ballInHand = false;
        }
    }

    let white = game.balls.white;
    if (!white || !white.active) return;

    let mySuit = game.playerSuits[botId];
    let candidateBalls = [];
    let allBalls = Object.values(game.balls).filter(b => b.active && b.type !== 'white');

    if (mySuit) {
        candidateBalls = allBalls.filter(b => b.type === mySuit);
        if (candidateBalls.length === 0) {
            candidateBalls = allBalls.filter(b => b.type === 'black');
        }
    } else {
        candidateBalls = allBalls.filter(b => b.type === 'solid' || b.type === 'stripe');
        if (candidateBalls.length === 0) candidateBalls = allBalls.filter(b => b.type === 'black');
    }

    if (candidateBalls.length === 0) return;

    const pockets = [
        { x: 12, y: 12 }, { x: 300, y: 10 }, { x: 588, y: 12 },
        { x: 12, y: 288 }, { x: 300, y: 290 }, { x: 588, y: 288 }
    ];

    let bestShot = null;
    let bestScore = -999999;

    for (let target of candidateBalls) {
        for (let pocket of pockets) {
            let dxTP = pocket.x - target.x;
            let dyTP = pocket.y - target.y;
            let distTP = Math.sqrt(dxTP * dxTP + dyTP * dyTP);
            if (distTP === 0) continue;

            let ghostX = target.x - (dxTP / distTP) * 16;
            let ghostY = target.y - (dyTP / distTP) * 16;

            if (ghostX < 16 || ghostX > 584 || ghostY < 16 || ghostY > 284) continue;

            let dxWG = ghostX - white.x;
            let dyWG = ghostY - white.y;
            let distWG = Math.sqrt(dxWG * dxWG + dyWG * dyWG);
            if (distWG === 0) continue;

            let dirWG = { x: dxWG / distWG, y: dyWG / distWG };
            let dirTP = { x: dxTP / distTP, y: dyTP / distTP };
            let dot = dirWG.x * dirTP.x + dirWG.y * dirTP.y;

            if (dot > 0.05) {
                let score = dot * 200 - distTP * 0.2 - distWG * 0.15;
                if (score > bestScore) {
                    bestScore = score;
                    bestShot = {
                        angle: Math.atan2(dyWG, dxWG) * (180 / Math.PI),
                        power: Math.min(22, Math.max(10, 8 + (distTP + distWG) * 0.025))
                    };
                }
            }
        }
    }

    if (!bestShot) {
        let target = candidateBalls[0];
        let dx = target.x - white.x;
        let dy = target.y - white.y;
        bestShot = {
            angle: Math.atan2(dy, dx) * (180 / Math.PI),
            power: 14
        };
    }

    let jitter = (Math.random() - 0.5) * 3;
    let finalAngle = bestShot.angle + jitter;

    billiardEngine.shootBall(game, botId, finalAngle, bestShot.power, 0, 0);
}

function handleBilliardVoteRematch(game, pid, vote, io, players) {
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
    game.players.forEach(p => io.to(p).emit('billiardRematchStatus', votePayload));
    if (game.spectators) game.spectators.forEach(s => io.to(s).emit('billiardRematchStatus', votePayload));

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
                    io.to(otherPid).emit('systemMessage', `⚠️ Masadaki oyuncunun bakiyesi yeni tur bahsini karşılamaya yetmedi.`);
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

        // Yeni bilardo turu başlat
        game.roundNumber = (game.roundNumber || 1) + 1;
        let fresh = billiardEngine.startBilliardGame(game.players);
        game.balls = fresh.balls;
        game.turnIndex = fresh.turnIndex;
        game.playerSuits = fresh.playerSuits;
        game.ballInHand = fresh.ballInHand;
        game.winner = null;
        game.gameOver = false;
        game.winnerRecorded = false;
        game.rematchVotes = {};
        game.shotActive = false;
        game._forceUpdate = true;

        let startNotice = `🎱 ${game.roundNumber}. Tur Başladı!${bet > 0 ? ` (Masa Bahsi: ${bet} TL | Pot: ${game.pot} TL)` : ''}`;
        game.players.forEach(pid => {
            io.to(pid).emit('systemMessage', startNotice);
            io.to(pid).emit('billiardRoundStarted', {
                roundNumber: game.roundNumber,
                pot: game.pot,
                bet: game.bet
            });
        });
        if (game.spectators) {
            game.spectators.forEach(sid => io.to(sid).emit('systemMessage', startNotice));
        }
    }
}

function startBilliardPhysicsLoop(io, players = {}) {
    setInterval(() => {
        // Hızlı aktiflik kontrolü: Sunucuda hiç bilardo masası yoksa boşuna işlem yapma
        let hasAnyBilliard = false;
        for (let gid in activeGames) {
            if (gid.startsWith('billiard')) {
                hasAnyBilliard = true;
                break;
            }
        }
        if (!hasAnyBilliard) return;

        let now = Date.now();
        for (let gid in activeGames) {
            if (!gid.startsWith('billiard')) continue;
            let game = activeGames[gid];
            if (game) {
                let isMoving = billiardEngine.updatePhysics(game);

                // Bot Sırası
                if (!isMoving && !game.gameOver && !game.shotActive) {
                    let currentPid = game.players[game.turnIndex];
                    let isBot = currentPid && (currentPid.startsWith('bot_') || game.playerProfiles[currentPid]?.isBot);
                    if (isBot && !billiardBotTimers[gid]) {
                        billiardBotTimers[gid] = setTimeout(() => {
                            delete billiardBotTimers[gid];
                            makeBilliardBotShot(game, currentPid);
                        }, 1400);
                    }
                }

                // Bilardo Bitiş
                if (game.gameOver && game.winner && !game.winnerRecorded) {
                    game.winnerRecorded = true;
                    let wName = game.playerProfiles[game.winner]?.name;
                    let isHuman = !game.winner.startsWith('bot_') && !wName.startsWith('🤖') && !game.playerProfiles[game.winner]?.isBot;
                    let winPrize = 20;
                    if (game.pot && game.pot > 0) {
                        winPrize += game.pot;
                        let potMsg = `💰 TEBRİKLER! ${wName} bilardo masasındaki ${game.pot} TL'lik potu kazandı!`;
                        game.players.forEach(pid => io.to(pid).emit('systemMessage', potMsg));
                        if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('systemMessage', potMsg));
                        game.pot = 0;
                    }
                    if (wName) {
                        if (isHuman) {
                            dataManager.persistentData.leaderboard.billiard[wName] = (dataManager.persistentData.leaderboard.billiard[wName] || 0) + 1;
                        }
                        if (isHuman && dataManager.persistentData.users[wName]) {
                            dataManager.persistentData.users[wName].money = (dataManager.persistentData.users[wName].money || 100) + winPrize;
                            io.to(game.winner).emit('moneyUpdate', dataManager.persistentData.users[wName].money);
                        }
                        dataManager.savePersistentData();
                    }

                    // Tur bitti bildirimi & Rövanş oylaması tetikle
                    game.roundNumber = game.roundNumber || 1;
                    game.rematchVotes = {};
                    let roundOverPayload = {
                        tableId: game.tableId,
                        winner: game.winner,
                        winnerName: wName,
                        roundNumber: game.roundNumber,
                        bet: game.bet || 0,
                        potAwarded: winPrize
                    };
                    game.players.forEach(pid => {
                        io.to(pid).emit('billiardRoundOver', roundOverPayload);
                    });
                    if (game.spectators) {
                        game.spectators.forEach(sid => io.to(sid).emit('billiardRoundOver', roundOverPayload));
                    }

                    // Bot için otomatik rövanş oyu
                    game.players.forEach(pid => {
                        let isBot = pid.startsWith('bot_') || game.playerProfiles[pid]?.isBot;
                        if (isBot) {
                            setTimeout(() => {
                                handleBilliardVoteRematch(game, pid, true, io, players);
                            }, 1200);
                        }
                    });
                }

                // Ağ trafiği optimizasyonu: Toplar hareket ederken her 30ms'de bir gönder.
                // Toplar durduğunda hemen 1 kesinleştirici paket gönder.
                // Toplar tamamen hareketsizken gereksiz 33 FPS soket selini kes (yalnızca 1 sn nabız veya zorunlu tetik).
                let shouldEmit = isMoving || game._wasMoving || game._forceUpdate;
                if (!shouldEmit && (!game._lastMotionlessEmit || now - game._lastMotionlessEmit >= 1000)) {
                    shouldEmit = true;
                    game._lastMotionlessEmit = now;
                }
                game._wasMoving = isMoving;
                if (game._forceUpdate) game._forceUpdate = false;

                if (shouldEmit) {
                    let soundEvents = game.soundEvents || [];
                    game.soundEvents = [];

                    let stateObj = {
                        balls: game.balls,
                        turnIndex: game.turnIndex,
                        players: game.players,
                        playerSuits: game.playerSuits,
                        playerProfiles: game.playerProfiles || {},
                        ballInHand: game.ballInHand,
                        winner: game.winner,
                        gameOver: game.gameOver,
                        tableId: game.tableId,
                        turnTimeout: 30,
                        roundNumber: game.roundNumber || 1,
                        bet: game.bet || 0,
                        pot: game.pot || 0,
                        shotActive: !!game.shotActive,
                        isMoving: !!isMoving,
                        events: soundEvents,
                        disconnectedPlayers: game.disconnectedPlayers || {}
                    };

                    game.players.forEach((pid) => {
                        io.to(pid).emit('billiardUpdate', { ...stateObj, isSpectator: false });
                    });

                    if (game.spectators && game.spectators.length > 0) {
                        game.spectators.forEach((sid) => {
                            io.to(sid).emit('billiardUpdate', { ...stateObj, isSpectator: true });
                        });
                    }
                }
            }
        }
    }, 30);
}

module.exports = {
    billiardBotTimers,
    makeBilliardBotShot,
    handleBilliardVoteRematch,
    startBilliardPhysicsLoop
};

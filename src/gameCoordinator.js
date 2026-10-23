// src/gameCoordinator.js - Oyun Motorları ve Koordinatörler Ana Orkestratörü
// (Modüler mimariye ayrılmıştır: boardGameCoordinator, batakCoordinator, okey101Coordinator, billiardCoordinator, voidHandCoordinator, gameState)

const batakEngine = require('./engines/batak.js');
const batak4Engine = require('./engines/batak4.js');
const billiardEngine = require('./engines/billiard.js');
const tavlaEngine = require('./engines/tavla.js');
const okey101Engine = require('./engines/okey101.js');
const xoxEngine = require('./engines/xox.js');
const amiralEngine = require('./engines/amiral.js');
const dostKazigiEngine = require('./engines/dostKazigi.js');
const chessEngine = require('./engines/chessEngine.js');

const dataManager = require('./dataManager');
const tableManager = require('./tableManager');

// Modüler Koordinatörler ve Ortak Durum
const { activeGames, getActiveGames, getActiveGame } = require('./coordinators/gameState');

const {
    batakAfkTimers,
    startBatakAfkTimer,
    makeBatakAiMove,
    handleBatakCardPlayed,
    finalizeBatakSet,
    handleBatakVoteRematch,
    sendBatakUpdate,
    executeVoidHandBatak
} = require('./coordinators/batakCoordinator');

const {
    okey101AfkTimers,
    sendOkey101Update,
    startOkey101AfkTimer,
    startNextOkey101Round,
    checkOkey101RoundEnd,
    executeVoidHandOkey101
} = require('./coordinators/okey101Coordinator');

const {
    dostKazigiAfkTimers,
    clearDostKazigiAfkTimer,
    startDostKazigiAfkTimer,
    makeDostKazigiAiMove,
    handleDostKazigiCardPlayed,
    startNextDostKazigiHand,
    sendDostKazigiUpdate,
    handleDostKazigiVoteRematch
} = require('./coordinators/dostKazigiCoordinator');

const {
    billiardBotTimers,
    makeBilliardBotShot,
    handleBilliardVoteRematch,
    startBilliardPhysicsLoop
} = require('./coordinators/billiardCoordinator');

const {
    sendTavlaUpdate,
    sendXoxUpdate,
    handleXoxVoteRematch,
    sendAmiralUpdate,
    handleAmiralVoteRematch,
    xoxBotTimers,
    amiralBotTimers,
    chessBotTimers,
    chessClockIntervals,
    clearChessTimers,
    sendChessUpdate,
    handleChessVoteRematch
} = require('./coordinators/boardGameCoordinator');

const {
    startVoidHandVote,
    handleVoidHandVoteResponse,
    cancelVoidHandVote,
    executeVoidHand
} = require('./coordinators/voidHandCoordinator');

const tableCleanupTimers = {};

function clearTableCleanupTimer(tableId) {
    if (tableCleanupTimers[tableId]) {
        clearTimeout(tableCleanupTimers[tableId]);
        delete tableCleanupTimers[tableId];
    }
}

// --- INSTANCE BULUCULAR ---
function getBatakInstance(socketId) {
    for (let gid in activeGames) {
        let g = activeGames[gid];
        if (g && g.players && g.players.includes(socketId)) {
            let engine = g.isBatak4 ? batak4Engine : batakEngine;
            return { game: g, engine: engine, gameId: gid };
        }
    }
    return null;
}

function getBilliardInstance(socketId) {
    for (let gid in activeGames) {
        let g = activeGames[gid];
        if (gid.startsWith('billiard') && g && g.players && g.players.includes(socketId)) {
            return { game: g, engine: billiardEngine, gameId: gid };
        }
    }
    return null;
}

function getTavlaInstance(socketId) {
    for (let gid in activeGames) {
        let g = activeGames[gid];
        if (gid.startsWith('tavla') && g && g.players && g.players.includes(socketId)) {
            return { game: g, engine: tavlaEngine, gameId: gid };
        }
    }
    return null;
}

function getOkey101Instance(socketId) {
    for (let gid in activeGames) {
        let g = activeGames[gid];
        if (gid.startsWith('okey101') && g && g.players && g.players.includes(socketId)) {
            return { game: g, engine: okey101Engine, gameId: gid };
        }
    }
    return null;
}

function getXoxInstance(socketId) {
    for (let gid in activeGames) {
        let g = activeGames[gid];
        if (gid.startsWith('xox') && g && g.players && g.players.includes(socketId)) {
            return { game: g, engine: xoxEngine, gameId: gid };
        }
    }
    return null;
}

function getAmiralInstance(socketId) {
    for (let gid in activeGames) {
        let g = activeGames[gid];
        if (gid.startsWith('amiral') && g && g.players && g.players.includes(socketId)) {
            return { game: g, engine: amiralEngine, gameId: gid };
        }
    }
    return null;
}

function getDostKazigiInstance(socketId) {
    for (let gid in activeGames) {
        let g = activeGames[gid];
        if (gid.startsWith('dost_kazigi') && g && g.players && g.players.includes(socketId)) {
            return { game: g, engine: dostKazigiEngine, gameId: gid };
        }
    }
    return null;
}

function getChessInstance(socketId) {
    for (let gid in activeGames) {
        let g = activeGames[gid];
        if (gid.startsWith('chess') && g && g.players && g.players.includes(socketId)) {
            return { game: g, engine: chessEngine, gameId: gid };
        }
    }
    return null;
}

// --- MASA BAŞLATMA ---
function startGameForTable(tableId, table, room, io, players) {
    let bet = table.bet || 0;
    let pot = 0;
    let paidPlayers = {};

    table.players.forEach(pid => {
        if (!pid.startsWith('bot_') && players[pid]) {
            let uName = players[pid].name;
            paidPlayers[uName.toLowerCase()] = true;
            if (dataManager.persistentData.users[uName]) {
                dataManager.persistentData.users[uName].money = Math.max(0, (dataManager.persistentData.users[uName].money || 0) - bet);
                players[pid].money = dataManager.persistentData.users[uName].money;
                io.to(pid).emit('moneyUpdate', players[pid].money);
            }
        }
        pot += bet;
    });
    dataManager.savePersistentData();

    let betAnnouncement = bet > 0 ? ` (Masa Bahsi: ${bet} TL | Toplam Ödül Havuzu: ${pot} TL)` : "";
    io.to(room).emit('systemMessage', `🔥 ${table.name} oyunu başladı!${betAnnouncement}`);

    let isBatak4 = table.baseType === 'batak4';
    let isBatak3 = table.baseType === 'batak';
    let isBilliard = table.baseType === 'billiard';
    let isTavla = table.baseType === 'tavla';
    let isOkey101 = table.baseType === 'okey101' || table.baseType === 'okey101_tekli';
    let isXox = table.baseType === 'xox';
    let isAmiral = table.baseType === 'amiral';
    let isChess = table.baseType === 'chess';
    let isDostKazigi = table.baseType === 'dost_kazigi' || table.baseType === 'dost_kazigi_3p';

    if (isBatak3 || isBatak4) {
        let engine = isBatak3 ? batakEngine : batak4Engine;
        let newGame = engine.startBatakGame(table.players, null, 1);
        newGame.isBatak4 = isBatak4;
        newGame.tableId = tableId;
        newGame.bet = bet;
        newGame.pot = pot;
        newGame.paidPlayers = { ...paidPlayers };
        newGame.spectators = [];
        newGame.disconnectedPlayers = {};
        newGame.playerProfiles = {};
        table.players.forEach(pid => {
            newGame.playerProfiles[pid] = {
                name: players[pid] ? players[pid].name : "Oyuncu",
                color: players[pid] ? players[pid].color : "#fff",
                isBot: !!players[pid]?.isBot
            };
        });

        // Set Sistemi Başlatma
        newGame.currentSet = 1;
        newGame.setRound = 1;
        newGame.isTieBreaker = false;
        newGame.currentSetRounds = [];
        newGame.setsHistory = [];
        newGame.cumulativeSetPoints = {};
        newGame.rematchVotes = {};
        newGame.lastScores = {};
        table.players.forEach(pid => {
            newGame.cumulativeSetPoints[pid] = 0;
            newGame.lastScores[pid] = 0;
        });

        activeGames[tableId] = newGame;
        activeGames[tableId].players.forEach((pid) => {
            if (!pid.startsWith('bot_')) io.to(pid).emit('startGame', 'batak');
        });
        sendBatakUpdate(activeGames[tableId], io, players);
    }
    else if (isBilliard) {
        let newGame = billiardEngine.startBilliardGame(table.players);
        newGame.tableId = tableId;
        newGame.bet = bet;
        newGame.pot = pot;
        newGame.roundNumber = 1;
        newGame.rematchVotes = {};
        newGame.paidPlayers = { ...paidPlayers };
        newGame.spectators = [];
        newGame.disconnectedPlayers = {};
        newGame.playerProfiles = {};
        table.players.forEach(pid => {
            newGame.playerProfiles[pid] = {
                name: players[pid] ? players[pid].name : "Oyuncu",
                isBot: !!players[pid]?.isBot
            };
        });

        activeGames[tableId] = newGame;
        activeGames[tableId].players.forEach((pid) => {
            if (!pid.startsWith('bot_')) {
                io.to(pid).emit('startGame', 'billiard');
                io.to(pid).emit('billiardUpdate', {
                    balls: newGame.balls,
                    turnIndex: newGame.turnIndex,
                    players: newGame.players,
                    playerSuits: newGame.playerSuits,
                    playerProfiles: newGame.playerProfiles || {},
                    ballInHand: newGame.ballInHand,
                    winner: newGame.winner,
                    gameOver: newGame.gameOver,
                    tableId: newGame.tableId,
                    turnTimeout: 30,
                    roundNumber: 1,
                    bet: newGame.bet,
                    pot: newGame.pot,
                    disconnectedPlayers: {}
                });
            }
        });
    }
    else if (isTavla) {
        let newGame = tavlaEngine.startTavlaGame(table.players);
        newGame.tableId = tableId;
        newGame.bet = bet;
        newGame.pot = pot;
        newGame.paidPlayers = { ...paidPlayers };
        newGame.spectators = [];
        newGame.disconnectedPlayers = {};
        newGame.playerProfiles = {};
        table.players.forEach(pid => {
            newGame.playerProfiles[pid] = {
                name: players[pid] ? players[pid].name : "Oyuncu",
                isBot: !!players[pid]?.isBot
            };
        });

        activeGames[tableId] = newGame;
        activeGames[tableId].players.forEach((pid) => {
            if (!pid.startsWith('bot_')) io.to(pid).emit('startGame', 'tavla');
        });
        sendTavlaUpdate(activeGames[tableId], io);
    }
    else if (isOkey101) {
        let mode = table.mode || (table.baseType === 'okey101_tekli' ? 'tekli' : 'esli');
        let newGame = okey101Engine.startOkey101Game(table.players, null, 1, mode);
        newGame.tableId = tableId;
        newGame.bet = bet;
        newGame.pot = pot;
        newGame.paidPlayers = { ...paidPlayers };
        newGame.mode = mode;
        newGame.spectators = [];
        newGame.disconnectedPlayers = {};
        newGame.playerProfiles = {};
        table.players.forEach(pid => {
            newGame.playerProfiles[pid] = {
                name: players[pid] ? players[pid].name : "Oyuncu",
                color: players[pid] ? players[pid].color : "#fff",
                isBot: !!players[pid]?.isBot
            };
        });

        activeGames[tableId] = newGame;
        activeGames[tableId].players.forEach((pid) => {
            if (!pid.startsWith('bot_')) io.to(pid).emit('startGame', 'okey101');
        });
        sendOkey101Update(activeGames[tableId], io, players);
    }
    else if (isXox) {
        let newGame = xoxEngine.startXoxGame(table.players);
        newGame.tableId = tableId;
        newGame.bet = bet;
        newGame.pot = pot;
        newGame.paidPlayers = { ...paidPlayers };
        newGame.spectators = [];
        newGame.disconnectedPlayers = {};
        newGame.playerProfiles = {};
        table.players.forEach(pid => {
            newGame.playerProfiles[pid] = {
                name: players[pid] ? players[pid].name : "Oyuncu",
                color: players[pid] ? players[pid].color : "#fff",
                isBot: !!players[pid]?.isBot
            };
        });

        activeGames[tableId] = newGame;
        activeGames[tableId].players.forEach((pid) => {
            if (!pid.startsWith('bot_')) io.to(pid).emit('startGame', 'xox');
        });
        sendXoxUpdate(activeGames[tableId], io);
    }
    else if (isAmiral) {
        let newGame = amiralEngine.startAmiralGame(table.players);
        newGame.tableId = tableId;
        newGame.bet = bet;
        newGame.pot = pot;
        newGame.paidPlayers = { ...paidPlayers };
        newGame.spectators = [];
        newGame.disconnectedPlayers = {};
        newGame.playerProfiles = {};
        table.players.forEach(pid => {
            newGame.playerProfiles[pid] = {
                name: players[pid] ? players[pid].name : "Oyuncu",
                color: players[pid] ? players[pid].color : "#fff",
                isBot: !!players[pid]?.isBot
            };
        });

        activeGames[tableId] = newGame;

        // Bot oyuncusu varsa donanmasını otomatik yerleştir ve hazır yap
        table.players.forEach(pid => {
            let isBot = pid.startsWith('bot_') || players[pid]?.isBot;
            if (isBot) {
                let randomFleet = amiralEngine.generateRandomFleet();
                amiralEngine.setPlayerFleet(newGame, pid, randomFleet.ships, randomFleet.grid);
            }
        });

        activeGames[tableId].players.forEach((pid) => {
            if (!pid.startsWith('bot_')) io.to(pid).emit('startGame', 'amiral');
        });
        sendAmiralUpdate(activeGames[tableId], io);
    }
    else if (isChess) {
        let timeMode = table.timeMode || '10m';
        let newGame = chessEngine.startChessGame(table.players, { tableId: tableId, timeMode: timeMode, bet: bet, pot: pot });
        newGame.tableId = tableId;
        newGame.bet = bet;
        newGame.pot = pot;
        newGame.timeMode = timeMode;
        newGame.paidPlayers = { ...paidPlayers };
        newGame.spectators = [];
        newGame.disconnectedPlayers = {};
        newGame.playerProfiles = {};
        table.players.forEach(pid => {
            newGame.playerProfiles[pid] = {
                name: players[pid] ? players[pid].name : "Oyuncu",
                color: players[pid] ? players[pid].color : "#fff",
                isBot: !!players[pid]?.isBot
            };
        });

        activeGames[tableId] = newGame;
        activeGames[tableId].players.forEach((pid) => {
            if (!pid.startsWith('bot_')) io.to(pid).emit('startGame', 'chess');
        });
        sendChessUpdate(activeGames[tableId], io);
    }
    else if (isDostKazigi) {
        let deckMode = table.deckMode || table.mode || 'tek_deste';
        let newGame = dostKazigiEngine.startDostKazigiGame(table.players, 1, null, 0, deckMode);
        newGame.tableId = tableId;
        newGame.baseType = table.baseType;
        newGame.deckMode = deckMode;
        newGame.bet = bet;
        newGame.pot = pot;
        newGame.paidPlayers = { ...paidPlayers };
        newGame.spectators = [];
        newGame.disconnectedPlayers = {};
        newGame.playerProfiles = {};
        table.players.forEach(pid => {
            newGame.playerProfiles[pid] = {
                name: players[pid] ? players[pid].name : "Oyuncu",
                color: players[pid] ? players[pid].color : "#fff",
                isBot: !!players[pid]?.isBot
            };
        });

        activeGames[tableId] = newGame;
        activeGames[tableId].players.forEach((pid) => {
            if (!pid.startsWith('bot_')) io.to(pid).emit('startGame', 'dost_kazigi');
        });
        sendDostKazigiUpdate(activeGames[tableId], io, players);
        startDostKazigiAfkTimer(activeGames[tableId], io, players);
    }
}

module.exports = {
    activeGames,
    getActiveGames,
    getActiveGame,
    getBatakInstance,
    getBilliardInstance,
    getTavlaInstance,
    getOkey101Instance,
    getXoxInstance,
    getAmiralInstance,
    getChessInstance,
    getDostKazigiInstance,
    startBatakAfkTimer,
    makeBatakAiMove,
    handleBatakCardPlayed,
    sendBatakUpdate,
    finalizeBatakSet,
    handleBatakVoteRematch,
    handleBilliardVoteRematch,
    handleXoxVoteRematch,
    handleAmiralVoteRematch,
    handleChessVoteRematch,
    sendTavlaUpdate,
    sendOkey101Update,
    sendXoxUpdate,
    sendAmiralUpdate,
    sendChessUpdate,
    startOkey101AfkTimer,
    startNextOkey101Round,
    checkOkey101RoundEnd,
    makeBilliardBotShot,
    startGameForTable,
    startBilliardPhysicsLoop,
    billiardEngine,
    tavlaEngine,
    okey101Engine,
    batakEngine,
    batak4Engine,
    xoxEngine,
    amiralEngine,
    chessEngine,
    dostKazigiEngine,
    dostKazigiAfkTimers,
    startDostKazigiAfkTimer,
    makeDostKazigiAiMove,
    handleDostKazigiCardPlayed,
    startNextDostKazigiHand,
    sendDostKazigiUpdate,
    handleDostKazigiVoteRematch,
    batakAfkTimers,
    okey101AfkTimers,
    billiardBotTimers,
    xoxBotTimers,
    amiralBotTimers,
    chessBotTimers,
    chessClockIntervals,
    clearChessTimers,
    tableCleanupTimers,
    clearTableCleanupTimer,
    startVoidHandVote,
    handleVoidHandVoteResponse,
    cancelVoidHandVote,
    executeVoidHand
};

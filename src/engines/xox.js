// src/engines/xox.js - Sunucu Tarafı XOX (Tic-Tac-Toe / Düello) Motoru
// Çok Oyunculu Eşzamanlı PVP & Taktiksel Minimax Yapay Zeka Botu

const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Yataylar
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Dikeyler
    [0, 4, 8], [2, 4, 6]             // Çaprazlar
];

function checkWin(board) {
    for (let combo of WINNING_COMBOS) {
        const [c1, c2, c3] = combo;
        if (board[c1] && board[c1] === board[c2] && board[c1] === board[c3]) {
            return { winner: board[c1], combo: combo };
        }
    }
    return null;
}

function startXoxGame(players) {
    const p1 = players[0];
    const p2 = players[1];

    return {
        tableId: null,
        players: [p1, p2],
        playerSymbols: {
            [p1]: 'X',
            [p2]: 'O'
        },
        turnIndex: 0, // 0 = p1 ('X'), 1 = p2 ('O')
        board: ['', '', '', '', '', '', '', '', ''],
        winner: null,
        winningCombo: null,
        gameOver: false,
        turnTimeout: 25,
        turnStartTime: Date.now(),
        scores: {
            [p1]: 0,
            [p2]: 0,
            ties: 0
        },
        spectators: [],
        disconnectedPlayers: {},
        playerProfiles: {}
    };
}

function makeXoxMove(gameData, playerId, cellIndex) {
    if (gameData.gameOver) {
        return { success: false, message: "Oyun zaten bitti." };
    }

    const currentTurnPid = gameData.players[gameData.turnIndex];
    if (playerId !== currentTurnPid) {
        return { success: false, message: "Sıra sizde değil." };
    }

    if (cellIndex < 0 || cellIndex > 8 || gameData.board[cellIndex] !== '') {
        return { success: false, message: "Geçersiz kare veya kare dolu." };
    }

    const symbol = gameData.playerSymbols[playerId] || (gameData.turnIndex === 0 ? 'X' : 'O');
    gameData.board[cellIndex] = symbol;

    const winResult = checkWin(gameData.board);
    if (winResult) {
        gameData.gameOver = true;
        gameData.winner = winResult.winner;
        gameData.winningCombo = winResult.combo;
        gameData.scores[playerId] = (gameData.scores[playerId] || 0) + 1;
        return { success: true, gameOver: true, winner: symbol, winningCombo: winResult.combo };
    }

    const isTie = gameData.board.every(cell => cell !== '');
    if (isTie) {
        gameData.gameOver = true;
        gameData.winner = 'tie';
        gameData.winningCombo = null;
        gameData.scores.ties = (gameData.scores.ties || 0) + 1;
        return { success: true, gameOver: true, winner: 'tie' };
    }

    // Sırayı diğer oyuncuya devret
    gameData.turnIndex = 1 - gameData.turnIndex;
    gameData.turnStartTime = Date.now();
    return { success: true, gameOver: false };
}

function getBestBotMove(gameData, botId) {
    const board = gameData.board;
    const botSymbol = gameData.playerSymbols[botId] || 'O';
    const opponentSymbol = (botSymbol === 'X') ? 'O' : 'X';

    const available = [];
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') available.push(i);
    }
    if (available.length === 0) return -1;

    // 1. Bot bu hamleyle kazanabiliyor mu?
    for (let idx of available) {
        let temp = [...board];
        temp[idx] = botSymbol;
        if (checkWin(temp)) return idx;
    }

    // 2. Rakip bir sonraki hamlede kazanacaksa bloke et!
    for (let idx of available) {
        let temp = [...board];
        temp[idx] = opponentSymbol;
        if (checkWin(temp)) return idx;
    }

    // 3. Merkez kare (4) boşsa al
    if (available.includes(4)) return 4;

    // 4. Köşe kareler (0, 2, 6, 8)
    const corners = [0, 2, 6, 8].filter(c => available.includes(c));
    if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Kenar kareler (1, 3, 5, 7)
    return available[Math.floor(Math.random() * available.length)];
}

function makeXoxBotMove(gameData, botId) {
    if (gameData.gameOver) return null;
    const cellIndex = getBestBotMove(gameData, botId);
    if (cellIndex === -1) return null;
    return makeXoxMove(gameData, botId, cellIndex);
}

function passTurn(gameData) {
    if (gameData.gameOver) return;
    // Zaman aşımında rastgele boş bir kare oynanır
    const currentTurnPid = gameData.players[gameData.turnIndex];
    const available = [];
    for (let i = 0; i < 9; i++) {
        if (gameData.board[i] === '') available.push(i);
    }
    if (available.length > 0) {
        const randCell = available[Math.floor(Math.random() * available.length)];
        makeXoxMove(gameData, currentTurnPid, randCell);
    }
}

module.exports = {
    startXoxGame,
    makeXoxMove,
    makeXoxBotMove,
    getBestBotMove,
    checkWin,
    passTurn
};

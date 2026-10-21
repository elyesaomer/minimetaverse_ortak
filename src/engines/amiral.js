// src/engines/amiral.js - Sunucu Tarafı Amiral Battı (Battleship / Deniz Muharebesi) Motoru
// Çok Oyunculu Eşzamanlı PVP & Taktiksel Radar Yapay Zeka Botu

const GRID_SIZE = 8;
const SHIPS_CONFIG = [
    { id: 'carrier', name: '🛳️ Amiral Gemisi', size: 4, color: '#38bdf8' },
    { id: 'cruiser', name: '🚢 Kruvazör', size: 3, color: '#4ade80' },
    { id: 'destroyer', name: '🚤 Muhrip', size: 2, color: '#fbbf24' },
    { id: 'patrol', name: '🛶 Hücumbot', size: 2, color: '#f43f5e' }
];

function createEmptyGrid() {
    return Array(GRID_SIZE).fill(null).map(() => 
        Array(GRID_SIZE).fill(null).map(() => ({ ship: null, hit: false, miss: false, fired: false }))
    );
}

function generateRandomFleet() {
    let grid = createEmptyGrid();
    let ships = [];

    SHIPS_CONFIG.forEach(cfg => {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 200) {
            attempts++;
            let isHoriz = Math.random() < 0.5;
            let r = Math.floor(Math.random() * (isHoriz ? GRID_SIZE : (GRID_SIZE - cfg.size + 1)));
            let c = Math.floor(Math.random() * (isHoriz ? (GRID_SIZE - cfg.size + 1) : GRID_SIZE));

            let canPlace = true;
            let coords = [];

            for (let i = 0; i < cfg.size; i++) {
                let cr = isHoriz ? r : r + i;
                let cc = isHoriz ? c + i : c;

                if (grid[cr][cc].ship !== null) {
                    canPlace = false;
                    break;
                }
                coords.push({ r: cr, c: cc });
            }

            if (canPlace) {
                coords.forEach(coord => {
                    grid[coord.r][coord.c].ship = cfg.id;
                });
                ships.push({
                    id: cfg.id,
                    name: cfg.name,
                    size: cfg.size,
                    color: cfg.color,
                    coords: coords,
                    hits: 0,
                    sunk: false
                });
                placed = true;
            }
        }
    });

    return { ships, grid };
}

function startAmiralGame(players) {
    const p1 = players[0];
    const p2 = players[1];

    const gameData = {
        tableId: null,
        players: [p1, p2],
        phase: 'SETUP', // 'SETUP' -> 'BATTLE' -> 'GAMEOVER'
        ready: {
            [p1]: false,
            [p2]: false
        },
        ships: {
            [p1]: [],
            [p2]: []
        },
        grids: {
            [p1]: createEmptyGrid(),
            [p2]: createEmptyGrid()
        },
        shots: {
            [p1]: createEmptyGrid(), // p1'in p2'nin alanına yaptığı atışlar
            [p2]: createEmptyGrid()  // p2'nin p1'in alanına yaptığı atışlar
        },
        turnIndex: 0,
        turnTimeout: 30,
        turnStartTime: Date.now(),
        lastShotResult: null,
        winner: null,
        gameOver: false,
        spectators: [],
        disconnectedPlayers: {},
        playerProfiles: {},
        stats: {
            [p1]: { shots: 0, hits: 0 },
            [p2]: { shots: 0, hits: 0 }
        }
    };

    // Eğer oyunculardan biri botsa, botun donanmasını otomatik hazırla
    [p1, p2].forEach(pid => {
        if (pid.startsWith('bot_')) {
            const fleet = generateRandomFleet();
            gameData.ships[pid] = fleet.ships;
            gameData.grids[pid] = fleet.grid;
            gameData.ready[pid] = true;
        }
    });

    return gameData;
}

function setPlayerFleet(gameData, playerId, ships, grid) {
    if (!gameData || gameData.phase !== 'SETUP') return false;

    if (ships && ships.length === 4 && grid) {
        gameData.ships[playerId] = ships.map(s => ({ ...s, hits: 0, sunk: false }));
        gameData.grids[playerId] = grid;
    } else {
        const fleet = generateRandomFleet();
        gameData.ships[playerId] = fleet.ships;
        gameData.grids[playerId] = fleet.grid;
    }

    gameData.ready[playerId] = true;

    // Her iki oyuncu da hazırsa doğrudan SAVAŞ evresine geç
    const allReady = gameData.players.every(p => gameData.ready[p] === true);
    if (allReady) {
        gameData.phase = 'BATTLE';
        gameData.turnIndex = 0;
        gameData.turnStartTime = Date.now();
    }

    return true;
}

function makeAmiralShot(gameData, playerId, r, c) {
    if (gameData.gameOver || gameData.phase !== 'BATTLE') {
        return { success: false, message: "Savaş henüz başlamadı veya bitti." };
    }

    const currentTurnPid = gameData.players[gameData.turnIndex];
    if (playerId !== currentTurnPid) {
        return { success: false, message: "Sıra sizde değil." };
    }

    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
        return { success: false, message: "Geçersiz radar koordinatı." };
    }

    const oppId = gameData.players[1 - gameData.turnIndex];
    const playerShotGrid = gameData.shots[playerId];

    if (playerShotGrid[r][c].fired) {
        return { success: false, message: "Bu kareye zaten daha önce atış yaptınız." };
    }

    playerShotGrid[r][c].fired = true;
    gameData.stats[playerId].shots++;

    const oppShipId = gameData.grids[oppId][r][c].ship;
    let hit = false;
    let sunkShip = null;

    if (oppShipId) {
        hit = true;
        playerShotGrid[r][c].hit = true;
        gameData.grids[oppId][r][c].hit = true;
        gameData.stats[playerId].hits++;

        // İlgili geminin hasar durumunu güncelle
        const hitShip = gameData.ships[oppId].find(s => s.id === oppShipId);
        if (hitShip) {
            hitShip.hits = (hitShip.hits || 0) + 1;
            if (hitShip.hits >= hitShip.size) {
                hitShip.sunk = true;
                sunkShip = hitShip;
            }
        }

        // Tüm gemiler battı mı kontrol et
        const allSunk = gameData.ships[oppId].every(s => s.sunk === true);
        if (allSunk) {
            gameData.gameOver = true;
            gameData.winner = playerId;
            gameData.phase = 'GAMEOVER';
        }
    } else {
        playerShotGrid[r][c].miss = true;
        gameData.grids[oppId][r][c].miss = true;
    }

    gameData.lastShotResult = {
        playerId,
        r,
        c,
        hit,
        sunkShip: sunkShip ? { id: sunkShip.id, name: sunkShip.name } : null
    };

    if (!gameData.gameOver) {
        // Sırayı diğer oyuncuya geçir
        gameData.turnIndex = 1 - gameData.turnIndex;
        gameData.turnStartTime = Date.now();
    }

    return {
        success: true,
        hit,
        sunkShip: sunkShip ? { id: sunkShip.id, name: sunkShip.name } : null,
        gameOver: gameData.gameOver,
        winner: gameData.winner
    };
}

function makeAmiralBotMove(gameData, botId) {
    if (gameData.gameOver || gameData.phase !== 'BATTLE') return null;

    const botShots = gameData.shots[botId];
    let target = null;

    // 1. Hedef Avlama Modu: Vurulmuş ama henüz batmamış bir gemi hücresi varsa etrafına ateş et
    const hitCoords = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (botShots[r][c].hit) {
                // Bu koordinat batmış bir gemiye mi ait?
                const oppId = gameData.players.find(p => p !== botId);
                const shipId = gameData.grids[oppId]?.[r]?.[c]?.ship;
                const isSunk = gameData.ships[oppId]?.find(s => s.id === shipId)?.sunk;
                if (!isSunk) {
                    hitCoords.push({ r, c });
                }
            }
        }
    }

    if (hitCoords.length > 0) {
        // Vurulan hücrelerin komşularını kontrol et (Yukarı, Aşağı, Sol, Sağ)
        const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (let hc of hitCoords) {
            for (let [dr, dc] of deltas) {
                let nr = hc.r + dr;
                let nc = hc.c + dc;
                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                    if (!botShots[nr][nc].fired) {
                        target = { r: nr, c: nc };
                        break;
                    }
                }
            }
            if (target) break;
        }
    }

    // 2. Rastgele Tarama Modu: Henüz atış yapılmamış bir kare seç (Dama tahtası paritesi)
    if (!target) {
        const unfired = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (!botShots[r][c].fired) {
                    unfired.push({ r, c });
                }
            }
        }
        if (unfired.length > 0) {
            // Pariteye uygun olanları öncelikle dene (r + c çift olanlar)
            const parity = unfired.filter(u => (u.r + u.c) % 2 === 0);
            const pool = parity.length > 0 ? parity : unfired;
            target = pool[Math.floor(Math.random() * pool.length)];
        }
    }

    if (target) {
        return makeAmiralShot(gameData, botId, target.r, target.c);
    }
    return null;
}

function passTurn(gameData) {
    if (gameData.gameOver || gameData.phase !== 'BATTLE') return;
    const currentTurnPid = gameData.players[gameData.turnIndex];
    makeAmiralBotMove(gameData, currentTurnPid);
}

module.exports = {
    GRID_SIZE,
    SHIPS_CONFIG,
    startAmiralGame,
    generateRandomFleet,
    setPlayerFleet,
    makeAmiralShot,
    makeAmiralBotMove,
    passTurn
};

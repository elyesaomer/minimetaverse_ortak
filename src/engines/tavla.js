// src/engines/tavla.js - Sunucu Tarafı Tavla (Backgammon) Motoru (Y Ekseninde Kusursuz Simetrik)

function createInitialBoard() {
    // 24 kapı (1-24). Her kapıda { player: 'white'|'black'|null, count: 0 }
    // Y Ekseninde (Üst/Alt Ayna) Kusursuz Simetrik Yerleşim:
    // Beyaz (White - Alt Oyuncu): 24'ten 1'e doğru ilerler (Toplama alanı: 1-6 Sağ Alt)
    // Siyah (Black - Üst Oyuncu): 1'den 24'e doğru ilerler (Toplama alanı: 19-24 Sağ Üst)
    let points = Array(25).fill(null).map(() => ({ player: null, count: 0 }));

    // Beyaz taşlar (Toplam 15 taş) - Ev: 1-6 (Sağ Alt)
    points[6] = { player: 'white', count: 5 };
    points[8] = { player: 'white', count: 3 };
    points[13] = { player: 'white', count: 5 };
    points[24] = { player: 'white', count: 2 };

    // Siyah taşlar (Toplam 15 taş) - Ev: 19-24 (Sağ Üst)
    // Simetrik Karşılıklar: 6<->19, 8<->17, 13<->12, 24<->1
    points[1] = { player: 'black', count: 2 };
    points[12] = { player: 'black', count: 5 };
    points[17] = { player: 'black', count: 3 };
    points[19] = { player: 'black', count: 5 };

    return points;
}

function startTavlaGame(players) {
    let p1 = players[0];
    let p2 = players[1];

    let gameData = {
        tableId: null,
        players: [p1, p2], // [white (alt), black (üst)]
        playerColors: {
            [p1]: 'white',
            [p2]: 'black'
        },
        turnIndex: 0, // 0: p1 (white), 1: p2 (black)
        board: createInitialBoard(),
        bar: { white: 0, black: 0 },         // Kırılan taşlar
        borneOff: { white: 0, black: 0 },   // Toplanan taşlar
        dice: [],                            // Atılan zarlar [d1, d2]
        remainingMoves: [],                  // Kullanılabilir zar hamleleri
        hasRolled: false,
        noMoves: false,
        winner: null,
        gameOver: false,
        spectators: [],
        disconnectedPlayers: {},
        playerProfiles: {}
    };

    return gameData;
}

function isHomeBoard(color, pointIndex) {
    if (color === 'white') {
        // Beyaz'ın toplama evi sağ alttaki 1-6 kapılarıdır
        return pointIndex >= 1 && pointIndex <= 6;
    }
    // Siyah'ın toplama evi sağ üstteki 19-24 kapılarıdır
    return pointIndex >= 19 && pointIndex <= 24;
}

function canBearOff(gameData, color) {
    if (gameData.bar[color] > 0) return false;

    let points = gameData.board;
    for (let i = 1; i <= 24; i++) {
        if (points[i].player === color && !isHomeBoard(color, i)) {
            return false;
        }
    }
    return true;
}

function getFurthestPoint(gameData, color) {
    if (color === 'white') {
        // Beyaz 1'e doğru toplar, en uzak kapı 6'dan geriye doğru ilk bulunan kapıdır
        for (let i = 6; i >= 1; i--) {
            if (gameData.board[i].player === color && gameData.board[i].count > 0) return i;
        }
    } else {
        // Siyah 24'e doğru toplar, en uzak kapı 19'dan yukarıya doğru ilk bulunan kapıdır
        for (let i = 19; i <= 24; i++) {
            if (gameData.board[i].player === color && gameData.board[i].count > 0) return i;
        }
    }
    return null;
}

function getValidMovesForPoint(gameData, playerId, fromPoint) {
    let color = gameData.playerColors[playerId];
    if (!color || gameData.gameOver || !gameData.hasRolled || gameData.remainingMoves.length === 0) {
        return [];
    }

    let moves = [];
    let uniqueDice = [...new Set(gameData.remainingMoves)];
    let opp = color === 'white' ? 'black' : 'white';

    // 1. Kırık taş varsa öncelikle bardan girilmelidir
    if (gameData.bar[color] > 0) {
        if (fromPoint !== 'bar') return [];

        uniqueDice.forEach(die => {
            // Beyaz siyahın evine girer (19-24): 25 - die
            // Siyah beyazın evine girer (1-6): die
            let target = color === 'white' ? (25 - die) : die;
            let pt = gameData.board[target];

            if (!pt.player || pt.player === color || (pt.player === opp && pt.count === 1)) {
                moves.push({ die, target });
            }
        });
        return moves;
    }

    if (fromPoint === 'bar') return [];

    let currentPt = gameData.board[fromPoint];
    if (!currentPt || currentPt.player !== color || currentPt.count === 0) return [];

    let bearingOffPossible = canBearOff(gameData, color);

    uniqueDice.forEach(die => {
        // Beyaz: 24'ten 1'e azalır (fromPoint - die)
        // Siyah: 1'den 24'e artar (fromPoint + die)
        let target = color === 'white' ? (fromPoint - die) : (fromPoint + die);

        // Pul toplama kontrolü
        if (color === 'white' && target < 1) {
            if (bearingOffPossible) {
                // Tam zarla çıkış (fromPoint === die) veya daha büyük zarla en arkadaki taştan çıkış
                if (fromPoint === die || fromPoint === getFurthestPoint(gameData, color)) {
                    moves.push({ die, target: 'off' });
                }
            }
        } else if (color === 'black' && target > 24) {
            if (bearingOffPossible) {
                // Tam zarla çıkış (fromPoint + die === 25) veya daha büyük zarla en arkadaki taştan çıkış
                if (fromPoint + die === 25 || fromPoint === getFurthestPoint(gameData, color)) {
                    moves.push({ die, target: 'off' });
                }
            }
        } else if (target >= 1 && target <= 24) {
            let targetPt = gameData.board[target];

            // Hedef kapı boş, kendi taşımız var ya da rakip tek taş (açık)
            if (!targetPt.player || targetPt.player === color || (targetPt.player === opp && targetPt.count === 1)) {
                moves.push({ die, target });
            }
        }
    });

    return moves;
}

function hasAnyValidMoves(gameData, playerId) {
    let color = gameData.playerColors[playerId];
    if (!color || gameData.remainingMoves.length === 0) return false;

    if (gameData.bar[color] > 0) {
        let barMoves = getValidMovesForPoint(gameData, playerId, 'bar');
        return barMoves.length > 0;
    }

    for (let i = 1; i <= 24; i++) {
        if (gameData.board[i].player === color && gameData.board[i].count > 0) {
            let moves = getValidMovesForPoint(gameData, playerId, i);
            if (moves.length > 0) return true;
        }
    }
    return false;
}

function rollDice(gameData, playerId) {
    let currentPid = gameData.players[gameData.turnIndex];
    if (currentPid !== playerId || gameData.hasRolled || gameData.gameOver) return false;

    let d1 = Math.floor(Math.random() * 6) + 1;
    let d2 = Math.floor(Math.random() * 6) + 1;

    gameData.dice = [d1, d2];
    gameData.hasRolled = true;

    if (d1 === d2) {
        // Çift zar: 4 hamle hakkı
        gameData.remainingMoves = [d1, d1, d1, d1];
    } else {
        gameData.remainingMoves = [d1, d2];
    }

    // Hamle yapılabilirlik kontrolü
    let canMove = hasAnyValidMoves(gameData, playerId);
    gameData.noMoves = !canMove;

    return true;
}

function makeMove(gameData, playerId, fromPoint, toPoint, usedDie) {
    let color = gameData.playerColors[playerId];
    if (!color || gameData.players[gameData.turnIndex] !== playerId || !gameData.hasRolled) return false;

    let dieIndex = gameData.remainingMoves.indexOf(usedDie);
    if (dieIndex === -1) return false;

    let opp = color === 'white' ? 'black' : 'white';

    // 1. Taşın çıkış noktasından eksiltilmesi
    if (fromPoint === 'bar') {
        if (gameData.bar[color] <= 0) return false;
        gameData.bar[color]--;
    } else {
        let pt = gameData.board[fromPoint];
        if (!pt || pt.player !== color || pt.count <= 0) return false;
        pt.count--;
        if (pt.count === 0) pt.player = null;
    }

    // 2. Taşın varış noktasına eklenmesi veya toplanması
    if (toPoint === 'off') {
        gameData.borneOff[color]++;
        if (gameData.borneOff[color] >= 15) {
            gameData.winner = playerId;
            gameData.gameOver = true;
        }
    } else {
        let targetPt = gameData.board[toPoint];
        if (targetPt.player === opp && targetPt.count === 1) {
            // Rakip tek taşı kırıldı!
            targetPt.player = color;
            targetPt.count = 1;
            gameData.bar[opp]++;
        } else {
            targetPt.player = color;
            targetPt.count++;
        }
    }

    // 3. Kullanılan zarı listeden düş
    gameData.remainingMoves.splice(dieIndex, 1);

    // Kalan zarlarla hamle kaldı mı kontrol et
    if (!gameData.gameOver) {
        if (gameData.remainingMoves.length === 0) {
            passTurn(gameData);
        } else {
            let canMoveFurther = hasAnyValidMoves(gameData, playerId);
            if (!canMoveFurther) {
                gameData.noMoves = true;
            }
        }
    }

    return true;
}

function passTurn(gameData) {
    if (!gameData || gameData.gameOver) return;
    gameData.turnIndex = (gameData.turnIndex + 1) % gameData.players.length;
    gameData.hasRolled = false;
    gameData.noMoves = false;
    gameData.dice = [];
    gameData.remainingMoves = [];
}

function makeTavlaBotMove(gameData, botId) {
    if (!gameData || gameData.gameOver || gameData.players[gameData.turnIndex] !== botId) return false;

    if (!gameData.hasRolled) {
        rollDice(gameData, botId);
    }

    if (gameData.noMoves) {
        passTurn(gameData);
        return true;
    }

    let color = gameData.playerColors[botId];
    let maxLoops = 8;
    while (gameData.hasRolled && gameData.remainingMoves.length > 0 && !gameData.gameOver && maxLoops-- > 0) {
        let moved = false;
        if (gameData.bar[color] > 0) {
            let moves = getValidMovesForPoint(gameData, botId, 'bar');
            if (moves.length > 0) {
                makeMove(gameData, botId, 'bar', moves[0].target, moves[0].die);
                moved = true;
            }
        } else {
            // Hamle öncelikleri: Kırma veya toplama öncelikli
            let allMoves = [];
            for (let i = 1; i <= 24; i++) {
                if (gameData.board[i].player === color && gameData.board[i].count > 0) {
                    let moves = getValidMovesForPoint(gameData, botId, i);
                    moves.forEach(m => allMoves.push({ from: i, to: m.target, die: m.die }));
                }
            }
            if (allMoves.length > 0) {
                // Toplama veya kırma hamlesi var mı?
                let offMove = allMoves.find(m => m.to === 'off');
                let hitMove = allMoves.find(m => m.to !== 'off' && gameData.board[m.to].player && gameData.board[m.to].player !== color);
                let chosen = offMove || hitMove || allMoves[0];

                makeMove(gameData, botId, chosen.from, chosen.to, chosen.die);
                moved = true;
            }
        }
        if (!moved) break;
    }

    if (gameData.remainingMoves.length > 0 && !hasAnyValidMoves(gameData, botId)) {
        passTurn(gameData);
    }

    return true;
}

module.exports = {
    startTavlaGame,
    createInitialBoard,
    rollDice,
    getValidMovesForPoint,
    hasAnyValidMoves,
    makeMove,
    passTurn,
    makeTavlaBotMove,
    isHomeBoard,
    canBearOff,
    getFurthestPoint
};

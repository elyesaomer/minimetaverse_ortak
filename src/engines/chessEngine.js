// src/engines/chessEngine.js - Sunucu Tarafı Satranç (Chess) Motoru
// Resmi FIDE Kuralları: Rok (Castling), Piyon Terfisi (Promotion), Geçerken Alma (En Passant), Şah & Mat, Pat & Beraberlik
// Süreli (10 dakika) ve Süresiz Mod Desteği, Akıllı Bot Hamle Motoru

const { Chess } = require('chess.js');

/**
 * Yeni bir satranç oyunu oturumu başlatır
 * @param {Array<string>} players - [beyaz_oyuncu_id, siyah_oyuncu_id]
 * @param {Object} options - { timeMode: '10m' | 'untimed', bet: number, pot: number }
 */
function startChessGame(players, options = {}) {
    const chess = new Chess();
    const p1 = players[0];
    const p2 = players[1];

    const timeMode = (options.timeMode === 'untimed') ? 'untimed' : '10m';
    const initialTime = (timeMode === '10m') ? 600 : 0; // 600 saniye = 10 dakika

    return {
        tableId: options.tableId || null,
        players: [p1, p2],
        playerColors: {
            [p1]: 'w', // 1. Koltuk: Beyaz
            [p2]: 'b'  // 2. Koltuk: Siyah
        },
        chessInstance: chess,
        fen: chess.fen(),
        turn: 'w', // 'w' veya 'b'
        timeMode: timeMode,
        whiteTime: initialTime,
        blackTime: initialTime,
        lastMoveTimestamp: Date.now(),
        turnStartTime: Date.now(),
        moveHistory: [],
        capturedPieces: {
            w: [], // Beyazın ele geçirdiği taşlar (siyah taşlar)
            b: []  // Siyahın ele geçirdiği taşlar (beyaz taşlar)
        },
        inCheck: false,
        gameOver: false,
        winner: null, // 'w', 'b', veya 'draw'
        winReason: null, // 'checkmate', 'timeout', 'resignation', 'stalemate', 'draw'
        bet: options.bet || 0,
        pot: options.pot || 0,
        spectators: [],
        disconnectedPlayers: {},
        playerProfiles: {},
        rematchVotes: {}
    };
}

/**
 * Oyuncunun hamlesini doğrular ve tahtaya uygular
 * @param {Object} game - Oyun nesnesi
 * @param {string} playerId - Hamle yapan oyuncu ID'si
 * @param {Object} moveData - { from: 'e2', to: 'e4', promotion: 'q' }
 */
function makeChessMove(game, playerId, moveData) {
    if (game.gameOver) {
        return { success: false, message: "Oyun zaten bitti." };
    }

    const playerColor = game.playerColors[playerId];
    if (!playerColor) {
        return { success: false, message: "Bu oyunda oyuncu değilsiniz." };
    }

    if (game.turn !== playerColor) {
        return { success: false, message: "Sıra sizde değil." };
    }

    const chess = game.chessInstance;
    const now = Date.now();

    // Süreli modda süreyi güncelle
    if (game.timeMode === '10m') {
        const elapsedSeconds = Math.max(0, (now - game.lastMoveTimestamp) / 1000);
        if (playerColor === 'w') {
            game.whiteTime = Math.max(0, game.whiteTime - elapsedSeconds);
            if (game.whiteTime <= 0) {
                game.gameOver = true;
                game.winner = 'b';
                game.winReason = 'timeout';
                return { success: true, gameOver: true, winner: 'b', winReason: 'timeout' };
            }
        } else {
            game.blackTime = Math.max(0, game.blackTime - elapsedSeconds);
            if (game.blackTime <= 0) {
                game.gameOver = true;
                game.winner = 'w';
                game.winReason = 'timeout';
                return { success: true, gameOver: true, winner: 'w', winReason: 'timeout' };
            }
        }
    }

    try {
        const moveOptions = {
            from: moveData.from,
            to: moveData.to
        };
        if (moveData.promotion) {
            moveOptions.promotion = moveData.promotion.toLowerCase();
        }

        const moveResult = chess.move(moveOptions);
        if (!moveResult) {
            return { success: false, message: "Geçersiz satranç hamlesi." };
        }

        // Ele geçirilen taş varsa listeye ekle
        if (moveResult.captured) {
            if (playerColor === 'w') {
                game.capturedPieces.w.push(moveResult.captured);
            } else {
                game.capturedPieces.b.push(moveResult.captured);
            }
        }

        // Hamle geçmişine ekle
        game.moveHistory.push({
            san: moveResult.san,
            from: moveResult.from,
            to: moveResult.to,
            color: playerColor,
            piece: moveResult.piece,
            captured: moveResult.captured || null,
            promotion: moveResult.promotion || null,
            flags: moveResult.flags
        });

        // Durum güncellemesi
        game.fen = chess.fen();
        game.turn = chess.turn();
        game.lastMoveTimestamp = now;
        game.turnStartTime = now;
        game.inCheck = chess.inCheck();

        // Oyun sonu kontrolleri (FIDE resmi kuralları)
        if (chess.isGameOver()) {
            game.gameOver = true;
            if (chess.isCheckmate()) {
                game.winner = playerColor; // Mat yapan oyuncu kazandı
                game.winReason = 'checkmate';
            } else if (chess.isStalemate()) {
                game.winner = 'draw';
                game.winReason = 'stalemate';
            } else if (chess.isThreefoldRepetition()) {
                game.winner = 'draw';
                game.winReason = 'threefold_repetition';
            } else if (chess.isInsufficientMaterial()) {
                game.winner = 'draw';
                game.winReason = 'insufficient_material';
            } else if (chess.isDraw()) {
                game.winner = 'draw';
                game.winReason = 'draw';
            }
            return {
                success: true,
                move: moveResult,
                gameOver: true,
                winner: game.winner,
                winReason: game.winReason,
                inCheck: game.inCheck
            };
        }

        return {
            success: true,
            move: moveResult,
            gameOver: false,
            inCheck: game.inCheck
        };
    } catch (err) {
        return { success: false, message: "Geçersiz hamle: " + err.message };
    }
}

/**
 * Oyuncunun terk etmesini (resignation) işler
 */
function resignChessGame(game, playerId) {
    if (game.gameOver) return { success: false, message: "Oyun zaten bitti." };
    const playerColor = game.playerColors[playerId];
    if (!playerColor) return { success: false, message: "Oyuncu bulunamadı." };

    game.gameOver = true;
    game.winner = (playerColor === 'w') ? 'b' : 'w';
    game.winReason = 'resignation';

    return {
        success: true,
        gameOver: true,
        winner: game.winner,
        winReason: 'resignation'
    };
}

/**
 * Belirli bir kare için tüm yasal hamleleri döndürür
 */
function getLegalMovesForSquare(game, square) {
    if (!game || !game.chessInstance) return [];
    try {
        return game.chessInstance.moves({ square: square, verbose: true });
    } catch (_) {
        return [];
    }
}

/**
 * Yapay Zeka Bot Hamlesi Üretici
 * Taktiksel Değerlendirme:
 * 1. Şah & Mat hamlesi varsa doğrudan yap
 * 2. Taş alma (capture) hamlelerini taş değerine göre önceliklendir (Q > R > B/N > P)
 * 3. Şah çekme hamlelerini değerlendir
 * 4. Merkez kareleri (d4, e4, d5, e5) tutan hamleleri tercih et
 */
const PIECE_VALUES = {
    p: 10,
    n: 30,
    b: 32,
    r: 50,
    q: 90,
    k: 900
};

function getBestBotChessMove(game, botId) {
    if (game.gameOver) return null;
    const playerColor = game.playerColors[botId];
    if (!playerColor || game.turn !== playerColor) return null;

    const chess = game.chessInstance;
    const legalMoves = chess.moves({ verbose: true });
    if (!legalMoves || legalMoves.length === 0) return null;

    // 1. Mat yapan hamle var mı?
    for (let m of legalMoves) {
        chess.move(m);
        let isMate = chess.isCheckmate();
        chess.undo();
        if (isMate) return m;
    }

    // 2. Hamleleri puanla
    let scoredMoves = legalMoves.map(m => {
        let score = 0;

        // Taş yeme puanı
        if (m.captured) {
            let capturedVal = PIECE_VALUES[m.captured] || 10;
            let attackerVal = PIECE_VALUES[m.piece] || 10;
            score += (capturedVal * 10) - (attackerVal * 2);
        }

        // Terfi puanı
        if (m.promotion) {
            score += 80;
        }

        // Rakibe şah çekme
        chess.move(m);
        if (chess.inCheck()) score += 15;
        // Kendi şahını tehlikeye atıp atmadığı chess.moves() tarafından zaten elenmiştir
        chess.undo();

        // Merkeze yakınlık (d4, e4, d5, e5)
        const targetSquare = m.to;
        if (['d4', 'e4', 'd5', 'e5'].includes(targetSquare)) {
            score += 6;
        } else if (['c3', 'c4', 'c5', 'c6', 'f3', 'f4', 'f5', 'f6'].includes(targetSquare)) {
            score += 3;
        }

        // Küçük rastgelelik (aynı puandaki hamleler arasında çeşitlilik)
        score += Math.random() * 3;

        return { move: m, score: score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
}

module.exports = {
    startChessGame,
    makeChessMove,
    resignChessGame,
    getLegalMovesForSquare,
    getBestBotChessMove,
    PIECE_VALUES
};

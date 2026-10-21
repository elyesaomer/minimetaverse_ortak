// src/coordinators/voidHandCoordinator.js - El Bozma ve Yeniden Dağıtma (Void Hand Vote) Koordinatörü
const { executeVoidHandBatak } = require('./batakCoordinator');
const { executeVoidHandOkey101 } = require('./okey101Coordinator');

function startVoidHandVote(game, initiatorPid, io, players) {
    if (!game || !game.players || !game.players.includes(initiatorPid)) return false;
    if (game.voidHandVote) return false;
    if (game.gameOver || game.setEnded) return false;

    let isBatak = (game.isBatak4 !== undefined || game.hiddenCards !== undefined || (game.tableId && game.tableId.startsWith('batak')));
    let isOkey = (game.mode !== undefined || (game.tableId && game.tableId.startsWith('okey101')));
    if (!isBatak && !isOkey) return false;

    let initiatorName = (players[initiatorPid] ? players[initiatorPid].name : null) || 
                        (game.playerProfiles && game.playerProfiles[initiatorPid] ? game.playerProfiles[initiatorPid].name : "Oyuncu");

    let gameType = isBatak ? 'batak' : 'okey101';

    let votes = {};
    // Başlatan oyuncu ve masadaki botlar otomatik olarak EL BOZMAYI kabul eder
    game.players.forEach(pid => {
        if (pid === initiatorPid || pid.startsWith('bot_') || (game.playerProfiles && game.playerProfiles[pid]?.isBot)) {
            votes[pid] = true;
        } else {
            votes[pid] = false;
        }
    });

    let totalPlayers = game.players.length;
    let yesCount = Object.values(votes).filter(v => v === true).length;

    let voteTimer = setTimeout(() => {
        if (game && game.voidHandVote) {
            cancelVoidHandVote(game, "⏱️ 20 saniyelik süre dolduğu için el bozma oylaması iptal edildi.", io, players);
        }
    }, 20000);

    game.voidHandVote = {
        initiatorPid,
        initiatorName,
        gameType,
        votes,
        totalPlayers,
        timer: voteTimer,
        expiresAt: Date.now() + 20000
    };

    let payload = {
        tableId: game.tableId,
        initiatorId: initiatorPid,
        initiatorName: initiatorName,
        gameType: gameType,
        votes: votes,
        yesCount: yesCount,
        totalPlayers: totalPlayers,
        expiresIn: 20
    };

    game.players.forEach(pid => io.to(pid).emit('voidHandVoteStarted', payload));
    if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('voidHandVoteStarted', payload));

    // Eğer herkes (örneğin 1 insan + 3 bot) zaten kabul ettiyse hemen uygula!
    if (game.players.every(p => votes[p] === true)) {
        executeVoidHand(game, io, players);
    }
    return true;
}

function handleVoidHandVoteResponse(game, socketId, accept, io, players) {
    if (!game || !game.voidHandVote || !game.players || !game.players.includes(socketId)) return;

    if (!accept) {
        let rejectorName = (players[socketId] ? players[socketId].name : null) || 
                           (game.playerProfiles && game.playerProfiles[socketId] ? game.playerProfiles[socketId].name : "Bir oyuncu");
        cancelVoidHandVote(game, `❌ ${rejectorName} eli bozmayı reddetti. Oyun kaldığı yerden devam ediyor.`, io, players);
        return;
    }

    game.voidHandVote.votes[socketId] = true;
    let yesCount = Object.values(game.voidHandVote.votes).filter(v => v === true).length;
    let totalPlayers = game.players.length;

    let updatePayload = {
        tableId: game.tableId,
        votes: game.voidHandVote.votes,
        yesCount: yesCount,
        totalPlayers: totalPlayers
    };

    game.players.forEach(pid => io.to(pid).emit('voidHandVoteUpdated', updatePayload));
    if (game.spectators) game.spectators.forEach(sid => io.to(sid).emit('voidHandVoteUpdated', updatePayload));

    if (game.players.every(p => game.voidHandVote.votes[p] === true)) {
        executeVoidHand(game, io, players);
    }
}

function cancelVoidHandVote(game, reasonMessage, io, players) {
    if (!game || !game.voidHandVote) return;
    if (game.voidHandVote.timer) {
        clearTimeout(game.voidHandVote.timer);
    }
    delete game.voidHandVote;

    let payload = {
        tableId: game.tableId,
        reason: reasonMessage,
        message: reasonMessage
    };

    game.players.forEach(pid => {
        io.to(pid).emit('voidHandVoteCancelled', payload);
        io.to(pid).emit('systemMessage', reasonMessage);
    });
    if (game.spectators) {
        game.spectators.forEach(sid => io.to(sid).emit('voidHandVoteCancelled', payload));
    }
}

function executeVoidHand(game, io, players) {
    if (!game) return;
    if (game.voidHandVote && game.voidHandVote.timer) {
        clearTimeout(game.voidHandVote.timer);
    }
    delete game.voidHandVote;

    let isBatak = (game.isBatak4 !== undefined || game.hiddenCards !== undefined || (game.tableId && game.tableId.startsWith('batak')));
    if (isBatak) {
        executeVoidHandBatak(game, io, players);
    } else {
        executeVoidHandOkey101(game, io, players);
    }
}

module.exports = {
    startVoidHandVote,
    handleVoidHandVoteResponse,
    cancelVoidHandVote,
    executeVoidHand
};

// src/coordinators/gameState.js - Aktif Oyun Oturumları Havuzu (Tek Doğruluk Kaynağı)
const activeGames = {};

function getActiveGames() {
    return activeGames;
}

function getActiveGame(tableId) {
    return activeGames[tableId] || null;
}

module.exports = {
    activeGames,
    getActiveGames,
    getActiveGame
};

// src/utils/securityUtils.js - Güvenlik, Hız Sınırlaması (Rate Limiting) ve XSS Koruması
const dataManager = require('../dataManager');

/**
 * Soket bazlı eylem hız sınırlayıcısı (Token / Sliding Window Rate Limiter)
 * İstemcinin döngüsel isteklerle sunucuyu yormasını veya mükerrer işlem yapmasını engeller.
 * 
 * @param {object} socket - Socket.io socket nesnesi
 * @param {string} actionKey - Eylem türü ('transaction', 'chat', 'movement', vb.)
 * @param {number} maxPerWindow - Zaman penceresindeki maksimum istek adedi (varsayılan: 5)
 * @param {number} windowMs - Zaman penceresi süresi milisaniye (varsayılan: 1000 ms)
 * @returns {boolean} - İstek izinliyse true, limit aşıldıysa false döner
 */
function checkRateLimit(socket, actionKey = 'default', maxPerWindow = 5, windowMs = 1000) {
    if (!socket) return true;
    if (!socket._rateLimits) socket._rateLimits = {};
    const now = Date.now();

    if (!socket._rateLimits[actionKey]) {
        socket._rateLimits[actionKey] = [];
    }

    // Pencereden eski kayıtları temizle
    socket._rateLimits[actionKey] = socket._rateLimits[actionKey].filter(t => (now - t) < windowMs);

    if (socket._rateLimits[actionKey].length >= maxPerWindow) {
        if (typeof socket.emit === 'function') {
            socket.emit('gameError', "⚠️ Çok hızlı işlem yapıyorsunuz! Lütfen bir saniye bekleyin.");
        }
        return false;
    }

    socket._rateLimits[actionKey].push(now);
    return true;
}

module.exports = {
    checkRateLimit,
    escapeHtml: dataManager.escapeHtml,
    sanitizeString: dataManager.sanitizeString,
    sanitizeAmount: dataManager.sanitizeAmount
};

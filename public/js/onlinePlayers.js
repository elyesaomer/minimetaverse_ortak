// public/js/onlinePlayers.js - Çevrimiçi Oyuncular Listesi ve Etkileşim Modülü

let cachedOnlinePlayers = [];
let currentOnlineRoomFilter = 'all';
let onlinePlayersAutoRefreshTimer = null;

// 1. MODALI AÇMA / KAPATMA
function openOnlinePlayersModal() {
    if (window.playSound) window.playSound('uiClick');

    const modal = document.getElementById('onlinePlayersModal');
    if (modal) modal.style.display = 'flex';

    // Arama kutusunu ve filtreyi sıfırla
    const searchInput = document.getElementById('onlinePlayerSearchInput');
    if (searchInput) searchInput.value = '';
    currentOnlineRoomFilter = 'all';

    // Filtre çipleri stilini sıfırla
    const chips = document.querySelectorAll('.online-filter-chip');
    chips.forEach(c => {
        if (c.getAttribute('data-room') === 'all') {
            c.classList.add('active');
            c.style.background = '#0284c7';
            c.style.borderColor = '#38bdf8';
            c.style.color = '#ffffff';
        } else {
            c.classList.remove('active');
            c.style.background = 'rgba(30, 41, 59, 0.7)';
            c.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            c.style.color = '#cbd5e1';
        }
    });

    // Sunucudan güncel oyuncu listesini iste
    refreshOnlinePlayers();

    // Modal açık kaldığı sürece 5 saniyede bir otomatik yenile
    if (onlinePlayersAutoRefreshTimer) clearInterval(onlinePlayersAutoRefreshTimer);
    onlinePlayersAutoRefreshTimer = setInterval(() => {
        const m = document.getElementById('onlinePlayersModal');
        if (m && m.style.display === 'flex' && window.socket && window.socket.connected) {
            window.socket.emit('getOnlinePlayers');
        } else {
            clearInterval(onlinePlayersAutoRefreshTimer);
            onlinePlayersAutoRefreshTimer = null;
        }
    }, 5000);
}

function closeOnlinePlayersModal() {
    const modal = document.getElementById('onlinePlayersModal');
    if (modal) modal.style.display = 'none';

    if (onlinePlayersAutoRefreshTimer) {
        clearInterval(onlinePlayersAutoRefreshTimer);
        onlinePlayersAutoRefreshTimer = null;
    }
}

function refreshOnlinePlayers() {
    if (window.socket && window.socket.connected) {
        window.socket.emit('getOnlinePlayers');
    }
}

// 2. MEKAN FİLTRESİ
function setOnlineRoomFilter(roomKey, btnElement) {
    currentOnlineRoomFilter = roomKey;

    const chips = document.querySelectorAll('.online-filter-chip');
    chips.forEach(c => {
        c.classList.remove('active');
        c.style.background = 'rgba(30, 41, 59, 0.7)';
        c.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        c.style.color = '#cbd5e1';
    });

    if (btnElement) {
        btnElement.classList.add('active');
        btnElement.style.background = '#0284c7';
        btnElement.style.borderColor = '#38bdf8';
        btnElement.style.color = '#ffffff';
    }

    filterOnlinePlayersList();
}

// 3. ARAMA VE FİLTRELEME
function filterOnlinePlayersList() {
    const searchVal = (document.getElementById('onlinePlayerSearchInput')?.value || '').toLowerCase().trim();

    let filtered = cachedOnlinePlayers.filter(p => {
        // Botları kesinlikle gösterme
        if (!p || !p.username || p.isBot || p.id?.startsWith('bot_') || p.username.startsWith('🤖')) {
            return false;
        }

        // Mekan filtresi
        if (currentOnlineRoomFilter !== 'all' && p.room !== currentOnlineRoomFilter) {
            return false;
        }

        // Metin araması
        if (searchVal) {
            let uMatch = (p.username || '').toLowerCase().includes(searchVal);
            let locMatch = (p.location || '').toLowerCase().includes(searchVal);
            return uMatch || locMatch;
        }

        return true;
    });

    renderOnlinePlayersCards(filtered);
}

// 4. OYUNCU KARTLARINI ÇİZME
function renderOnlinePlayersCards(list) {
    const container = document.getElementById('onlinePlayersListContainer');
    if (!container) return;

    container.innerHTML = "";

    if (!list || list.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; color:#94a3b8; padding:35px 20px; background:rgba(30, 41, 59, 0.4); border-radius:14px; border:1px dashed rgba(255,255,255,0.1);">
                <div style="font-size:36px; margin-bottom:8px;">🔍</div>
                <div style="font-weight:700; color:#e2e8f0; font-size:15px;">Aramanıza uygun oyuncu bulunamadı</div>
                <div style="font-size:12px; color:#64748b; margin-top:4px;">Farklı bir isim veya mekan filtresi deneyebilirsiniz.</div>
            </div>
        `;
        return;
    }

    list.forEach(p => {
        let isFemale = p.gender === 'female';
        let avatarEmoji = isFemale ? '👧' : '👦';
        let avatarBg = isFemale ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)';

        let card = document.createElement('div');
        card.className = 'online-player-card';
        card.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            padding: 10px 14px;
            gap: 12px;
            transition: all 0.2s ease;
        `;

        // Rozetler
        let badgesHtml = '';
        if (p.isSelf) {
            badgesHtml += `<span style="background: rgba(59, 130, 246, 0.25); border: 1px solid #3b82f6; color: #93c5fd; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 8px;">Sen</span>`;
        }
        if (p.isAdmin) {
            badgesHtml += `<span style="background: rgba(239, 68, 68, 0.25); border: 1px solid #ef4444; color: #fca5a5; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 8px;">👑 Admin</span>`;
        }
        if (p.isMod || p.role === 'mod' || p.role === 'moderator' || (p.username && p.username.toLowerCase() === 'elyesa')) {
            badgesHtml += `<span style="background: rgba(2, 132, 199, 0.25); border: 1px solid #0284c7; color: #38bdf8; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 8px;">🛡️ Mod</span>`;
        }
        if (p.isVip) {
            badgesHtml += `<span style="background: rgba(234, 179, 8, 0.25); border: 1px solid #eab308; color: #fef08a; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 8px;">⭐ VIP</span>`;
        }
        if (p.isFriend && !p.isSelf) {
            badgesHtml += `<span style="background: rgba(16, 185, 129, 0.25); border: 1px solid #10b981; color: #6ee7b7; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 8px;">👥 Arkadaş</span>`;
        }
        if (p.isFishing) {
            badgesHtml += `<span style="background: rgba(14, 165, 233, 0.25); border: 1px solid #0ea5e9; color: #7dd3fc; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 8px;">🎣 Balıkta</span>`;
        }
        if (p.hasTea) {
            badgesHtml += `<span style="background: rgba(245, 158, 11, 0.25); border: 1px solid #f59e0b; color: #fde68a; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 8px;">☕ Çay</span>`;
        }

        // Aksiyon Butonları
        let actionsHtml = '';
        if (!p.isSelf) {
            // Fısılda butonu
            actionsHtml += `
                <button type="button" onclick="whisperToPlayer('${p.username}')" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); border: none; color: white; padding: 6px 11px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3); transition: transform 0.1s;" title="${p.username} kullanıcısına özel fısılda">
                    <span>💬</span> Fısılda
                </button>
            `;

            // Arkadaşlık butonu
            if (!p.isFriend) {
                actionsHtml += `
                    <button type="button" onclick="addFriendFromOnlineList('${p.username}')" style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #6ee7b7; padding: 6px 11px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px;" title="Arkadaş ekle">
                        <span>➕</span> Ekle
                    </button>
                `;
            }

            // Evine Git butonu (Eğer evi varsa)
            if (p.house && typeof visitFriendHouse === 'function') {
                actionsHtml += `
                    <button type="button" onclick="visitFriendHouse('${p.username}', '${p.house.type || 'standart'}'); closeOnlinePlayersModal();" style="background: rgba(14, 165, 233, 0.2); border: 1px solid #0ea5e9; color: #7dd3fc; padding: 6px 10px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer;" title="Evini Ziyaret Et">
                        🏠 Ev
                    </button>
                `;
            }

            // Eğer aynı odadaysa incele / etkileşim butonu
            if (typeof currentRoom !== 'undefined' && currentRoom === p.room && typeof openPlayerInteractionModal === 'function') {
                actionsHtml += `
                    <button type="button" onclick="interactWithOnlinePlayer('${p.id}', '${p.username}')" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: white; padding: 6px 10px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer;" title="Karakteri İncele">
                        👤
                    </button>
                `;
            }
        }

        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                <div style="position: relative; width: 42px; height: 42px; border-radius: 12px; background: ${avatarBg}; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); flex-shrink: 0;">
                    <span>${avatarEmoji}</span>
                    <span style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background: #22c55e; border: 2px solid #0f172a; box-shadow: 0 0 6px #22c55e;"></span>
                </div>
                <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span style="font-weight: 800; font-size: 14.5px; color: ${p.isSelf ? '#38bdf8' : '#f8fafc'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.username}</span>
                        ${badgesHtml}
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 3px; display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <span style="color: #38bdf8;">📍</span>
                        <span style="color: #cbd5e1;">${p.location || '🌳 Meydan'}</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                ${actionsHtml}
            </div>
        `;

        container.appendChild(card);
    });
}

// 5. OYUNCUYA ÖZEL FISILDAMA (WHISPER)
function whisperToPlayer(username) {
    if (!username) return;
    closeOnlinePlayersModal();

    // Chat paneli kapalıysa aç
    const chatPanel = document.getElementById('sideChatContainer');
    if (!chatPanel || chatPanel.style.display === 'none' || getComputedStyle(chatPanel).display === 'none') {
        if (typeof toggleChatPanel === 'function') {
            toggleChatPanel();
        }
    }

    // Chat küçültülmüşse büyüt
    const chatBody = document.getElementById('chatBody');
    if (chatBody && chatBody.style.display === 'none') {
        if (typeof toggleChatMinimize === 'function') {
            toggleChatMinimize();
        }
    }

    // Input kutusuna /w <username> yaz ve odakla
    const input = document.getElementById('sideChatInput');
    if (input) {
        input.value = `/w ${username} `;
        input.focus();
        if (typeof updateChatCharCounter === 'function') {
            updateChatCharCounter(input);
        }
    }
}

// 6. ARKADAŞ EKLEME
function addFriendFromOnlineList(username) {
    if (!username) return;
    if (window.socket && window.socket.connected) {
        window.socket.emit('sendFriendRequest', { targetUsername: username });
        if (window.playSound) window.playSound('uiClick');
    }
}

// 7. KARAKTERLE ETKİLEŞİME GEÇME
function interactWithOnlinePlayer(targetId, targetUsername) {
    closeOnlinePlayersModal();
    if (typeof players !== 'undefined' && players[targetId] && typeof openPlayerInteractionModal === 'function') {
        openPlayerInteractionModal(targetId, players[targetId]);
    }
}

// 8. SOKET DİNLEYİCİLERİ
if (window.socket) {
    // Sayı güncellemesi
    window.socket.on('onlineCountUpdate', (count) => {
        let total = (typeof count === 'number') ? count : 1;
        const navBadge = document.getElementById('onlinePlayersCountBadge');
        if (navBadge) navBadge.innerText = total;

        const modalBadge = document.getElementById('onlinePlayersModalCountBadge');
        if (modalBadge) modalBadge.innerText = `${total} Kişi Aktif`;
    });

    // Detaylı liste güncellemesi
    window.socket.on('onlinePlayersListUpdate', (data) => {
        if (!data) return;
        cachedOnlinePlayers = data.players || [];
        let total = data.total !== undefined ? data.total : cachedOnlinePlayers.length;

        const navBadge = document.getElementById('onlinePlayersCountBadge');
        if (navBadge) navBadge.innerText = total;

        const modalBadge = document.getElementById('onlinePlayersModalCountBadge');
        if (modalBadge) modalBadge.innerText = `${total} Kişi Aktif`;

        filterOnlinePlayersList();
    });
}

// Global Erişime Aç
window.openOnlinePlayersModal = openOnlinePlayersModal;
window.closeOnlinePlayersModal = closeOnlinePlayersModal;
window.refreshOnlinePlayers = refreshOnlinePlayers;
window.setOnlineRoomFilter = setOnlineRoomFilter;
window.filterOnlinePlayersList = filterOnlinePlayersList;
window.whisperToPlayer = whisperToPlayer;
window.addFriendFromOnlineList = addFriendFromOnlineList;
window.interactWithOnlinePlayer = interactWithOnlinePlayer;

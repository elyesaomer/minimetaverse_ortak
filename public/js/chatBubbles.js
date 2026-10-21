// public/js/chatBubbles.js - Konuşma Baloncukları, Hızlı Emoji ve Yan Panel Sohbeti

let activeChatBubbles = {};
let chatMessagesLog = [];
const MAX_CHAT_LOG = 60;
let activePlayerEmojis = {};
let isChatMinimized = false;
let unreadChatCount = 0;

// Kanal Yönetimi: 'all_view' (Tümü), 'room_only' (Oda), 'global_only' (Genel Evren)
let currentChatTab = 'all_view';
// Mesaj Gönderme Kanalı: 'room' veya 'all'
let activeSendChannel = 'room';

const CHAT_ROOM_NAMES = {
    'sokak': 'Meydan',
    'cadde': 'Cadde',
    'dedenin_yeri': 'Dede',
    'emlakci': 'Emlak',
    'kafe': 'Kafe',
    'sahil': 'Sahil',
    'nargile_cafe': 'Nargile',
    'market': 'Market',
    'ganyan': 'Ganyan',
    'vip_casino': 'Casino',
    'sanalika_cadde': '1. Cadde'
};

function getChatRoomLabel(roomKey) {
    if (!roomKey) return '';
    if (CHAT_ROOM_NAMES[roomKey]) return CHAT_ROOM_NAMES[roomKey];
    if (roomKey.startsWith('house_')) return 'Ev';
    return roomKey;
}

function appendChatMessageToHistory(itemOrName, msg, channel, room) {
    const historyDiv = document.getElementById('chatHistory');
    if (!historyDiv) return;

    let item;
    if (typeof itemOrName === 'object' && itemOrName !== null) {
        item = itemOrName;
    } else {
        item = {
            name: itemOrName,
            msg: msg,
            channel: channel || 'room',
            room: room || ''
        };
    }

    // Aktif sekme filtresi
    if (currentChatTab === 'room_only' && item.channel !== 'room') return;
    if (currentChatTab === 'global_only' && item.channel !== 'all') return;

    let line = document.createElement('div');
    line.className = 'chat-msg-row ' + (item.channel === 'all' ? 'chat-msg-all' : 'chat-msg-room');

    // Kanal Rozeti (🌍 GENEL / 🏠 ODA)
    let badge = document.createElement('span');
    badge.style.fontSize = '9.5px';
    badge.style.fontWeight = '800';
    badge.style.padding = '1px 5px';
    badge.style.borderRadius = '4px';
    badge.style.marginRight = '5px';
    badge.style.letterSpacing = '0.3px';
    badge.style.display = 'inline-block';

    if (item.channel === 'all') {
        badge.textContent = '🌍 GENEL';
        badge.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        badge.style.color = '#18181b';
    } else {
        badge.textContent = '🏠 ODA';
        badge.style.background = 'linear-gradient(135deg, #0d9488, #059669)';
        badge.style.color = '#ffffff';
    }
    line.appendChild(badge);

    // Genel sohbette gönderenin bulunduğu oda rozeti
    let roomLabel = getChatRoomLabel(item.room);
    if (item.channel === 'all' && roomLabel) {
        let roomBadge = document.createElement('span');
        roomBadge.style.fontSize = '9px';
        roomBadge.style.background = 'rgba(255, 255, 255, 0.15)';
        roomBadge.style.color = '#fde68a';
        roomBadge.style.padding = '1px 4px';
        roomBadge.style.borderRadius = '3px';
        roomBadge.style.marginRight = '5px';
        roomBadge.textContent = roomLabel;
        line.appendChild(roomBadge);
    }

    if (item.channel === 'whisper') {
        line.style.background = 'rgba(236, 72, 153, 0.16)';
        line.style.borderLeft = '3px solid #ec4899';
        line.style.padding = '3px 8px';
        line.style.borderRadius = '5px';
    }

    // Gönderici Adı
    let b = document.createElement('b');
    b.textContent = item.name + ': ';
    b.style.color = item.channel === 'whisper' ? '#f472b6' : (item.channel === 'all' ? '#fde047' : '#5eead4');
    line.appendChild(b);

    // Mesaj Metni
    let span = document.createElement('span');
    span.textContent = item.msg;
    span.style.color = '#ffffff';
    line.appendChild(span);

    historyDiv.appendChild(line);

    while (historyDiv.children.length > MAX_CHAT_LOG) {
        historyDiv.removeChild(historyDiv.firstChild);
    }
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

function renderChatHistory() {
    const historyDiv = document.getElementById('chatHistory');
    if (!historyDiv) return;
    historyDiv.innerHTML = "";
    chatMessagesLog.forEach(item => {
        appendChatMessageToHistory(item);
    });
}

function switchChatTab(tab) {
    currentChatTab = tab;
    document.querySelectorAll('.chat-tab-btn').forEach(btn => btn.classList.remove('active'));

    if (tab === 'all_view') {
        document.getElementById('chatTabAll')?.classList.add('active');
    } else if (tab === 'global_only') {
        document.getElementById('chatTabGlobal')?.classList.add('active');
        setActiveSendChannel('all');
        const dot = document.getElementById('tabBadgeGlobal');
        if (dot) dot.style.display = 'none';
    } else if (tab === 'room_only') {
        document.getElementById('chatTabRoom')?.classList.add('active');
        setActiveSendChannel('room');
        const dot = document.getElementById('tabBadgeRoom');
        if (dot) dot.style.display = 'none';
    }
    renderChatHistory();
}

function setActiveSendChannel(channel) {
    activeSendChannel = channel === 'all' ? 'all' : 'room';
    const btn = document.getElementById('chatChannelToggleBtn');
    const icon = document.getElementById('chatChannelIcon');
    const label = document.getElementById('chatChannelLabel');
    const input = document.getElementById('sideChatInput');

    if (activeSendChannel === 'all') {
        if (btn) {
            btn.style.borderColor = 'rgba(245, 158, 11, 0.5)';
            btn.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3))';
            btn.style.color = '#fde68a';
        }
        if (icon) icon.innerText = '🌍';
        if (label) label.innerText = 'Genel';
        if (input) {
            input.placeholder = '🌍 Genel evren sohbetine yaz (maks 50)...';
            input.style.borderColor = 'rgba(245, 158, 11, 0.45)';
        }
    } else {
        if (btn) {
            btn.style.borderColor = 'rgba(45, 212, 191, 0.4)';
            btn.style.background = 'linear-gradient(135deg, rgba(13, 148, 136, 0.3), rgba(16, 185, 129, 0.25))';
            btn.style.color = '#5eead4';
        }
        if (icon) icon.innerText = '🏠';
        if (label) label.innerText = 'Oda';
        if (input) {
            input.placeholder = '🏠 Oda sohbetine yaz (maks 50)...';
            input.style.borderColor = 'rgba(45, 212, 191, 0.35)';
        }
    }
}

function toggleActiveSendChannel() {
    setActiveSendChannel(activeSendChannel === 'all' ? 'room' : 'all');
}

function sendSideChat() {
    const input = document.getElementById('sideChatInput');
    if (!input) return;
    let rawMsg = input.value.trim();
    if (!rawMsg) return;

    // Hızlı Işınlanma Komutları: /cadde, /sanalika, /1cadde
    if (rawMsg.toLowerCase() === '/cadde' || rawMsg.toLowerCase() === '/sanalika' || rawMsg.toLowerCase() === '/1cadde') {
        input.value = "";
        updateChatCharCounter();
        if (typeof selectPlace === 'function') {
            selectPlace('sanalika_cadde');
        } else if (typeof changeRoom === 'function') {
            changeRoom('sanalika_cadde');
        }
        return;
    }

    if (!rawMsg) return;

    if (rawMsg.length > 50) {
        rawMsg = rawMsg.substring(0, 50);
    }
    if (window.socket) {
        const channelToSend = (typeof activeSendChannel !== 'undefined' && activeSendChannel) ? activeSendChannel : 'room';
        window.socket.emit('chatMessage', {
            msg: rawMsg,
            channel: channelToSend
        });
        input.value = "";
        updateChatCharCounter();
    }
}

function updateChatCharCounter(el) {
    const input = (el && el.value !== undefined) ? el : document.getElementById('sideChatInput');
    const counter = document.getElementById('chatCharCounter');
    if (input && counter) {
        const len = input.value ? input.value.length : 0;
        counter.textContent = `${len}/50`;
    }
}

function sendQuickEmoji(emoji) {
    if (!window.socket || !emoji) return;
    window.socket.emit('playerEmoji', emoji);
    if (typeof myId !== 'undefined' && myId) {
        activePlayerEmojis[myId] = { emoji: emoji, start: Date.now() };
    }
}

// Karakter Hareket Kontrolleri (WASD & Tıklayarak Yürüme) Ayarları
window.movementSettings = {
    wasdEnabled: (typeof localStorage !== 'undefined' ? localStorage.getItem('mm_move_wasd') : null) !== 'false', // Varsayılan: Açık
    clickEnabled: (typeof localStorage !== 'undefined' ? localStorage.getItem('mm_move_click') : null) !== 'false' // Varsayılan: Açık
};

function setWasdMovementEnabled(enabled) {
    window.movementSettings.wasdEnabled = !!enabled;
    if (typeof localStorage !== 'undefined') localStorage.setItem('mm_move_wasd', window.movementSettings.wasdEnabled ? 'true' : 'false');
    const chk = document.getElementById('settingWasdMovement');
    if (chk) chk.checked = window.movementSettings.wasdEnabled;
    if (!window.movementSettings.wasdEnabled && typeof keys !== 'undefined') {
        keys.w = false; keys.a = false; keys.s = false; keys.d = false;
    }
}

function setClickMovementEnabled(enabled) {
    window.movementSettings.clickEnabled = !!enabled;
    if (typeof localStorage !== 'undefined') localStorage.setItem('mm_move_click', window.movementSettings.clickEnabled ? 'true' : 'false');
    const chk = document.getElementById('settingClickMovement');
    if (chk) chk.checked = window.movementSettings.clickEnabled;
    if (!window.movementSettings.clickEnabled && typeof targetWalkPos !== 'undefined') {
        targetWalkPos = null;
    }
}
window.setWasdMovementEnabled = setWasdMovementEnabled;
window.setClickMovementEnabled = setClickMovementEnabled;

// Ayarlar Penceresi (SFX, Müzik, Sesli Sohbet, Hareket Ayarları)
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.style.display = 'flex';
    if (typeof getAudioSettings === 'function') {
        const audioSettings = getAudioSettings();
        const sfxSlider = document.getElementById('sfxVolumeSlider');
        const sfxVal = document.getElementById('sfxVolumeVal');
        const musSlider = document.getElementById('musicVolumeSlider');
        const musVal = document.getElementById('musicVolumeVal');
        if (sfxSlider) {
            sfxSlider.value = Math.round(audioSettings.sfx * 100);
            if (sfxVal) sfxVal.innerText = `${sfxSlider.value}%`;
        }
        if (musSlider) {
            musSlider.value = Math.round(audioSettings.music * 100);
            if (musVal) musVal.innerText = `${musSlider.value}%`;
        }
    }

    // Hareket Kontrol Ayarlarını Yükle
    const wasdChk = document.getElementById('settingWasdMovement');
    if (wasdChk) wasdChk.checked = window.movementSettings.wasdEnabled;
    const clickChk = document.getElementById('settingClickMovement');
    if (clickChk) clickChk.checked = window.movementSettings.clickEnabled;
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.style.display = 'none';
}

function handleSfxVolumeChange(val) {
    const label = document.getElementById('sfxVolumeVal');
    if (label) label.innerText = `${val}%`;
    if (typeof setSfxVolume === 'function') {
        setSfxVolume(val / 100);
    }
}

function handleMusicVolumeChange(val) {
    const label = document.getElementById('musicVolumeVal');
    if (label) label.innerText = `${val}%`;
    if (typeof setMusicVolume === 'function') {
        setMusicVolume(val / 100);
    }
}

function handleVoiceVolumeChange(val) {
    const label = document.getElementById('voiceVolumeVal');
    if (label) label.innerText = `${val}%`;
    if (window.voiceManager && typeof window.voiceManager.setVolume === 'function') {
        window.voiceManager.setVolume(val / 100);
    }
}

function updateChatUIBadges() {
    const floatBadge = document.getElementById('floatingChatBadge');
    const headerBadge = document.getElementById('chatHeaderBadge');

    if (unreadChatCount > 0) {
        if (floatBadge) {
            floatBadge.innerText = unreadChatCount;
            floatBadge.style.display = 'inline-block';
        }
        if (headerBadge) {
            headerBadge.innerText = unreadChatCount;
            headerBadge.style.display = 'inline-block';
        }
    } else {
        if (floatBadge) floatBadge.style.display = 'none';
        if (headerBadge) headerBadge.style.display = 'none';
    }
}

function toggleChatMinimize(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const panel = document.getElementById('sideChatContainer');
    const minBtn = document.getElementById('chatMinimizeBtn');
    if (!panel) return;

    isChatMinimized = !isChatMinimized;
    if (isChatMinimized) {
        panel.classList.add('chat-minimized');
        if (minBtn) {
            minBtn.innerText = '□';
            minBtn.title = 'Sohbeti Genişlet';
        }
    } else {
        panel.classList.remove('chat-minimized');
        unreadChatCount = 0;
        updateChatUIBadges();
        if (minBtn) {
            minBtn.innerText = '─';
            minBtn.title = 'Simge Durumuna Küçült';
        }
        const historyDiv = document.getElementById('chatHistory');
        if (historyDiv) historyDiv.scrollTop = historyDiv.scrollHeight;
    }
}

function toggleChatPanel(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const panel = document.getElementById('sideChatContainer');
    const floatBtn = document.getElementById('floatingChatToggleBtn');
    if (!panel) return;

    const isHidden = (panel.style.display === 'none' || getComputedStyle(panel).display === 'none');

    if (isHidden) {
        panel.style.display = 'flex';
        if (floatBtn) floatBtn.style.display = 'none';
        if (isChatMinimized) {
            panel.classList.add('chat-minimized');
        } else {
            panel.classList.remove('chat-minimized');
        }
        unreadChatCount = 0;
        updateChatUIBadges();
        updateAllChatButtons(true);
        const historyDiv = document.getElementById('chatHistory');
        if (historyDiv) historyDiv.scrollTop = historyDiv.scrollHeight;
    } else {
        panel.style.display = 'none';
        if (floatBtn) floatBtn.style.display = 'flex';
        updateAllChatButtons(false);
    }
}

function updateAllChatButtons(isOpen) {
    const btnIds = ['chatToggleBtn', 'tableChatToggleBtn', 'bjChatToggleBtn', 'rouletteChatToggleBtn', 'slotChatToggleBtn', 'ganyanChatToggleBtn'];
    btnIds.forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (id === 'chatToggleBtn') {
            btn.innerText = isOpen ? '💬 Chat Kapat' : '💬 Chat Aç';
        } else if (id === 'tableChatToggleBtn') {
            const txt = document.getElementById('tableChatText');
            if (txt) txt.innerText = isOpen ? 'Sohbet Kapat' : 'Sohbet';
        } else {
            const spanText = btn.querySelector('span:last-child');
            if (spanText) spanText.innerText = isOpen ? 'Sohbet Kapat' : 'Sohbet';
        }
    });
}

// Global olarak erişilebilir yap
window.toggleChatPanel = toggleChatPanel;
window.toggleChatMinimize = toggleChatMinimize;
window.sendSideChat = sendSideChat;
window.updateChatCharCounter = updateChatCharCounter;
window.sendQuickEmoji = sendQuickEmoji;
window.switchChatTab = switchChatTab;
window.setActiveSendChannel = setActiveSendChannel;
window.toggleActiveSendChannel = toggleActiveSendChannel;

// Socket Dinleyicileri
if (window.socket) {
    window.socket.on('chatUpdate', (data) => {
        if (!data || !data.msg || data.msg.trim() === "") return;
        if (window.playSound) window.playSound('chatPop');

        let channel = data.channel || 'room';
        let senderName = data.name || ((typeof players !== 'undefined' && players[data.id]) ? players[data.id].name : "Biri");
        let senderRoom = data.room || (typeof currentRoom !== 'undefined' ? currentRoom : '');

        let item = {
            id: data.id,
            name: senderName,
            room: senderRoom,
            msg: data.msg,
            channel: channel,
            time: Date.now()
        };

        chatMessagesLog.push(item);
        if (chatMessagesLog.length > MAX_CHAT_LOG) chatMessagesLog.shift();
        appendChatMessageToHistory(item);

        // Arka plan sekmesinde yeni mesaj rozeti
        if (channel === 'all' && currentChatTab === 'room_only') {
            const dot = document.getElementById('tabBadgeGlobal');
            if (dot) dot.style.display = 'inline-block';
        } else if (channel === 'room' && currentChatTab === 'global_only') {
            const dot = document.getElementById('tabBadgeRoom');
            if (dot) dot.style.display = 'inline-block';
        }

        const panel = document.getElementById('sideChatContainer');
        const isHidden = (!panel || panel.style.display === 'none' || (panel && getComputedStyle(panel).display === 'none'));
        if (isHidden || isChatMinimized) {
            unreadChatCount++;
            updateChatUIBadges();
        }

        // Konuşma Baloncuğu (Aynı odadaki oyuncular veya kendi mesajımız için)
        if (data.id) {
            if (!activeChatBubbles[data.id]) activeChatBubbles[data.id] = [];
            if (activeChatBubbles[data.id].length >= 4) {
                let oldBubble = activeChatBubbles[data.id].shift();
                clearTimeout(oldBubble.timer);
            }

            let bubbleText = (channel === 'all' ? '🌍 ' : '') + data.msg;
            let timer = setTimeout(() => {
                if (activeChatBubbles[data.id]) {
                    activeChatBubbles[data.id] = activeChatBubbles[data.id].filter(b => b.timer !== timer);
                }
            }, 5000);

            activeChatBubbles[data.id].push({
                text: bubbleText,
                name: senderName,
                channel: channel,
                timer: timer
            });
        }
    });
}

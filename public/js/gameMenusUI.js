// public/js/gameMenusUI.js - Liderlik Tablosu, Günlük Görevler ve Reconnect (Yeniden Bağlanma) Modülleri

(function () {
    const socket = window.socket || (typeof io !== 'undefined' ? io() : null);

    // --- 1. LİDERLİK TABLOSU ---
    function openLeaderboard() {
        if (socket) socket.emit('getLeaderboard');
        const modal = document.getElementById('leaderboardModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeLeaderboard() {
        const modal = document.getElementById('leaderboardModal');
        if (modal) modal.style.display = 'none';
    }

    if (socket) {
        socket.on('leaderboardData', (data) => {
            const bList = document.getElementById('billiardLeaderList');
            const batakList = document.getElementById('batakLeaderList');
            const tavlaList = document.getElementById('tavlaLeaderList');

            if (bList) {
                if (!data.billiard || data.billiard.length === 0) {
                    bList.innerHTML = "<div style='color:#94a3b8; font-style:italic;'>Henüz kayıt yok</div>";
                } else {
                    let medals = ["🥇", "🥈", "🥉", "4.", "5."];
                    bList.innerHTML = data.billiard.map((item, idx) =>
                        `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span>${medals[idx] || (idx + 1) + '.'} <b>${item.name}</b></span>
                            <span style="color:#facc15; font-weight:bold;">${item.wins} Galibiyet</span>
                        </div>`
                    ).join('');
                }
            }

            if (batakList) {
                if (!data.batak || data.batak.length === 0) {
                    batakList.innerHTML = "<div style='color:#94a3b8; font-style:italic;'>Henüz kayıt yok</div>";
                } else {
                    let medals = ["🥇", "🥈", "🥉", "4.", "5."];
                    batakList.innerHTML = data.batak.map((item, idx) =>
                        `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span>${medals[idx] || (idx + 1) + '.'} <b>${item.name}</b></span>
                            <span style="color:#34d399; font-weight:bold;">${item.score} Puan</span>
                        </div>`
                    ).join('');
                }
            }

            if (tavlaList) {
                if (!data.tavla || data.tavla.length === 0) {
                    tavlaList.innerHTML = "<div style='color:#94a3b8; font-style:italic;'>Henüz kayıt yok</div>";
                } else {
                    let medals = ["🥇", "🥈", "🥉", "4.", "5."];
                    tavlaList.innerHTML = data.tavla.map((item, idx) =>
                        `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span>${medals[idx] || (idx + 1) + '.'} <b>${item.name}</b></span>
                            <span style="color:#fb923c; font-weight:bold;">${item.wins} Galibiyet</span>
                        </div>`
                    ).join('');
                }
            }

            const okey101List = document.getElementById('okey101LeaderList');
            if (okey101List) {
                if (!data.okey101 || data.okey101.length === 0) {
                    okey101List.innerHTML = "<div style='color:#94a3b8; font-style:italic;'>Henüz kayıt yok</div>";
                } else {
                    let medals = ["🥇", "🥈", "🥉", "4.", "5."];
                    okey101List.innerHTML = data.okey101.map((item, idx) =>
                        `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span>${medals[idx] || (idx + 1) + '.'} <b>${item.name}</b></span>
                            <span style="color:#ec4899; font-weight:bold;">${item.wins} Galibiyet</span>
                        </div>`
                    ).join('');
                }
            }
        });
    }

    // --- 2. DEVAM EDEN OYUNA DÖNÜŞ (RECONNECT / F5 KORUMASI) ---
    let pendingReconnectTableId = null;

    if (socket) {
        socket.on('promptReconnect', (data) => {
            if (!data || !data.tableId) return;
            pendingReconnectTableId = data.tableId;
            let modal = document.getElementById('reconnectPromptModal');
            let tNameEl = document.getElementById('reconnectPromptTableName');
            if (tNameEl) tNameEl.innerText = data.tableName || "Masa";
            if (modal) modal.style.display = 'flex';
        });

        // 5.1 Reconnect teklifi (Menü üstü Reconnect)
        socket.on('reconnectOffer', (data) => {
            pendingReconnectTableId = data.tableId;
            const modal = document.getElementById('reconnectModal');
            const nameSpan = document.getElementById('reconnectTableName');
            if (nameSpan) nameSpan.innerText = data.tableName;
            if (modal) modal.style.display = 'flex';
        });
    }

    function confirmReconnect() {
        let modal = document.getElementById('reconnectPromptModal');
        if (modal) modal.style.display = 'none';
        if (pendingReconnectTableId && socket) {
            socket.emit('acceptReconnect', pendingReconnectTableId);
            pendingReconnectTableId = null;
        }
    }

    function dismissReconnect() {
        let modal = document.getElementById('reconnectPromptModal');
        if (modal) modal.style.display = 'none';
        if (pendingReconnectTableId && socket) {
            socket.emit('declineReconnect', pendingReconnectTableId);
            pendingReconnectTableId = null;
        }
    }

    function handleAcceptReconnect() {
        if (pendingReconnectTableId && socket) {
            socket.emit('acceptReconnect', pendingReconnectTableId);
            pendingReconnectTableId = null;
        }
        const modal = document.getElementById('reconnectModal');
        if (modal) modal.style.display = 'none';
    }

    function handleDeclineReconnect() {
        if (pendingReconnectTableId && socket) {
            socket.emit('declineReconnect', pendingReconnectTableId);
            pendingReconnectTableId = null;
        }
        const modal = document.getElementById('reconnectModal');
        if (modal) modal.style.display = 'none';
    }

    // --- 3. GÜNLÜK GÖREVLER (DAILY QUESTS) ---
    function openDailyQuestsModal() {
        if (socket) socket.emit('getDailyQuests');
        const modal = document.getElementById('dailyQuestsModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeDailyQuestsModal() {
        const modal = document.getElementById('dailyQuestsModal');
        if (modal) modal.style.display = 'none';
    }

    function claimDailyQuest(questId) {
        if (!questId) return;
        if (socket) socket.emit('claimDailyQuest', questId);
        if (window.playSound) window.playSound('coin');
    }

    if (socket) {
        socket.on('dailyQuestsData', (quests) => {
            const container = document.getElementById('dailyQuestsContainer');
            if (!container) return;

            if (!quests || quests.length === 0) {
                container.innerHTML = "<div style='color:#94a3b8; font-style:italic; padding:20px;'>Bugün için aktif görev bulunamadı.</div>";
                return;
            }

            container.innerHTML = quests.map(q => {
                let isCompleted = q.current >= q.target;
                let isClaimed = !!q.claimed;
                let progressPct = Math.min(100, Math.round((q.current / q.target) * 100));

                let actionBtn = '';
                if (isClaimed) {
                    actionBtn = `<span style="padding:6px 12px; background:rgba(255,255,255,0.08); color:#94a3b8; border-radius:8px; font-size:12px; font-weight:bold;">✅ Alındı</span>`;
                } else if (isCompleted) {
                    actionBtn = `<button onclick="claimDailyQuest('${q.id}')" style="padding:8px 16px; background:linear-gradient(135deg, #10b981, #059669); color:white; border:none; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer; box-shadow:0 0 10px rgba(16,185,129,0.5);">🎁 Ödülü Al (${q.reward} TL)</button>`;
                } else {
                    actionBtn = `<span style="padding:6px 12px; background:rgba(255,255,255,0.05); color:#64748b; border-radius:8px; font-size:12px; font-weight:bold;">${q.current} / ${q.target}</span>`;
                }

                return `
                    <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid ${isCompleted && !isClaimed ? '#10b981' : 'rgba(255,255,255,0.08)'}; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left;">
                        <div style="flex: 1;">
                            <div style="font-weight: 800; font-size: 14px; color: ${isCompleted ? '#34d399' : '#f8fafc'};">${q.title}</div>
                            <div style="font-size: 12px; color: #94a3b8; margin: 2px 0 6px 0;">${q.desc}</div>
                            <div style="background: rgba(0,0,0,0.4); border-radius: 10px; height: 6px; width: 100%; max-width: 220px; overflow: hidden;">
                                <div style="background: ${isCompleted ? '#10b981' : '#38bdf8'}; width: ${progressPct}%; height: 100%; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                            <div style="font-size: 13px; font-weight: 900; color: #facc15;">+${q.reward} TL</div>
                            ${actionBtn}
                        </div>
                    </div>
                `;
            }).join('');
        });
    }

    // --- 4. EL BOZMA OYLAMASI (BATAK & 101 OKEY) ---
    let voidHandCountdownInterval = null;

    function closeVoidHandModal() {
        if (voidHandCountdownInterval) {
            clearInterval(voidHandCountdownInterval);
            voidHandCountdownInterval = null;
        }
        const modal = document.getElementById('voidHandVoteModal');
        if (modal) modal.style.display = 'none';
    }

    function requestVoidHand() {
        if (!socket) return;
        let currentTable = window.currentActiveTableId || (window.currentJoinedTable ? window.currentJoinedTable.id : null);
        if (!currentTable) {
            let batakArea = document.getElementById('batakArea');
            let okey101Area = document.getElementById('okey101Area');
            if (batakArea && batakArea.style.display !== 'none') {
                currentTable = window.currentBatakTableId || 'batak_tekli';
            } else if (okey101Area && okey101Area.style.display !== 'none') {
                currentTable = window.currentOkey101TableId || 'okey101';
            }
        }
        socket.emit('requestVoidHand', { tableId: currentTable });
    }

    function respondVoidHandVote(accept) {
        if (!socket) return;
        let currentTable = window.currentActiveTableId || (window.currentJoinedTable ? window.currentJoinedTable.id : null);
        socket.emit('respondVoidHandVote', { accept: !!accept, tableId: currentTable });

        if (!accept) {
            closeVoidHandModal();
        } else {
            const btnGroup = document.getElementById('voidHandVoteButtons');
            const waitingNotice = document.getElementById('voidHandWaitingNotice');
            if (btnGroup) btnGroup.style.display = 'none';
            if (waitingNotice) {
                waitingNotice.style.display = 'block';
                waitingNotice.innerText = '✓ Oyunuz (Kabul) kaydedildi. Diğer oyuncuların onayı bekleniyor...';
            }
        }
    }

    if (socket) {
        // El bozma oylaması başladı
        socket.on('voidHandVoteStarted', (data) => {
            if (!data) return;
            const modal = document.getElementById('voidHandVoteModal');
            if (!modal) return;

            if (voidHandCountdownInterval) {
                clearInterval(voidHandCountdownInterval);
                voidHandCountdownInterval = null;
            }

            const nameEl = document.getElementById('voidHandInitiatorName');
            if (nameEl) nameEl.innerText = data.initiatorName || 'Bir oyuncu';

            const countEl = document.getElementById('voidHandVoteCount');
            if (countEl) countEl.innerText = `${data.yesCount || 1} / ${data.totalPlayers || 4}`;

            const btnGroup = document.getElementById('voidHandVoteButtons');
            const waitingNotice = document.getElementById('voidHandWaitingNotice');

            let myId = socket.id;
            let alreadyVoted = (myId === data.initiatorId) || (data.votes && data.votes[myId] === true);

            if (alreadyVoted) {
                if (btnGroup) btnGroup.style.display = 'none';
                if (waitingNotice) {
                    waitingNotice.style.display = 'block';
                    waitingNotice.innerText = (myId === data.initiatorId)
                        ? '✓ El bozma teklifiniz iletildi. Diğer oyuncuların onayı bekleniyor...'
                        : '✓ Oyunuz (Kabul) kaydedildi. Diğer oyuncuların onayı bekleniyor...';
                }
            } else {
                if (btnGroup) btnGroup.style.display = 'flex';
                if (waitingNotice) waitingNotice.style.display = 'none';
            }

            const timerText = document.getElementById('voidHandTimerText');
            const timerBar = document.getElementById('voidHandTimerBar');
            let durationMs = data.durationMs || 20000;
            let startedAt = data.startedAt || Date.now();

            function updateTimer() {
                let elapsed = Date.now() - startedAt;
                let remainingSec = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
                let pct = Math.max(0, Math.min(100, ((durationMs - elapsed) / durationMs) * 100));

                if (timerText) timerText.innerText = `⏱️ ${remainingSec}s`;
                if (timerBar) timerBar.style.width = `${pct}%`;

                if (remainingSec <= 0) {
                    if (voidHandCountdownInterval) {
                        clearInterval(voidHandCountdownInterval);
                        voidHandCountdownInterval = null;
                    }
                }
            }

            updateTimer();
            voidHandCountdownInterval = setInterval(updateTimer, 200);

            modal.style.display = 'flex';
            if (typeof window.playSound === 'function') {
                window.playSound('chip');
            }
        });

        // Oylama güncellendi (başka bir oyuncu oy verdi)
        socket.on('voidHandVoteUpdated', (data) => {
            if (!data) return;
            const countEl = document.getElementById('voidHandVoteCount');
            if (countEl) countEl.innerText = `${data.yesCount} / ${data.totalPlayers}`;

            let myId = socket.id;
            if (data.votes && data.votes[myId] === true) {
                const btnGroup = document.getElementById('voidHandVoteButtons');
                const waitingNotice = document.getElementById('voidHandWaitingNotice');
                if (btnGroup) btnGroup.style.display = 'none';
                if (waitingNotice) {
                    waitingNotice.style.display = 'block';
                    waitingNotice.innerText = '✓ Oyunuz (Kabul) kaydedildi. Diğer oyuncuların onayı bekleniyor...';
                }
            }
        });

        // Oylama iptal edildi
        socket.on('voidHandVoteCancelled', (data) => {
            closeVoidHandModal();
            let reason = data && data.reason ? data.reason : 'El bozma oylaması iptal edildi.';
            if (typeof showSocialNotificationToast === 'function') {
                showSocialNotificationToast('❌', 'El Bozma İptal', reason);
            } else {
                const errToast = document.getElementById('errorToast');
                if (errToast) {
                    errToast.innerText = reason;
                    errToast.style.display = 'block';
                    setTimeout(() => { errToast.style.display = 'none'; }, 4000);
                }
            }
        });

        // El başarıyla bozuldu ve yeniden dağıtıldı
        socket.on('voidHandSuccess', (data) => {
            closeVoidHandModal();
            let msg = (data && data.message) ? data.message : '🔄 El bozuldu! Kartlar/taşlar yeniden dağıtıldı (Yeniden para alınmadı).';

            if (typeof showSocialNotificationToast === 'function') {
                showSocialNotificationToast('🔄', 'El Bozuldu', msg);
            } else {
                const errToast = document.getElementById('errorToast');
                if (errToast) {
                    errToast.innerText = msg;
                    errToast.style.display = 'block';
                    setTimeout(() => { errToast.style.display = 'none'; }, 4500);
                }
            }

            if (data && data.gameType === 'batak') {
                if (typeof window.playCardSound === 'function') window.playCardSound();
            } else if (data && data.gameType === 'okey101') {
                if (typeof window.playTileSound === 'function') window.playTileSound();
                window.okey101RackSlots = null;
                if (typeof okey101SelectedIds !== 'undefined') okey101SelectedIds = [];
                if (typeof selectedForDiscard !== 'undefined') selectedForDiscard = [];

                const warnEl = document.getElementById('okey101DiscardWarning');
                if (warnEl) warnEl.style.display = 'none';
                const drawnEl = document.getElementById('okey101DrawnNotification');
                if (drawnEl) drawnEl.style.display = 'none';
            }
        });
    }

    // Global erişim için window'a bağlama
    window.openLeaderboard = openLeaderboard;
    window.closeLeaderboard = closeLeaderboard;
    window.confirmReconnect = confirmReconnect;
    window.dismissReconnect = dismissReconnect;
    window.handleAcceptReconnect = handleAcceptReconnect;
    window.handleDeclineReconnect = handleDeclineReconnect;
    window.openDailyQuestsModal = openDailyQuestsModal;
    window.closeDailyQuestsModal = closeDailyQuestsModal;
    window.claimDailyQuest = claimDailyQuest;
    window.requestVoidHand = requestVoidHand;
    window.respondVoidHandVote = respondVoidHandVote;
    window.closeVoidHandModal = closeVoidHandModal;
})();

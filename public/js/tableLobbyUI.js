// public/js/tableLobbyUI.js - Modüler Oyun Masası Seçimi, Lobi ve Koltuk Yönetimi UI
// (Batak, 101 Okey, Bilardo, Tavla vb. masaların listelenmesi, katılım ve izleme panelleri)

(function () {
    let currentSelectedBaseType = null;
    const socket = window.socket || (typeof io !== 'undefined' ? io() : null);

    if (socket) {
        socket.on('tableCreateError', (data) => {
            const msg = (typeof data === 'string') ? data : (data?.message || "Bu oyunda zaten açık bir masanız var!");
            const alertEl = document.getElementById('tableSelectErrorAlert');
            if (alertEl) {
                alertEl.innerText = `⚠️ ${msg}`;
                alertEl.style.display = 'block';
            }
            const modal = document.getElementById('tableSelectModal');
            if (modal) modal.style.display = 'flex';

            if (!window.currentActiveTableId) {
                const gModal = document.getElementById('gameModal');
                if (gModal) gModal.style.display = 'none';
            }

            if (typeof showSocialNotificationToast === 'function') {
                showSocialNotificationToast('🚫', 'Masa Açılamadı', msg);
            }
        });

        socket.on('tableOptionsModal', (data) => {
            currentSelectedBaseType = data.baseType;
            window.currentSelectedBaseType = currentSelectedBaseType;
            const modal = document.getElementById('tableSelectModal');
            const title = document.getElementById('tableSelectTitle');
            const list = document.getElementById('tableOptionsList');

            const alertEl = document.getElementById('tableSelectErrorAlert');
            if (alertEl) alertEl.style.display = 'none';

            const modeCont = document.getElementById('newTable101ModeContainer');
            const modeSelect = document.getElementById('newTable101ModeSelect');
            if (modeCont) {
                modeCont.style.display = 'none'; // Masanın türü sabit: Sol masa tekli, Sağ masa eşli
                if (modeSelect) {
                    modeSelect.value = (data.baseType === 'okey101_tekli') ? 'tekli' : 'esli';
                }
            }

            const dkModeCont = document.getElementById('newTableDostKazigiModeContainer');
            if (dkModeCont) {
                // Yalnızca Dost Kazığı için tek/çift deste seçeneğini göster, Batak standart 52 karttır
                let isDeckGame = (data.baseType === 'dost_kazigi' || data.baseType === 'dost_kazigi_3p');
                dkModeCont.style.display = isDeckGame ? 'flex' : 'none';
            }

            const chessTimeCont = document.getElementById('newTableChessTimeModeContainer');
            if (chessTimeCont) {
                chessTimeCont.style.display = (data.baseType === 'chess') ? 'flex' : 'none';
            }

            if (title) title.innerText = `${data.baseName} Masaları`;
            if (list) {
                list.innerHTML = "";
                data.tables.forEach(t => {
                    let itemHtml = `<div style="background: rgba(0,0,0,0.35); border: 1px solid #34495e; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">`;

                    let betBadge = (t.bet && t.bet > 0)
                        ? `<span style="display:inline-block; margin-left:6px; background:rgba(245,158,11,0.25); border:1px solid #f59e0b; color:#facc15; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;">💰 Bahis: ${t.bet} TL (Ödül: ${(t.pot > 0 ? t.pot : (t.bet * t.min))} TL)</span>`
                        : `<span style="display:inline-block; margin-left:6px; background:rgba(34,197,94,0.2); border:1px solid #22c55e; color:#4ade80; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;">🌱 Ücretsiz</span>`;

                    let modeBadge = "";
                    if (t.deckMode === 'cift_deste' || t.mode === 'cift_deste') {
                        modeBadge = `<span style="display:inline-block; margin-left:6px; background:rgba(234,179,8,0.25); border:1px solid #eab308; color:#facc15; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;">🎴 Çift Deste (104)</span>`;
                    } else if (t.deckMode === 'tek_deste' || t.mode === 'tek_deste') {
                        modeBadge = `<span style="display:inline-block; margin-left:6px; background:rgba(56,189,248,0.25); border:1px solid #38bdf8; color:#38bdf8; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;">🃏 Tek Deste (52)</span>`;
                    } else if (t.mode === 'esli') {
                        modeBadge = `<span style="display:inline-block; margin-left:6px; background:rgba(59,130,246,0.25); border:1px solid #3b82f6; color:#60a5fa; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;">👥 Eşli</span>`;
                    } else if (t.mode === 'tekli') {
                        modeBadge = `<span style="display:inline-block; margin-left:6px; background:rgba(100,116,139,0.25); border:1px solid #64748b; color:#cbd5e1; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;">👤 Tekli</span>`;
                    }

                    if (t.timeMode === 'untimed') {
                        modeBadge += `<span style="display:inline-block; margin-left:6px; background:rgba(168,85,247,0.25); border:1px solid #a855f7; color:#c084fc; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;">♾️ Süresiz</span>`;
                    } else if (t.timeMode === '10m' || t.baseType === 'chess') {
                        modeBadge += `<span style="display:inline-block; margin-left:6px; background:rgba(234,179,8,0.25); border:1px solid #eab308; color:#facc15; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;">⏱️ 10 Dk</span>`;
                    }

                    if (t.isActive) {
                        let vacantDesc = "";
                        if (t.hasVacantSeat && t.vacantSeats && t.vacantSeats.length > 0) {
                            vacantDesc = `<div style="font-size: 12px; color: #f87171; font-weight: bold; margin-top: 3px;">💺 Boş Koltuk: ${t.vacantSeats.map(v => v.name + ' ayrıldı').join(', ')}</div>`;
                        }

                        itemHtml += `<div style="flex: 1; min-width: 180px;">
                            <div style="font-weight: bold; color: ${t.hasVacantSeat ? '#f59e0b' : '#f39c12'}; font-size: 15px; display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                                <span>${t.hasVacantSeat ? '⚠️' : '🔴'} ${t.name} (Oyun Sürüyor${t.hasVacantSeat ? ' - Eksik Koltuk Var!' : ''})</span>
                                ${modeBadge}
                                ${betBadge}
                            </div>
                            <div style="font-size: 12px; color: #bdc3c7; margin-top: 3px;">
                                Oyuncular: ${t.players.join(', ')} | 👁️ Yancılar: ${t.spectatorCount}
                            </div>
                            ${vacantDesc}
                        </div>
                        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">`;

                        if (t.hasVacantSeat && t.vacantSeats) {
                            t.vacantSeats.forEach(v => {
                                itemHtml += `<button onclick="takeoverSeat('${t.id}', '${v.oldPid}')" style="padding: 8px 12px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; box-shadow: 0 2px 8px rgba(16,185,129,0.4);">💺 ${v.name} Yerine Otur</button>`;
                            });
                        }

                        if (t.hasBotSeat && t.botSeats) {
                            t.botSeats.forEach(b => {
                                itemHtml += `<button onclick="takeoverSeat('${t.id}', '${b.botPid}')" style="padding: 8px 12px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; box-shadow: 0 2px 8px rgba(139,92,246,0.4);">🤖 ${b.name} Yerine Otur</button>`;
                            });
                        }

                        itemHtml += `<button onclick="spectateTable('${t.id}')" style="padding: 8px 14px; background: #e67e22; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 13px;">👁️ İzle (Yancı Ol)</button>
                        </div>`;
                    } else {
                        let botBtnHtml = "";
                        if (t.count < t.min) {
                            botBtnHtml = `<button onclick="handleAddBotToTable('${t.id}')" style="padding: 8px 12px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; box-shadow: 0 2px 8px rgba(139,92,246,0.4);">🤖 Bot Ekle</button>`;
                        }

                        let botTakeoverBtnHtml = "";
                        if (t.hasBotSeat && t.botSeats) {
                            t.botSeats.forEach(b => {
                                botTakeoverBtnHtml += `<button onclick="takeoverSeat('${t.id}', '${b.botPid}')" style="padding: 8px 12px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; box-shadow: 0 2px 8px rgba(139,92,246,0.4);">🤖 ${b.name} Yerine Otur</button>`;
                            });
                        }

                        itemHtml += `<div>
                            <div style="font-weight: bold; color: #2ecc71; font-size: 15px; display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                                <span>🟢 ${t.name}</span>
                                ${modeBadge}
                                ${betBadge}
                            </div>
                            <div style="font-size: 12px; color: #bdc3c7; margin-top: 3px;">Oyuncular (${t.count}/${t.min}): ${t.players.length > 0 ? t.players.join(', ') : 'Henüz kimse yok'}</div>
                        </div>
                        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                            ${botBtnHtml}
                            ${botTakeoverBtnHtml}
                            <button onclick="joinSelectedTable('${t.id}')" style="padding: 8px 14px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 13px;">🟢 Masaya Otur</button>
                        </div>`;
                    }

                    itemHtml += `</div>`;
                    list.innerHTML += itemHtml;
                });
            }

            if (modal) modal.style.display = 'flex';
        });
    }

    function handleAddBotToTable(specificTableId) {
        let tId = specificTableId || window.currentActiveTableId;
        if (!tId && (currentSelectedBaseType || window.currentSelectedBaseType)) {
            tId = currentSelectedBaseType || window.currentSelectedBaseType;
        }
        let sock = socket || window.socket;
        if (tId && sock) {
            sock.emit('addBotToTable', tId);
        }
    }

    function joinSelectedTable(tableId) {
        window.currentActiveTableId = tableId;
        if (window.setVoiceTable) window.setVoiceTable(tableId);
        let sock = socket || window.socket;
        if (sock) sock.emit('joinTable', tableId);
        closeTableSelectModal();
        const modal = document.getElementById('gameModal');
        if (modal) {
            modal.style.display = 'block';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.left = '50%';
            modal.style.top = '50%';
        }
        const statusEl = document.getElementById('modalStatus');
        if (statusEl) statusEl.innerText = "Masaya oturuldu, diğer oyuncular bekleniyor...";
    }

    function spectateTable(tableId) {
        window.currentActiveTableId = tableId;
        let sock = socket || window.socket;
        if (sock) sock.emit('spectateTable', tableId);
        closeTableSelectModal();
    }

    function takeoverSeat(tableId, oldPid) {
        window.currentActiveTableId = tableId;
        let sock = socket || window.socket;
        if (sock) sock.emit('takeoverSeat', { tableId: tableId, oldPid: oldPid });
        closeTableSelectModal();
        const modal = document.getElementById('gameModal');
        if (modal) {
            modal.style.display = 'block';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.left = '50%';
            modal.style.top = '50%';
        }
        const statusEl = document.getElementById('modalStatus');
        if (statusEl) statusEl.innerText = "Koltuğa oturuluyor, oyun aktarılıyor...";
    }

    function handleCreateNewTable() {
        let bType = currentSelectedBaseType || window.currentSelectedBaseType;
        let sock = socket || window.socket;
        if (bType && sock) {
            const betSelect = document.getElementById('newTableBetSelect');
            const betVal = betSelect ? (parseInt(betSelect.value) || 0) : 0;
            const modeSelect = document.getElementById('newTable101ModeSelect');
            const dkModeSelect = document.getElementById('newTableDostKazigiModeSelect');
            const chessTimeSelect = document.getElementById('newTableChessTimeModeSelect');
            let is101 = (bType === 'okey101' || bType === 'okey101_tekli');
            let isDeckGame = (bType === 'dost_kazigi' || bType === 'dost_kazigi_3p');
            let isChess = (bType === 'chess');
            let dkModeVal = (isDeckGame && dkModeSelect) ? dkModeSelect.value : null;
            let chessTimeVal = (isChess && chessTimeSelect) ? chessTimeSelect.value : (isChess ? '10m' : null);
            let defaultMode = (bType === 'okey101_tekli') ? 'tekli' : (is101 ? 'esli' : (isDeckGame ? dkModeVal : null));
            const modeVal = isDeckGame ? dkModeVal : ((is101 && modeSelect) ? modeSelect.value : defaultMode);

            // Önceki hata uyarısını temizle
            const alertEl = document.getElementById('tableSelectErrorAlert');
            if (alertEl) alertEl.style.display = 'none';

            sock.emit('createNewTable', { 
                baseType: bType, 
                bet: betVal, 
                mode: modeVal, 
                deckMode: isDeckGame ? dkModeVal : null,
                timeMode: chessTimeVal
            });
            // NOT: gameModal'ı önceden hemen açmıyoruz. Sunucu isteği onaylayıp
            // updateTableLobby yayını yaptığında modal otomatik ve sorunsuz açılacaktır.
            // Spam engeline takılırsa modal kapalı kalacak ve masa seçim ekranında hata mesajı gösterilecektir.
        }
    }

    function closeTableSelectModal() {
        const modal = document.getElementById('tableSelectModal');
        if (modal) modal.style.display = 'none';
        const alertEl = document.getElementById('tableSelectErrorAlert');
        if (alertEl) alertEl.style.display = 'none';
    }

    // Global erişim için window'a bağlama
    window.handleAddBotToTable = handleAddBotToTable;
    window.joinSelectedTable = joinSelectedTable;
    window.spectateTable = spectateTable;
    window.takeoverSeat = takeoverSeat;
    window.handleCreateNewTable = handleCreateNewTable;
    window.closeTableSelectModal = closeTableSelectModal;
})();

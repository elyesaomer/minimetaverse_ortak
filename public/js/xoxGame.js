// public/js/xoxGame.js - Kafe XOX (Tic-Tac-Toe / Düello) Oyunu
// 1P vs Akıllı Yapay Zeka (Minimax) & 2P Karşılıklı Mod & Çevrimiçi Masalar (PVP & Bot)

(function () {
    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = false;
    let gameMode = 'ai'; // 'ai' veya 'pvp'
    let aiDifficulty = 'hard'; // 'easy', 'medium', 'hard'
    let scores = { X: 0, O: 0, ties: 0 };
    let winningCombo = null;
    let roundStartingPlayer = 'X'; // Her tur sıra değişimi (X -> O -> X)

    let serverXoxData = null;
    let hasPlayedWinSound = false;
    const socket = window.socket || (typeof io !== 'undefined' ? io() : null);

    // Socket Entegrasyonu
    if (socket) {
        socket.off('xoxUpdate');
        socket.off('xoxRematchStatus');
        socket.off('opponentLeft');
        socket.off('tableLeft');
        socket.off('tableClosed');

        socket.on('xoxUpdate', (data) => {
            if (!data) return;
            if (data.disconnectedPlayers && socket && data.disconnectedPlayers[socket.id]) return;
            if (data.players && socket && !data.players.includes(socket.id) && !data.isSpectator) return;
            serverXoxData = data;
            board = [...data.board];
            winningCombo = data.winningCombo;
            gameActive = !data.gameOver;

            const p1 = data.players[0];
            const p2 = data.players[1];
            scores.X = (data.scores && data.scores[p1] !== undefined) ? data.scores[p1] : 0;
            scores.O = (data.scores && data.scores[p2] !== undefined) ? data.scores[p2] : 0;
            scores.ties = (data.scores && data.scores.ties !== undefined) ? data.scores.ties : 0;

            const modal = document.getElementById('xoxModal');
            if (modal) modal.style.display = 'flex';

            if (data.gameOver && !hasPlayedWinSound) {
                hasPlayedWinSound = true;
                if (data.winner === 'tie') {
                    playXoxSound('tie');
                } else {
                    playXoxSound('win');
                    let winPid = data.players.find(p => data.playerSymbols[p] === data.winner);
                    if (winPid === socket.id && typeof window.triggerVictoryConfetti === 'function') {
                        window.triggerVictoryConfetti();
                    }
                }
            } else if (!data.gameOver) {
                hasPlayedWinSound = false;
            }

            updateXoxUI();
        });

        socket.on('xoxRematchStatus', (data) => {
            if (!data) return;
            const statusEl = document.getElementById('xoxStatusText');
            if (statusEl && serverXoxData?.gameOver) {
                let votesCount = Object.values(data.votes || {}).filter(v => v).length;
                statusEl.innerHTML = `<span style="color:#facc15;">🔄 ${data.playerName} rövanş istedi (${votesCount}/${data.totalPlayers})</span>`;
            }
        });

        socket.on('opponentLeft', (data) => {
            serverXoxData = null;
            gameActive = false;
            const modal = document.getElementById('xoxModal');
            if (modal) modal.style.display = 'none';
            if (typeof window.resetAllTableUIs === 'function') {
                window.resetAllTableUIs();
            }
            let msg = (data && data.message) ? data.message : "Rakip masadan ayrıldı";
            if (typeof showSocialNotificationToast === 'function') {
                showSocialNotificationToast('⚠️', 'Masa Kapatıldı', msg);
            } else if (typeof showFloatingToast === 'function') {
                showFloatingToast(`⚠️ ${msg}`);
            }
        });

        socket.on('tableLeft', () => {
            serverXoxData = null;
            gameActive = false;
            const modal = document.getElementById('xoxModal');
            if (modal) modal.style.display = 'none';
            if (typeof window.resetAllTableUIs === 'function') {
                window.resetAllTableUIs();
            }
        });

        socket.on('tableClosed', (data) => {
            let closedId = typeof data === 'object' ? data?.tableId : data;
            if (!closedId || (serverXoxData && serverXoxData.tableId === closedId)) {
                serverXoxData = null;
                gameActive = false;
                const modal = document.getElementById('xoxModal');
                if (modal) modal.style.display = 'none';
                if (typeof window.resetAllTableUIs === 'function') {
                    window.resetAllTableUIs();
                }
            }
        });
    }

    // Ses Efektleri
    function playXoxSound(type) {
        try {
            if (window.audioCtx) {
                const now = window.audioCtx.currentTime;
                const gainNode = window.audioCtx.createGain();
                gainNode.connect(window.audioCtx.destination);
                const sfxVol = (typeof window.getAudioSettings === 'function') ? window.getAudioSettings().sfx : 0.8;
                gainNode.gain.setValueAtTime(sfxVol * 0.4, now);

                if (type === 'pop') {
                    const osc = window.audioCtx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(520, now);
                    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                    osc.connect(gainNode);
                    osc.start(now);
                    osc.stop(now + 0.09);
                } else if (type === 'ai_pop') {
                    const osc = window.audioCtx.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(740, now);
                    osc.frequency.exponentialRampToValueAtTime(420, now + 0.09);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    osc.connect(gainNode);
                    osc.start(now);
                    osc.stop(now + 0.1);
                } else if (type === 'tie') {
                    const osc = window.audioCtx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.setValueAtTime(330, now + 0.12);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                    osc.connect(gainNode);
                    osc.start(now);
                    osc.stop(now + 0.28);
                }
            }
        } catch (_) {}

        if (type === 'win' && typeof window.playSound === 'function') {
            window.playSound('win');
        }
    }

    // Modal Açma / Kapatma
    function openXoxModal() {
        const modal = document.getElementById('xoxModal');
        if (!modal) return;
        modal.style.display = 'flex';
        if (!serverXoxData) {
            resetXoxRound();
        }
        updateXoxUI();
    }
    window.openXoxModal = openXoxModal;

    function closeXoxModal() {
        if (socket) {
            let activeId = serverXoxData?.tableId || window.currentActiveTableId;
            if (activeId) {
                socket.emit('closeTable', { tableId: activeId });
            }
            socket.emit('leaveTable');
        }
        serverXoxData = null;
        gameActive = false;
        const modal = document.getElementById('xoxModal');
        if (modal) modal.style.display = 'none';
        if (typeof window.resetAllTableUIs === 'function') {
            window.resetAllTableUIs();
        }
    }
    window.closeXoxModal = closeXoxModal;

    // Mod ve Zorluk Değiştirme
    function setXoxMode(mode) {
        if (serverXoxData) return;
        gameMode = mode;
        scores = { X: 0, O: 0, ties: 0 };
        document.querySelectorAll('.xox-mode-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === mode);
        });
        const diffCont = document.getElementById('xoxDifficultyContainer');
        if (diffCont) {
            diffCont.style.display = (mode === 'ai') ? 'flex' : 'none';
        }
        resetXoxRound();
    }
    window.setXoxMode = setXoxMode;

    function setXoxDifficulty(diff) {
        if (serverXoxData) return;
        aiDifficulty = diff;
        document.querySelectorAll('.xox-diff-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.diff === diff);
        });
        resetXoxRound();
    }
    window.setXoxDifficulty = setXoxDifficulty;

    // Tur Sıfırlama
    function resetXoxRound(manualReset = false) {
        if (serverXoxData) {
            if (socket) socket.emit('xoxVoteRematch');
            return;
        }
        board = ['', '', '', '', '', '', '', '', ''];
        if (!manualReset) {
            roundStartingPlayer = (roundStartingPlayer === 'X') ? 'O' : 'X';
        }
        currentPlayer = roundStartingPlayer;
        gameActive = true;
        winningCombo = null;
        updateXoxUI();

        // Eğer sıra Yapay Zeka (O) ile başladıysa ilk hamleyi yap
        if (gameActive && gameMode === 'ai' && currentPlayer === 'O') {
            setTimeout(() => {
                if (!gameActive || currentPlayer !== 'O') return;
                const aiMove = getAiMove();
                if (aiMove !== -1) {
                    makeMove(aiMove, 'O');
                    updateXoxUI();
                }
            }, 380);
        }
    }
    window.resetXoxRound = resetXoxRound;

    function resetXoxScores() {
        if (serverXoxData) {
            resetXoxRound();
            return;
        }
        scores = { X: 0, O: 0, ties: 0 };
        roundStartingPlayer = 'X';
        resetXoxRound(true);
    }
    window.resetXoxScores = resetXoxScores;

    // Hücreye Tıklama
    function handleXoxCellClick(index) {
        if (serverXoxData) {
            if (serverXoxData.gameOver || serverXoxData.isSpectator) return;
            if (serverXoxData.board[index] !== '') return;
            let currentTurnPid = serverXoxData.players[serverXoxData.turnIndex];
            if (socket && currentTurnPid !== socket.id) return;
            playXoxSound('pop');
            if (socket) socket.emit('xoxMove', index);
            return;
        }

        if (!gameActive || board[index] !== '') return;
        if (gameMode === 'ai' && currentPlayer !== 'X') return; // AI düşünürken tıklanamaz

        makeMove(index, currentPlayer);

        if (gameActive && gameMode === 'ai' && currentPlayer === 'O') {
            updateXoxUI();
            // Yapay Zeka Hamlesi (Gerçekçi 300ms düşünme hissi)
            setTimeout(() => {
                if (!gameActive) return;
                const aiMove = getAiMove();
                if (aiMove !== -1) {
                    makeMove(aiMove, 'O');
                }
            }, 320);
        }
    }
    window.handleXoxCellClick = handleXoxCellClick;

    function makeMove(index, player) {
        board[index] = player;
        playXoxSound(player === 'X' ? 'pop' : 'ai_pop');

        const winResult = checkWin(board);
        if (winResult) {
            gameActive = false;
            winningCombo = winResult.combo;
            scores[player]++;
            playXoxSound('win');
            if (typeof window.triggerVictoryConfetti === 'function') {
                window.triggerVictoryConfetti();
            }
        } else if (board.every(cell => cell !== '')) {
            gameActive = false;
            scores.ties++;
            playXoxSound('tie');
        } else {
            currentPlayer = (player === 'X') ? 'O' : 'X';
        }

        updateXoxUI();
    }

    // Galibiyet Kontrolü
    const WINNING_COMBOS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Yataylar
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Dikeyler
        [0, 4, 8], [2, 4, 6]             // Çaprazlar
    ];

    function checkWin(b) {
        for (let combo of WINNING_COMBOS) {
            const [c1, c2, c3] = combo;
            if (b[c1] && b[c1] === b[c2] && b[c1] === b[c3]) {
                return { winner: b[c1], combo: combo };
            }
        }
        return null;
    }

    // Yapay Zeka Mantığı (Easy / Medium / Unbeatable Minimax)
    function getAiMove() {
        const available = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
        if (available.length === 0) return -1;

        if (aiDifficulty === 'easy') {
            // %70 rastgele, %30 varsa kazanma hamlesi
            if (Math.random() > 0.3) {
                return available[Math.floor(Math.random() * available.length)];
            }
        } else if (aiDifficulty === 'medium') {
            // Varsa kazanma hamlesini yap
            for (let idx of available) {
                let temp = [...board];
                temp[idx] = 'O';
                if (checkWin(temp)) return idx;
            }
            // Varsa rakibin kazanmasını engelle
            for (let idx of available) {
                let temp = [...board];
                temp[idx] = 'X';
                if (checkWin(temp)) return idx;
            }
            // Aksi halde %40 rastgele, %60 merkez/köşe
            if (Math.random() < 0.4) {
                return available[Math.floor(Math.random() * available.length)];
            }
        }

        // 'hard' veya medium fallback: Minimax Algoritması (Yenilmez Matematiksel Çözüm)
        let bestScore = -Infinity;
        let bestMove = available[0];

        // Hızlandırma: İlk hamlede merkez boşsa doğrudan merkezi al
        if (board[4] === '' && available.length >= 7) return 4;

        for (let idx of available) {
            board[idx] = 'O';
            let score = minimax(board, 0, false, -Infinity, Infinity);
            board[idx] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = idx;
            }
        }
        return bestMove;
    }

    function minimax(b, depth, isMaximizing, alpha, beta) {
        const win = checkWin(b);
        if (win) {
            return (win.winner === 'O') ? (10 - depth) : (depth - 10);
        }
        if (b.every(c => c !== '')) return 0; // Beraberlik

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (b[i] === '') {
                    b[i] = 'O';
                    let evaluation = minimax(b, depth + 1, false, alpha, beta);
                    b[i] = '';
                    maxEval = Math.max(maxEval, evaluation);
                    alpha = Math.max(alpha, evaluation);
                    if (beta <= alpha) break;
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < 9; i++) {
                if (b[i] === '') {
                    b[i] = 'X';
                    let evaluation = minimax(b, depth + 1, true, alpha, beta);
                    b[i] = '';
                    minEval = Math.min(minEval, evaluation);
                    beta = Math.min(beta, evaluation);
                    if (beta <= alpha) break;
                }
            }
            return minEval;
        }
    }

    // Arayüzü Güncelleme
    function updateXoxUI() {
        // Mod ve Zorluk butonlarının görünürlüğü
        const modeBtnContainer = document.querySelector('.xox-mode-btn')?.parentElement;
        if (modeBtnContainer) {
            modeBtnContainer.style.display = serverXoxData ? 'none' : 'flex';
        }
        const diffCont = document.getElementById('xoxDifficultyContainer');
        if (diffCont) {
            diffCont.style.display = (serverXoxData || gameMode !== 'ai') ? 'none' : 'flex';
        }

        // Skorlar
        const scoreXEl = document.getElementById('xoxScoreX');
        const scoreOEl = document.getElementById('xoxScoreO');
        const scoreTiesEl = document.getElementById('xoxScoreTies');
        if (scoreXEl) scoreXEl.innerText = scores.X;
        if (scoreOEl) scoreOEl.innerText = scores.O;
        if (scoreTiesEl) scoreTiesEl.innerText = scores.ties;

        // İsimler & Rozetler
        const playerXlabel = scoreXEl?.parentElement?.querySelector('div:first-child');
        const playerOlabel = document.getElementById('xoxPlayerOName');

        if (serverXoxData) {
            const p1 = serverXoxData.players[0];
            const p2 = serverXoxData.players[1];
            const p1Name = serverXoxData.playerProfiles[p1]?.name || '1. Oyuncu';
            const p2Name = serverXoxData.playerProfiles[p2]?.name || '2. Oyuncu';
            const p1IsMe = (socket && p1 === socket.id);
            const p2IsMe = (socket && p2 === socket.id);

            if (playerXlabel) playerXlabel.innerText = `${p1IsMe ? '👤 Sen' : '👤 ' + p1Name} (X)`;
            if (playerOlabel) playerOlabel.innerText = `${p2IsMe ? '👤 Sen' : (serverXoxData.playerProfiles[p2]?.isBot ? '🤖 ' : '👤 ') + p2Name} (O)`;
        } else {
            if (playerXlabel) playerXlabel.innerText = '👤 Sen (X)';
            if (playerOlabel) playerOlabel.innerText = (gameMode === 'ai') ? '🤖 Yapay Zeka' : '👤 2. Oyuncu';
        }

        // Multiplayer Masa & Bahis & Pot Banner'ı
        let bannerEl = document.getElementById('xoxMultiplayerBanner');
        if (serverXoxData) {
            if (!bannerEl) {
                bannerEl = document.createElement('div');
                bannerEl.id = 'xoxMultiplayerBanner';
                bannerEl.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.85); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:6px 12px; margin-bottom:12px; font-size:12px; font-weight:800;';
                const statusEl = document.getElementById('xoxStatusText');
                if (statusEl && statusEl.parentElement) {
                    statusEl.parentElement.insertBefore(bannerEl, statusEl);
                }
            }
            let betText = serverXoxData.bet > 0 ? `💰 Bahis: ${serverXoxData.bet} TL` : `🌱 Ücretsiz`;
            let potText = serverXoxData.pot > 0 ? `🏆 Dev Pot: ${serverXoxData.pot} TL` : `🏆 Pot: 0 TL`;
            bannerEl.innerHTML = `
                <span style="color:#facc15;">${betText}</span>
                <span style="color:#4ade80;">${potText}</span>
                <span style="color:#38bdf8;">🎲 ${serverXoxData.tableId}</span>
            `;
            bannerEl.style.display = 'flex';
        } else if (bannerEl) {
            bannerEl.style.display = 'none';
        }

        // Durum Başlığı
        const statusEl = document.getElementById('xoxStatusText');
        if (statusEl) {
            if (serverXoxData) {
                if (serverXoxData.isSpectator) {
                    let curName = serverXoxData.playerProfiles[serverXoxData.players[serverXoxData.turnIndex]]?.name || 'Oyuncu';
                    statusEl.innerHTML = `<span style="color:#facc15;">👁️ İzleyici Modu (Sıra: ${curName})</span>`;
                } else if (serverXoxData.gameOver) {
                    if (serverXoxData.winner === 'tie') {
                        statusEl.innerHTML = `<span style="color:#cbd5e1;">🤝 DOSTLUK KAZANDI (BERABERLİK)!</span>`;
                    } else {
                        let winPid = serverXoxData.players.find(p => serverXoxData.playerSymbols[p] === serverXoxData.winner);
                        let isMe = (socket && winPid === socket.id);
                        let winName = serverXoxData.playerProfiles[winPid]?.name || serverXoxData.winner;
                        statusEl.innerHTML = isMe
                            ? `<span style="color:#22c55e;">🎉 TEBRİKLER! DÜELLOYU KAZANDIN!</span>`
                            : `<span style="color:#ef4444;">💀 ${winName} KAZANDI!</span>`;
                    }
                } else {
                    let currentTurnPid = serverXoxData.players[serverXoxData.turnIndex];
                    let isMyTurn = (socket && currentTurnPid === socket.id);
                    let mySym = serverXoxData.playerSymbols[socket.id] || 'X';
                    let turnName = serverXoxData.playerProfiles[currentTurnPid]?.name || 'Rakip';
                    statusEl.innerHTML = isMyTurn
                        ? `<span style="color:#38bdf8;">🟢 SENİN SIRAN (${mySym})</span>`
                        : `<span style="color:#f43f5e;">⏳ ${turnName} Bekleniyor...</span>`;
                }
            } else {
                if (!gameActive) {
                    if (winningCombo) {
                        const winner = board[winningCombo[0]];
                        if (gameMode === 'ai') {
                            statusEl.innerHTML = (winner === 'X')
                                ? `<span style="color:#22c55e;">🎉 TEBRİKLER! KAZANDIN!</span>`
                                : `<span style="color:#ef4444;">💀 YAPAY ZEKA KAZANDI!</span>`;
                        } else {
                            statusEl.innerHTML = `<span style="color:#facc15;">🏆 ${winner} KAZANDI!</span>`;
                        }
                    } else {
                        statusEl.innerHTML = `<span style="color:#cbd5e1;">🤝 DOSTLUK KAZANDI (BERABERLİK)!</span>`;
                    }
                } else {
                    if (gameMode === 'ai') {
                        statusEl.innerHTML = (currentPlayer === 'X')
                            ? `<span style="color:#38bdf8;">🟢 Senin Sıran (X)</span>`
                            : `<span style="color:#f43f5e;">🤖 Yapay Zeka Düşünüyor...</span>`;
                    } else {
                        statusEl.innerHTML = (currentPlayer === 'X')
                            ? `<span style="color:#38bdf8;">🟢 1. Oyuncu (X) Sırası</span>`
                            : `<span style="color:#f43f5e;">🔴 2. Oyuncu (O) Sırası</span>`;
                    }
                }
            }
        }

        // 3x3 Izgarayı Çiz
        const boardEl = document.getElementById('xoxBoardGrid');
        if (!boardEl) return;
        boardEl.innerHTML = '';

        board.forEach((val, idx) => {
            const cell = document.createElement('div');
            cell.className = 'xox-cell';
            if (val !== '') {
                cell.classList.add(val.toLowerCase());
                cell.innerHTML = `<span>${val}</span>`;
            }
            if (winningCombo && winningCombo.includes(idx)) {
                cell.classList.add('winning-cell');
            }
            cell.onclick = () => handleXoxCellClick(idx);
            boardEl.appendChild(cell);
        });
    }

    // İlk başlatma
    window.addEventListener('DOMContentLoaded', () => {
        // Sürükleme mantığı (modal taşınabilir olsun)
        const header = document.getElementById('xoxModalHeader');
        const modal = document.getElementById('xoxModalContent');
        if (header && modal) {
            let isDragging = false, startX, startY, initialX, initialY;
            header.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = modal.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
                modal.style.position = 'fixed';
                modal.style.margin = '0';
                modal.style.left = initialX + 'px';
                modal.style.top = initialY + 'px';
            });
            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                modal.style.left = (initialX + (e.clientX - startX)) + 'px';
                modal.style.top = (initialY + (e.clientY - startY)) + 'px';
            });
            window.addEventListener('mouseup', () => { isDragging = false; });
        }
    });
})();

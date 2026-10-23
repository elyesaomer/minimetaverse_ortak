// public/js/chessGameUI.js - Satranç (Chess) İstemci Arayüzü & Tahta Motoru
// Resmi FIDE Kuralları Desteği: Rok, Piyon Terfisi Modal Seçimi, Geçerken Alma, Şah/Mat Görselleri
// Çift Dijital Satranç Saati (LCD Ekran), Otomatik Döndürme (Siyah aşağıda / Beyaz aşağıda), Ses Efektleri

(function () {
    const socket = window.socket || (typeof io !== 'undefined' ? io() : null);

    let serverChessData = null;
    let selectedSquare = null;
    let legalMovesForSelected = [];
    let pendingPromotionMove = null;
    let isBoardFlipped = false;
    let userManuallyToggledFlip = false;
    let clientClockTimer = null;
    let lastRenderedFen = null;

    // --- SES MOTORU (Web Audio API İle Kusursuz Akustik Sesler) ---
    function playChessSound(type) {
        try {
            if (!window.audioCtx) {
                window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = window.audioCtx;
            if (ctx.state === 'suspended') ctx.resume();

            const now = ctx.currentTime;
            const sfxVol = (typeof window.getAudioSettings === 'function') ? window.getAudioSettings().sfx : 0.8;
            const masterGain = ctx.createGain();
            masterGain.connect(ctx.destination);
            masterGain.gain.setValueAtTime(sfxVol * 0.5, now);

            if (type === 'move') {
                // Tok Ahşap Masaya Taş Koyma Sesi
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(240, now);
                osc.frequency.exponentialRampToValueAtTime(70, now + 0.07);
                gain.gain.setValueAtTime(0.7, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'capture') {
                // Sert Ahşap Çarpışma / Taş Yeme Sesi
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(380, now);
                osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
                gain.gain.setValueAtTime(0.9, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(now);
                osc.stop(now + 0.13);
            } else if (type === 'check') {
                // Şah Çekme Uyarı Akoru
                [523.25, 659.25, 783.99].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.04);
                    gain.gain.setValueAtTime(0.3, now + idx * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);
                    osc.connect(gain);
                    gain.connect(masterGain);
                    osc.start(now + idx * 0.04);
                    osc.stop(now + idx * 0.04 + 0.25);
                });
            } else if (type === 'gameover' && typeof window.playSound === 'function') {
                window.playSound('win');
            }
        } catch (_) {}
    }

    // --- MODERN YÜKSEK KALİTELİ VEKTÖREL SATRANÇ TAŞLARI (SVG) ---
    function getPieceSVG(type, color) {
        const isWhite = color === 'w';
        const fill = isWhite ? '#ffffff' : '#18181b';
        const stroke = isWhite ? '#18181b' : '#09090b';
        const strokeW = 1.6;

        if (type === 'p') {
            // Modern Piyon
            return `<svg viewBox="0 0 45 45" class="chess-piece-svg">
                <path d="M 11,38.5 C 11,36 13.5,34.5 16.5,34.5 L 28.5,34.5 C 31.5,34.5 34,36 34,38.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 13.5,34.5 L 31.5,34.5 C 31,32 29,31 27,30 L 18,30 C 16,31 14,32 13.5,34.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 18,30 C 18,24 20,21 20,18.5 L 25,18.5 C 25,21 27,24 27,30 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 17,18.5 C 17,17.2 28,17.2 28,18.5 C 28,19.8 17,19.8 17,18.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>
                <circle cx="22.5" cy="12" r="5.5" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>
                ${isWhite 
                  ? `<path d="M 19,10 A 3.5,3.5 0 0,1 24,8.5" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 15,36.8 L 30,36.8" stroke="#cbd5e1" stroke-width="1" stroke-linecap="round"/>`
                  : `<path d="M 19,10 A 3.5,3.5 0 0,1 24,8.5" stroke="#e2e8f0" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 15,36.8 L 30,36.8" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>`
                }
            </svg>`;
        } else if (type === 'r') {
            // Modern Kale (Castle)
            return `<svg viewBox="0 0 45 45" class="chess-piece-svg">
                <path d="M 9.5,38.5 C 9.5,36.5 12,35 15.5,35 L 29.5,35 C 33,35 35.5,36.5 35.5,38.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 13,35 L 32,35 L 30.5,31 L 14.5,31 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 14.5,31 L 16,18 L 29,18 L 30.5,31 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 12.5,18 L 32.5,18 L 33.5,14 L 11.5,14 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 11.5,14 L 11.5,8.5 L 16.5,8.5 L 16.5,11.5 L 20,11.5 L 20,8.5 L 25,8.5 L 25,11.5 L 28.5,11.5 L 28.5,8.5 L 33.5,8.5 L 33.5,14 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                ${isWhite
                  ? `<path d="M 22.5,21.5 L 22.5,26.5" stroke="#64748b" stroke-width="1.6" stroke-linecap="round"/>
                     <path d="M 14,37 L 31,37" stroke="#cbd5e1" stroke-width="1" stroke-linecap="round"/>`
                  : `<path d="M 22.5,21.5 L 22.5,26.5" stroke="#e2e8f0" stroke-width="1.6" stroke-linecap="round"/>
                     <path d="M 14,37 L 31,37" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>`
                }
            </svg>`;
        } else if (type === 'n') {
            // Modern At (Knight)
            return `<svg viewBox="0 0 45 45" class="chess-piece-svg">
                <path d="M 10,38.5 C 10,36.5 12.5,35 16,35 L 29,35 C 32.5,35 35,36.5 35,38.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 13.5,35 C 12.5,30 11.5,25.5 9,24 C 7.5,23 8,21 10,21 C 12,21 13.5,22.5 14.5,22.5 C 13,19 13,15.5 15,12.5 C 16.5,10 19,8 20.5,7 C 21.2,6.5 22,7 21.5,8 C 21,9.5 21.5,10.5 23,10.5 C 24.5,10.5 26,9 27,7.5 C 27.5,6.8 28.5,7.2 28,8.2 C 27.5,10 29,11 30.5,10 C 31.8,9.2 32.8,8.2 33.2,9.2 C 33.8,10.2 32.5,12.5 33.5,14.5 C 35,17.5 36,23.5 35.5,29.5 C 35,32.5 33,34.5 30,35 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                ${isWhite
                  ? `<circle cx="16" cy="15.5" r="1.5" fill="#0f172a"/>
                     <path d="M 10.5,23.5 C 12,24.5 13.5,24 14,23" stroke="#64748b" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 23,17 C 24.5,19 25,23 23,28" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 14,37 L 31,37" stroke="#cbd5e1" stroke-width="1" stroke-linecap="round"/>`
                  : `<circle cx="16" cy="15.5" r="1.5" fill="#f8fafc"/>
                     <path d="M 10.5,23.5 C 12,24.5 13.5,24 14,23" stroke="#e2e8f0" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 23,17 C 24.5,19 25,23 23,28" stroke="#cbd5e1" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 14,37 L 31,37" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>`
                }
            </svg>`;
        } else if (type === 'b') {
            // Modern Fil (Bishop)
            return `<svg viewBox="0 0 45 45" class="chess-piece-svg">
                <path d="M 11,38.5 C 11,36.5 13.5,35 16.5,35 L 28.5,35 C 31.5,35 34,36.5 34,38.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 14,35 L 31,35 L 29.5,31 L 15.5,31 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 15.5,31 C 13,26 13,19 16.5,14.5 C 18,12.5 20.2,10.5 22.5,10 C 24.8,10.5 27,12.5 28.5,14.5 C 32,19 32,26 29.5,31 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <circle cx="22.5" cy="8" r="2.2" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>
                ${isWhite
                  ? `<path d="M 19,16 L 26,23" stroke="#0f172a" stroke-width="1.6" stroke-linecap="round"/>
                     <path d="M 17,28 C 20,29.5 25,29.5 28,28" stroke="#64748b" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 15,37 L 30,37" stroke="#cbd5e1" stroke-width="1" stroke-linecap="round"/>`
                  : `<path d="M 19,16 L 26,23" stroke="#f8fafc" stroke-width="1.6" stroke-linecap="round"/>
                     <path d="M 17,28 C 20,29.5 25,29.5 28,28" stroke="#e2e8f0" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 15,37 L 30,37" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>`
                }
            </svg>`;
        } else if (type === 'q') {
            // Modern Vezir (Queen)
            return `<svg viewBox="0 0 45 45" class="chess-piece-svg">
                <path d="M 9.5,38.5 C 9.5,36.5 12.5,35 16,35 L 29,35 C 32.5,35 35.5,36.5 35.5,38.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 13,35 L 32,35 L 30.5,31 L 14.5,31 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 14.5,31 C 14,25.5 16,21.5 18,19 L 27,19 C 29,21.5 31,25.5 30.5,31 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 11.5,19.5 L 8.5,13.5 L 14,17 L 15.5,11 L 19,16 L 22.5,9.5 L 26,16 L 29.5,11 L 31,17 L 36.5,13.5 L 33.5,19.5 C 30.5,21.5 27.5,22.5 22.5,22.5 C 17.5,22.5 14.5,21.5 11.5,19.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <circle cx="8.5" cy="12.5" r="1.8" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                <circle cx="15.5" cy="10" r="1.8" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                <circle cx="22.5" cy="8.5" r="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                <circle cx="29.5" cy="10" r="1.8" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                <circle cx="36.5" cy="12.5" r="1.8" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                ${isWhite
                  ? `<path d="M 15,26.5 C 18,28 27,28 30,26.5" stroke="#64748b" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 14,37 L 31,37" stroke="#cbd5e1" stroke-width="1" stroke-linecap="round"/>`
                  : `<path d="M 15,26.5 C 18,28 27,28 30,26.5" stroke="#e2e8f0" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 14,37 L 31,37" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>`
                }
            </svg>`;
        } else if (type === 'k') {
            // Modern Şah (King)
            return `<svg viewBox="0 0 45 45" class="chess-piece-svg">
                <path d="M 9.5,38.5 C 9.5,36.5 12.5,35 16,35 L 29,35 C 32.5,35 35.5,36.5 35.5,38.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 13,35 L 32,35 L 30.5,31 L 14.5,31 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 14.5,31 C 13.5,24.5 15,19 18,17 L 27,17 C 30,19 31.5,24.5 30.5,31 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 12,17 C 12,13 16.5,10.5 22.5,10.5 C 28.5,10.5 33,13 33,17 C 30.5,19 26.5,20 22.5,20 C 18.5,20 14.5,19 12,17 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                <path d="M 22.5,3.5 L 22.5,10.5 M 19,6.5 L 26,6.5" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>
                ${isWhite
                  ? `<circle cx="22.5" cy="15" r="2.2" fill="#0f172a"/>
                     <path d="M 15,26 C 18,27.5 27,27.5 30,26" stroke="#64748b" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 14,37 L 31,37" stroke="#cbd5e1" stroke-width="1" stroke-linecap="round"/>`
                  : `<circle cx="22.5" cy="15" r="2.2" fill="#f8fafc"/>
                     <path d="M 15,26 C 18,27.5 27,27.5 30,26" stroke="#e2e8f0" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                     <path d="M 14,37 L 31,37" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>`
                }
            </svg>`;
        }
        return '';
    }

    // FEN Dizesinden 8x8 Tahta Dizisi Çıkarıcı
    function parseFenToBoard(fen) {
        const board = [];
        const rows = fen.split(' ')[0].split('/');
        for (let r = 0; r < 8; r++) {
            const rowArr = [];
            const rowStr = rows[r];
            for (let i = 0; i < rowStr.length; i++) {
                const char = rowStr[i];
                if (char >= '1' && char <= '8') {
                    const emptyCount = parseInt(char);
                    for (let e = 0; e < emptyCount; e++) rowArr.push(null);
                } else {
                    const color = (char === char.toUpperCase()) ? 'w' : 'b';
                    const type = char.toLowerCase();
                    rowArr.push({ type: type, color: color });
                }
            }
            board.push(rowArr);
        }
        return board;
    }

    // Saniye -> MM:SS Formatlayıcı
    function formatClockTime(sec) {
        if (sec === undefined || sec === null || sec < 0) sec = 0;
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // --- SOCKET DİNLEYİCİLERİ ---
    if (socket) {
        socket.off('chessUpdate');
        socket.off('chessClockTick');
        socket.off('chessRematchStatus');

        socket.on('chessUpdate', (data) => {
            if (!data) return;
            const myId = socket.id;

            // Eğer ayrılan veya masada olmayan oyuncuysa yoksay
            if (data.disconnectedPlayers && data.disconnectedPlayers[myId]) return;

            const isPlayer = data.players && data.players.includes(myId);
            const myColor = isPlayer ? data.playerColors[myId] : null;

            // Ses efektleri kontrolü (Yeni hamle, taş yeme, şah)
            if (serverChessData && serverChessData.fen !== data.fen) {
                if (data.inCheck) {
                    playChessSound('check');
                } else {
                    let lastMove = data.history && data.history.length > 0 ? data.history[data.history.length - 1] : null;
                    if (lastMove && lastMove.captured) {
                        playChessSound('capture');
                    } else {
                        playChessSound('move');
                    }
                }
            }

            // Otomatik Tahta Döndürme (Auto-Flip):
            // Siyah oyuncu ise siyah parçaları aşağıda görür.
            // Kullanıcı manuel döndürme butonuna basmadıysa renge göre otomatik ayarla.
            if (!userManuallyToggledFlip) {
                isBoardFlipped = (myColor === 'b');
            }

            serverChessData = data;
            selectedSquare = null;
            legalMovesForSelected = [];
            pendingPromotionMove = null;

            const modal = document.getElementById('chessModal');
            if (modal) modal.style.display = 'flex';

            // Oyun bittiyse zafer konfetisi
            if (data.gameOver && data.winner && !data.winnerRecordedClient) {
                data.winnerRecordedClient = true;
                if (data.winner === myColor && typeof window.triggerVictoryConfetti === 'function') {
                    window.triggerVictoryConfetti();
                }
                playChessSound('gameover');
            }

            renderChessUI();
        });

        // Canlı Saat Tıklaması
        socket.on('chessClockTick', (clockData) => {
            if (!serverChessData || serverChessData.tableId !== clockData.tableId) return;
            serverChessData.whiteTime = clockData.whiteTime;
            serverChessData.blackTime = clockData.blackTime;
            serverChessData.turn = clockData.turn;
            updateClocksDisplay();
        });

        socket.on('chessRematchStatus', (voteData) => {
            if (!voteData) return;
            const statusEl = document.getElementById('chessRematchVotesText');
            if (statusEl) {
                let votesCount = Object.values(voteData.votes || {}).filter(v => v).length;
                statusEl.innerHTML = `<span style="color:#facc15;">🔄 ${voteData.playerName} rövanş istedi (${votesCount}/${voteData.totalPlayers})</span>`;
            }
        });
    }

    // --- UI RENDER MOTORU ---
    function renderChessUI() {
        if (!serverChessData) return;
        const data = serverChessData;
        const myId = socket ? socket.id : null;
        const isPlayer = data.players && data.players.includes(myId);
        const myColor = isPlayer ? data.playerColors[myId] : null;

        // Tahta Yönü:
        // Eğer isBoardFlipped === true: Siyah aşağıda (Ranks 1..8, Files h..a)
        // Eğer isBoardFlipped === false: Beyaz aşağıda (Ranks 8..1, Files a..h)
        const bottomColor = isBoardFlipped ? 'b' : 'w';
        const topColor = isBoardFlipped ? 'w' : 'b';

        // Oyuncu Kimlikleri
        const bottomPid = data.players.find(p => data.playerColors[p] === bottomColor);
        const topPid = data.players.find(p => data.playerColors[p] === topColor);

        const bottomName = bottomPid ? (data.playerProfiles[bottomPid]?.name || "Oyuncu") : "Oyuncu";
        const topName = topPid ? (data.playerProfiles[topPid]?.name || "Oyuncu") : "Oyuncu";

        // İsim ve Rozet Güncellemeleri
        const topNameEl = document.getElementById('chessTopPlayerName');
        const bottomNameEl = document.getElementById('chessBottomPlayerName');
        if (topNameEl) {
            let isTurn = data.turn === topColor && !data.gameOver;
            topNameEl.innerHTML = `<span>${topColor === 'w' ? '⚪' : '⚫'} ${topName}</span> ${isTurn ? '<span class="chess-active-pill">Sıra Onda</span>' : ''}`;
        }
        if (bottomNameEl) {
            let isTurn = data.turn === bottomColor && !data.gameOver;
            let youBadge = (bottomPid === myId) ? ' (Sen)' : '';
            bottomNameEl.innerHTML = `<span>${bottomColor === 'w' ? '⚪' : '⚫'} ${bottomName}${youBadge}</span> ${isTurn ? '<span class="chess-active-pill">Senin Sıran</span>' : ''}`;
        }

        // Bahis ve Pot Rozeti
        const betBadge = document.getElementById('chessBetBadge');
        if (betBadge) {
            let betText = data.bet > 0 ? `💰 Bahis: ${data.bet} TL` : `🌱 Ücretsiz`;
            let potText = data.pot > 0 ? `🏆 Pot: ${data.pot} TL` : ``;
            let modeText = (data.timeMode === 'untimed') ? `♾️ Süresiz` : `⏱️ 10 Dk`;
            betBadge.innerHTML = `<span style="color:#facc15;">${betText}</span> ${potText ? `<span style="color:#4ade80;">| ${potText}</span>` : ''} <span style="color:#38bdf8;">| ${modeText}</span>`;
        }

        // Durum Başlığı (Şah, Mat, Sıra)
        const statusEl = document.getElementById('chessStatusText');
        if (statusEl) {
            if (data.gameOver) {
                if (data.winner === 'draw') {
                    let rTr = "Beraberlik";
                    if (data.winReason === 'stalemate') rTr = "Pat (Hareket Alanı Yok)";
                    else if (data.winReason === 'insufficient_material') rTr = "Yetersiz Taş";
                    statusEl.innerHTML = `<span style="color:#cbd5e1; font-weight:900;">🤝 OYUN BİTTİ (BERABERE: ${rTr})</span>`;
                } else {
                    let winName = (data.winner === bottomColor) ? bottomName : topName;
                    let isMe = (data.winner === myColor);
                    let rTr = "Şah & Mat";
                    if (data.winReason === 'timeout') rTr = "Zaman Aşımı";
                    else if (data.winReason === 'resignation') rTr = "Terk Edildi";

                    statusEl.innerHTML = isMe
                        ? `<span style="color:#22c55e; font-weight:900;">🎉 TEBRİKLER! OYUNU KAZANDIN! (${rTr})</span>`
                        : `<span style="color:#ef4444; font-weight:900;">💀 ${winName} KAZANDI! (${rTr})</span>`;
                }
            } else if (data.inCheck) {
                let checkedColor = data.turn;
                let checkedName = (checkedColor === bottomColor) ? bottomName : topName;
                statusEl.innerHTML = `<span style="color:#f43f5e; font-weight:900; animation:pulseCheck 1s infinite;">⚠️ ŞAH ÇEKİLDİ! (${checkedName} Şahı Tehdit Altında!)</span>`;
            } else {
                let isMyTurn = (myColor && data.turn === myColor);
                statusEl.innerHTML = isMyTurn
                    ? `<span style="color:#38bdf8; font-weight:bold;">🟢 Senin Sıran (${myColor === 'w' ? 'Beyaz' : 'Siyah'}) - Oynamak için taşa tıkla</span>`
                    : `<span style="color:#94a3b8; font-weight:bold;">⏳ Sıra: ${data.turn === 'w' ? 'Beyaz' : 'Siyah'} (${data.turn === topColor ? topName : bottomName})</span>`;
            }
        }

        // İzleyici Bilgisi
        const spectatorBanner = document.getElementById('chessSpectatorBanner');
        if (spectatorBanner) {
            let isSpectator = !isPlayer;
            spectatorBanner.style.display = isSpectator ? 'flex' : 'none';
        }

        // Ele Geçirilen Taşlar Tepsisi
        renderCapturedPieces(data.capturedPieces, topColor, bottomColor);

        // Saatleri Güncelle
        updateClocksDisplay();

        // 8x8 Tahtayı Çiz
        renderBoardSquares();

        // Rövanş Ekranı
        const rematchOverlay = document.getElementById('chessRematchOverlay');
        if (rematchOverlay) {
            rematchOverlay.style.display = data.gameOver ? 'flex' : 'none';
        }
    }

    // Saat LCD Göstergesi
    function updateClocksDisplay() {
        if (!serverChessData) return;
        const data = serverChessData;
        const topColor = isBoardFlipped ? 'w' : 'b';
        const bottomColor = isBoardFlipped ? 'b' : 'w';

        const topClockEl = document.getElementById('chessTopClock');
        const bottomClockEl = document.getElementById('chessBottomClock');

        if (data.timeMode === 'untimed') {
            if (topClockEl) topClockEl.innerText = "♾️";
            if (bottomClockEl) bottomClockEl.innerText = "♾️";
            return;
        }

        const topTime = (topColor === 'w') ? data.whiteTime : data.blackTime;
        const bottomTime = (bottomColor === 'w') ? data.whiteTime : data.blackTime;

        if (topClockEl) {
            topClockEl.innerText = formatClockTime(topTime);
            topClockEl.classList.toggle('active-clock', data.turn === topColor && !data.gameOver);
            topClockEl.classList.toggle('low-time', topTime <= 60 && !data.gameOver);
        }
        if (bottomClockEl) {
            bottomClockEl.innerText = formatClockTime(bottomTime);
            bottomClockEl.classList.toggle('active-clock', data.turn === bottomColor && !data.gameOver);
            bottomClockEl.classList.toggle('low-time', bottomTime <= 60 && !data.gameOver);
        }
    }

    // Ele Geçirilen Taşları Render Et
    function renderCapturedPieces(capturedObj, topColor, bottomColor) {
        const topTray = document.getElementById('chessTopCaptured');
        const bottomTray = document.getElementById('chessBottomCaptured');
        if (!capturedObj) return;

        // Top oyuncunun yediği taşlar = Rakip renk
        const topPieces = (topColor === 'w') ? capturedObj.w : capturedObj.b;
        const bottomPieces = (bottomColor === 'w') ? capturedObj.w : capturedObj.b;

        const pieceIcons = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

        if (topTray) {
            topTray.innerHTML = (topPieces || []).map(p => `<span>${pieceIcons[p] || '♟'}</span>`).join('');
        }
        if (bottomTray) {
            bottomTray.innerHTML = (bottomPieces || []).map(p => `<span>${pieceIcons[p] || '♟'}</span>`).join('');
        }
    }

    // 8x8 Tahtayı Çiz ve Kareleri Oluştur
    function renderBoardSquares() {
        const boardEl = document.getElementById('chessBoardGrid');
        if (!boardEl || !serverChessData) return;
        boardEl.innerHTML = '';

        const boardMatrix = parseFenToBoard(serverChessData.fen);
        const myId = socket ? socket.id : null;
        const isPlayer = serverChessData.players && serverChessData.players.includes(myId);
        const myColor = isPlayer ? serverChessData.playerColors[myId] : null;
        const canMove = isPlayer && !serverChessData.gameOver && (serverChessData.turn === myColor);

        // Son yapılan hamle kareleri (amber vurgu)
        const lastMove = (serverChessData.history && serverChessData.history.length > 0)
            ? serverChessData.history[serverChessData.history.length - 1]
            : null;

        // Şah tehdit altında ise şah karesi
        let checkedKingSquare = null;
        if (serverChessData.inCheck) {
            // Şah karesini FEN'den bul
            const checkedColor = serverChessData.turn;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    let p = boardMatrix[r][c];
                    if (p && p.type === 'k' && p.color === checkedColor) {
                        let f = String.fromCharCode(97 + c);
                        let rankNum = 8 - r;
                        checkedKingSquare = `${f}${rankNum}`;
                    }
                }
            }
        }

        // Tahta Yönü İndeksleri
        // Normal (Beyaz altta): rankIdx 0..7 => Rank 8..1, fileIdx 0..7 => File a..h
        // Flipped (Siyah altta): rankIdx 7..0 => Rank 1..8, fileIdx 7..0 => File h..a
        const rankIndices = isBoardFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
        const fileIndices = isBoardFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

        rankIndices.forEach((rIdx, visualRow) => {
            fileIndices.forEach((cIdx, visualCol) => {
                const squareName = `${String.fromCharCode(97 + cIdx)}${8 - rIdx}`;
                const piece = boardMatrix[rIdx][cIdx];

                const isLight = (rIdx + cIdx) % 2 === 0;
                const cell = document.createElement('div');
                cell.className = `chess-square ${isLight ? 'light' : 'dark'}`;
                cell.dataset.square = squareName;

                // Son hamle vurgusu
                if (lastMove && (lastMove.from === squareName || lastMove.to === squareName)) {
                    cell.classList.add('last-move-highlight');
                }

                // Seçili kare vurgusu
                if (selectedSquare === squareName) {
                    cell.classList.add('selected-square');
                }

                // Tehdit altındaki şah karesi (kırmızı nabız)
                if (checkedKingSquare === squareName) {
                    cell.classList.add('king-in-check');
                }

                // Yasal hamle hedef noktası
                const isLegalTarget = legalMovesForSelected.some(m => m.to === squareName);
                if (isLegalTarget) {
                    if (piece) {
                        cell.classList.add('legal-capture-target');
                    } else {
                        const dot = document.createElement('div');
                        dot.className = 'legal-move-dot';
                        cell.appendChild(dot);
                    }
                }

                // Koordinat etiketleri (chess.com stili)
                if (visualCol === 0) {
                    const rankLabel = document.createElement('span');
                    rankLabel.className = 'chess-coord rank-coord';
                    rankLabel.innerText = `${8 - rIdx}`;
                    cell.appendChild(rankLabel);
                }
                if (visualRow === 7) {
                    const fileLabel = document.createElement('span');
                    fileLabel.className = 'chess-coord file-coord';
                    fileLabel.innerText = String.fromCharCode(97 + cIdx);
                    cell.appendChild(fileLabel);
                }

                // Taş Vektörü
                if (piece) {
                    const pieceWrap = document.createElement('div');
                    pieceWrap.className = 'chess-piece-wrapper';
                    pieceWrap.innerHTML = getPieceSVG(piece.type, piece.color);
                    cell.appendChild(pieceWrap);
                }

                // Tıklama Olayı
                cell.onclick = () => handleSquareClick(squareName, piece, canMove, myColor);
                boardEl.appendChild(cell);
            });
        });
    }

    // Kare Tıklama İşleyicisi
    function handleSquareClick(squareName, piece, canMove, myColor) {
        if (!canMove || !serverChessData || serverChessData.gameOver) return;

        // 1. Durum: Henüz taş seçilmediyse veya kendi taşımıza tıklandıysa
        if (!selectedSquare) {
            if (piece && piece.color === myColor) {
                selectedSquare = squareName;
                legalMovesForSelected = calculateLegalMoves(squareName);
                renderBoardSquares();
            }
            return;
        }

        // 2. Durum: Zaten seçili bir taş varken tekrar kendi taşımıza tıklanırsa seçimi değiştir
        if (piece && piece.color === myColor) {
            if (selectedSquare === squareName) {
                selectedSquare = null;
                legalMovesForSelected = [];
            } else {
                selectedSquare = squareName;
                legalMovesForSelected = calculateLegalMoves(squareName);
            }
            renderBoardSquares();
            return;
        }

        // 3. Durum: Seçili taştan hedef kareye hamle denemesi
        const matchingMove = legalMovesForSelected.find(m => m.to === squareName);
        if (matchingMove) {
            // Piyon Terfisi (Promotion) Kontrolü
            const isPawnPromotion = matchingMove.promotion !== undefined || isPawnReachingBackRank(selectedSquare, squareName);

            if (isPawnPromotion) {
                pendingPromotionMove = { from: selectedSquare, to: squareName };
                showPromotionModal(myColor);
                return;
            }

            // Normal Hamleyi Gönder
            executeMoveToServer(selectedSquare, squareName, null);
            selectedSquare = null;
            legalMovesForSelected = [];
            renderBoardSquares();
        } else {
            // Geçersiz kareye tıklandı -> seçimi kaldır
            selectedSquare = null;
            legalMovesForSelected = [];
            renderBoardSquares();
        }
    }

    // Piyonun son sıraya ulaşıp ulaşmadığı kontrolü
    function isPawnReachingBackRank(fromSquare, toSquare) {
        const board = parseFenToBoard(serverChessData.fen);
        let fromCol = fromSquare.charCodeAt(0) - 97;
        let fromRow = 8 - parseInt(fromSquare[1]);
        let p = board[fromRow][fromCol];
        if (!p || p.type !== 'p') return false;

        let toRank = parseInt(toSquare[1]);
        return (p.color === 'w' && toRank === 8) || (p.color === 'b' && toRank === 1);
    }

    // Piyon Terfi Modalını Aç
    function showPromotionModal(color) {
        const modal = document.getElementById('chessPromotionModal');
        const piecesContainer = document.getElementById('chessPromotionPieces');
        if (!modal || !piecesContainer) return;

        piecesContainer.innerHTML = '';
        const promoOptions = [
            { type: 'q', name: 'Vezir' },
            { type: 'r', name: 'Kale' },
            { type: 'b', name: 'Fil' },
            { type: 'n', name: 'At' }
        ];

        promoOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chess-promo-choice-btn';
            btn.innerHTML = `
                <div style="width:52px; height:52px; margin:0 auto;">${getPieceSVG(opt.type, color)}</div>
                <div style="font-size:12px; font-weight:800; color:#facc15; margin-top:4px;">${opt.name}</div>
            `;
            btn.onclick = () => {
                modal.style.display = 'none';
                if (pendingPromotionMove) {
                    executeMoveToServer(pendingPromotionMove.from, pendingPromotionMove.to, opt.type);
                    pendingPromotionMove = null;
                    selectedSquare = null;
                    legalMovesForSelected = [];
                    renderBoardSquares();
                }
            };
            piecesContainer.appendChild(btn);
        });

        modal.style.display = 'flex';
    }

    // Sunucuya Hamle İletimi
    function executeMoveToServer(from, to, promotion) {
        if (!socket) return;
        const payload = { from, to };
        if (promotion) payload.promotion = promotion;
        socket.emit('chessMove', payload);
    }

    // Seçili kare için yasal hamleleri hesapla
    function calculateLegalMoves(fromSquare) {
        if (!serverChessData) return [];
        if (serverChessData.legalMoves && Array.isArray(serverChessData.legalMoves)) {
            return serverChessData.legalMoves.filter(m => m.from === fromSquare);
        }
        try {
            if (typeof Chess !== 'undefined') {
                const c = new Chess(serverChessData.fen);
                return c.moves({ square: fromSquare, verbose: true });
            }
        } catch (_) {}
        return [];
    }

    // Tahtayı Manuel Çevirme / Döndürme
    function toggleBoardFlip() {
        isBoardFlipped = !isBoardFlipped;
        userManuallyToggledFlip = true;
        renderChessUI();
    }
    window.toggleBoardFlip = toggleBoardFlip;

    // Oyunu Terk Etme (Teslim Olma)
    function resignChess() {
        if (!serverChessData || serverChessData.gameOver) return;
        if (confirm("Satranç karşılaşmasını terk etmek (teslim olmak) istediğinize emin misiniz?")) {
            if (socket) socket.emit('chessResign');
        }
    }
    window.resignChess = resignChess;

    // Rövanş Oyu Gönderme
    function voteChessRematch() {
        if (!serverChessData || !serverChessData.gameOver) return;
        if (socket) socket.emit('chessVoteRematch');
    }
    window.voteChessRematch = voteChessRematch;

    // Satranç Masasından Ayrılma
    function leaveChessGame() {
        if (socket) {
            let activeId = serverChessData?.tableId || window.currentActiveTableId;
            if (activeId) {
                socket.emit('closeTable', { tableId: activeId });
            }
            socket.emit('leaveTable');
        }
        serverChessData = null;
        userManuallyToggledFlip = false;
        const modal = document.getElementById('chessModal');
        if (modal) modal.style.display = 'none';
        if (typeof window.resetAllTableUIs === 'function') {
            window.resetAllTableUIs();
        }
    }
    window.leaveChessGame = leaveChessGame;

    // Modal Sürükleme Mantığı
    window.addEventListener('DOMContentLoaded', () => {
        const header = document.getElementById('chessModalHeader');
        const modal = document.getElementById('chessModalContent');
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

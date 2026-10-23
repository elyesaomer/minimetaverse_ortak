// public/js/amiralBatti.js - Kafe Amiral Battı (Battleship / Deniz Muharebesi) Oyunu
// Taktiksel Radar Ekranı & Akıllı Kaptan Barbaros Yapay Zekası & Çevrimiçi Masalar (PVP & Bot)

(function () {
    const GRID_SIZE = 8;
    const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    const SHIPS_CONFIG = [
        { id: 'carrier', name: '🛳️ Amiral Gemisi', size: 4, color: '#38bdf8' },
        { id: 'cruiser', name: '🚢 Kruvazör', size: 3, color: '#4ade80' },
        { id: 'destroyer', name: '🚤 Muhrip', size: 2, color: '#fbbf24' },
        { id: 'patrol', name: '🛶 Hücumbot', size: 2, color: '#f43f5e' }
    ];

    // Oyun Durumu
    let phase = 'SETUP'; // 'SETUP' veya 'BATTLE' veya 'GAMEOVER'
    let currentOrientation = 'H'; // 'H' (Yatay) veya 'V' (Dikey)
    let selectedShipIndex = 0; // Manuel yerleştirmede sıradaki gemi

    // Oyuncu Donanması
    let playerShips = []; // { id, name, size, coords: [{r, c}], hits: 0, sunk: false }
    let playerGrid = []; // [8][8]: { ship: null, hit: false, miss: false }

    // Düşman Donanması
    let enemyShips = [];
    let enemyGrid = []; // [8][8]: { ship: null, hit: false, miss: false }

    let turn = 'player'; // 'player' veya 'ai'
    let playerStats = { shots: 0, hits: 0 };
    let aiMemory = {
        mode: 'HUNT', // 'HUNT' veya 'TARGET'
        targetStack: [],
        firstHit: null,
        currentHits: []
    };

    let serverAmiralData = null;
    let hasPlayedWinSound = false;
    let isReadySent = false;
    const socket = window.socket || (typeof io !== 'undefined' ? io() : null);

    // Socket Entegrasyonu
    if (socket) {
        socket.off('amiralUpdate');
        socket.off('amiralRematchStatus');
        socket.off('opponentLeft');
        socket.off('tableLeft');
        socket.off('tableClosed');

        socket.on('amiralUpdate', (data) => {
            if (!data) return;
            if (data.disconnectedPlayers && socket && data.disconnectedPlayers[socket.id]) return;
            if (data.players && socket && !data.players.includes(socket.id) && !data.isSpectator) return;
            serverAmiralData = data;
            const modal = document.getElementById('amiralBattiModal');
            if (modal) modal.style.display = 'flex';

            phase = data.phase;
            turn = data.isMyTurn ? 'player' : 'enemy';

            if (data.myGrid && data.myGrid.length === GRID_SIZE) {
                playerGrid = data.myGrid;
            }
            if (data.myShips) {
                playerShips = data.myShips;
            }
            if (data.oppShots && data.oppShots.length === GRID_SIZE) {
                enemyGrid = data.oppShots;
            }
            if (data.oppShipsStatus) {
                enemyShips = data.oppShipsStatus;
            }

            if (data.stats && data.stats[socket.id]) {
                playerStats = data.stats[socket.id];
            }

            if (data.lastShotResult) {
                let r = data.lastShotResult;
                if (r.hit) {
                    playBattleshipSound(r.sunkShip ? 'sunk' : 'hit');
                    if (r.sunkShip) {
                        showNavalToast(`💥 ${r.playerId === socket.id ? 'Düşmanın' : 'Senin'} ${r.sunkShip.name} gemisi BATTI!`);
                    }
                } else {
                    playBattleshipSound('miss');
                }
            }

            if (data.gameOver && !hasPlayedWinSound) {
                hasPlayedWinSound = true;
                if (data.winner === socket.id) {
                    playBattleshipSound('win');
                    if (typeof window.triggerVictoryConfetti === 'function') {
                        window.triggerVictoryConfetti();
                    }
                }
            } else if (!data.gameOver) {
                hasPlayedWinSound = false;
            }

            if (phase === 'SETUP') {
                updateSetupUI();
            } else if (phase === 'BATTLE') {
                isReadySent = false;
                updateBattleUI();
            } else if (phase === 'GAMEOVER') {
                handleGameOver(data.winner === socket.id ? 'player' : 'enemy');
            }

            renderAllGrids();
        });

        socket.on('amiralRematchStatus', (data) => {
            if (!data) return;
            const banner = document.getElementById('amiralStatusBanner');
            if (banner && serverAmiralData?.gameOver) {
                let votesCount = Object.values(data.votes || {}).filter(v => v).length;
                banner.innerHTML = `<span style="color:#facc15;">🔄 ${data.playerName} rövanş istedi (${votesCount}/${data.totalPlayers})</span>`;
            }
        });

        socket.on('opponentLeft', (data) => {
            serverAmiralData = null;
            phase = 'SETUP';
            const modal = document.getElementById('amiralBattiModal');
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
            serverAmiralData = null;
            phase = 'SETUP';
            const modal = document.getElementById('amiralBattiModal');
            if (modal) modal.style.display = 'none';
            if (typeof window.resetAllTableUIs === 'function') {
                window.resetAllTableUIs();
            }
        });

        socket.on('tableClosed', (data) => {
            let closedId = typeof data === 'object' ? data?.tableId : data;
            if (!closedId || (serverAmiralData && serverAmiralData.tableId === closedId)) {
                serverAmiralData = null;
                phase = 'SETUP';
                const modal = document.getElementById('amiralBattiModal');
                if (modal) modal.style.display = 'none';
                if (typeof window.resetAllTableUIs === 'function') {
                    window.resetAllTableUIs();
                }
            }
        });
    }

    // Ses Efektleri
    function playBattleshipSound(type) {
        try {
            if (window.audioCtx) {
                const now = window.audioCtx.currentTime;
                const gainNode = window.audioCtx.createGain();
                gainNode.connect(window.audioCtx.destination);
                const sfxVol = (typeof window.getAudioSettings === 'function') ? window.getAudioSettings().sfx : 0.8;
                gainNode.gain.setValueAtTime(sfxVol * 0.45, now);

                if (type === 'sonar') {
                    // Sonar Radar Sesi (Yüksek frekanslı yankılanan bip)
                    const osc = window.audioCtx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1400, now);
                    osc.frequency.exponentialRampToValueAtTime(700, now + 0.35);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
                    osc.connect(gainNode);
                    osc.start(now);
                    osc.stop(now + 0.38);
                } else if (type === 'launch') {
                    // Füze / Torpido Fırlatma Sesi (Hışırtılı ıslık)
                    const osc = window.audioCtx.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(260, now);
                    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.22);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
                    osc.connect(gainNode);
                    osc.start(now);
                    osc.stop(now + 0.24);
                } else if (type === 'hit') {
                    // Bomba Patlaması (Derin Bas Patlama)
                    const osc = window.audioCtx.createOscillator();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(180, now);
                    osc.frequency.exponentialRampToValueAtTime(35, now + 0.3);
                    gainNode.gain.setValueAtTime(sfxVol * 0.6, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                    osc.connect(gainNode);
                    osc.start(now);
                    osc.stop(now + 0.35);
                } else if (type === 'sunk') {
                    // Gemi Batma Sireni
                    [440, 370, 310, 220].forEach((freq, i) => {
                        const osc = window.audioCtx.createOscillator();
                        const gn = window.audioCtx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, now + i * 0.12);
                        gn.gain.setValueAtTime(sfxVol * 0.4, now + i * 0.12);
                        gn.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
                        osc.connect(gn);
                        gn.connect(window.audioCtx.destination);
                        osc.start(now + i * 0.12);
                        osc.stop(now + i * 0.12 + 0.25);
                    });
                }
            }
        } catch (_) {}

        if (type === 'miss' && typeof window.playSound === 'function') {
            window.playSound('splash');
        } else if (type === 'win' && typeof window.playSound === 'function') {
            window.playSound('win');
        }
    }

    // Modal Açma / Kapatma
    function openAmiralBattiModal() {
        const modal = document.getElementById('amiralBattiModal');
        if (!modal) return;
        modal.style.display = 'flex';
        if (!serverAmiralData) {
            initAmiralBatti();
        }
        playBattleshipSound('sonar');
    }
    window.openAmiralBattiModal = openAmiralBattiModal;

    function closeAmiralBattiModal() {
        if (socket) {
            let activeId = serverAmiralData?.tableId || window.currentActiveTableId;
            if (activeId) {
                socket.emit('closeTable', { tableId: activeId });
            }
            socket.emit('leaveTable');
        }
        serverAmiralData = null;
        phase = 'SETUP';
        const modal = document.getElementById('amiralBattiModal');
        if (modal) modal.style.display = 'none';
        if (typeof window.resetAllTableUIs === 'function') {
            window.resetAllTableUIs();
        }
    }
    window.closeAmiralBattiModal = closeAmiralBattiModal;

    // Oyunu Başlat / Sıfırla
    function initAmiralBatti() {
        phase = 'SETUP';
        turn = 'player';
        currentOrientation = 'H';
        selectedShipIndex = 0;
        playerStats = { shots: 0, hits: 0 };
        aiMemory = { mode: 'HUNT', targetStack: [], firstHit: null, currentHits: [] };
        isReadySent = false;

        playerGrid = createEmptyGrid();
        enemyGrid = createEmptyGrid();
        playerShips = [];
        enemyShips = [];

        // Düşman donanmasını otomatik yerleştir (vs Yapay Zeka modu için)
        enemyShips = deployRandomFleet(enemyGrid);

        // Başlangıçta gemileri hazır rastgele diz (kullanıcı isterse doğrudan başlayabilir veya Temizle diyerek manuel dizebilir)
        playerShips = deployRandomFleet(playerGrid);

        updateSetupUI();
        renderAllGrids();
    }
    window.initAmiralBatti = initAmiralBatti;

    function createEmptyGrid() {
        let grid = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            grid[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                grid[r][c] = { ship: null, hit: false, miss: false };
            }
        }
        return grid;
    }

    function getNextShipToPlace() {
        return SHIPS_CONFIG.find(c => !playerShips.some(s => s.id === c.id));
    }

    function clearPlacementPreviews() {
        document.querySelectorAll('#playerBoardGrid .naval-cell').forEach(el => {
            el.classList.remove('placement-preview-valid', 'placement-preview-invalid');
        });
    }

    function clearPlayerFleet() {
        if (phase !== 'SETUP') return;
        playerGrid = createEmptyGrid();
        playerShips = [];
        selectedShipIndex = 0;
        isReadySent = false;
        renderAllGrids();
        updateSetupUI();
        showNavalToast("🧹 Donanma temizlendi. Gemileri yerleştirmek için ızgaraya tıklayın.");
    }
    window.clearPlayerFleet = clearPlayerFleet;

    function handlePlayerGridCellHover(r, c) {
        if (phase !== 'SETUP' || isReadySent) return;
        clearPlacementPreviews();
        let nextShip = getNextShipToPlace();
        if (!nextShip) return;

        let canPlace = canPlaceShip(playerGrid, r, c, nextShip.size, currentOrientation);
        for (let i = 0; i < nextShip.size; i++) {
            let cr = (currentOrientation === 'V') ? (r + i) : r;
            let cc = (currentOrientation === 'H') ? (c + i) : c;
            if (cr >= 0 && cr < GRID_SIZE && cc >= 0 && cc < GRID_SIZE) {
                let targetCell = document.querySelector(`#playerBoardGrid .naval-cell[data-r="${cr}"][data-c="${cc}"]`);
                if (targetCell) {
                    targetCell.classList.add(canPlace ? 'placement-preview-valid' : 'placement-preview-invalid');
                }
            }
        }
    }

    function handlePlayerGridCellClick(r, c) {
        if (phase !== 'SETUP' || isReadySent) return;
        let nextShip = getNextShipToPlace();
        if (!nextShip) {
            showNavalToast("Tüm gemiler dizildi! 'Rastgele Diz' veya 'Temizle' ile değiştirebilirsiniz.");
            return;
        }

        if (!canPlaceShip(playerGrid, r, c, nextShip.size, currentOrientation)) {
            playBattleshipSound('miss');
            showNavalToast("⚠️ Gemi buraya sığmıyor veya diğer gemilere çok yakın!");
            return;
        }

        // Gemiyi yerleştir
        let shipInstance = {
            id: nextShip.id,
            name: nextShip.name,
            size: nextShip.size,
            color: nextShip.color,
            coords: [],
            hits: 0,
            sunk: false
        };

        for (let i = 0; i < nextShip.size; i++) {
            let cr = (currentOrientation === 'V') ? (r + i) : r;
            let cc = (currentOrientation === 'H') ? (c + i) : c;
            playerGrid[cr][cc].ship = shipInstance;
            shipInstance.coords.push({ r: cr, c: cc });
        }

        playerShips.push(shipInstance);
        playBattleshipSound('sonar');
        showNavalToast(`⚓ ${nextShip.name} yerleştirildi!`);

        clearPlacementPreviews();
        renderAllGrids();
        updateSetupUI();
    }
    window.handlePlayerGridCellClick = handlePlayerGridCellClick;

    // Donanmayı Rastgele Yerleştirme
    function deployRandomFleet(grid) {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                grid[r][c] = { ship: null, hit: false, miss: false };
            }
        }

        let fleet = [];
        SHIPS_CONFIG.forEach(cfg => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 200) {
                attempts++;
                let orientation = Math.random() < 0.5 ? 'H' : 'V';
                let maxR = (orientation === 'V') ? (GRID_SIZE - cfg.size) : (GRID_SIZE - 1);
                let maxC = (orientation === 'H') ? (GRID_SIZE - cfg.size) : (GRID_SIZE - 1);
                let startR = Math.floor(Math.random() * (maxR + 1));
                let startC = Math.floor(Math.random() * (maxC + 1));

                if (canPlaceShip(grid, startR, startC, cfg.size, orientation)) {
                    let shipInstance = {
                        id: cfg.id,
                        name: cfg.name,
                        size: cfg.size,
                        color: cfg.color,
                        coords: [],
                        hits: 0,
                        sunk: false
                    };
                    for (let i = 0; i < cfg.size; i++) {
                        let r = (orientation === 'V') ? (startR + i) : startR;
                        let c = (orientation === 'H') ? (startC + i) : startC;
                        grid[r][c].ship = shipInstance;
                        shipInstance.coords.push({ r, c });
                    }
                    fleet.push(shipInstance);
                    placed = true;
                }
            }
        });
        return fleet;
    }

    function canPlaceShip(grid, startR, startC, size, orientation) {
        for (let i = 0; i < size; i++) {
            let r = (orientation === 'V') ? (startR + i) : startR;
            let c = (orientation === 'H') ? (startC + i) : startC;
            if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
            // Gemiler üst üste gelmesin ve en az 1 kare boşluk bıraksın
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    let nr = r + dr;
                    let nc = c + dc;
                    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                        if (grid[nr][nc].ship !== null) return false;
                    }
                }
            }
        }
        return true;
    }

    // Rastgele Yerleştir Butonu
    function handleRandomDeploy() {
        if (phase !== 'SETUP' || isReadySent) return;
        playerShips = deployRandomFleet(playerGrid);
        playBattleshipSound('sonar');
        clearPlacementPreviews();
        renderAllGrids();
        updateSetupUI();
    }
    window.handleRandomDeploy = handleRandomDeploy;

    // Yön Değiştirme Butonu
    function toggleOrientation() {
        currentOrientation = (currentOrientation === 'H') ? 'V' : 'H';
        const btn = document.getElementById('amiralRotateBtn');
        if (btn) {
            btn.innerHTML = (currentOrientation === 'H') ? '🔄 Yön: Yatay ➔' : '🔄 Yön: Dikey ⬇';
        }
        clearPlacementPreviews();
    }
    window.toggleOrientation = toggleOrientation;

    // Savaşa Başlama Butonu
    function startBattle() {
        if (playerShips.length !== SHIPS_CONFIG.length) {
            showNavalToast("⚠️ Lütfen önce 4 geminizin tamamını yerleştirin!");
            return;
        }
        if (serverAmiralData) {
            isReadySent = true;
            if (socket) {
                socket.emit('amiralReady', { ships: playerShips, grid: playerGrid });
            }
            updateSetupUI();
            return;
        }
        phase = 'BATTLE';
        turn = 'player';
        playBattleshipSound('launch');
        updateBattleUI();
        renderAllGrids();
    }
    window.startBattle = startBattle;

    // Düşman Radarına Tıklama (Oyuncunun Atışı)
    function handleEnemyRadarClick(r, c) {
        if (serverAmiralData) {
            if (serverAmiralData.phase !== 'BATTLE' || !serverAmiralData.isMyTurn || serverAmiralData.isSpectator) {
                showNavalToast("⚠️ Sıra sizde değil, rakip bekleniyor!");
                return;
            }
            const cell = enemyGrid[r] && enemyGrid[r][c];
            if (cell && (cell.hit || cell.miss || cell.fired)) {
                showNavalToast("⚠️ Bu koordinata daha önce atış yaptınız!");
                return;
            }
            playBattleshipSound('launch');
            if (socket) socket.emit('amiralFire', { r, c });
            return;
        }

        if (phase !== 'BATTLE' || turn !== 'player') return;
        const cell = enemyGrid[r][c];
        if (cell.hit || cell.miss) return; // Zaten vurulmuş

        playerStats.shots++;
        playBattleshipSound('launch');

        if (cell.ship !== null) {
            // İSABET!
            cell.hit = true;
            cell.ship.hits++;
            playerStats.hits++;
            triggerModalShake();

            // Gemi tamamen battı mı?
            if (cell.ship.hits >= cell.ship.size) {
                cell.ship.sunk = true;
                playBattleshipSound('sunk');
                showNavalToast(`💥 Düşmanın ${cell.ship.name} gemisi BATTI!`);
            } else {
                playBattleshipSound('hit');
                showNavalToast(`🔥 İSABET! Tekrar ateş hakkı kazandınız!`);
            }

            // Zafer Kontrolü
            if (enemyShips.every(s => s.sunk)) {
                handleGameOver('player');
                return;
            }

            // Kural: İsabet eden oyuncu tekrar ateş eder!
            renderAllGrids();
            updateBattleUI();
        } else {
            // ISKA!
            cell.miss = true;
            playBattleshipSound('miss');
            showNavalToast(`🌊 Karavana! Sıra Düşman Kaptan Barbaros'ta...`);
            turn = 'ai';
            renderAllGrids();
            updateBattleUI();

            // Yapay Zeka Sırası (600ms taktiksel gecikme)
            setTimeout(executeAiTurn, 650);
        }
    }
    window.handleEnemyRadarClick = handleEnemyRadarClick;

    // Akıllı Yapay Zeka ("Kaptan Barbaros") Sırası
    function executeAiTurn() {
        if (phase !== 'BATTLE' || turn !== 'ai') return;

        let target = getAiTargetCoordinate();
        if (!target) {
            turn = 'player';
            updateBattleUI();
            return;
        }

        let { r, c } = target;
        let cell = playerGrid[r][c];

        playBattleshipSound('launch');

        if (cell.ship !== null) {
            // Yapay zeka oyuncunun gemisini vurdu!
            cell.hit = true;
            cell.ship.hits++;
            triggerModalShake();

            // Yapay zeka hedefini hafızaya al
            aiMemory.mode = 'TARGET';
            aiMemory.currentHits.push({ r, c });

            // Çevredeki komşuları hedef yığıtına ekle
            addNeighborsToTargetStack(r, c);

            if (cell.ship.hits >= cell.ship.size) {
                cell.ship.sunk = true;
                playBattleshipSound('sunk');
                showNavalToast(`⚠️ Dikkat! Senin ${cell.ship.name} gemin BATIRILDI!`);
                // Gemi battığı için hedef modundan çık
                aiMemory.mode = 'HUNT';
                aiMemory.targetStack = [];
                aiMemory.currentHits = [];
            } else {
                playBattleshipSound('hit');
                showNavalToast(`🚨 Düşman donanmanızı vurdu! Karşı atış devam ediyor...`);
            }

            // Yenilgi Kontrolü
            if (playerShips.every(s => s.sunk)) {
                handleGameOver('ai');
                return;
            }

            renderAllGrids();
            updateBattleUI();

            // İsabet ettiği için yapay zeka tekrar atış yapar!
            setTimeout(executeAiTurn, 700);
        } else {
            // Yapay zeka ıskaladı
            cell.miss = true;
            playBattleshipSound('miss');
            showNavalToast(`🛡️ Düşman ıskaladı! Sıra sende, hedef al!`);
            turn = 'player';
            renderAllGrids();
            updateBattleUI();
        }
    }

    function addNeighborsToTargetStack(r, c) {
        const directions = [
            { r: r - 1, c: c }, // Kuzey
            { r: r + 1, c: c }, // Güney
            { r: r, c: c - 1 }, // Batı
            { r: r, c: c + 1 }  // Doğu
        ];
        directions.forEach(d => {
            if (d.r >= 0 && d.r < GRID_SIZE && d.c >= 0 && d.c < GRID_SIZE) {
                if (!playerGrid[d.r][d.c].hit && !playerGrid[d.r][d.c].miss) {
                    // Tekrar eklememek için kontrol
                    if (!aiMemory.targetStack.some(t => t.r === d.r && t.c === d.c)) {
                        aiMemory.targetStack.push(d);
                    }
                }
            }
        });
    }

    function getAiTargetCoordinate() {
        // 1. Hedef yığıtında öncelikli koordinat varsa orayı vur
        while (aiMemory.targetStack.length > 0) {
            let next = aiMemory.targetStack.pop();
            if (!playerGrid[next.r][next.c].hit && !playerGrid[next.r][next.c].miss) {
                return next;
            }
        }

        // 2. Aksi halde Dama Tahtası (Parity) kuralıyla tara
        let candidates = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (!playerGrid[r][c].hit && !playerGrid[r][c].miss) {
                    if ((r + c) % 2 === 0) candidates.push({ r, c });
                }
            }
        }

        if (candidates.length > 0) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        // 3. Kalan herhangi bir hücre
        let remaining = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (!playerGrid[r][c].hit && !playerGrid[r][c].miss) {
                    remaining.push({ r, c });
                }
            }
        }
        return remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : null;
    }

    // Oyun Sonu
    function handleGameOver(winner) {
        phase = 'GAMEOVER';
        renderAllGrids();

        const banner = document.getElementById('amiralStatusBanner');
        if (serverAmiralData) {
            let isWin = (winner === 'player');
            if (isWin) {
                playBattleshipSound('win');
                if (banner) {
                    banner.innerHTML = `<span style="color:#22c55e; font-size:16px;">🏆 ZAFER! DÜŞMAN DONANMASINI BATIRDIN!${serverAmiralData.pot > 0 ? ` (+${serverAmiralData.pot} TL Pot Kazandın)` : ''}</span>`;
                }
                if (typeof window.triggerVictoryConfetti === 'function') {
                    window.triggerVictoryConfetti();
                }
            } else {
                if (banner) {
                    banner.innerHTML = `<span style="color:#ef4444; font-size:16px;">💀 BOZGUN! TÜM DONANMANIZ BATIRILDI!</span>`;
                }
            }

            const setupControls = document.getElementById('amiralSetupControls');
            if (setupControls) {
                setupControls.style.display = 'flex';
                setupControls.innerHTML = `
                    <button type="button" onclick="handleAmiralRematchClick()" style="padding:10px 22px; background:linear-gradient(135deg, #22c55e, #16a34a); color:white; border:none; border-radius:8px; font-weight:900; font-size:14px; cursor:pointer; box-shadow:0 3px 12px rgba(34,197,94,0.4);">🔄 Rövanş Oyna</button>
                `;
            }
            return;
        }

        if (winner === 'player') {
            playBattleshipSound('win');
            if (banner) {
                banner.innerHTML = `<span style="color:#22c55e; font-size:16px;">🏆 ZAFER! DÜŞMAN DONANMASINI YOK ETTİN! (+250 TL Kazandın)</span>`;
            }
            if (typeof window.triggerVictoryConfetti === 'function') {
                window.triggerVictoryConfetti();
            }
            if (window.myMoney !== undefined) {
                window.myMoney += 250;
            }
        } else {
            if (banner) {
                banner.innerHTML = `<span style="color:#ef4444; font-size:16px;">💀 BOZGUN! TÜM DONANMANIZ BATIRILDI!</span>`;
            }
        }

        const setupControls = document.getElementById('amiralSetupControls');
        if (setupControls) {
            setupControls.style.display = 'flex';
            setupControls.innerHTML = `
                <button type="button" onclick="initAmiralBatti()" style="padding:10px 22px; background:linear-gradient(135deg, #22c55e, #16a34a); color:white; border:none; border-radius:8px; font-weight:900; font-size:14px; cursor:pointer; box-shadow:0 3px 12px rgba(34,197,94,0.4);">🔄 Yeniden Oyna</button>
            `;
        }
    }

    function handleAmiralRematchClick() {
        if (serverAmiralData && socket) {
            socket.emit('amiralVoteRematch');
        } else {
            initAmiralBatti();
        }
    }
    window.handleAmiralRematchClick = handleAmiralRematchClick;

    // Toast Bildirimi
    function showNavalToast(msg) {
        const toast = document.getElementById('amiralToast');
        if (!toast) return;
        toast.innerText = msg;
        toast.style.display = 'block';
        toast.style.opacity = '1';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.style.display = 'none';
        }, 2800);
    }

    // Ekran Sallantısı (Screen Shake)
    function triggerModalShake() {
        const box = document.getElementById('amiralBattiModalContent');
        if (!box) return;
        box.classList.add('naval-shake');
        setTimeout(() => box.classList.remove('naval-shake'), 400);
    }

    // UI Güncelleme
    function renderAmiralMultiplayerBanner() {
        let bannerEl = document.getElementById('amiralMultiplayerBanner');
        if (serverAmiralData) {
            if (!bannerEl) {
                bannerEl = document.createElement('div');
                bannerEl.id = 'amiralMultiplayerBanner';
                bannerEl.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(10,25,47,0.85); border:1px solid rgba(34,197,94,0.3); border-radius:10px; padding:6px 14px; margin-bottom:10px; font-size:12px; font-weight:800;';
                const statusBanner = document.getElementById('amiralStatusBanner');
                if (statusBanner && statusBanner.parentElement) {
                    statusBanner.parentElement.insertBefore(bannerEl, statusBanner);
                }
            }
            let betText = serverAmiralData.bet > 0 ? `💰 Bahis: ${serverAmiralData.bet} TL` : `🌱 Ücretsiz`;
            let potText = serverAmiralData.pot > 0 ? `🏆 Dev Pot: ${serverAmiralData.pot} TL` : `🏆 Pot: 0 TL`;
            bannerEl.innerHTML = `
                <span style="color:#facc15;">${betText}</span>
                <span style="color:#4ade80;">${potText}</span>
                <span style="color:#38bdf8;">🎲 ${serverAmiralData.tableId}</span>
            `;
            bannerEl.style.display = 'flex';
        } else if (bannerEl) {
            bannerEl.style.display = 'none';
        }
    }

    function updateSetupUI() {
        renderAmiralMultiplayerBanner();

        const setupControls = document.getElementById('amiralSetupControls');
        if (setupControls) {
            setupControls.style.display = 'flex';
            setupControls.style.flexDirection = 'column';
            setupControls.style.alignItems = 'center';
            setupControls.style.gap = '10px';

            if (serverAmiralData && isReadySent) {
                setupControls.innerHTML = `
                    <div style="color:#facc15; font-weight:800; font-size:13px; padding:8px 18px; background:rgba(250,204,21,0.15); border:1px solid #facc15; border-radius:8px;">⏳ Hazırsınız! Rakip donanmanın hazırlanması bekleniyor...</div>
                `;
            } else {
                let nextShip = getNextShipToPlace();
                let chipsHtml = SHIPS_CONFIG.map(cfg => {
                    let placed = playerShips.some(s => s.id === cfg.id);
                    let isNext = nextShip && nextShip.id === cfg.id;
                    let border = isNext ? '2px solid #38bdf8' : (placed ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.2)');
                    let bg = placed ? 'rgba(34,197,94,0.2)' : (isNext ? 'rgba(56,189,248,0.25)' : 'rgba(0,0,0,0.35)');
                    let icon = placed ? '✅' : (isNext ? '👉' : '⏳');
                    return `<div style="display:inline-flex; align-items:center; gap:5px; padding:4px 9px; border-radius:6px; background:${bg}; border:${border}; font-size:11px; font-weight:bold; color:white;">
                        <span>${icon} ${cfg.name} (${cfg.size}k)</span>
                    </div>`;
                }).join('');

                let isAllPlaced = (playerShips.length === SHIPS_CONFIG.length);
                let startBtnText = serverAmiralData ? (isAllPlaced ? "🚀 Hazırım / Savaşa Başla!" : "⚠️ Önce 4 Gemiyi Dizin") : (isAllPlaced ? "🚀 Muharebeyi Başlat!" : "⚠️ Önce 4 Gemiyi Dizin");
                let startBtnOpacity = isAllPlaced ? '1' : '0.55';
                let startBtnCursor = isAllPlaced ? 'pointer' : 'not-allowed';

                setupControls.innerHTML = `
                    <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:center; align-items:center;">
                        ${chipsHtml}
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; align-items:center;">
                        <button type="button" onclick="handleRandomDeploy()" style="padding:8px 14px; background:linear-gradient(135deg, #0284c7, #0369a1); color:white; border:1px solid #38bdf8; border-radius:8px; font-weight:bold; font-size:12px; cursor:pointer;" title="Gemileri haritaya otomatik yerleştir">🎲 Rastgele Diz</button>
                        <button type="button" id="amiralRotateBtn" onclick="toggleOrientation()" style="padding:8px 14px; background:rgba(30,41,59,0.9); color:#facc15; border:1px solid #facc15; border-radius:8px; font-weight:bold; font-size:12px; cursor:pointer;">🔄 Yön: ${currentOrientation === 'H' ? 'Yatay ➔' : 'Dikey ⬇'}</button>
                        <button type="button" onclick="clearPlayerFleet()" style="padding:8px 14px; background:rgba(239,68,68,0.2); color:#fca5a5; border:1px solid #ef4444; border-radius:8px; font-weight:bold; font-size:12px; cursor:pointer;" title="Haritayı temizleyip kendi gemilerini tek tek diz">🗑️ Temizle</button>
                        <button type="button" onclick="startBattle()" style="padding:8px 20px; background:linear-gradient(135deg, #22c55e, #16a34a); color:white; border:none; border-radius:8px; font-weight:900; font-size:13px; cursor:${startBtnCursor}; opacity:${startBtnOpacity}; box-shadow:0 3px 10px rgba(34,197,94,0.4);">${startBtnText}</button>
                    </div>
                `;
            }
        }
        const banner = document.getElementById('amiralStatusBanner');
        if (banner) {
            let nextShip = getNextShipToPlace();
            if (nextShip) {
                banner.innerHTML = `<span style="color:#38bdf8;">⚓ <b>${nextShip.name}</b> (${nextShip.size} kare) için ızgaraya tıkla ya da <b>Rastgele Diz</b>'e bas.</span>`;
            } else {
                banner.innerHTML = `<span style="color:#4ade80;">✅ 4 geminin tamamı hazır! <b>Savaşa Başla</b> butonuna tıkla.</span>`;
            }
        }
    }

    function updateBattleUI() {
        renderAmiralMultiplayerBanner();

        const setupControls = document.getElementById('amiralSetupControls');
        if (setupControls) setupControls.style.display = 'none';

        const banner = document.getElementById('amiralStatusBanner');
        if (banner) {
            if (serverAmiralData) {
                if (serverAmiralData.isSpectator) {
                    let curPid = serverAmiralData.players[serverAmiralData.turnIndex];
                    let curName = serverAmiralData.playerProfiles[curPid]?.name || 'Oyuncu';
                    banner.innerHTML = `<span style="color:#facc15;">👁️ İzleyici Modu (Ateş Sırası: ${curName})</span>`;
                } else if (turn === 'player') {
                    banner.innerHTML = `<span style="color:#4ade80;">🎯 ATEŞ SIRASI SENDE! Düşman radarına tıkla.</span>`;
                } else {
                    let oppPid = serverAmiralData.players.find(p => p !== socket.id);
                    let oppName = (oppPid && serverAmiralData.playerProfiles[oppPid]?.name) || 'Düşman';
                    banner.innerHTML = `<span style="color:#f87171;">⚓ ${oppName} hedef alıyor...</span>`;
                }
            } else {
                if (turn === 'player') {
                    banner.innerHTML = `<span style="color:#4ade80;">🎯 ATEŞ SIRASI SENDE! Düşman radarına tıkla.</span>`;
                } else {
                    banner.innerHTML = `<span style="color:#f87171;">⚓ Düşman Kaptan Barbaros hedef alıyor...</span>`;
                }
            }
        }

        // Kalan Gemi Durumu
        renderFleetStatusHUD();
    }

    function renderFleetStatusHUD() {
        const hud = document.getElementById('amiralFleetHUD');
        if (!hud) return;

        let playerAlive = 0;
        let enemyAlive = 0;

        if (serverAmiralData && serverAmiralData.myShips && serverAmiralData.myShips.length > 0) {
            playerAlive = serverAmiralData.myShips.filter(s => !s.sunk).length;
        } else {
            playerAlive = playerShips.filter(s => !s.sunk).length;
        }

        if (serverAmiralData && serverAmiralData.oppShipsStatus && serverAmiralData.oppShipsStatus.length > 0) {
            enemyAlive = serverAmiralData.oppShipsStatus.filter(s => !s.sunk).length;
        } else {
            enemyAlive = enemyShips.filter(s => !s.sunk).length;
        }

        let oppName = "Düşman Donanması";
        if (serverAmiralData && socket) {
            let oppPid = serverAmiralData.players.find(p => p !== socket.id);
            if (oppPid && serverAmiralData.playerProfiles[oppPid]) {
                oppName = (serverAmiralData.playerProfiles[oppPid].isBot ? "🤖 " : "👤 ") + serverAmiralData.playerProfiles[oppPid].name;
            }
        }

        hud.innerHTML = `
            <div style="display:flex; justify-content:space-around; align-items:center; background:rgba(15,23,42,0.85); border:1.5px solid rgba(56,189,248,0.3); border-radius:12px; padding:8px 16px; margin-bottom:12px; font-size:13px; font-weight:800; box-shadow:0 4px 15px rgba(0,0,0,0.4);">
                <div style="color:#38bdf8; display:flex; align-items:center; gap:6px;">
                    <span>🚢 Senin Donanman:</span>
                    <span style="background:rgba(34,197,94,0.2); border:1px solid #22c55e; color:#4ade80; padding:2px 8px; border-radius:8px; font-size:14px;">${playerAlive} / 4 Sağlam</span>
                </div>
                <div style="color:#cbd5e1; font-size:12px;">🎯 İsabet: <b style="color:#facc15;">${playerStats.shots > 0 ? Math.round((playerStats.hits / playerStats.shots) * 100) : 0}%</b></div>
                <div style="color:#f87171; display:flex; align-items:center; gap:6px;">
                    <span>☠️ ${oppName}:</span>
                    <span style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#f87171; padding:2px 8px; border-radius:8px; font-size:14px;">${enemyAlive} / 4 Sağlam</span>
                </div>
            </div>
        `;
    }

    // Izgaraları Çizme (Radar & Oyuncu Gemileri)
    function renderAllGrids() {
        renderGrid('playerBoardGrid', playerGrid, false);
        renderGrid('enemyBoardGrid', enemyGrid, true);
        renderFleetStatusHUD();
    }

    function renderGrid(containerId, grid, isEnemy) {
        const cont = document.getElementById(containerId);
        if (!cont) return;
        cont.innerHTML = '';

        if (!isEnemy) {
            cont.onmouseleave = () => clearPlacementPreviews();
        }

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cellData = grid[r][c];
                const cell = document.createElement('div');
                cell.className = 'naval-cell';
                cell.dataset.r = r;
                cell.dataset.c = c;

                if (isEnemy) {
                    // Düşman radarı
                    if (cellData.hit) {
                        cell.classList.add('hit');
                        cell.innerHTML = '🔥';
                        if (cellData.sunk || (cellData.ship && cellData.ship.sunk)) {
                            cell.classList.add('sunk');
                            cell.innerHTML = '☠️';
                        }
                    } else if (cellData.miss) {
                        cell.classList.add('miss');
                        cell.innerHTML = '🌊';
                    }
                    if (phase === 'BATTLE' && turn === 'player' && !cellData.hit && !cellData.miss) {
                        cell.classList.add('clickable');
                        cell.onclick = () => handleEnemyRadarClick(r, c);
                    }
                } else {
                    // Oyuncu donanması
                    if (cellData.ship !== null) {
                        cell.classList.add('has-ship');
                        if (cellData.hit) {
                            cell.classList.add('hit');
                            let isSunk = cellData.ship?.sunk || (typeof cellData.ship === 'object' && cellData.ship.hits >= cellData.ship.size);
                            cell.innerHTML = isSunk ? '☠️' : '🔥';
                        } else {
                            cell.innerHTML = '🚢';
                        }
                    } else if (cellData.miss) {
                        cell.classList.add('miss');
                        cell.innerHTML = '🌊';
                    }

                    // Manuel Hazırlık Aşaması Etkileşimi
                    if (phase === 'SETUP' && !isReadySent) {
                        cell.onclick = () => handlePlayerGridCellClick(r, c);
                        cell.onmouseenter = () => handlePlayerGridCellHover(r, c);
                    }
                }

                cont.appendChild(cell);
            }
        }
    }

    // Sürükleme Mantığı (Window Header)
    window.addEventListener('DOMContentLoaded', () => {
        const header = document.getElementById('amiralModalHeader');
        const modal = document.getElementById('amiralBattiModalContent');
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

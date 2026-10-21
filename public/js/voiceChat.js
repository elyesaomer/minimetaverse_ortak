// public/js/voiceChat.js - WebRTC Tabanlı Canlı Sesli Sohbet Motoru (Blackjack, Masa Oyunları ve Açık Dünya)

(function () {
    const RTC_CONFIG = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    };

    let localVoiceStream = null;
    let currentVoiceTableId = null;
    let isVoiceConnected = false;
    let isMicMuted = false;
    let peerConnections = {};      // remoteSocketId -> RTCPeerConnection
    let remoteAudioElements = {};  // remoteSocketId -> HTMLAudioElement
    let vadInterval = null;
    let audioContext = null;
    let analyser = null;
    let isSpeakingLocal = false;
    let speakingPeers = new Set(); // socketIds currently speaking

    window.speakingPeers = speakingPeers;
    window.isVoiceConnected = false;
    window.isMicMuted = false;

    // 1. Dinamik Ses Kanalını Belirleme (Blackjack, Masa veya Açık Dünya Odası)
    function getEffectiveVoiceChannel() {
        // A) Blackjack Modalı Açık mı?
        const bjModal = document.getElementById('blackjackModal');
        if (bjModal && bjModal.style.display === 'flex') {
            return 'blackjack';
        }
        // B) Aktif Masa Oyunu Açık mı? (Batak vb.)
        if (window.currentActiveTableId) {
            return window.currentActiveTableId;
        }
        // C) 101 Okey Açık mı?
        if (window.okey101Data && window.okey101Data.tableId) {
            return window.okey101Data.tableId;
        }
        // D) Tavla Açık mı?
        if (window.tavlaState && window.tavlaState.gameId) {
            return 'tavla_' + window.tavlaState.gameId;
        }
        // E) Oyun Dışı: Metaverse Açık Dünya Odası (Meydan, Sahil, Cadde, Kafe vb.)
        let room = window.currentRoom || 'sokak';
        return 'room_' + room;
    }
    window.getEffectiveVoiceChannel = getEffectiveVoiceChannel;

    // Kanal İsimlendirme Yardımcısı (Toast & Buton Metinleri İçin)
    function getVoiceChannelDisplayName(channelId) {
        if (!channelId) return 'Genel';
        if (channelId === 'blackjack') return '♠️ Blackjack Masası';
        if (channelId.startsWith('room_')) {
            let r = channelId.replace('room_', '');
            const names = {
                sokak: '🌳 Meydan',
                cadde: '🛣️ Cadde',
                sahil: '🏖️ Sahil',
                kafe: '☕ Kafe',
                nargile_cafe: '💨 Nargile Lounge',
                dedenin_yeri: '⚡ Dedenin Yeri',
                ganyan: '🏇 Ganyan Bayii',
                market: '🛒 Market',
                emlakci: '🏢 Emlak Ofisi',
                sanalika_cadde: '🏙️ 1. Cadde'
            };
            return names[r] || `🏠 Ev (${r})`;
        }
        if (channelId.startsWith('batak_')) return '♠️ Batak Masası';
        if (channelId.startsWith('tavla_')) return '🎲 Tavla Masası';
        return `🎲 Masa (${channelId})`;
    }
    window.getVoiceChannelDisplayName = getVoiceChannelDisplayName;

    // 2. Ses Kanalı Hazırlığı (Masaya Otururken veya Açarken)
    function setVoiceTable(tableId) {
        if (!tableId) return;
        if (currentVoiceTableId && currentVoiceTableId !== tableId && isVoiceConnected) {
            switchVoiceChannel(tableId);
            return;
        }
        currentVoiceTableId = tableId;
        updateVoiceButtonUI();
    }
    window.setVoiceTable = setVoiceTable;

    // 3. Kesintisiz Ses Kanalı Değiştirme (Odalar Arası Yürürken veya Masaya Geçerken)
    async function switchVoiceChannel(newChannel) {
        if (!newChannel || currentVoiceTableId === newChannel) return;
        let oldChannel = currentVoiceTableId;
        currentVoiceTableId = newChannel;

        if (isVoiceConnected) {
            // Eski odadan ayrıl
            if (oldChannel && window.socket) {
                socket.emit('voiceLeaveRoom', { tableId: oldChannel });
            }
            // Mevcut eş bağlantılarını temizle
            for (let pid in peerConnections) {
                try { peerConnections[pid].close(); } catch (e) {}
            }
            peerConnections = {};

            for (let pid in remoteAudioElements) {
                if (remoteAudioElements[pid]) {
                    remoteAudioElements[pid].srcObject = null;
                    remoteAudioElements[pid].remove();
                }
            }
            remoteAudioElements = {};
            speakingPeers.clear();

            // Yeni odaya katıl
            if (window.socket) {
                socket.emit('voiceJoinRoom', { tableId: newChannel });
            }
            updateVoiceButtonUI();
            showVoiceToast(`🔄 Ses kanalı bağlandı: ${getVoiceChannelDisplayName(newChannel)}`);
        } else {
            updateVoiceButtonUI();
        }
    }
    window.switchVoiceChannel = switchVoiceChannel;

    // Açık Dünyada Mekan Değiştirildiğinde (changeRoom tetikler)
    function handleRoomChangedVoice(newRoom) {
        if (!isVoiceConnected) return;
        // Eğer oyun penceresi açıksa odaya göre kanalı bozma
        const bjModal = document.getElementById('blackjackModal');
        if (bjModal && bjModal.style.display === 'flex') return;
        const gModal = document.getElementById('gameModal');
        if (gModal && gModal.style.display === 'flex') return;
        const okeyArea = document.getElementById('okey101Area');
        if (okeyArea && okeyArea.style.display !== 'none') return;
        const xoxModal = document.getElementById('xoxModal');
        if (xoxModal && xoxModal.style.display === 'flex') return;
        const amiralModal = document.getElementById('amiralBattiModal');
        if (amiralModal && amiralModal.style.display === 'flex') return;

        let targetChannel = 'room_' + newRoom;
        if (currentVoiceTableId !== targetChannel) {
            switchVoiceChannel(targetChannel);
        }
    }
    window.handleRoomChangedVoice = handleRoomChangedVoice;

    // 4. Genel Sesli Sohbet Toggle (C Tuşu veya Butonlar)
    async function toggleGlobalVoiceChat(targetChannel = null) {
        let channel = targetChannel || getEffectiveVoiceChannel();

        if (!isVoiceConnected) {
            currentVoiceTableId = channel;
            await joinTableVoiceChat();
        } else {
            // Eğer bağlı olduğu kanal ile hedef kanal farklıysa (örn: Meydandan Blackjack'e girdi)
            if (targetChannel && currentVoiceTableId !== targetChannel) {
                await switchVoiceChannel(targetChannel);
                if (isMicMuted) toggleMicMute();
            } else {
                // Zaten aynı kanaldaysa: Mikrofonu Aç / Sessize Al (Mute/Unmute)
                toggleMicMute();
            }
        }
    }
    window.toggleGlobalVoiceChat = toggleGlobalVoiceChat;
    window.toggleTableVoiceChat = toggleGlobalVoiceChat; // Geriye dönük uyumluluk

    // 5. Ses Kanalına Bağlan (Mikrofon İzni Al ve Odaya Katıl)
    async function joinTableVoiceChat() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showVoiceToast("⚠️ Tarayıcınız canlı sesli sohbeti (WebRTC) desteklemiyor.");
            return;
        }

        if (!currentVoiceTableId) {
            currentVoiceTableId = getEffectiveVoiceChannel();
        }

        try {
            showVoiceToast("🎤 Mikrofon açılıyor, lütfen tarayıcı iznini onaylayın...");
            localVoiceStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
        } catch (err) {
            console.error("Mikrofon izni alınamadı:", err);
            let msg = "⚠️ Mikrofon izni verilmedi veya mikrofon bulunamadı!";
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                msg = "⚠️ Mikrofon izni engellendi! Lütfen adres çubuğundaki kilit simgesinden mikrofona izin verin.";
            }
            showVoiceToast(msg);
            return;
        }

        isVoiceConnected = true;
        window.isVoiceConnected = true;
        isMicMuted = false;
        window.isMicMuted = false;

        // VAD (Voice Activity Detection - Konuşma Algılama) Başlat
        startVoiceActivityDetection();

        // Sunucuya ses odasına katıldığımızı bildir
        if (window.socket) {
            socket.emit('voiceJoinRoom', { tableId: currentVoiceTableId });
        }

        updateVoiceButtonUI();
        showVoiceToast(`✅ ${getVoiceChannelDisplayName(currentVoiceTableId)} sesli sohbetine bağlandınız! (C ile konuşabilirsiniz)`);
    }
    window.joinTableVoiceChat = joinTableVoiceChat;

    // 6. Mikrofonu Sessize Al / Aç (Mute / Unmute)
    function toggleMicMute() {
        if (!localVoiceStream) return;
        isMicMuted = !isMicMuted;
        window.isMicMuted = isMicMuted;

        localVoiceStream.getAudioTracks().forEach(track => {
            track.enabled = !isMicMuted;
        });

        if (isMicMuted && isSpeakingLocal) {
            isSpeakingLocal = false;
            if (window.socket) {
                socket.emit('voiceSpeaking', { tableId: currentVoiceTableId, isSpeaking: false });
            }
            updateSpeakingUI(socket.id, false);
        }

        updateVoiceButtonUI();
        showVoiceToast(isMicMuted ? "🔇 Mikrofonunuz sessize alındı. (Açmak için C'ye basın)" : "🎙️ Mikrofonunuz açıldı. (Konuşabilirsiniz)");
    }
    window.toggleMicMute = toggleMicMute;

    // 7. Sesli Sohbetten Tamamen Ayrıl
    function leaveTableVoiceChat() {
        if (!isVoiceConnected && !currentVoiceTableId) return;

        if (vadInterval) {
            clearInterval(vadInterval);
            vadInterval = null;
        }

        if (audioContext && audioContext.state !== 'closed') {
            try { audioContext.close(); } catch (e) {}
            audioContext = null;
        }

        if (localVoiceStream) {
            localVoiceStream.getTracks().forEach(t => t.stop());
            localVoiceStream = null;
        }

        for (let pid in peerConnections) {
            try { peerConnections[pid].close(); } catch (e) {}
        }
        peerConnections = {};

        for (let pid in remoteAudioElements) {
            if (remoteAudioElements[pid]) {
                remoteAudioElements[pid].srcObject = null;
                remoteAudioElements[pid].remove();
            }
        }
        remoteAudioElements = {};
        speakingPeers.clear();

        if (currentVoiceTableId && window.socket) {
            socket.emit('voiceLeaveRoom', { tableId: currentVoiceTableId });
        }

        isVoiceConnected = false;
        window.isVoiceConnected = false;
        isMicMuted = false;
        window.isMicMuted = false;
        isSpeakingLocal = false;

        updateVoiceButtonUI();
        if (window.socket) updateSpeakingUI(socket.id, false);
        showVoiceToast("🔇 Sesli sohbetten ayrıldınız.");
    }
    window.leaveTableVoiceChat = leaveTableVoiceChat;

    // 8. Konuşma Algılama (Voice Activity Detection - VAD)
    function startVoiceActivityDetection() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(localVoiceStream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            vadInterval = setInterval(() => {
                if (!localVoiceStream || isMicMuted) {
                    if (isSpeakingLocal) {
                        isSpeakingLocal = false;
                        if (window.socket) {
                            socket.emit('voiceSpeaking', { tableId: currentVoiceTableId, isSpeaking: false });
                        }
                        if (window.socket) updateSpeakingUI(socket.id, false);
                    }
                    return;
                }

                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                let average = sum / bufferLength;

                let speaking = average > 18; // Konuşma hassasiyet eşiği
                if (speaking !== isSpeakingLocal) {
                    isSpeakingLocal = speaking;
                    if (window.socket) {
                        socket.emit('voiceSpeaking', { tableId: currentVoiceTableId, isSpeaking: speaking });
                        updateSpeakingUI(socket.id, speaking);
                    }
                }
            }, 120);
        } catch (e) {
            console.error("VAD başlatma hatası:", e);
        }
    }

    // 9. WebRTC Peer Connection Oluşturucu
    function createPeerConnection(remoteSocketId, isInitiator) {
        if (peerConnections[remoteSocketId]) {
            try { peerConnections[remoteSocketId].close(); } catch (e) {}
        }

        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnections[remoteSocketId] = pc;

        // Yerel ses kanalını ekle
        if (localVoiceStream) {
            localVoiceStream.getAudioTracks().forEach(track => {
                pc.addTrack(track, localVoiceStream);
            });
        }

        // ICE Adayları Gönderimi
        pc.onicecandidate = (event) => {
            if (event.candidate && window.socket) {
                socket.emit('voiceSignal', {
                    to: remoteSocketId,
                    signal: { type: 'candidate', candidate: event.candidate }
                });
            }
        };

        // Karşıdan Gelen Sesi Dinle ve Çal
        pc.ontrack = (event) => {
            let remoteStream = event.streams[0];
            let audioEl = remoteAudioElements[remoteSocketId];
            if (!audioEl) {
                audioEl = document.createElement('audio');
                audioEl.id = `remoteAudio_${remoteSocketId}`;
                audioEl.autoplay = true;
                audioEl.playsInline = true;
                document.body.appendChild(audioEl);
                remoteAudioElements[remoteSocketId] = audioEl;
            }
            audioEl.srcObject = remoteStream;
            audioEl.play().catch(e => {
                console.log("Ses otomatik oynatma:", e);
            });
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                if (remoteAudioElements[remoteSocketId]) {
                    remoteAudioElements[remoteAudioElements[remoteSocketId]] = null;
                    remoteAudioElements[remoteSocketId]?.remove();
                    delete remoteAudioElements[remoteSocketId];
                }
                updateSpeakingUI(remoteSocketId, false);
            }
        };

        if (isInitiator) {
            pc.onnegotiationneeded = async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    if (window.socket) {
                        socket.emit('voiceSignal', {
                            to: remoteSocketId,
                            signal: { type: 'offer', sdp: pc.localDescription }
                        });
                    }
                } catch (err) {
                    console.error("Offer oluşturma hatası:", err);
                }
            };
        }

        return pc;
    }

    // --- SOKET DİNLEYİCİLERİ ---
    if (typeof socket !== 'undefined' && socket) {
        initSocketVoiceListeners(socket);
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            if (window.socket) initSocketVoiceListeners(window.socket);
        });
    }

    function initSocketVoiceListeners(sock) {
        sock.on('voicePeersList', ({ tableId, peers }) => {
            if (!peers || peers.length === 0) return;
            peers.forEach(peer => {
                createPeerConnection(peer.socketId, true);
            });
            showVoiceToast(`👥 ${getVoiceChannelDisplayName(tableId)} kanalında ${peers.length + 1} kişi canlı.`);
        });

        sock.on('voiceUserJoined', ({ socketId, username }) => {
            if (isVoiceConnected) {
                createPeerConnection(socketId, false);
                showVoiceToast(`🎙️ ${username} sesli sohbete bağlandı.`);
            }
        });

        sock.on('voiceSignal', async ({ from, username, signal }) => {
            let pc = peerConnections[from];
            if (!pc) {
                pc = createPeerConnection(from, false);
            }

            try {
                if (signal.type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    sock.emit('voiceSignal', {
                        to: from,
                        signal: { type: 'answer', sdp: pc.localDescription }
                    });
                } else if (signal.type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                } else if (signal.type === 'candidate' && signal.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                }
            } catch (err) {
                console.error("Sinyal işleme hatası:", err);
            }
        });

        sock.on('voiceUserLeft', ({ socketId }) => {
            if (peerConnections[socketId]) {
                try { peerConnections[socketId].close(); } catch (e) {}
                delete peerConnections[socketId];
            }
            if (remoteAudioElements[socketId]) {
                remoteAudioElements[socketId].srcObject = null;
                remoteAudioElements[socketId].remove();
                delete remoteAudioElements[socketId];
            }
            speakingPeers.delete(socketId);
            updateSpeakingUI(socketId, false);
        });

        sock.on('voiceUserSpeaking', ({ socketId, username, isSpeaking }) => {
            if (isSpeaking) {
                speakingPeers.add(socketId);
            } else {
                speakingPeers.delete(socketId);
            }
            updateSpeakingUI(socketId, isSpeaking);
        });
    }

    // --- ARAYÜZ VE GÖRSEL GÖSTERGELER (UI) ---

    function updateVoiceButtonUI() {
        // 1. Batak / Masa Modal Butonu
        const btn = document.getElementById('tableVoiceBtn');
        const icon = document.getElementById('tableVoiceIcon');
        const text = document.getElementById('tableVoiceText');

        // 2. 101 Okey Butonu
        const okeyBtn = document.getElementById('okey101VoiceToggleBtn');
        const okeyIcon = document.getElementById('okey101VoiceIcon');
        const okeyText = document.getElementById('okey101VoiceText');
        const okeyInd = document.getElementById('okey101VoiceIndicator');
        const okeyStatText = document.getElementById('okey101VoiceStatusText');

        // 3. Blackjack Butonu
        const bjBtn = document.getElementById('bjVoiceToggleBtn');
        const bjIcon = document.getElementById('bjVoiceIcon');
        const bjText = document.getElementById('bjVoiceText');

        // 4. Genel Üst Bar / Açık Dünya Butonu
        const globalBtn = document.getElementById('globalVoiceNavBtn');
        const globalIcon = document.getElementById('globalVoiceIcon');
        const globalText = document.getElementById('globalVoiceText');

        if (!isVoiceConnected) {
            // A) BAĞLI DEĞİL (KAPALI)
            if (btn) {
                btn.style.background = 'linear-gradient(135deg, #475569, #334155)';
                btn.style.boxShadow = 'none';
            }
            if (icon) icon.innerText = '🎤';
            if (text) text.innerText = 'Ses Aç';

            if (okeyBtn) {
                okeyBtn.style.background = 'linear-gradient(135deg, #475569, #334155)';
                okeyBtn.style.boxShadow = 'none';
            }
            if (okeyIcon) okeyIcon.innerText = '🎤';
            if (okeyText) okeyText.innerText = 'Sesli Konuş';
            if (okeyInd) okeyInd.style.background = '#64748b';
            if (okeyStatText) okeyStatText.innerText = 'Ses Kapalı';

            if (bjBtn) {
                bjBtn.style.background = 'linear-gradient(135deg, #475569, #334155)';
                bjBtn.style.boxShadow = 'none';
                bjBtn.style.borderColor = '#64748b';
            }
            if (bjIcon) bjIcon.innerText = '🎤';
            if (bjText) bjText.innerText = 'Ses Aç (C)';

            if (globalBtn) {
                globalBtn.style.background = 'linear-gradient(135deg, #334155, #1e293b)';
                globalBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
                globalBtn.style.borderColor = 'rgba(255,255,255,0.15)';
            }
            if (globalIcon) globalIcon.innerText = '🎤';
            if (globalText) globalText.innerText = 'Sesli Sohbet (C)';

        } else if (isMicMuted) {
            // B) SESSİZDE (MUTE)
            if (btn) {
                btn.style.background = 'linear-gradient(135deg, #eab308, #ca8a04)';
                btn.style.boxShadow = '0 0 10px rgba(234,179,8,0.5)';
            }
            if (icon) icon.innerText = '🔇';
            if (text) text.innerText = 'Sessizde';

            if (okeyBtn) {
                okeyBtn.style.background = 'linear-gradient(135deg, #eab308, #ca8a04)';
                okeyBtn.style.boxShadow = '0 0 10px rgba(234,179,8,0.5)';
            }
            if (okeyIcon) okeyIcon.innerText = '🔇';
            if (okeyText) okeyText.innerText = 'Sessizde (Tıkla Aç)';
            if (okeyInd) okeyInd.style.background = '#eab308';
            if (okeyStatText) okeyStatText.innerText = 'Mikrofon Sessiz';

            if (bjBtn) {
                bjBtn.style.background = 'linear-gradient(135deg, #eab308, #ca8a04)';
                bjBtn.style.boxShadow = '0 0 12px rgba(234,179,8,0.6)';
                bjBtn.style.borderColor = '#fde047';
            }
            if (bjIcon) bjIcon.innerText = '🔇';
            if (bjText) bjText.innerText = 'Sessizde (C)';

            if (globalBtn) {
                globalBtn.style.background = 'linear-gradient(135deg, #ca8a04, #a16207)';
                globalBtn.style.boxShadow = '0 0 14px rgba(234,179,8,0.65)';
                globalBtn.style.borderColor = '#fef08a';
            }
            if (globalIcon) globalIcon.innerText = '🔇';
            if (globalText) globalText.innerText = `${getVoiceChannelDisplayName(currentVoiceTableId)}: Sessiz (C)`;

        } else {
            // C) MİKROFON AÇIK (CANLI)
            if (btn) {
                btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                btn.style.boxShadow = '0 0 12px rgba(16,185,129,0.7)';
            }
            if (icon) icon.innerText = '🎙️';
            if (text) text.innerText = 'Ses Açık';

            if (okeyBtn) {
                okeyBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                okeyBtn.style.boxShadow = '0 0 12px rgba(16,185,129,0.7)';
            }
            if (okeyIcon) okeyIcon.innerText = '🎙️';
            if (okeyText) okeyText.innerText = 'Mikrofon Açık';
            if (okeyInd) okeyInd.style.background = '#10b981';
            if (okeyStatText) okeyStatText.innerText = 'Canlı Ses Bağlı';

            if (bjBtn) {
                bjBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                bjBtn.style.boxShadow = '0 0 14px rgba(16,185,129,0.8)';
                bjBtn.style.borderColor = '#6ee7b7';
            }
            if (bjIcon) bjIcon.innerText = '🎙️';
            if (bjText) bjText.innerText = 'Ses Açık (C)';

            if (globalBtn) {
                globalBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                globalBtn.style.boxShadow = '0 0 16px rgba(16,185,129,0.85)';
                globalBtn.style.borderColor = '#a7f3d0';
            }
            if (globalIcon) globalIcon.innerText = '🎙️';
            if (globalText) globalText.innerText = `${getVoiceChannelDisplayName(currentVoiceTableId)}: Açık (C)`;
        }
    }
    window.updateVoiceButtonUI = updateVoiceButtonUI;

    function updateSpeakingUI(socketId, isSpeaking) {
        // 1. 101 Okey Skorbord Kartı
        const card = document.getElementById(`okey101PlayerCard_${socketId}`);
        if (card) {
            if (isSpeaking) {
                card.classList.add('voice-speaking');
                let badge = card.querySelector('.voice-speaking-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'voice-speaking-badge';
                    badge.innerHTML = ' 🎙️<span class="voice-wave-bars"><span></span><span></span><span></span></span>';
                    let nameEl = card.querySelector('b');
                    if (nameEl) nameEl.appendChild(badge);
                }
            } else {
                card.classList.remove('voice-speaking');
                let badge = card.querySelector('.voice-speaking-badge');
                if (badge) badge.remove();
            }
        }

        // 2. Blackjack Masası Koltukları
        if (window.bjCurrentTable && window.bjCurrentTable.seats) {
            window.bjCurrentTable.seats.forEach((seat, idx) => {
                if (seat && seat.socketId === socketId) {
                    const seatBox = document.getElementById(`bjSeatBox_${idx}`);
                    if (seatBox) {
                        if (isSpeaking) seatBox.classList.add('voice-speaking');
                        else seatBox.classList.remove('voice-speaking');
                    }
                }
            });
        }

        // 3. 2D Metaverse Canvas / Çevrimiçi Oyuncu Tag'i (Tüm Açık Dünya Odaları İçin)
        if (window.players && window.players[socketId]) {
            window.players[socketId].isSpeaking = isSpeaking;
        }
    }
    window.updateSpeakingUI = updateSpeakingUI;

    function showVoiceToast(msg) {
        let toast = document.getElementById('voiceNotificationToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'voiceNotificationToast';
            toast.className = 'voice-toast';
            document.body.appendChild(toast);
        }
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }
    window.showVoiceToast = showVoiceToast;

    // 10. "C" Tuşu Dinleyicisi (Oyun İçi ve Oyun Dışında Sesli Konuşmayı Aktif Eder)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'c' || e.key === 'C') {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT' || activeEl.isContentEditable)) {
                return; // Chat veya form alanlarına normal 'c' harfi yazılabilsin
            }
            if (e.repeat) return;
            e.preventDefault();
            toggleGlobalVoiceChat();
        }
    });

    // Sayfadan ayrılınca ses bağlantılarını temizle
    window.addEventListener('beforeunload', () => {
        leaveTableVoiceChat();
    });

})();

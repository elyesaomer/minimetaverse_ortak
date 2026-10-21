const AudioContextClass = (typeof window !== 'undefined') ? (window.AudioContext || window.webkitAudioContext) : null;
const audioCtx = AudioContextClass ? new AudioContextClass() : null;

// Ana Ses Düzeyi Yöneticisi (Settings Paneli ile Senkron)
const sfxGainNode = audioCtx ? audioCtx.createGain() : null;
if (sfxGainNode && audioCtx) sfxGainNode.connect(audioCtx.destination);

const musicGainNode = audioCtx ? audioCtx.createGain() : null;
if (musicGainNode && audioCtx) musicGainNode.connect(audioCtx.destination);

let sfxVolume = parseFloat((typeof localStorage !== 'undefined' ? localStorage.getItem('mm_sfxVolume') : null) ?? '0.8');
let musicVolume = parseFloat((typeof localStorage !== 'undefined' ? localStorage.getItem('mm_musicVolume') : null) ?? '0.7');
if (sfxGainNode && audioCtx) sfxGainNode.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
if (musicGainNode && audioCtx) musicGainNode.gain.setValueAtTime(musicVolume, audioCtx.currentTime);

function setSfxVolume(val) {
    sfxVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('mm_sfxVolume', sfxVolume);
    if (sfxGainNode) sfxGainNode.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
}
window.setSfxVolume = setSfxVolume;

function setMusicVolume(val) {
    musicVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('mm_musicVolume', musicVolume);
    if (musicGainNode) musicGainNode.gain.setValueAtTime(musicVolume, audioCtx.currentTime);
}
window.setMusicVolume = setMusicVolume;

window.getAudioSettings = () => ({ sfx: sfxVolume, music: musicVolume });

// Pre-generated SFX Noise Buffers (Performans & Sıfır GC Havuzlama)
let cardNoiseBuffer = null;
let splashNoiseBuffer = null;

function initNoiseBuffers() {
    if (!audioCtx) return;
    try {
        let sampleRate = audioCtx.sampleRate || 44100;
        // Kart hışırtısı tamponu (0.08s)
        let cSize = Math.floor(sampleRate * 0.08);
        cardNoiseBuffer = audioCtx.createBuffer(1, cSize, sampleRate);
        if (cardNoiseBuffer && typeof cardNoiseBuffer.getChannelData === 'function') {
            let cData = cardNoiseBuffer.getChannelData(0);
            if (cData) {
                for (let i = 0; i < cSize; i++) {
                    cData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (cSize * 0.3));
                }
            }
        }

        // Su şapırtısı tamponu (0.22s)
        let sSize = Math.floor(sampleRate * 0.22);
        splashNoiseBuffer = audioCtx.createBuffer(1, sSize, sampleRate);
        if (splashNoiseBuffer && typeof splashNoiseBuffer.getChannelData === 'function') {
            let sData = splashNoiseBuffer.getChannelData(0);
            if (sData) {
                for (let i = 0; i < sSize; i++) {
                    sData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sSize * 0.35));
                }
            }
        }
    } catch (e) {
        console.warn("Noise buffer havuzlama uyarısı:", e);
    }
}
try { initNoiseBuffers(); } catch (_) {}

// Nostaljik Gramofon Melodi Döngüsü
let gramophoneLoopInterval = null;
let isGramophonePlaying = false;

function playGramophoneMusic() {
    if (isGramophonePlaying) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    isGramophonePlaying = true;

    // Nostaljik Retro Melodi Notaları (Frekanslar ve Vuruşlar)
    const melodyNotes = [
        392.00, 440.00, 523.25, 587.33, 659.25, 587.33, 523.25, 440.00,
        349.23, 392.00, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00,
        329.63, 392.00, 440.00, 523.25, 659.25, 783.99, 659.25, 523.25,
        587.33, 659.25, 587.33, 523.25, 440.00, 392.00, 329.63, 261.63
    ];
    let noteIdx = 0;

    function playNextNote() {
        if (!isGramophonePlaying) return;
        let freq = melodyNotes[noteIdx % melodyNotes.length];
        noteIdx++;

        let now = audioCtx.currentTime;
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();

        // Hafif nostaljik plak/müzik kutusu tınısı (warm sine + slight vibrato)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(gain);
        gain.connect(musicGainNode);

        osc.start(now);
        osc.stop(now + 0.40);
    }

    playNextNote();
    gramophoneLoopInterval = setInterval(playNextNote, 240);
}
window.playGramophoneMusic = playGramophoneMusic;

function stopGramophoneMusic() {
    isGramophonePlaying = false;
    if (gramophoneLoopInterval) {
        clearInterval(gramophoneLoopInterval);
        gramophoneLoopInterval = null;
    }
}
window.stopGramophoneMusic = stopGramophoneMusic;

// Kullanıcı etkileşiminde (tıklama/tuş) AudioContext'i otomatik uyandırma
const unlockAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};
['click', 'keydown', 'touchstart'].forEach(evt => window.addEventListener(evt, unlockAudio, { once: true, passive: true }));

function playSound(type, param) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    try {
        if (type === 'footstep') {
            // Ritmik, hafif ve doğal zemin adım sesi
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100 + Math.random() * 25, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.035);

            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

            osc.connect(gain);
            gain.connect(sfxGainNode);
            osc.start(now);
            osc.stop(now + 0.04);
        }
        else if (type === 'card') {
            // İskambil kart atma / hışırtı sesi (Havuzlanmış tampon)
            if (!cardNoiseBuffer) initNoiseBuffers();
            let noise = audioCtx.createBufferSource();
            noise.buffer = cardNoiseBuffer;
            let filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.Q.setValueAtTime(2, now);

            let gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(sfxGainNode);
            noise.start(now);
        }
        else if (type === 'billiardHit' || type === 'billiard_hit') {
            // Bilardo toplarının çarpışma sesi (Önce assets/sounds/billiard_hit.mp3 dener, yoksa masif reçine akustik sentezine geçer)
            playCasinoSound('billiardHit');
        }
        else if (type === 'cueShoot') {
            // Istaka vuruş sesi (cue_shoot.mp3 veya deri uç akustik darbesi)
            playCasinoSound('cueShoot');
        }
        else if (type === 'pocket') {
            // Topun cebe düşme sesi (billiard_pocket.mp3 veya derin cep tok sesi)
            playCasinoSound('pocket');
        }
        else if (type === 'chatPop') {
            // Sohbet balonu patlama sesi
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.06);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

            osc.connect(gain);
            gain.connect(sfxGainNode);
            osc.start(now);
            osc.stop(now + 0.07);
        }
        else if (type === 'win') {
            // El kazanma sevinç melodisi
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.2, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.2);
            });
        }
        else if (type === 'splash') {
            // Su şapırtısı sesi (balık vurma / olta atma - Havuzlanmış tampon)
            if (!splashNoiseBuffer) initNoiseBuffers();
            let noise = audioCtx.createBufferSource();
            noise.buffer = splashNoiseBuffer;
            let filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(550, now);
            filter.frequency.exponentialRampToValueAtTime(90, now + 0.22);
            let gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(sfxGainNode);
            noise.start(now);
        }
        else if (type === 'reel') {
            // Olta sarma dişli tıkırtısı
            for (let i = 0; i < 5; i++) {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1300 + i * 160, now + i * 0.04);
                gain.gain.setValueAtTime(0.18, now + i * 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.025);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + i * 0.04);
                osc.stop(now + i * 0.04 + 0.025);
            }
        }
        else if (type === 'coin') {
            // Para kazanma şıngırtısı
            [1046.50, 1318.51, 1567.98].forEach((freq, idx) => {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0.25, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.2);
            });
        }
        else if (type === 'okeyTile') {
            // Okey taşı vurma / çekme / masaya atma sesi (tok melamin 'tak' sesi)
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(860, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(sfxGainNode);
            osc.start(now);
            osc.stop(now + 0.05);
        }
        else if (type === 'tick') {
            // Süre sayacı tik-tak sesi
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            osc.connect(gain);
            gain.connect(sfxGainNode);
            osc.start(now);
            osc.stop(now + 0.03);
        }
        else if (type === 'fanfare') {
            // Zafer & Okey Bitiş Fanfarı
            [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.09);
                gain.gain.setValueAtTime(0.3, now + idx * 0.09);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + idx * 0.09);
                osc.stop(now + idx * 0.09 + 0.35);
            });
        }
        else if (type === 'miracle') {
            // Mucizevi İlahi Göksel İniş Melodisi (Harp / Celestial Chime)
            [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00].forEach((freq, idx) => {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                gain.gain.setValueAtTime(0.22, now + idx * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.5);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.5);
            });
        }
        else if (type === 'nom' || type === 'gulp') {
            // Çizgi film "Ham / Çomp / Yutma" Komik Sesi
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(650, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.connect(gain);
            gain.connect(sfxGainNode);
            osc.start(now);
            osc.stop(now + 0.2);
        }
        else if (type === 'turn' || type === 'turnBell') {
            // Kullanıcı Talebi: Oyunlardaki gibi sıranın geldiğini bildiren iki tonlu şık ding-dong melodisi
            [880.00, 1174.66].forEach((freq, idx) => {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                gain.gain.setValueAtTime(0.3, now + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + idx * 0.1);
                osc.stop(now + idx * 0.1 + 0.35);
            });
        }
        else if (type === 'smokeBlast') {
            // Yoğun nargile dumanı patlama ve gürleme efekti
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.5);
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.connect(gain);
            gain.connect(sfxGainNode);
            osc.start(now);
            osc.stop(now + 0.5);
        }
        else if (type === 'billiardHit' || type === 'billiard_hit' || type === 'billiard' || type === 'hit') {
            playRealisticBilliardHit(now, param);
        }
        else if (type === 'billiardCushion' || type === 'cushion') {
            playRealisticBilliardCushion(now, param);
        }
        else if (type === 'cueShoot') {
            playRealisticCueShoot(now, param);
        }
        else if (type === 'pocket') {
            playRealisticPocket(now);
        }
        else if (CASINO_SOUND_FILES[type] || ['chip', 'wheel', 'roulette_spin', 'bet_start', 'card_deal', 'lose', 'spin', 'slot_spin', 'jackpot'].includes(type)) {
            playCasinoSound(type);
        }
    } catch(e) {
        // Tarayıcı otomatik ses engeli durumunda sessizce devam eder
    }
}

window.playSound = playSound;

// ============================================================================
// KAPSAMLI CASINO SES SİSTEMİ (public/assets/sounds/ Desteği & Web Audio Fallback)
// ============================================================================
const CASINO_SOUND_FILES = {
    'chip': 'chip.mp3',
    'wheel': 'wheel.mp3',
    'roulette_spin': 'wheel.mp3',
    'bet_start': 'bet_start.mp3',
    'card_deal': 'card_deal.mp3',
    'deal': 'card_deal.mp3',
    'win': 'win.mp3',
    'lose': 'lose.mp3',
    'spin': 'spin.mp3',
    'slot_spin': 'spin.mp3',
    'jackpot': 'jackpot.mp3',
    'billiardHit': 'billiard_hit.mp3',
    'billiard_hit': 'billiard_hit.mp3',
    'billiard': 'billiard_hit.mp3',
    'cueShoot': 'cue_shoot.mp3',
    'pocket': 'billiard_pocket.mp3'
};

const activeAudioInstances = {};
const soundAvailabilityCache = {};

/**
 * Casino & Oyun sesini 'public/assets/sounds/' klasöründen oynatır.
 * Eğer dosya henüz eklenmemişse veya yüklenemezse otomatik olarak
 * zengin Web Audio API sentezleyicisi (Synthesizer Fallback) ile çalar.
 */
function playCasinoSound(soundName, options = {}) {
    const fileName = CASINO_SOUND_FILES[soundName] || (soundName + '.mp3');

    // Eğer bu dosyanın diskte olmadığı daha önce tespit edildiyse doğrudan sentezleyiciye geç (0ms gecikme)
    if (soundAvailabilityCache[fileName] === false) {
        playSynthesizedCasinoSound(soundName);
        return;
    }

    const soundPath = `assets/sounds/${fileName}`;
    const vol = (options.volume !== undefined) ? options.volume : sfxVolume;

    try {
        let audio = new Audio(soundPath);
        audio.volume = Math.max(0, Math.min(1, vol));

        if (options.loop) {
            audio.loop = true;
        }

        activeAudioInstances[soundName] = audio;

        let playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                soundAvailabilityCache[fileName] = true;
            }).catch(err => {
                soundAvailabilityCache[fileName] = false;
                playSynthesizedCasinoSound(soundName);
            });
        }
    } catch (e) {
        soundAvailabilityCache[fileName] = false;
        playSynthesizedCasinoSound(soundName);
    }
}
window.playCasinoSound = playCasinoSound;

function stopCasinoSound(soundName) {
    if (activeAudioInstances[soundName]) {
        try {
            activeAudioInstances[soundName].pause();
            activeAudioInstances[soundName].currentTime = 0;
        } catch (e) {}
        delete activeAudioInstances[soundName];
    }
}
window.stopCasinoSound = stopCasinoSound;

/**
 * Web Audio API ile gerçekçi casino ses sentezleme motoru (Fallback & Zero-dependency)
 */
function playSynthesizedCasinoSound(name) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    try {
        if (name === 'chip') {
            // Gerçekçi seramik casino çipi çarpışma ve masaya konma sesi (çift klik)
            [0, 0.025].forEach((delay, idx) => {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(2600 + idx * 600, now + delay);
                osc.frequency.exponentialRampToValueAtTime(700, now + delay + 0.035);
                gain.gain.setValueAtTime(0.28, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + delay);
                osc.stop(now + delay + 0.045);
            });
        }
        else if (name === 'wheel' || name === 'roulette_spin') {
            // Rulet çarkı dönüşü ve topun metal bölmelere sürtünme pıtırtısı
            for (let i = 0; i < 28; i++) {
                let t = now + (i * 0.04) + Math.pow(i / 28, 2.2) * 2.8;
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(2200 - i * 35, t);
                osc.frequency.exponentialRampToValueAtTime(800, t + 0.015);
                gain.gain.setValueAtTime(0.18 * (1 - i / 32), t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(t);
                osc.stop(t + 0.025);
            }
        }
        else if (name === 'bet_start') {
            // Tur başlangıcı / Bahis açılış zili (Zarif iki tonlu pirinç çan melodisi)
            [659.25, 830.61].forEach((freq, idx) => {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                gain.gain.setValueAtTime(0.3, now + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + idx * 0.12);
                osc.stop(now + idx * 0.12 + 0.5);
            });
        }
        else if (name === 'card_deal' || name === 'deal') {
            // İskambil kart çekme / dağıtma 'fışşt' sesi
            if (!cardNoiseBuffer) initNoiseBuffers();
            let noise = audioCtx.createBufferSource();
            noise.buffer = cardNoiseBuffer;
            let filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.Q.setValueAtTime(2.5, now);
            let gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(sfxGainNode);
            noise.start(now);
        }
        else if (name === 'win') {
            // Casino kazanç zafer akoru ve parıldayan altın melodisi
            [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.32, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.35);
            });
        }
        else if (name === 'lose') {
            // Casino el kaybetme hafif hüzünlü bas akoru
            [349.23, 311.13, 261.63, 196.00].forEach((freq, idx) => {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.11);
                gain.gain.setValueAtTime(0.24, now + idx * 0.11);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.3);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + idx * 0.11);
                osc.stop(now + idx * 0.11 + 0.32);
            });
        }
        else if (name === 'spin' || name === 'slot_spin') {
            // Slot makara dönüşü tıkır tıkır dişli mekanizma sesi
            for (let i = 0; i < 12; i++) {
                let t = now + i * 0.06;
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(900 + (i % 3) * 120, t);
                gain.gain.setValueAtTime(0.18, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(t);
                osc.stop(t + 0.035);
            }
        }
        else if (name === 'jackpot') {
            // 🌟 BÜYÜK COŞKULU GLOBAL JACKPOT KUTLAMA FANFARI 🌟
            // 1. Bas ve Tiz Fanfar Akorları
            const fanfare = [
                { f: 523.25, d: 0.00 }, { f: 659.25, d: 0.00 }, { f: 783.99, d: 0.00 }, // C Maj
                { f: 659.25, d: 0.16 }, { f: 783.99, d: 0.16 }, { f: 987.77, d: 0.16 }, // E Maj
                { f: 783.99, d: 0.32 }, { f: 1046.50, d: 0.32 }, { f: 1318.51, d: 0.32 }, // G-C-E
                { f: 1046.50, d: 0.50 }, { f: 1318.51, d: 0.50 }, { f: 1567.98, d: 0.50 }, { f: 2093.00, d: 0.50 } // Yüksek Zafer Akoru
            ];

            fanfare.forEach(note => {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note.f, now + note.d);
                gain.gain.setValueAtTime(0.28, now + note.d);
                gain.gain.exponentialRampToValueAtTime(0.001, now + note.d + 0.45);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + note.d);
                osc.stop(now + note.d + 0.48);
            });

            // 2. Altın Sikke / Para Yağmuru Pırıltısı (Coin Shower Arpeggio)
            for (let c = 0; c < 16; c++) {
                let coinDelay = 0.55 + c * 0.055;
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1400 + Math.random() * 800, now + coinDelay);
                gain.gain.setValueAtTime(0.25, now + coinDelay);
                gain.gain.exponentialRampToValueAtTime(0.001, now + coinDelay + 0.18);
                osc.connect(gain);
                gain.connect(sfxGainNode);
                osc.start(now + coinDelay);
                osc.stop(now + coinDelay + 0.2);
            }
        }
        else if (name === 'billiardHit' || name === 'billiard_hit' || name === 'billiard') {
            playRealisticBilliardHit(now);
        }
        else if (name === 'billiardCushion' || name === 'cushion') {
            playRealisticBilliardCushion(now);
        }
        else if (name === 'cueShoot') {
            playRealisticCueShoot(now);
        }
        else if (name === 'pocket') {
            playRealisticPocket(now);
        }
    } catch (e) {}
}

/**
 * 🎱 ULTRA GERÇEKÇİ AKUSTİK BİLARDO TOPU ÇARPIŞMASI (Aramith Phenolic Resin Acoustics)
 * @param {number} [now]
 * @param {number} [intensity=0.8] - 0.1 ile 1.0 arası vuruş hızı/şiddeti
 */
function playRealisticBilliardHit(now, intensity = 0.8) {
    if (!audioCtx) return;
    const t = now || audioCtx.currentTime;
    const power = Math.max(0.12, Math.min(1.0, (typeof intensity === 'number' && !isNaN(intensity)) ? intensity : 0.8));

    // Doğal akustik varyasyon (Her topta farklı Hertz mikrosapması)
    const jitter = (Math.random() - 0.5) * 70;
    const crackFreq = 4800 + jitter * 2;
    const mode1 = 1260 + jitter;
    const mode2 = 3150 + jitter * 1.5;

    // 1. Sert Kristalin Kontak İmpulsu (Hertzian Ultra-Fast Contact Crack - 0.003s)
    let oscClick = audioCtx.createOscillator();
    let gainClick = audioCtx.createGain();
    let filterClick = audioCtx.createBiquadFilter();

    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(crackFreq, t);
    oscClick.frequency.exponentialRampToValueAtTime(1200, t + 0.005);

    filterClick.type = 'bandpass';
    filterClick.frequency.setValueAtTime(crackFreq, t);
    filterClick.Q.setValueAtTime(3.5, t);

    gainClick.gain.setValueAtTime(0.75 * power, t);
    gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.007);

    oscClick.connect(filterClick);
    filterClick.connect(gainClick);
    gainClick.connect(sfxGainNode);
    oscClick.start(t);
    oscClick.stop(t + 0.009);

    // 2. Fenolik Reçine Katı Küre Titreşimi (Solid Phenolic Sphere Resonance - 1260 Hz)
    let oscMode1 = audioCtx.createOscillator();
    let gainMode1 = audioCtx.createGain();
    oscMode1.type = 'sine';
    oscMode1.frequency.setValueAtTime(mode1, t);
    oscMode1.frequency.exponentialRampToValueAtTime(mode1 * 0.92, t + 0.045);

    let ringDecay = 0.025 + power * 0.035;
    gainMode1.gain.setValueAtTime(0.48 * power, t);
    gainMode1.gain.exponentialRampToValueAtTime(0.001, t + ringDecay);

    oscMode1.connect(gainMode1);
    gainMode1.connect(sfxGainNode);
    oscMode1.start(t);
    oscMode1.stop(t + ringDecay + 0.005);

    // 3. Üst Harmonik Çınlama (High Harmonic Ring - 3150 Hz)
    let oscMode2 = audioCtx.createOscillator();
    let gainMode2 = audioCtx.createGain();
    oscMode2.type = 'triangle';
    oscMode2.frequency.setValueAtTime(mode2, t);
    oscMode2.frequency.exponentialRampToValueAtTime(2200, t + 0.02);

    let highDecay = 0.012 + power * 0.016;
    gainMode2.gain.setValueAtTime(0.32 * power, t);
    gainMode2.gain.exponentialRampToValueAtTime(0.001, t + highDecay);

    oscMode2.connect(gainMode2);
    gainMode2.connect(sfxGainNode);
    oscMode2.start(t);
    oscMode2.stop(t + highDecay + 0.005);

    // 4. Mermer Tabla ve Çuha Bas Darbesi (Slate Bed Thud - 140Hz -> 48Hz)
    let oscSlate = audioCtx.createOscillator();
    let gainSlate = audioCtx.createGain();
    oscSlate.type = 'sine';
    oscSlate.frequency.setValueAtTime(140 + (Math.random() - 0.5) * 20, t);
    oscSlate.frequency.exponentialRampToValueAtTime(48, t + 0.035);

    gainSlate.gain.setValueAtTime(0.38 * power, t);
    gainSlate.gain.exponentialRampToValueAtTime(0.001, t + 0.038);

    oscSlate.connect(gainSlate);
    gainSlate.connect(sfxGainNode);
    oscSlate.start(t);
    oscSlate.stop(t + 0.042);
}

/**
 * 🎱 BANT ÇARPMA SESİ (Rubber Cushion & Felt Bounce)
 * @param {number} [now]
 * @param {number} [intensity=0.8]
 */
function playRealisticBilliardCushion(now, intensity = 0.8) {
    if (!audioCtx) return;
    const t = now || audioCtx.currentTime;
    const power = Math.max(0.15, Math.min(1.0, (typeof intensity === 'number' && !isNaN(intensity)) ? intensity : 0.8));

    // Kauçuk tampon ve çuha darbesi (Muffled rubbery thud)
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    let filter = audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130 + (Math.random() - 0.5) * 15, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.065);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.065);

    gain.gain.setValueAtTime(0.40 * power, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.075);
}

/**
 * 🎱 ISTAKA VURUŞ SESİ (Leather Cue Tip Impact)
 */
function playRealisticCueShoot(now, power = 1.0) {
    if (!audioCtx) return;
    const t = now || audioCtx.currentTime;
    const p = Math.max(0.2, Math.min(1.0, (typeof power === 'number' && !isNaN(power)) ? power : 1.0));

    // Deri tebeşirli ıstaka ucu darbesi
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(780, t);
    osc.frequency.exponentialRampToValueAtTime(130, t + 0.05);

    gain.gain.setValueAtTime(0.55 * p, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

    osc.connect(gain);
    gain.connect(sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.06);

    // Ahşap akçaağaç şaft titreşimi
    let oscWood = audioCtx.createOscillator();
    let gainWood = audioCtx.createGain();
    oscWood.type = 'sine';
    oscWood.frequency.setValueAtTime(290, t);
    oscWood.frequency.exponentialRampToValueAtTime(85, t + 0.04);

    gainWood.gain.setValueAtTime(0.30 * p, t);
    gainWood.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    oscWood.connect(gainWood);
    gainWood.connect(sfxGainNode);
    oscWood.start(t);
    oscWood.stop(t + 0.045);
}

/**
 * 🎱 TOPUN CEBE DÜŞME SESİ (Cloth / Leather Pocket Drop)
 */
function playRealisticPocket(now) {
    if (!audioCtx) return;
    const t = now || audioCtx.currentTime;

    // 1. Deri/file cep tabanına ağır düşüş darbesi (Heavy pocket bottom thud)
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.14);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.15);

    // 2. Ağ ve deri çıtırtısı (Pocket leather rattle)
    let oscRattle = audioCtx.createOscillator();
    let gainRattle = audioCtx.createGain();
    oscRattle.type = 'triangle';
    oscRattle.frequency.setValueAtTime(320, t + 0.02);
    oscRattle.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    gainRattle.gain.setValueAtTime(0.28, t + 0.02);
    gainRattle.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    oscRattle.connect(gainRattle);
    gainRattle.connect(sfxGainNode);
    oscRattle.start(t + 0.02);
    oscRattle.stop(t + 0.13);
}


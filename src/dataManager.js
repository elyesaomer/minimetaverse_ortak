// src/dataManager.js - Mongoose & MongoDB Destekli Kalıcı Veri ve Kimlik Doğrulama Katmanı
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');

const DATA_FILE = config.DATA_FILE;
const BACKUP_FILE = config.BACKUP_FILE;

// Bellek İçi Hızlı Erişim & Çalışma Zamanı Havuzu
let persistentData = {
    users: {},
    leaderboard: {
        billiard: {},
        batak: {},
        tavla: {},
        okey101: {},
        xox: {},
        amiral: {}
    }
};

// --- 1. KRİPTOGRAFİK ŞİFRELEME (SCRYPT İLE GÜVENLİ HASH) ---
function hashPassword(password, salt) {
    if (!salt) {
        salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.scryptSync(password, salt, 32).toString('hex');
    return { hash, salt };
}

function verifyPassword(password, storedHash, salt) {
    if (!storedHash || !salt || typeof password !== 'string') return false;
    try {
        const hash = crypto.scryptSync(password, salt, 32).toString('hex');
        const bufA = Buffer.from(hash, 'hex');
        const bufB = Buffer.from(storedHash, 'hex');
        if (bufA.length !== bufB.length) return false;
        return crypto.timingSafeEqual(bufA, bufB);
    } catch (e) {
        return false;
    }
}

// --- 2. MONGOOSE İLE VERİ TABANINA ASENKRON ANLIK KAYIT ---
async function saveUserData(username, updateFields = null) {
    if (!username) return;
    const uKey = findUserKey(username) || username;
    if (updateFields && persistentData.users[uKey]) {
        Object.assign(persistentData.users[uKey], updateFields);
    }
    const dataToSave = updateFields || persistentData.users[uKey];
    if (!dataToSave) return;

    if (mongoose.connection.readyState === 1) {
        try {
            const updateDoc = { ...dataToSave };
            delete updateDoc._id;
            delete updateDoc.__v;
            await User.findOneAndUpdate(
                { username: { $regex: new RegExp(`^${uKey}$`, 'i') } },
                { $set: updateDoc },
                { upsert: true, new: true }
            );
        } catch (err) {
            console.error(`❌ [MONGODB HATA]: ${username} kullanıcısı kaydedilemedi:`, err.message);
        }
    }

    // Yerel data.json yedeğini daima senkronize tut
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(persistentData, null, 2), 'utf-8');
    } catch (_) {}
}

async function savePersistentData(targetUsername = null) {
    if (targetUsername) {
        await saveUserData(targetUsername);
        return;
    }

    if (mongoose.connection.readyState === 1) {
        try {
            const bulkOps = [];
            for (const [uname, uData] of Object.entries(persistentData.users)) {
                const doc = { ...uData };
                delete doc._id;
                delete doc.__v;
                bulkOps.push({
                    updateOne: {
                        filter: { username: { $regex: new RegExp(`^${uname}$`, 'i') } },
                        update: { $set: doc },
                        upsert: true
                    }
                });
            }
            if (bulkOps.length > 0) {
                await User.bulkWrite(bulkOps);
            }
        } catch (err) {
            console.error('❌ [MONGODB HATA]: Toplu kayıt hatası:', err.message);
        }
    }

    // Yerel data.json yedeğini ve liderlik tablosunu (leaderboard) daima senkronize tut
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(persistentData, null, 2), 'utf-8');
    } catch (_) {}
}

// Geriye dönük uyumluluk aliasları
function savePersistentDataAtomic() {
    return savePersistentData();
}

function flushNow() {
    return savePersistentData();
}

// --- 3. VERİ YÜKLEME VE İLK KURULUMDA DATA.JSON'DAN MONGODB'YE AKTARMA ---
async function loadPersistentData() {
    if (mongoose.connection.readyState === 1) {
        try {
            const users = await User.find({}).lean();
            persistentData.users = {};
            for (const u of users) {
                persistentData.users[u.username] = u;
            }
            console.log(`🍃 [MONGODB]: Kalıcı veriler MongoDB'den yüklendi (${users.length} kullanıcı).`);
            return;
        } catch (err) {
            console.error('❌ [MONGODB]: Veriler MongoDB\'den yüklenemedi:', err.message);
        }
    }

    // MongoDB bağlantısı henüz aktif değilse yerel önbellek dosyasından yükle
    if (fs.existsSync(DATA_FILE)) {
        try {
            const content = fs.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(content);
            persistentData.users = parsed.users || {};
            persistentData.leaderboard = parsed.leaderboard || { billiard: {}, batak: {}, tavla: {}, okey101: {}, xox: {}, amiral: {} };
            console.log(`📁 Yerel önbellekten veriler yüklendi (${Object.keys(persistentData.users).length} kullanıcı).`);
        } catch (e) {
            console.warn("Yerel veri okuma uyarısı:", e.message);
        }
    }
}

// MongoDB'ye ilk bağlantıda data.json'daki kullanıcıları içe aktarma
async function syncDataJsonToMongo() {
    if (mongoose.connection.readyState !== 1) return;
    try {
        const count = await User.countDocuments();
        if (count === 0 && fs.existsSync(DATA_FILE)) {
            console.log('🍃 [MONGODB]: MongoDB kullanıcı koleksiyonu boş. data.json verileri aktarılıyor...');
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            const userDocs = [];
            for (const [uname, u] of Object.entries(parsed.users || {})) {
                userDocs.push({
                    username: uname,
                    ...u
                });
            }
            if (userDocs.length > 0) {
                await User.insertMany(userDocs, { ordered: false });
                console.log(`✅ [MONGODB]: ${userDocs.length} adet kullanıcı MongoDB'ye başarıyla aktarıldı!`);
            }
        }

        // Güncel verileri MongoDB'den belleğe çek
        const allUsers = await User.find({}).lean();
        for (const u of allUsers) {
            persistentData.users[u.username] = u;
        }

        // Canlı moderatör rolü güvencesi (Elyesa)
        let elyesaKey = findUserKey('elyesa') || 'Elyesa';
        if (persistentData.users[elyesaKey]) {
            persistentData.users[elyesaKey].role = 'mod';
            persistentData.users[elyesaKey].isMod = true;
            await User.updateOne({ username: /^elyesa$/i }, { $set: { role: 'mod', isMod: true } }).catch(() => {});
        }
        console.log(`🍃 [MONGODB]: Canlı veriler MongoDB ile senkronize edildi (${allUsers.length} kullanıcı).`);
    } catch (err) {
        console.error('❌ [MONGODB]: Senkronizasyon hatası:', err.message);
    }
}

// İlk başlatma
loadPersistentData();

// --- 3.1 ADMİN KULLANICILARI VE YETKİ KONTROLÜ ---
const ADMIN_USERS = ['yasin', 'maltoroz'];
const MOD_USERS = ['elyesa'];

function isUserAdmin(name) {
    if (!name || typeof name !== 'string') return false;
    return ADMIN_USERS.includes(name.toLowerCase().trim());
}

function isUserMod(name) {
    if (!name || typeof name !== 'string') return false;
    let lower = name.toLowerCase().trim();
    if (MOD_USERS.includes(lower)) return true;
    let uKey = findUserKey(name);
    let u = uKey ? persistentData.users[uKey] : null;
    return !!(u && (u.role === 'mod' || u.role === 'moderator' || u.isMod === true));
}

// --- 4. KULLANICI ARAMA & EV / ODA AYRIŞTIRICILARI ---
function findUserKey(name) {
    if (!name || typeof name !== 'string') return null;
    let lower = name.toLowerCase().trim();
    return Object.keys(persistentData.users).find(k => k.toLowerCase() === lower) || null;
}

function parseHouseRoom(roomName) {
    if (!roomName || !roomName.toLowerCase().startsWith('house_')) return null;
    let parts = roomName.substring(6).split('_');
    let last = parts[parts.length - 1]?.toLowerCase();
    let houseType = (last === 'standart' || last === 'garden' || last === 'pool') ? last : null;
    let rawOwner = houseType ? parts.slice(0, -1).join('_') : parts.join('_');
    let owner = findUserKey(rawOwner) || rawOwner;
    return { owner, houseType };
}

function getFriendListData(username, playersOnline = {}) {
    let uKey = findUserKey(username) || username;
    let uData = persistentData.users[uKey];
    if (!uData || !uData.friends) return [];
    return uData.friends.map(fName => {
        let fKey = findUserKey(fName) || fName;
        let onlinePlayer = Object.values(playersOnline).find(p => p.name && p.name.toLowerCase() === fKey.toLowerCase());
        let fData = persistentData.users[fKey];
        return {
            username: fKey,
            isOnline: !!onlinePlayer,
            room: onlinePlayer ? onlinePlayer.room : null,
            house: fData ? fData.house : null
        };
    });
}

// --- 5. GÜVENLİ GİRİŞ, KAYIT VE ŞİFRE DEĞİŞTİRME (ASYNC / MONGOOSE) ---
async function loginUser(rawName, password, playersOnline = {}) {
    if (!rawName || typeof rawName !== 'string') {
        return { success: false, message: "❌ Kullanıcı adı boş olamaz!" };
    }
    const cleanName = rawName.trim();
    if (!password || typeof password !== 'string' || password.length < 3) {
        return { success: false, message: "❌ Şifre en az 3 karakter olmalıdır!" };
    }

    let uData = null;
    let existingKey = null;

    if (mongoose.connection.readyState === 1) {
        try {
            const dbUser = await User.findByUsername(cleanName);
            if (dbUser) {
                uData = dbUser.toObject ? dbUser.toObject() : dbUser;
                existingKey = uData.username;
                persistentData.users[existingKey] = uData;
            }
        } catch (e) {
            console.error('MongoDB loginUser sorgu hatası:', e.message);
        }
    }

    if (!uData) {
        existingKey = findUserKey(cleanName);
        if (existingKey) {
            uData = persistentData.users[existingKey];
        }
    }

    if (!existingKey || !uData) {
        return { 
            success: false, 
            message: "❌ Böyle bir hesap bulunamadı! Henüz hesabınız yoksa lütfen 'Kayıt Ol' sekmesini kullanın." 
        };
    }

    // Çevrimiçi Çift Giriş Kontrolü (Aynı hesapla 2. giriş engeli)
    const isAlreadyOnline = Object.values(playersOnline).some(
        p => p && p.name && p.name.toLowerCase() === existingKey.toLowerCase()
    );
    if (isAlreadyOnline) {
        return {
            success: false,
            message: "⚠️ Bu hesap şu anda oyunda aktif! Eğer bu sizseniz diğer sekmeyi kapatın veya birkaç saniye bekleyin."
        };
    }

    // Şifre Doğrulama
    if (uData.auth && uData.auth.hash && uData.auth.salt) {
        const isValid = verifyPassword(password, uData.auth.hash, uData.auth.salt);
        if (!isValid) {
            return { success: false, message: "❌ Şifre hatalı!" };
        }
        if (isUserAdmin(existingKey)) {
            uData.role = 'admin';
            uData.isAdmin = true;
        } else if (isUserMod(existingKey)) {
            uData.role = 'mod';
            uData.isMod = true;
        }
        return {
            success: true,
            username: existingKey,
            userData: uData,
            isNew: false
        };
    }

    // Eski (legacy) hesap ilk girişte şifresini bağlar
    const { hash, salt } = hashPassword(password);
    uData.auth = { hash, salt };
    if (isUserAdmin(existingKey)) {
        uData.role = 'admin';
        uData.isAdmin = true;
    } else if (isUserMod(existingKey)) {
        uData.role = 'mod';
        uData.isMod = true;
    }
    persistentData.users[existingKey] = uData;
    await saveUserData(existingKey, uData);

    return {
        success: true,
        username: existingKey,
        userData: uData,
        isNew: false,
        upgraded: true
    };
}

async function registerUser(rawName, password, gender = 'male') {
    if (!rawName || typeof rawName !== 'string') {
        return { success: false, message: "❌ Kullanıcı adı boş olamaz!" };
    }
    const cleanName = rawName.trim();
    if (cleanName.length < 2 || cleanName.length > 20) {
        return { success: false, message: "❌ Kullanıcı adı 2-20 karakter arasında olmalıdır!" };
    }
    const USERNAME_REGEX = /^[a-zA-Z0-9_çÇğĞıİöÖşŞüÜ-]+( [a-zA-Z0-9_çÇğĞıİöÖşŞüÜ-]+)*$/;
    if (!USERNAME_REGEX.test(cleanName)) {
        return { success: false, message: "❌ Kullanıcı adı yalnızca harf, rakam, boşluk, tire ve alt çizgi içerebilir!" };
    }
    if (!password || typeof password !== 'string' || password.length < 3) {
        return { success: false, message: "❌ Şifre en az 3 karakter olmalıdır!" };
    }

    if (mongoose.connection.readyState === 1) {
        const existing = await User.findByUsername(cleanName);
        if (existing) {
            return { 
                success: false, 
                message: "❌ Bu kullanıcı adı zaten alınmış! Lütfen başka bir ad seçin veya 'Giriş Yap' sekmesini kullanın." 
            };
        }
    } else if (findUserKey(cleanName)) {
        return { 
            success: false, 
            message: "❌ Bu kullanıcı adı zaten alınmış! Lütfen başka bir ad seçin veya 'Giriş Yap' sekmesini kullanın." 
        };
    }

    const isFem = (gender === 'female');
    const { hash, salt } = hashPassword(password);

    const newUser = {
        username: cleanName,
        money: 1000,
        gender: gender || 'male',
        auth: { hash, salt },
        role: isUserAdmin(cleanName) ? 'admin' : (isUserMod(cleanName) ? 'mod' : 'user'),
        isAdmin: isUserAdmin(cleanName),
        isMod: isUserMod(cleanName),
        avatar: {
            model: 'classic',
            hat: isFem ? 'hair_long' : 'bere',
            face: 'none',
            skinColor: '#ffd1a4',
            shirtColor: isFem ? 'dress_pink' : '#3b82f6',
            color: isFem ? 'dress_pink' : '#3b82f6',
            heldItem: 'none',
            shoes: isFem ? 'flats' : 'sneakers'
        },
        inventory: isFem 
            ? ['hats_hair_long', 'skins_#ffd1a4', 'shirts_dress_pink', 'shoes_flats', 'face_none', 'props_none']
            : ['hats_bere', 'skins_#facc15', 'shirts_#3b82f6', 'shoes_sneakers', 'face_none', 'props_none'],
        friends: [],
        friendRequests: [],
        house: null,
        houses: {},
        furnitureInventory: [],
        propInventory: {}
    };

    if (mongoose.connection.readyState === 1) {
        try {
            await User.create(newUser);
        } catch (dbErr) {
            console.error('MongoDB registerUser hatası:', dbErr.message);
            return { success: false, message: "❌ Veritabanına kayıt sırasında bir hata oluştu!" };
        }
    }

    persistentData.users[cleanName] = newUser;

    return {
        success: true,
        username: cleanName,
        userData: newUser,
        isNew: true
    };
}

async function changeUserPassword(username, oldPassword, newPassword) {
    if (!username || !oldPassword || !newPassword) {
        return { success: false, message: "❌ Lütfen tüm şifre alanlarını doldurun!" };
    }
    const cleanName = username.trim();
    let uData = null;
    let uKey = null;

    if (mongoose.connection.readyState === 1) {
        const userDoc = await User.findByUsername(cleanName);
        if (userDoc) {
            uData = userDoc;
            uKey = userDoc.username;
        }
    }

    if (!uData) {
        uKey = findUserKey(cleanName);
        if (uKey) uData = persistentData.users[uKey];
    }

    if (!uKey || !uData) {
        return { success: false, message: "❌ Kullanıcı bulunamadı!" };
    }

    if (!uData.auth || !uData.auth.hash) {
        return { success: false, message: "❌ Hesabın şifresi doğrulanamadı!" };
    }

    const isOldValid = verifyPassword(oldPassword, uData.auth.hash, uData.auth.salt);
    if (!isOldValid) {
        return { success: false, message: "❌ Mevcut eski şifrenizi yanlış girdiniz!" };
    }

    if (newPassword.length < 3) {
        return { success: false, message: "❌ Yeni şifre en az 3 karakter olmalıdır!" };
    }

    if (oldPassword === newPassword) {
        return { success: false, message: "❌ Yeni şifre eski şifrenizle aynı olamaz!" };
    }

    const { hash, salt } = hashPassword(newPassword);
    uData.auth = { hash, salt };

    if (persistentData.users[uKey]) {
        persistentData.users[uKey].auth = { hash, salt };
    }

    await saveUserData(uKey, { auth: { hash, salt } });

    return { success: true, message: "✅ Şifreniz başarıyla değiştirildi!" };
}

function authenticateOrRegister(rawName, password, gender = 'male', playersOnline = {}) {
    const existingKey = findUserKey(rawName);
    if (existingKey) {
        return loginUser(rawName, password, playersOnline);
    } else {
        return registerUser(rawName, password, gender);
    }
}

// --- 6. GİRDİ SANİTİZASYON VE DOĞRULAMA (INPUT SANITIZATION) ---
function sanitizeAmount(val, min = 0, max = 100000000) {
    let num = parseInt(val, 10);
    if (isNaN(num) || !Number.isFinite(num)) return null;
    if (num < min || num > max) return null;
    return num;
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function sanitizeString(str, maxLen = 100, doEscape = true) {
    if (typeof str !== 'string') return '';
    let clean = str.trim().slice(0, maxLen);
    return doEscape ? escapeHtml(clean) : clean;
}

// --- 7. GÜNLÜK GÖREVLER (DAILY QUESTS) SİSTEMİ ---
function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEFAULT_DAILY_QUESTS_DEF = [
    { id: 'okey101_play', title: '🀄 101 Okey Partisi', desc: "101 Okey masasında 1 el tamamla", target: 1, reward: config.DAILY_QUEST_REWARDS.okey101_play },
    { id: 'batak_play', title: '🃏 Koz Batak Ustası', desc: "Batak masasında 1 el tamamla", target: 1, reward: config.DAILY_QUEST_REWARDS.batak_play },
    { id: 'tavla_play', title: '🎲 Tavla Mücadelesi', desc: "Tavla masasında 1 oyun tamamla", target: 1, reward: config.DAILY_QUEST_REWARDS.tavla_play },
    { id: 'drink_tea', title: '☕ Tavşan Kanlı Çay', desc: "Kıraathane çay ocağından taze çay iç", target: 1, reward: config.DAILY_QUEST_REWARDS.drink_tea },
    { id: 'go_fishing', title: '🎣 Göl Kenarı Balıkçısı', desc: "Göl kenarında 1 kez olta atıp balık tut", target: 1, reward: config.DAILY_QUEST_REWARDS.go_fishing }
];

async function getUserDailyQuests(username) {
    const uKey = findUserKey(username) || username;
    let uData = persistentData.users[uKey];

    if (!uData && mongoose.connection.readyState === 1) {
        const dbU = await User.findByUsername(username);
        if (dbU) {
            uData = dbU.toObject ? dbU.toObject() : dbU;
            persistentData.users[uData.username] = uData;
        }
    }

    if (!uData) return [];
    const today = getTodayDateString();

    if (!uData.dailyQuests || uData.dailyQuests.date !== today) {
        uData.dailyQuests = {
            date: today,
            quests: DEFAULT_DAILY_QUESTS_DEF.map(q => ({
                id: q.id,
                title: q.title,
                desc: q.desc,
                target: q.target,
                reward: q.reward,
                current: 0,
                claimed: false
            }))
        };
        await saveUserData(uKey, { dailyQuests: uData.dailyQuests });
    } else {
        let rewardsUpdated = false;
        for (const quest of uData.dailyQuests.quests) {
            const definition = DEFAULT_DAILY_QUESTS_DEF.find(q => q.id === quest.id);
            if (definition && quest.reward !== definition.reward) {
                quest.reward = definition.reward;
                rewardsUpdated = true;
            }
        }
        if (rewardsUpdated) {
            await saveUserData(uKey, { dailyQuests: uData.dailyQuests });
        }
    }

    return uData.dailyQuests.quests;
}

async function recordQuestProgress(username, questId, amount = 1) {
    const uKey = findUserKey(username) || username;
    let uData = persistentData.users[uKey];
    if (!uData) return null;
    const quests = await getUserDailyQuests(uKey);
    const quest = quests.find(q => q.id === questId);
    if (!quest) return null;

    if (quest.current < quest.target) {
        quest.current = Math.min(quest.target, quest.current + amount);
        await saveUserData(uKey, { dailyQuests: uData.dailyQuests });
        return quest;
    }
    return null;
}

async function claimQuestReward(username, questId) {
    const uKey = findUserKey(username) || username;
    let uData = persistentData.users[uKey];
    if (!uData) return { success: false, msg: "Kullanıcı bulunamadı!" };
    const quests = await getUserDailyQuests(uKey);
    const quest = quests.find(q => q.id === questId);

    if (!quest) return { success: false, msg: "Görev bulunamadı!" };
    if (quest.current < quest.target) return { success: false, msg: "Bu görevi henüz tamamlamadınız!" };
    if (quest.claimed) return { success: false, msg: "Bu görevin ödülünü zaten aldınız!" };

    quest.claimed = true;
    uData.money = (uData.money || 100) + quest.reward;
    await saveUserData(uKey, { money: uData.money, dailyQuests: uData.dailyQuests });

    return {
        success: true,
        reward: quest.reward,
        newMoney: uData.money,
        quests: uData.dailyQuests.quests,
        msg: `🎉 Tebrikler! "${quest.title}" görevinden ${quest.reward} TL kazandınız!`
    };
}

module.exports = {
    persistentData,
    loadPersistentData,
    syncDataJsonToMongo,
    savePersistentData,
    saveUserData,
    savePersistentDataAtomic,
    flushNow,
    findUserKey,
    parseHouseRoom,
    getFriendListData,
    loginUser,
    registerUser,
    changeUserPassword,
    authenticateOrRegister,
    hashPassword,
    verifyPassword,
    sanitizeAmount,
    sanitizeString,
    escapeHtml,
    getUserDailyQuests,
    recordQuestProgress,
    claimQuestReward,
    isUserAdmin,
    ADMIN_USERS,
    isUserMod,
    MOD_USERS
};

/**
 * scratch/test_spam_table_limit.js
 * Adım 1: Sınırsız Masa Açma (Spam) Kontrolü Testi
 */
const io = require('socket.io-client');
const assert = require('assert');

async function testSpamProtection() {
    console.log("🚀 Testing Adım 1: Sınırsız Masa Açma (Spam) Kontrolü...");

    const socket = io('http://localhost:3000', {
        transports: ['websocket'],
        forceNew: true
    });

    await new Promise((resolve) => socket.on('connect', resolve));
    console.log("✅ Socket bağlandı:", socket.id);

    // 1. Oyuncu Kayıt ve Girişi
    const testUser = `spam_${Date.now().toString().slice(-6)}`;
    await new Promise((resolve, reject) => {
        socket.once('loginSuccess', resolve);
        socket.once('registerFailed', reject);
        socket.once('loginFailed', reject);
        socket.emit('register', { name: testUser, pass: 'password123', gender: 'male' });
    });
    console.log("✅ Test kullanıcısı başarıyla oyuna girdi:", testUser);

    // 2. İlk XOX masasını aç
    console.log("\n1️⃣ İlk XOX masası açılıyor...");
    let firstTableLobby = await new Promise((resolve, reject) => {
        socket.once('updateTableLobby', resolve);
        socket.once('tableCreateError', reject);
        socket.emit('createNewTable', { baseType: 'xox', bet: 0 });
    });
    console.log("✅ İlk masa başarıyla açıldı! Masa ID:", firstTableLobby.tableId, "İsim:", firstTableLobby.name);

    // 3. AYNI OYUN TÜRÜNDE (XOX) İKİNCİ MASA AÇMAYI DENE (SPAM KONTROLÜ)
    console.log("\n2️⃣ Aynı kullanıcı aynı oyun türünde (XOX) 2. masayı açmaya çalışıyor...");
    let errorData = await new Promise((resolve) => {
        socket.once('tableCreateError', (err) => {
            console.log("🛡️ tableCreateError yakalandı:", err);
            resolve(err);
        });
        socket.emit('createNewTable', { baseType: 'xox', bet: 0 });
    });

    assert.strictEqual(errorData.message, "Bu oyunda zaten açık bir masanız var!", "HATA: Uyarı mesajı birebir eşleşmeli!");
    console.log("🎉 SPAM ENGELLENDİ: Sunucu başarıyla 'Bu oyunda zaten açık bir masanız var!' uyarısı verdi!");

    // 4. Farklı bir oyun türünde (örneğin Amiral Battı) masa açabilmeli mi?
    console.log("\n3️⃣ Farklı bir oyun türünde (Amiral) masa açma testi...");
    let amiralLobby = await new Promise((resolve, reject) => {
        socket.once('updateTableLobby', resolve);
        socket.once('tableCreateError', reject);
        socket.emit('createNewTable', { baseType: 'amiral', bet: 0 });
    });
    console.log("✅ Farklı oyun türünde (Amiral) masa açılabildi! Masa ID:", amiralLobby.tableId);

    // 5. Masa kapatıldığında limitin sıfırlanması testi
    console.log("\n4️⃣ Masa kapatıldığında limitin sıfırlanması testi...");
    await new Promise((resolve) => {
        socket.once('tableClosed', resolve);
        socket.emit('closeTable', firstTableLobby.tableId);
    });
    console.log("🧹 İlk XOX masası sunucuda kapatıldı (tableClosed alındı).");

    // Şimdi tekrar XOX masası açabilmeli!
    let reCreatedLobby = await new Promise((resolve, reject) => {
        socket.once('updateTableLobby', resolve);
        socket.once('tableCreateError', reject);
        socket.emit('createNewTable', { baseType: 'xox', bet: 0 });
    });
    console.log("✅ Masa kapatıldıktan sonra limit sıfırlandı ve yeni XOX masası açılabildi! Yeni ID:", reCreatedLobby.tableId);

    // Temizlik
    socket.emit('closeTable', amiralLobby.tableId);
    socket.emit('closeTable', reCreatedLobby.tableId);

    socket.disconnect();
    console.log("\n🎯 ADIM 1 TESTİ EKSİKSİZ VE BAŞARIYLA TAMAMLANDI!");
    process.exit(0);
}

testSpamProtection().catch(err => {
    console.error("❌ TEST BAŞARISIZ:", err);
    process.exit(1);
});

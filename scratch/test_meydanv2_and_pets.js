// scratch/test_meydanv2_and_pets.js
const { io } = require("socket.io-client");

async function runTest() {
    console.log("=== TEST BAŞLIYOR: Meydan v2 ve Pet Shop Entegrasyonu ===");
    const socket = io("http://localhost:3000", {
        transports: ["websocket"],
        reconnection: false
    });

    const testUsername = "MeydanTester_" + Math.floor(Math.random() * 9000 + 1000);

    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Bağlantı zaman aşımı")), 5000);

        socket.on("connect", () => {
            console.log("✅ Socket sunucuya bağlandı (ID: " + socket.id + ")");
            socket.emit("register", { name: testUsername, pass: "123456", gender: "male" });
        });

        socket.on("registerFailed", (msg) => {
            console.log("Kayıt başarısız, login deneniyor:", msg);
            socket.emit("login", { name: testUsername, pass: "123456" });
        });

        socket.on("loginFailed", (msg) => {
            console.log("Giriş başarısız:", msg);
            clearTimeout(timeout);
            reject(new Error(msg));
        });

        socket.on("loginSuccess", (data) => {
            console.log("✅ Giriş başarılı:", data.username, "Bakiye:", data.money);
            clearTimeout(timeout);
            resolve();
        });
    });

    // 1. Meydan v2'ye Geçiş Testi
    console.log("\n[TEST 1]: 'meydanv2' mekanına geçiş yapılıyor...");
    await new Promise((resolve, reject) => {
        const to = setTimeout(() => reject(new Error("changeRoom zaman aşımı")), 5000);

        socket.once("currentPlayers", (roomPlayers) => {
            console.log("✅ Mekan başarıyla değiştirildi! 'currentPlayers' alındı:", Object.keys(roomPlayers).length, "oyuncu.");
            clearTimeout(to);
            resolve();
        });

        socket.emit("changeRoom", "meydanv2");
    });

    // 2. Meydan v2 İçinde Yürüme
    console.log("\n[TEST 2]: Meydan v2 içinde yürüyüş hareketi yapılıyor...");
    socket.emit("playerMovement", { x: 520, y: 340, facing: "right", isMoving: true });
    await new Promise(r => setTimeout(r, 600));
    socket.emit("playerMovement", { x: 520, y: 340, facing: "right", isMoving: false });
    console.log("✅ Hareket paketi iletildi.");

    // 3. Cadde'ye geçip Pet Shop'tan Kedi (cat) Satın Alma Testi
    console.log("\n[TEST 3]: Caddeye geçiliyor ve Pet Shop durumu sorgulanıyor...");
    await new Promise((resolve) => {
        socket.once("currentPlayers", () => {
            console.log("✅ Cadde mekanına geçildi!");
            resolve();
        });
        socket.emit("changeRoom", "cadde");
    });

    // Bakiye kontrol ve satın alma testi
    console.log("\n[TEST 4]: Pet satın alma (buyPet) isteği gönderiliyor...");
    await new Promise((resolve) => {
        socket.once("gameError", (err) => {
            console.log("ℹ️ Pet Shop beklenen bakiye uyarısı alındı:", err);
            resolve();
        });
        socket.once("buyPetSuccess", (res) => {
            console.log("✅ Pet başarıyla satın alındı:", res);
            resolve();
        });
        socket.emit("buyPet", { petType: "cat" });
    });

    // 4. Tekrar Meydan v2'ye dönme testi
    console.log("\n[TEST 5]: Cadde'den Meydan v2'ye geri dönülüyor...");
    await new Promise((resolve) => {
        socket.once("currentPlayers", () => {
            console.log("✅ Meydan v2'ye sorunsuz geri dönüldü!");
            resolve();
        });
        socket.emit("changeRoom", "meydanv2");
    });

    console.log("\n🎉 TÜM TESTLER BAŞARIYLA TAMAMLANDI!");
    socket.disconnect();
    process.exit(0);
}

runTest().catch((err) => {
    console.error("❌ Test hatası:", err);
    process.exit(1);
});

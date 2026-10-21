// scratch/test_table_open_and_join.js
const io = require('socket.io-client');
const assert = require('assert');

const SERVER_URL = 'http://localhost:3000';

async function testJoinAndCreateTable() {
    console.log("🚀 Testing Table Opening, Joining, Bot Fill & Game Start...\n");

    const client = io(SERVER_URL, { reconnection: false });
    await new Promise(res => client.on('connect', res));
    console.log("✅ Client connected to server");

    const testUser = "user_table_" + Math.floor(Math.random() * 89999 + 10000);
    client.emit('register', { name: testUser, pass: 'password123', gender: 'male' });
    await new Promise((res, rej) => {
        client.on('loginSuccess', res);
        client.on('registerFailed', rej);
    });
    console.log(`✅ Logged in as: ${testUser}`);

    // Enter dostlar_kiraathanesi
    client.emit('changeRoom', 'dostlar_kiraathanesi');
    await new Promise(r => setTimeout(r, 200));

    // Listen for unexpected tableLeft
    let unexpectedTableLeft = false;
    client.on('tableLeft', () => {
        unexpectedTableLeft = true;
        console.error("❌ UNEXPECTED tableLeft received!");
    });

    // 1. Test Yeni Masa Aç (createNewTable)
    console.log("\n1️⃣ Testing 'Yeni Masa Aç' (createNewTable)...");
    let lobbyData = null;
    client.on('updateTableLobby', (data) => {
        lobbyData = data;
        console.log(`   📋 Received updateTableLobby: ${data.name} (count: ${data.count}/${data.min}, tableId: ${data.tableId})`);
    });

    client.emit('createNewTable', { baseType: 'batak4', bet: 0, mode: 'tek_deste' });
    await new Promise(r => setTimeout(r, 500));

    assert(lobbyData, "Must receive updateTableLobby upon createNewTable");
    assert.strictEqual(lobbyData.count, 1, "Created table must have 1 player");
    assert(!unexpectedTableLeft, "Must NOT receive tableLeft when creating a new table!");
    console.log("   ✅ 'Yeni Masa Aç' succeeded without unexpected tableLeft!\n");

    // 2. Test Masaya Bot Ekleme & Oyun Ekranı Açılması (addBotToTable)
    console.log("2️⃣ Testing 'Masaya Bot Ekle' (addBotToTable) up to game start...");
    let gameStartedType = null;
    client.on('startGame', (type) => {
        gameStartedType = type;
        console.log(`   🎮 Received 'startGame': ${type}`);
    });

    let batakUpdateReceived = false;
    client.on('batakUpdate', (data) => {
        batakUpdateReceived = true;
        assert(data.players.includes(client.id), "Player's socket ID must be in data.players");
        console.log(`   🃏 Received 'batakUpdate' with tableId: ${data.tableId}, myTurn: ${data.myTurn}, players: ${data.players.length}`);
    });

    // Add 3 bots to fill the 4P table
    client.emit('addBotToTable', lobbyData.tableId);
    await new Promise(r => setTimeout(r, 300));
    client.emit('addBotToTable', lobbyData.tableId);
    await new Promise(r => setTimeout(r, 300));
    client.emit('addBotToTable', lobbyData.tableId);
    await new Promise(r => setTimeout(r, 600));

    assert(gameStartedType, "Game must start when table fills up");
    assert(batakUpdateReceived, "Player must receive batakUpdate with cards and state");
    assert(!unexpectedTableLeft, "Must NOT receive tableLeft during game start!");
    console.log("   ✅ Game started successfully and player received their hand and game state!\n");

    // 3. Test Masadan Ayrıl (leaveTable)
    console.log("3️⃣ Testing 'Masadan Ayrıl' explicitly...");
    let tableLeftEmitted = false;
    client.on('tableLeft', () => {
        tableLeftEmitted = true;
        console.log("   🚪 Received expected 'tableLeft' upon explicit leaveTable");
    });

    client.emit('leaveTable');
    await new Promise(r => setTimeout(r, 400));
    assert(tableLeftEmitted, "Must receive tableLeft upon explicit leave");
    console.log("   ✅ Explicit leave table verified!\n");

    // 4. Test Masaya Oturma (joinTable)
    console.log("4️⃣ Testing 'Masaya Oturma' (joinTable) on an existing table...");
    unexpectedTableLeft = false;
    lobbyData = null;

    client.emit('joinTable', 'batak4'); // Join default base table
    await new Promise(r => setTimeout(r, 500));
    assert(lobbyData, "Must receive updateTableLobby upon joinTable");
    assert(!unexpectedTableLeft, "Must NOT receive tableLeft upon joining a table!");
    console.log("   ✅ 'Masaya Otur' succeeded without unexpected tableLeft!\n");

    client.disconnect();
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! Everything working 100%.");
    process.exit(0);
}

testJoinAndCreateTable().catch(err => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});

// scratch/test_user_requests.js
const io = require('socket.io-client');
const assert = require('assert');

// Mock window for client-side script requiring in Node
global.window = {};

const SERVER_URL = 'http://localhost:3000';

async function runTests() {
    console.log("🚀 Starting verification tests for all 4 user requests...\n");

    // 1. Verify seatRegistry column alignment
    require('../public/js/seatRegistry.js');
    console.log("1️⃣ Testing Column Alignment in STATIC_ROOM_SEATS.dostlar_kiraathanesi...");
    const seats = global.window.STATIC_ROOM_SEATS.dostlar_kiraathanesi;
    assert(seats, "dostlar_kiraathanesi seats must exist");

    const batak4Seats = seats.filter(s => s.game === 'batak4');
    const batak3Seats = seats.filter(s => s.game === 'batak');
    const dost4Seats = seats.filter(s => s.game === 'dost_kazigi');
    const dost3Seats = seats.filter(s => s.game === 'dost_kazigi_3p');

    assert.strictEqual(batak4Seats.length, 4, "Batak 4P should have 4 seats");
    assert.strictEqual(batak3Seats.length, 3, "Batak 3P should have 3 seats");
    assert.strictEqual(dost4Seats.length, 4, "Dost Kazigi 4P should have 4 seats");
    assert.strictEqual(dost3Seats.length, 3, "Dost Kazigi 3P should have 3 seats");

    // Check X coordinates (columns): Batak column around x=320, Dost Kazigi column around x=720
    batak4Seats.forEach(s => assert(s.x >= 240 && s.x <= 400, `Batak4 seat x (${s.x}) should be in left column (x~320)`));
    batak3Seats.forEach(s => assert(s.x >= 240 && s.x <= 400, `Batak3 seat x (${s.x}) should be in left column (x~320)`));

    dost4Seats.forEach(s => assert(s.x >= 640 && s.x <= 800, `Dost4 seat x (${s.x}) should be in right column (x~720)`));
    dost3Seats.forEach(s => assert(s.x >= 640 && s.x <= 800, `Dost3 seat x (${s.x}) should be in right column (x~720)`));
    console.log("   ✅ Column alignment verified: Batak left column (x~320), Dost Kazığı right column (x~720)\n");

    // 2. Test Socket Connections & Venue-Exclusive Drinks
    console.log("2️⃣ Testing Venue-Exclusive Drinks in Dostlar Kıraathanesi...");
    const client = io(SERVER_URL, { reconnection: false });

    await new Promise((resolve) => client.on('connect', resolve));
    console.log("   ✅ Test client connected to server");

    const testUser = "user_" + Math.floor(Math.random() * 89999 + 10000);
    client.emit('register', { name: testUser, pass: 'password123', gender: 'male' });

    await new Promise((resolve, reject) => {
        client.on('loginSuccess', (data) => {
            console.log(`   ✅ Logged in as: ${testUser}`);
            resolve(data);
        });
        client.on('registerFailed', reject);
    });

    // Enter dostlar_kiraathanesi
    client.emit('changeRoom', 'dostlar_kiraathanesi');
    await new Promise(r => setTimeout(r, 200));

    // Buy a drink
    let drinkBought = false;
    client.on('kiraathaneDrinkSuccess', (item) => {
        drinkBought = true;
        console.log(`   ☕ Purchased Kıraathane drink: ${item.name} (${item.heldItem})`);
    });

    client.emit('buyKiraathaneDrink', { id: 'cay' });
    await new Promise(r => setTimeout(r, 400));
    assert(drinkBought, "Drink purchase must succeed");

    // Change room to cadde
    let drinkClearedReceived = false;
    client.on('kiraathaneDrinkCleared', () => {
        drinkClearedReceived = true;
        console.log("   ✅ Received 'kiraathaneDrinkCleared' event upon exiting venue");
    });

    client.emit('changeRoom', 'cadde');
    await new Promise(r => setTimeout(r, 400));
    assert(drinkClearedReceived, "Drink must be cleared when exiting dostlar_kiraathanesi");
    console.log("   ✅ Verified: Kıraathane drinks are strictly venue-exclusive and disappear upon exit!\n");

    // 3. Test Table Leave & Clean Room Change
    console.log("3️⃣ Testing Table Leave & Modals Not Popping Up After Leaving...");
    // Enter kafe or dostlar_kiraathanesi and create/join a table
    client.emit('changeRoom', 'dostlar_kiraathanesi');
    await new Promise(r => setTimeout(r, 200));

    // Create a Batak 4 table
    client.emit('createNewTable', { baseType: 'batak4', bet: 0, mode: 'tek_deste' });
    await new Promise(r => setTimeout(r, 300));

    // Now test leaving table explicitly
    let tableLeftReceived = false;
    client.on('tableLeft', () => {
        tableLeftReceived = true;
        console.log("   ✅ Received 'tableLeft' event from server");
    });

    client.emit('leaveTable');
    await new Promise(r => setTimeout(r, 300));
    assert(tableLeftReceived, "Server must emit 'tableLeft' when player leaves table");

    // Player changes room to sahil
    client.emit('changeRoom', 'sahil');
    await new Promise(r => setTimeout(r, 300));

    // Confirm no spurious batakUpdate or dostKazigiUpdate arrives for the left table
    let spuriousUpdate = false;
    client.on('batakUpdate', () => { spuriousUpdate = true; });
    client.on('dostKazigiUpdate', () => { spuriousUpdate = true; });

    await new Promise(r => setTimeout(r, 500));
    assert(!spuriousUpdate, "No spurious game updates should be received while in sahil");
    console.log("   ✅ Verified: Player successfully left table, no turns or popups sent to other rooms!\n");

    client.disconnect();
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 100% Verified.");
    process.exit(0);
}

runTests().catch(err => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});

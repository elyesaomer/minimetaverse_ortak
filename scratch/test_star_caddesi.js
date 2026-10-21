const { io } = require('socket.io-client');

async function runTest() {
    console.log('Connecting to server...');
    const socket = io('http://localhost:3000', {
        transports: ['websocket'],
        forceNew: true
    });

    await new Promise((resolve, reject) => {
        socket.on('connect', () => {
            console.log('Connected with socket id:', socket.id);
            resolve();
        });
        socket.on('connect_error', reject);
    });

    const testUsername = 'StarTester_' + Math.floor(Math.random() * 10000);

    // Register & Login
    console.log('Registering test user:', testUsername);
    await new Promise((resolve, reject) => {
        socket.emit('register', { name: testUsername, pass: '123456', gender: 'male' });
        socket.once('loginSuccess', (data) => {
            console.log('Login success! Initial username:', data.username, 'Balance:', data.money);
            resolve();
        });
        socket.once('registerFailed', (err) => {
            reject(new Error(err));
        });
    });

    // Change room to star_caddesi
    console.log('Changing room to star_caddesi...');
    await new Promise((resolve) => {
        socket.emit('changeRoom', 'star_caddesi');
        socket.once('currentPlayers', (players) => {
            console.log('Received currentPlayers in star_caddesi! Player count:', Object.keys(players).length);
            resolve();
        });
    });

    // Send movement in star_caddesi
    console.log('Moving in star_caddesi to (520, 360)...');
    socket.emit('playerMovement', { x: 520, y: 360, isMoving: true, facing: 'down' });

    // Request pet shop status
    console.log('Testing Pet Shop status...');
    await new Promise((resolve) => {
        socket.emit('getPetShopStatus');
        socket.once('petShopStatus', (status) => {
            console.log('Pet Shop status received: Balance =', status.money, 'Active Pet =', status.activePet);
            resolve();
        });
    });

    // Switch back to sokak
    console.log('Changing room back to sokak...');
    await new Promise((resolve) => {
        socket.emit('changeRoom', 'sokak');
        socket.once('currentPlayers', (players) => {
            console.log('Back in sokak! Players in room:', Object.keys(players).length);
            resolve();
        });
    });

    console.log('🎉 ALL INTEGRATION TESTS PASSED 100% SUCCESSFULLY!');
    socket.disconnect();
    process.exit(0);
}

runTest().catch((err) => {
    console.error('Test FAILED:', err);
    process.exit(1);
});

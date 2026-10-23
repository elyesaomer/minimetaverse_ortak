const fs = require('fs');
const { decodePNG, encodePNG } = require('./scratch/clean_pet_sprites.js');

function testProcess(img) {
    const { width, height, data } = img;
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0, tail = 0;

    // 1. Initial border flood fill for outer white background
    function isWhiteBg(x, y) {
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
        // Background is white / off-white (RGB >= 220)
        return a > 0 && r >= 220 && g >= 220 && b >= 220;
    }

    function push(x, y) {
        const pIdx = y * width + x;
        if (visited[pIdx]) return;
        visited[pIdx] = 1;
        data[pIdx * 4 + 3] = 0; // set alpha = 0
        queue[tail++] = pIdx;
    }

    for (let x = 0; x < width; x++) {
        if (isWhiteBg(x, 0)) push(x, 0);
        if (isWhiteBg(x, height - 1)) push(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
        if (isWhiteBg(0, y)) push(0, y);
        if (isWhiteBg(width - 1, y)) push(width - 1, y);
    }

    while (head < tail) {
        const pIdx = queue[head++];
        const cx = pIdx % width;
        const cy = Math.floor(pIdx / width);

        for (const [nx, ny] of [[cx-1, cy], [cx+1, cy], [cx, cy-1], [cx, cy+1]]) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (!visited[nIdx] && isWhiteBg(nx, ny)) {
                    push(nx, ny);
                }
            }
        }
    }

    console.log('Pass 1 (White BG cleared):', tail);

    // 2. Remove bottom shadow blob:
    // In each 64px row (height = 16 * 64 = 1024):
    // The shadow blob is located around yCell >= 53 outside the feet.
    // Notice the shadow blob is in the lower portion of each 64px cell (yCell >= 53).
    // Let's inspect what colors the shadow has and flood it from the bottom/sides!
    // If we flood from transparent pixels touching the bottom or sides into pixels where:
    // in yCell >= 52: any pixel that is shadow (shadow has r, g, b around 60-180 and is under feet):
    // Wait, let's see what is inside yCell >= 53!
}

const orig = decodePNG('C:/Users/Elyesa Ömer/.gemini/antigravity-ide/brain/8afe957a-dd92-4387-af61-4c8d52b66d1f/.user_uploaded/media_1792706229455.png');
testProcess(orig);

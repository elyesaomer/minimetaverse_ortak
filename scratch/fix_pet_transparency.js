const fs = require('fs');
const { decodePNG, encodePNG } = require('./clean_pet_sprites.js');

function processSheet(inputPath, outputPath, isCompanion = true) {
    console.log(`Processing ${inputPath} -> ${outputPath}...`);
    const img = decodePNG(inputPath);
    const { width, height, data } = img;
    const cellW = width / 4;
    const cellH = height / 16;

    // 1. Flood fill pure white outer background strictly starting from 4 image boundaries
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0, tail = 0;

    function isWhiteBg(x, y) {
        const idx = (y * width + x) * 4;
        return data[idx] >= 244 && data[idx+1] >= 244 && data[idx+2] >= 244;
    }

    function push(x, y) {
        const pIdx = y * width + x;
        if (visited[pIdx]) return;
        visited[pIdx] = 1;
        data[pIdx * 4 + 3] = 0; // Alpha = 0
        queue[tail++] = pIdx;
    }

    // Push 4 outer borders of image
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
        for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (!visited[nIdx] && isWhiteBg(nx, ny)) {
                    push(nx, ny);
                }
            }
        }
    }
    console.log(`  Flood fill cleared: ${tail} outer background pixels`);

    // 2. Clear bottom baked-in shadow for companions (yCell >= 58, and yCell === 57 where not a dark paw outline)
    if (isCompanion) {
        let shadowCleared = 0;
        for (let y = 0; y < height; y++) {
            const yCell = y % 64;
            if (yCell >= 58) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    if (data[idx+3] !== 0) {
                        data[idx+3] = 0;
                        shadowCleared++;
                    }
                }
            } else if (yCell === 57) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    if (data[idx+3] !== 0) {
                        const lum = (data[idx] + data[idx+1] + data[idx+2]) / 3;
                        // Paw outline is very dark (lum < 35). Anything else at y=57 is the shadow ellipse.
                        if (lum >= 35) {
                            data[idx+3] = 0;
                            shadowCleared++;
                        }
                    }
                }
            }
        }
        console.log(`  Shadow cleared: ${shadowCleared} bottom shadow pixels`);
    }

    // 3. Single-pass Outer Boundary Defringing
    // ONLY applied to pixels directly touching alpha === 0!
    // Interior belly, chest, face, muzzle pixels are deeply surrounded and completely untouched (100% solid)!
    let defringed = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (data[idx+3] === 0) continue;

            let touchesTransparent = false;
            for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
                if (nx < 0 || nx >= width || ny < 0 || ny >= height || data[(ny * width + nx) * 4 + 3] === 0) {
                    touchesTransparent = true;
                    break;
                }
            }

            if (touchesTransparent) {
                const lum = (data[idx] + data[idx+1] + data[idx+2]) / 3;
                if (lum >= 235) {
                    // Residual near-white background noise
                    data[idx+3] = 0;
                    defringed++;
                } else if (lum >= 120) {
                    // Outer outline anti-aliasing edge pixel
                    const alpha = Math.max(0, Math.min(255, Math.round(((255 - lum) / 125) * 255)));
                    data[idx+3] = alpha;
                    // Tint towards dark outline to eliminate white rim on dark roads
                    data[idx] = Math.round(data[idx] * (alpha / 255) + 30 * (1 - alpha / 255));
                    data[idx+1] = Math.round(data[idx+1] * (alpha / 255) + 20 * (1 - alpha / 255));
                    data[idx+2] = Math.round(data[idx+2] * (alpha / 255) + 15 * (1 - alpha / 255));
                    defringed++;
                }
            }
        }
    }
    console.log(`  Defringed outer border: ${defringed} pixels`);

    // 4. Encode and save clean asset
    const encoded = encodePNG(width, height, data);
    fs.writeFileSync(outputPath, encoded);
    console.log(`  Successfully saved clean asset to ${outputPath} (${encoded.length} bytes)\n`);
}

// 1. Clean Cat
processSheet(
    'C:/Users/Elyesa Ömer/.gemini/antigravity-ide/brain/8afe957a-dd92-4387-af61-4c8d52b66d1f/.user_uploaded/media_1792706229455.png',
    'public/assets/pets/cat_spritesheet.png',
    true
);

// 2. Clean Dog
processSheet(
    'C:/Users/Elyesa Ömer/.gemini/antigravity-ide/brain/8afe957a-dd92-4387-af61-4c8d52b66d1f/.user_uploaded/media_1792706083085.png',
    'public/assets/pets/dog_spritesheet.png',
    true
);

console.log('All pet spritesheets cleaned and restored with 100% solid white fur!');

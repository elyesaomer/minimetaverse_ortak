const fs = require('fs');
const zlib = require('zlib');
const { decodePNG, encodePNG } = require('./clean_pet_sprites.js');

function cleanSpriteSheet(inputPath, outputPath, isCompanion = true) {
    console.log(`Processing: ${inputPath} -> ${outputPath}`);
    const img = decodePNG(inputPath);
    const { width, height, data } = img;

    // 1. Flood fill from borders
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0, tail = 0;

    function isClearable(x, y) {
        const idx = (y * width + x) * 4;
        if (data[idx+3] === 0) return true;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const lum = (r + g + b) / 3;
        const yCell = y % 64;

        // Dark outline: never clear
        if (lum < 70) return false;

        // For cat & dog companions, clear the baked-in fuzzy bottom shadow blob
        if (isCompanion && yCell >= 52) {
            return lum > 65;
        }

        // Background white & light noise
        return lum > 175;
    }

    function push(x, y) {
        const pIdx = y * width + x;
        if (visited[pIdx]) return;
        visited[pIdx] = 1;
        data[pIdx * 4 + 3] = 0;
        queue[tail++] = pIdx;
    }

    // Push 4 borders
    for (let x = 0; x < width; x++) {
        if (isClearable(x, 0)) push(x, 0);
        if (isClearable(x, height - 1)) push(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
        if (isClearable(0, y)) push(0, y);
        if (isClearable(width - 1, y)) push(width - 1, y);
    }

    while (head < tail) {
        const pIdx = queue[head++];
        const cx = pIdx % width;
        const cy = Math.floor(pIdx / width);

        for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (!visited[nIdx] && isClearable(nx, ny)) {
                    push(nx, ny);
                }
            }
        }
    }
    console.log(`  Pass 1 (Flood fill) cleared ${tail} pixels.`);

    // 2. Defringe: peel white/light halo pixels touching transparency
    // 2 passes ensures crisp cartoon outline without paint-cutout white fringes
    for (let pass = 0; pass < 2; pass++) {
        let peeled = 0;
        const toClear = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (data[idx+3] === 0) continue;
                let hasTransp = false;
                for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height || data[(ny * width + nx) * 4 + 3] === 0) {
                        hasTransp = true;
                        break;
                    }
                }
                if (hasTransp) {
                    const lum = (data[idx] + data[idx+1] + data[idx+2]) / 3;
                    if (lum > 135) {
                        toClear.push(idx);
                    }
                }
            }
        }
        toClear.forEach(idx => {
            data[idx+3] = 0;
            peeled++;
        });
        console.log(`  Defringe pass ${pass + 1} cleared ${peeled} fringe pixels.`);
    }

    // 3. Save clean PNG
    const encoded = encodePNG(width, height, data);
    fs.writeFileSync(outputPath, encoded);
    console.log(`  Saved clean asset: ${outputPath} (${encoded.length} bytes)`);
}

// Clean Cat
cleanSpriteSheet(
    'C:/Users/Elyesa Ömer/.gemini/antigravity-ide/brain/8afe957a-dd92-4387-af61-4c8d52b66d1f/.user_uploaded/media_1792706229455.png',
    'public/assets/pets/cat_spritesheet.png',
    true
);

// Clean Dog
cleanSpriteSheet(
    'C:/Users/Elyesa Ömer/.gemini/antigravity-ide/brain/8afe957a-dd92-4387-af61-4c8d52b66d1f/.user_uploaded/media_1792706083085.png',
    'public/assets/pets/dog_spritesheet.png',
    true
);

// Clean Mouse
cleanSpriteSheet(
    'public/assets/pets/tfm_mouse_spritesheet.png',
    'public/assets/pets/tfm_mouse_spritesheet.png',
    false
);

console.log('All pet sprite sheets cleaned successfully!');

const fs = require('fs');
const { decodePNG, encodePNG } = require('./clean_pet_sprites.js');

function processSheetProperly(inputPath, outputPath) {
    console.log(`Processing: ${inputPath} -> ${outputPath}`);
    const img = decodePNG(inputPath);
    const { width, height, data } = img;

    // 1. Flood fill pure white outer background
    // Start strictly from the borders of the image
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0, tail = 0;

    function isPureWhiteBg(x, y) {
        const idx = (y * width + x) * 4;
        // Background in original images is r,g,b >= 238
        return data[idx] >= 238 && data[idx+1] >= 238 && data[idx+2] >= 238;
    }

    function push(x, y) {
        const pIdx = y * width + x;
        if (visited[pIdx]) return;
        visited[pIdx] = 1;
        data[pIdx * 4 + 3] = 0; // Alpha 0
        queue[tail++] = pIdx;
    }

    // Push outer boundaries
    for (let x = 0; x < width; x++) {
        if (isPureWhiteBg(x, 0)) push(x, 0);
        if (isPureWhiteBg(x, height - 1)) push(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
        if (isPureWhiteBg(0, y)) push(0, y);
        if (isPureWhiteBg(width - 1, y)) push(width - 1, y);
    }

    while (head < tail) {
        const pIdx = queue[head++];
        const cx = pIdx % width;
        const cy = Math.floor(pIdx / width);

        for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (!visited[nIdx] && isPureWhiteBg(nx, ny)) {
                    push(nx, ny);
                }
            }
        }
    }
    console.log(`  Cleared ${tail} background pixels.`);

    // 2. De-fringe ONLY outer border pixels that directly touch the transparent background!
    // This removes the 1-pixel white halo (anti-aliasing with white background)
    // WITHOUT EVER TOUCHING THE INTERIOR (belly, chest, face are completely preserved)!
    let defringedCount = 0;
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
                const r = data[idx], g = data[idx+1], b = data[idx+2];
                const lum = (r + g + b) / 3;

                if (lum > 140) {
                    if (lum >= 235) {
                        data[idx+3] = 0;
                    } else {
                        // Blend alpha to remove white halo
                        const alpha = Math.max(0, Math.min(255, Math.round(((255 - lum) / 130) * 255)));
                        data[idx+3] = alpha;
                        // Tint edge pixel towards dark outline color (35, 25, 20)
                        data[idx] = Math.round(data[idx] * (alpha / 255) + 35 * (1 - alpha / 255));
                        data[idx+1] = Math.round(data[idx+1] * (alpha / 255) + 25 * (1 - alpha / 255));
                        data[idx+2] = Math.round(data[idx+2] * (alpha / 255) + 20 * (1 - alpha / 255));
                    }
                    defringedCount++;
                }
            }
        }
    }
    console.log(`  Defringed ${defringedCount} outer edge pixels.`);

    const encoded = encodePNG(width, height, data);
    fs.writeFileSync(outputPath, encoded);
    console.log(`  Saved to ${outputPath} (${encoded.length} bytes).`);
}

// 1. Cat: process from original source
processSheetProperly(
    'C:/Users/Elyesa Ömer/.gemini/antigravity-ide/brain/8afe957a-dd92-4387-af61-4c8d52b66d1f/.user_uploaded/media_1792706229455.png',
    'public/assets/pets/cat_spritesheet.png'
);

// 2. Dog: process from original source
processSheetProperly(
    'C:/Users/Elyesa Ömer/.gemini/antigravity-ide/brain/8afe957a-dd92-4387-af61-4c8d52b66d1f/.user_uploaded/media_1792706083085.png',
    'public/assets/pets/dog_spritesheet.png'
);

console.log('Done!');

const fs = require('fs');
const { decodePNG, encodePNG } = require('./clean_pet_sprites.js');

function processSheet(inputPath) {
    const img = decodePNG(inputPath);
    const { width, height, data } = img;

    // 1. Flood fill pure white outer background
    // Threshold: r >= 238 && g >= 238 && b >= 238
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0, tail = 0;

    function isPureBg(x, y) {
        const idx = (y * width + x) * 4;
        return data[idx] >= 238 && data[idx+1] >= 238 && data[idx+2] >= 238;
    }

    function push(x, y) {
        const pIdx = y * width + x;
        if (visited[pIdx]) return;
        visited[pIdx] = 1;
        data[pIdx * 4 + 3] = 0; // Transparent
        queue[tail++] = pIdx;
    }

    for (let x = 0; x < width; x++) {
        if (isPureBg(x, 0)) push(x, 0);
        if (isPureBg(x, height - 1)) push(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
        if (isPureBg(0, y)) push(0, y);
        if (isPureBg(width - 1, y)) push(width - 1, y);
    }

    while (head < tail) {
        const pIdx = queue[head++];
        const cx = pIdx % width;
        const cy = Math.floor(pIdx / width);

        for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (!visited[nIdx] && isPureBg(nx, ny)) {
                    push(nx, ny);
                }
            }
        }
    }
    console.log('Background flood fill cleared:', tail, 'pixels');

    // 2. De-fringe ONLY outer border pixels that touch the transparent background!
    // Never touch any pixel inside the animal!
    // For any non-transparent pixel touching alpha === 0:
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

                // If it's a light anti-aliasing pixel blending with the white background (lum > 140)
                if (lum > 140) {
                    // Calculate alpha of the dark outline (outline lum ~ 30)
                    // If lum >= 235: set alpha = 0 (it is background residue)
                    if (lum >= 235) {
                        data[idx+3] = 0;
                    } else {
                        // De-multiply white background:
                        // alpha in range 0..255
                        const alpha = Math.max(0, Math.min(255, Math.round(((255 - lum) / 150) * 255)));
                        data[idx+3] = alpha;
                        // Tint edge pixel towards dark outline color (e.g. 35, 25, 20) so it doesn't show white residue on dark road
                        data[idx] = Math.round(data[idx] * 0.2 + 35 * 0.8);
                        data[idx+1] = Math.round(data[idx+1] * 0.2 + 25 * 0.8);
                        data[idx+2] = Math.round(data[idx+2] * 0.2 + 20 * 0.8);
                    }
                    defringedCount++;
                }
            }
        }
    }
    console.log('Outer edge defringed pixels:', defringedCount);

    // Verify Belly & Chest
    console.log('Face patch (31, 28): RGB =', data[(28*width+31)*4], data[(28*width+31)*4+1], data[(28*width+31)*4+2], 'Alpha =', data[(28*width+31)*4+3]);
    console.log('Chest fur (31, 34): RGB =', data[(34*width+31)*4], data[(34*width+31)*4+1], data[(34*width+31)*4+2], 'Alpha =', data[(34*width+31)*4+3]);
    console.log('Belly fur (31, 44): RGB =', data[(44*width+31)*4], data[(44*width+31)*4+1], data[(44*width+31)*4+2], 'Alpha =', data[(44*width+31)*4+3]);

    return img;
}

const cleanedCat = processSheet('C:/Users/Elyesa Ömer/.gemini/antigravity-ide/brain/8afe957a-dd92-4387-af61-4c8d52b66d1f/.user_uploaded/media_1792706229455.png');

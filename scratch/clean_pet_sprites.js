const fs = require('fs');
const zlib = require('zlib');

// Proper PNG Decoder
function decodePNG(filePath) {
    const buf = fs.readFileSync(filePath);
    let pos = 8;
    let width = buf.readUInt32BE(16);
    let height = buf.readUInt32BE(20);
    let bitDepth = buf[24];
    let colorType = buf[25];
    
    const idatChunks = [];
    while (pos < buf.length) {
        const len = buf.readUInt32BE(pos);
        const type = buf.toString('ascii', pos + 4, pos + 8);
        if (type === 'IDAT') {
            idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
        }
        pos += 12 + len;
    }
    
    const raw = zlib.inflateSync(Buffer.concat(idatChunks));
    const bytesPerPixel = colorType === 6 ? 4 : (colorType === 2 ? 3 : 4);
    const rowStride = 1 + width * bytesPerPixel;
    const rgba = Buffer.alloc(width * height * 4);
    
    const prevRow = Buffer.alloc(width * bytesPerPixel);
    const currentRow = Buffer.alloc(width * bytesPerPixel);
    
    for (let y = 0; y < height; y++) {
        const filter = raw[y * rowStride];
        const rowData = raw.slice(y * rowStride + 1, (y + 1) * rowStride);
        
        for (let i = 0; i < rowData.length; i++) {
            const bpp = bytesPerPixel;
            const a = i >= bpp ? currentRow[i - bpp] : 0;
            const b = prevRow[i];
            const c = i >= bpp ? prevRow[i - bpp] : 0;
            
            let val = rowData[i];
            if (filter === 0) {
                // None
            } else if (filter === 1) {
                val = (val + a) & 0xff;
            } else if (filter === 2) {
                val = (val + b) & 0xff;
            } else if (filter === 3) {
                val = (val + Math.floor((a + b) / 2)) & 0xff;
            } else if (filter === 4) {
                const p = a + b - c;
                const pa = Math.abs(p - a);
                const pb = Math.abs(p - b);
                const pc = Math.abs(p - c);
                let pr;
                if (pa <= pb && pa <= pc) pr = a;
                else if (pb <= pc) pr = b;
                else pr = c;
                val = (val + pr) & 0xff;
            }
            currentRow[i] = val;
        }
        
        for (let x = 0; x < width; x++) {
            const srcIdx = x * bytesPerPixel;
            const dstIdx = (y * width + x) * 4;
            if (colorType === 6) {
                rgba[dstIdx] = currentRow[srcIdx];
                rgba[dstIdx + 1] = currentRow[srcIdx + 1];
                rgba[dstIdx + 2] = currentRow[srcIdx + 2];
                rgba[dstIdx + 3] = currentRow[srcIdx + 3];
            } else if (colorType === 2) {
                rgba[dstIdx] = currentRow[srcIdx];
                rgba[dstIdx + 1] = currentRow[srcIdx + 1];
                rgba[dstIdx + 2] = currentRow[srcIdx + 2];
                rgba[dstIdx + 3] = 255;
            }
        }
        currentRow.copy(prevRow);
    }
    
    return { width, height, data: rgba };
}

// CRC32 implementation
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        if (c & 1) c = 0xedb88320 ^ (c >>> 1);
        else c = c >>> 1;
    }
    CRC_TABLE[n] = c;
}

function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

function encodePNG(width, height, rgba) {
    const rowStride = 1 + width * 4;
    const raw = Buffer.alloc(height * rowStride);
    for (let y = 0; y < height; y++) {
        raw[y * rowStride] = 0;
        rgba.copy(raw, y * rowStride + 1, y * width * 4, (y + 1) * width * 4);
    }
    const compressed = zlib.deflateSync(raw);
    
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    
    function makeChunk(type, data) {
        const typeBuf = Buffer.from(type, 'ascii');
        const len = data.length;
        const chunk = Buffer.alloc(8 + len + 4);
        chunk.writeUInt32BE(len, 0);
        typeBuf.copy(chunk, 4);
        data.copy(chunk, 8);
        const crc = crc32(Buffer.concat([typeBuf, data]));
        chunk.writeUInt32BE(crc, 8 + len);
        return chunk;
    }
    
    return Buffer.concat([
        sig,
        makeChunk('IHDR', ihdr),
        makeChunk('IDAT', compressed),
        makeChunk('IEND', Buffer.alloc(0))
    ]);
}

module.exports = { decodePNG, encodePNG };

// Test reading original cat
const cat = decodePNG('C:/Users/Elyesa Ömer/.gemini/antigravity-ide/brain/8afe957a-dd92-4387-af61-4c8d52b66d1f/.user_uploaded/media_1792706229455.png');
console.log('Decoded cat successfully:', cat.width, 'x', cat.height);
// Cell 0, 0
for (let y = 48; y < 60; y++) {
    let line = '';
    for (let x = 14; x < 50; x++) {
        let idx = (y * cat.width + x) * 4;
        let r = cat.data[idx], g = cat.data[idx+1], b = cat.data[idx+2];
        let lum = (r + g + b) / 3;
        if (lum > 240) line += ' ';
        else if (lum > 180) line += '.';
        else if (lum > 120) line += '-';
        else if (lum > 60) line += '+';
        else line += '#';
    }
    console.log(String(y).padStart(2), line);
}

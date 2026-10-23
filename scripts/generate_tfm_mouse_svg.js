/**
 * scripts/generate_tfm_mouse_svg.js
 * Generates high-definition vector SVG sprite sheet for Transformice Mouse
 */
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'assets', 'pets');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Transformice Color Palette
const P = {
    outline: '#261409',
    furDark: '#4a2a14',
    furBase: '#693f21',
    furHighlight: '#83522f',
    furBelly: '#9a6b46',
    innerEar: '#f3c7a5',
    innerEarShadow: '#cb9b78',
    earFold: '#7c4d2d',
    nose: '#e69d87',
    eye: '#0f0a06',
    eyeGlint: '#ffffff',
    eyeSubGlint: 'rgba(255, 255, 255, 0.45)',
    paw: '#dfaf94',
    pawShadow: '#996b52',
    tail: '#deb398',
    tailHighlight: '#edd0bc',
    shadow: 'rgba(0, 0, 0, 0.28)'
};

const directions = [
    'down',
    'down-right',
    'right',
    'up-right',
    'up',
    'up-left',
    'left',
    'down-left'
];

const cellW = 64;
const cellH = 64;
const cols = 4; // 4 frames per animation
const rows = directions.length * 2; // 8 idle + 8 walk = 16 rows
const totalW = cols * cellW; // 256
const totalH = rows * cellH; // 1024

function getEarSvg(x, y, rw, rh, rot, isFar) {
    const fur = isFar ? P.furDark : P.furBase;
    const inner = isFar ? P.innerEarShadow : P.innerEar;
    return `
    <g transform="translate(${x}, ${y}) rotate(${rot * 180 / Math.PI})">
        <ellipse cx="0" cy="0" rx="${rw}" ry="${rh}" fill="${fur}" stroke="${P.outline}" stroke-width="1.6" />
        <ellipse cx="0.5" cy="1" rx="${rw * 0.72}" ry="${rh * 0.72}" fill="${inner}" />
        <path d="M ${-rw * 0.35} 2.5 A ${rw * 0.45} ${rw * 0.45} 0 0 1 ${rw * 0.35} 1.5" fill="none" stroke="${P.earFold}" stroke-width="1.1" stroke-linecap="round" />
    </g>`;
}

function getEarBackSvg(x, y, rw, rh, rot) {
    return `
    <g transform="translate(${x}, ${y}) rotate(${rot * 180 / Math.PI})">
        <ellipse cx="0" cy="0" rx="${rw}" ry="${rh}" fill="${P.furBase}" stroke="${P.outline}" stroke-width="1.6" />
        <path d="M ${-rw * 0.6} 1.5 A ${rw * 0.6} ${rh * 0.5} 0 0 0 ${rw * 0.6} 1.5 Z" fill="${P.furDark}" />
    </g>`;
}

function getEyeSvg(x, y, rw, rh, rot) {
    return `
    <g transform="translate(${x}, ${y}) rotate(${rot * 180 / Math.PI})">
        <ellipse cx="0" cy="0" rx="${rw}" ry="${rh}" fill="${P.eye}" />
        <circle cx="${rw * 0.35}" cy="${-rh * 0.35}" r="${rw * 0.42}" fill="${P.eyeGlint}" />
        <circle cx="${-rw * 0.3}" cy="${rh * 0.35}" r="${rw * 0.22}" fill="${P.eyeSubGlint}" />
    </g>`;
}

function getPawSvg(x, y, w, h, isBack) {
    const col = isBack ? P.pawShadow : P.paw;
    return `
    <g transform="translate(${x}, ${y})">
        <ellipse cx="0" cy="0" rx="${w}" ry="${h}" fill="${col}" stroke="${P.outline}" stroke-width="1.3" />
        <line x1="${-w * 0.2}" y1="${-h * 0.4}" x2="${-w * 0.2}" y2="${h * 0.7}" stroke="${P.outline}" stroke-width="0.9" />
        <line x1="${w * 0.2}" y1="${-h * 0.4}" x2="${w * 0.2}" y2="${h * 0.7}" stroke="${P.outline}" stroke-width="0.9" />
    </g>`;
}

function getTailSvg(startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY) {
    return `
    <g>
        <path d="M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}" fill="none" stroke="${P.outline}" stroke-width="3.6" stroke-linecap="round" />
        <path d="M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}" fill="none" stroke="${P.tail}" stroke-width="2.4" stroke-linecap="round" />
    </g>`;
}

function renderFrameSvg(dir, anim, frame) {
    let isFlipped = (dir === 'left' || dir === 'up-left' || dir === 'down-left');
    let baseDir = dir;
    if (dir === 'left') baseDir = 'right';
    else if (dir === 'up-left') baseDir = 'up-right';
    else if (dir === 'down-left') baseDir = 'down-right';

    let bobY = 0;
    let spine = 0;
    let tailWag = 0;
    let earTwitch = 0;
    let flX = 0, flY = 0, frX = 0, frY = 0;
    let rlX = 0, rlY = 0, rrX = 0, rrY = 0;

    if (anim === 'idle') {
        const t = frame / 4;
        bobY = Math.sin(t * Math.PI * 2) * 0.8;
        spine = Math.sin(t * Math.PI * 2) * 0.02;
        tailWag = Math.sin(t * Math.PI * 2) * 4;
        earTwitch = (frame === 2) ? -0.05 : 0;
    } else {
        const step = frame % 4;
        if (step === 0) {
            bobY = 0; frX = 3.5; frY = -1.5; flX = -3.0; flY = 0.5; rlX = 3.0; rlY = -1.0; rrX = -3.5; rrY = 0.5; tailWag = -3; spine = 0.04;
        } else if (step === 1) {
            bobY = -1.5; frX = 1.0; frY = -1.0; flX = -0.5; flY = -0.5; rlX = 0.5; rlY = -0.8; rrX = -1.0; rrY = -0.5; tailWag = 1; spine = -0.02;
        } else if (step === 2) {
            bobY = 0; frX = -3.0; frY = 0.5; flX = 3.5; flY = -1.5; rlX = -3.5; rlY = 0.5; rrX = 3.0; rrY = -1.0; tailWag = 3; spine = 0.04;
        } else if (step === 3) {
            bobY = -1.5; frX = -0.5; frY = -0.5; flX = 1.0; flY = -1.0; rlX = -1.0; rlY = -0.5; rrX = 0.5; rrY = -0.8; tailWag = -1; spine = -0.02;
        }
    }

    let innerContent = '';

    if (baseDir === 'right') {
        innerContent = `
        <!-- Uzak Kulak -->
        ${getEarSvg(-1, -19 + earTwitch, 4.5, 7.5, -0.2, true)}
        <!-- Uzak Arka Ayak -->
        ${getPawSvg(-11 + rlX, 6 + rlY, 3.5, 2.8, true)}
        <!-- Uzak Ön Ayak -->
        ${getPawSvg(3 + flX, 6 + flY, 3.0, 2.6, true)}
        <!-- Kuyruk -->
        ${getTailSvg(-12, 1, -26, -11 + tailWag, -22, -22 + tailWag * 1.5, -16, -26 + tailWag * 2)}
        <!-- Gövde -->
        <path d="M 5 5 C 9 3, 10 -2, 7 -6 C 4 -8, -1 -6, -6 -4 C -11 -2, -15 0, -15 4 C -15 8, -11 8.5, -8 7.5 C -4 7, 1 7.5, 5 5 Z" fill="${P.furBase}" stroke="${P.outline}" stroke-width="1.8" />
        <!-- Göbek Açık Ton -->
        <path d="M -6 6 Q 0 4.5, 4 4 Q 0 6.8, -6 6 Z" fill="${P.furBelly}" />
        <!-- Kalça Çizgisi -->
        <path d="M -11 0 A 5 5 0 0 1 -4 5" fill="none" stroke="${P.outline}" stroke-width="1.4" />
        <!-- Yakın Arka Ayak -->
        ${getPawSvg(-8 + rrX, 7 + rrY, 4.0, 3.0, false)}
        <!-- Yakın Ön Ayak -->
        ${getPawSvg(6 + frX, 7 + frY, 3.2, 2.8, false)}
        <!-- Kafa & Burun -->
        <path d="M 2 -7 C 6 -8, 12 -7, 15 -4 C 16.5 -2.5, 16.5 -1, 14 0 C 10 1.5, 5 1, 2 -1 C 0 -3, 0 -5, 2 -7 Z" fill="${P.furBase}" stroke="${P.outline}" stroke-width="1.8" />
        <circle cx="15.5" cy="-2.8" r="1.3" fill="${P.nose}" />
        <!-- Göz -->
        ${getEyeSvg(10, -4, 2.4, 3.2, 0.1)}
        <!-- Ön Kulak -->
        ${getEarSvg(3, -16 + earTwitch, 7.5, 8.5, 0.15, false)}
        `;
    } else if (baseDir === 'down-right') {
        innerContent = `
        ${getPawSvg(-10 + rlX * 0.8, 5.5 + rlY, 3.2, 2.6, true)}
        ${getTailSvg(-11, 2, -22, -8 + tailWag, -20, -18 + tailWag * 1.3, -14, -24 + tailWag * 1.8)}
        ${getEarSvg(-4, -18 + earTwitch, 5.5, 8.0, -0.25, false)}
        <!-- Gövde -->
        <path d="M 4 5.5 C 8 3.5, 9 -2, 6 -5 C 3 -7, -3 -6, -8 -3 C -13 0, -14 4, -12 6.5 C -9 8.5, -3 8.5, 4 5.5 Z" fill="${P.furBase}" stroke="${P.outline}" stroke-width="1.8" />
        <ellipse cx="-1" cy="5" rx="5" ry="2.5" transform="rotate(11)" fill="${P.furBelly}" />
        ${getPawSvg(1 + flX, 6.5 + flY, 3.0, 2.6, false)}
        ${getPawSvg(-6 + rrX, 7.5 + rrY, 3.8, 3.0, false)}
        <path d="M -10 1 A 4.5 4.5 0 0 1 -4 5" fill="none" stroke="${P.outline}" stroke-width="1.4" />
        ${getPawSvg(6 + frX, 7.8 + frY, 3.4, 2.8, false)}
        <!-- Kafa -->
        <path d="M 1 -6 C 5 -8, 10 -6, 13.5 -3 C 15 -1.5, 14 0.5, 12 1.5 C 8 2.5, 3 2, 0 -1 C -2 -3, -1 -5, 1 -6 Z" fill="${P.furBase}" stroke="${P.outline}" stroke-width="1.8" />
        <circle cx="14" cy="-1.5" r="1.3" fill="${P.nose}" />
        <!-- Uzak Göz -->
        <ellipse cx="6.5" cy="-4.5" rx="1.4" ry="2.0" fill="${P.eye}" />
        <circle cx="6.8" cy="-5.2" r="0.6" fill="${P.eyeGlint}" />
        <!-- Yakın Göz -->
        ${getEyeSvg(10.5, -3.2, 2.3, 3.0, 0.15)}
        <!-- Yakın Kulak -->
        ${getEarSvg(3, -15 + earTwitch, 7.2, 8.5, 0.2, false)}
        `;
    } else if (baseDir === 'down') {
        innerContent = `
        ${getTailSvg(0, 4, 12 + tailWag, -4, 18 + tailWag * 1.5, -14, 16 + tailWag * 2, -22)}
        ${getPawSvg(-10 + rlX * 0.5, 6 + rlY, 3.6, 2.8, false)}
        ${getPawSvg(10 + rrX * 0.5, 6 + rrY, 3.6, 2.8, false)}
        ${getEarSvg(-9, -15 + earTwitch, 7.0, 8.0, -0.3, false)}
        ${getEarSvg(9, -15 + earTwitch, 7.0, 8.0, 0.3, false)}
        <!-- Gövde -->
        <ellipse cx="0" cy="3" rx="10.5" ry="6.5" fill="${P.furBase}" stroke="${P.outline}" stroke-width="1.8" />
        <ellipse cx="0" cy="4.5" rx="5.5" ry="3.8" fill="${P.furBelly}" />
        ${getPawSvg(-4 + flX * 0.6, 7.5 + flY, 3.2, 2.6, false)}
        ${getPawSvg(4 + frX * 0.6, 7.5 + frY, 3.2, 2.6, false)}
        <!-- Kafa -->
        <path d="M -6 -7 C -7 -4, -6 0, -4 1.5 C -2 3, 2 3, 4 1.5 C 6 0, 7 -4, 6 -7 C 4 -9, -4 -9, -6 -7 Z" fill="${P.furBase}" stroke="${P.outline}" stroke-width="1.8" />
        <ellipse cx="0" cy="0.5" rx="1.5" ry="1.1" fill="${P.nose}" />
        ${getEyeSvg(-3.8, -3.5, 2.2, 2.8, -0.05)}
        ${getEyeSvg(3.8, -3.5, 2.2, 2.8, 0.05)}
        `;
    } else if (baseDir === 'up-right') {
        innerContent = `
        <circle cx="8" cy="-6" r="4" fill="${P.furBase}" stroke="${P.outline}" stroke-width="1.8" />
        <circle cx="11.5" cy="-5.5" r="1.2" fill="${P.nose}" />
        ${getEarBackSvg(-4, -18 + earTwitch, 6.0, 8.0, -0.2)}
        ${getPawSvg(1 + flX, 5.5 + flY, 3.0, 2.5, true)}
        ${getPawSvg(7 + frX, 6.5 + frY, 3.2, 2.7, true)}
        <path d="M -10 4 C -14 0, -12 -4, -6 -6 C 0 -7, 5 -5, 6 -2 C 6 3, 2 7, -4 7.5 C -8 7.5, -10 6, -10 4 Z" fill="${P.furBase}" stroke="${P.outline}" stroke-width="1.8" />
        <path d="M -8 1 A 5 5 0 0 1 -1 5" fill="none" stroke="${P.furDark}" stroke-width="1.2" />
        ${getPawSvg(-10 + rlX, 6.5 + rlY, 3.5, 2.8, false)}
        ${getPawSvg(-3 + rrX, 7.5 + rrY, 3.8, 3.0, false)}
        ${getEarBackSvg(4, -17 + earTwitch, 7.0, 8.5, 0.2)}
        ${getTailSvg(-8, 2, -18, -8 + tailWag, -16, -18 + tailWag * 1.4, -10, -25 + tailWag * 1.8)}
        `;
    } else if (baseDir === 'up') {
        innerContent = `
        ${getPawSvg(-5 + flX * 0.7, 5 + flY, 3.0, 2.5, true)}
        ${getPawSvg(5 + frX * 0.7, 5 + frY, 3.0, 2.5, true)}
        ${getPawSvg(-9 + rlX * 0.7, 6.5 + rlY, 3.6, 2.8, false)}
        ${getPawSvg(9 + rrX * 0.7, 6.5 + rrY, 3.6, 2.8, false)}
        <ellipse cx="0" cy="3" rx="10" ry="6.5" fill="${P.furBase}" stroke="${P.outline}" stroke-width="1.8" />
        <circle cx="0" cy="-4" r="6.5" fill="${P.furBase}" stroke="${P.outline}" stroke-width="1.8" />
        ${getEarBackSvg(-8, -14 + earTwitch, 6.8, 8.0, -0.25)}
        ${getEarBackSvg(8, -14 + earTwitch, 6.8, 8.0, 0.25)}
        ${getTailSvg(0, 2, -5 + tailWag, -10, -8 + tailWag * 1.5, -18, -4 + tailWag * 2, -26)}
        `;
    }

    const flipTransform = isFlipped ? 'scale(-1, 1)' : '';
    const rotDeg = spine * 180 / Math.PI;

    return `
    <g transform="translate(32, 42)">
        <g transform="${flipTransform}">
            <g transform="translate(0, ${bobY}) rotate(${rotDeg})">
                ${innerContent}
            </g>
        </g>
    </g>`;
}

let svgOutput = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
    <defs>
        <style>
            .grid-label { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 9px; fill: #666; }
        </style>
    </defs>
    <!-- Background grid lines for sprite verification -->
    <rect width="${totalW}" height="${totalH}" fill="#ffffff" fill-opacity="0.0" />
`;

let rowIdx = 0;
const anims = ['idle', 'walk'];

for (const anim of anims) {
    for (const dir of directions) {
        for (let frame = 0; frame < cols; frame++) {
            const cellX = frame * cellW;
            const cellY = rowIdx * cellH;
            const frameSvg = renderFrameSvg(dir, anim, frame);

            svgOutput += `
    <!-- Frame: ${anim}_${dir}_${frame} -->
    <g id="frame_${anim}_${dir}_${frame}" transform="translate(${cellX}, ${cellY})">
        ${frameSvg}
    </g>`;
        }
        rowIdx++;
    }
}

svgOutput += `\n</svg>\n`;

const targetSvgPath = path.join(targetDir, 'tfm_mouse_8way.svg');
fs.writeFileSync(targetSvgPath, svgOutput, 'utf8');
console.log(`✅ SVG Sprite Sheet saved successfully to: ${targetSvgPath}`);
console.log(`   Dimensions: ${totalW}x${totalH} (Cols: ${cols}, Rows: ${rows}, 64 Frames)`);

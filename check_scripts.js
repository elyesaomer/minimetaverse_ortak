const fs = require('fs');
const indexHtml = fs.readFileSync('public/index.html', 'utf8');

const scriptRegex = /<script src="([^"]+)"/g;
let match;
let missing = [];
while ((match = scriptRegex.exec(indexHtml)) !== null) {
    let src = match[1].split('?')[0];
    if (!src.startsWith('http') && !src.startsWith('/socket.io')) {
        let localPath = 'public/' + (src.startsWith('/') ? src.slice(1) : src);
        if (!fs.existsSync(localPath)) {
            missing.push(localPath);
        }
    }
}
if (missing.length === 0) {
    console.log('ALL script files in index.html exist!');
} else {
    console.error('Missing script files:', missing);
}

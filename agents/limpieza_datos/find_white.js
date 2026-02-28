const fs = require('fs');
const doc = fs.readFileSync('doc_raw.xml', 'utf8');

const matches = [];
let i = 0;
while (i < doc.length) {
    let tagStart = doc.indexOf('<', i);
    if (tagStart === -1) break;
    let tagEnd = doc.indexOf('>', tagStart);
    if (tagEnd === -1) break;

    let tag = doc.substring(tagStart, tagEnd + 1);
    if (tag.toLowerCase().includes('ffffff') || tag.toLowerCase().includes('white') || tag.toLowerCase().includes('color') || tag.toLowerCase().includes('fill')) {
        matches.push(tag);
    }
    i = tagEnd + 1;
}

const uniqueMatches = [...new Set(matches)];
console.log("Unique elements with color/fill/ffffff/white:");
console.log(uniqueMatches.join('\n'));

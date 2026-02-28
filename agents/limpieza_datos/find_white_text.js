const fs = require('fs');

const doc = fs.readFileSync('doc_raw.xml', 'utf8');

// Find all <w:r> tags
const regex = /<w:r[ >][\s\S]*?<\/w:r>/g;
let match;
while ((match = regex.exec(doc)) !== null) {
    const run = match[0];
    const textMatch = run.match(/<w:t[^>]*>(.*?)<\/w:t>/);
    if (!textMatch || !textMatch[1].trim()) continue;

    const text = textMatch[1].trim();
    const colorMatch = run.match(/<w:color\s+[^>]*\/>/);
    if (colorMatch && (colorMatch[0].includes('FFFFFF') || colorMatch[0].toLowerCase().includes('white'))) {
        console.log("WHITE TEXT:", text, colorMatch[0]);
    }
}
console.log("Finished searching for white text.");

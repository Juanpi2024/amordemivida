const fs = require('fs');
const docRaw = fs.readFileSync('doc_raw.xml', 'utf8');
const fills = docRaw.match(/w:fill="[^"]+"/gi) || [];
console.log("Unique fills:", [...new Set(fills)]);

const fs = require('fs');
const diff = require('diff');

const raw = fs.readFileSync('doc_raw.xml', 'utf8');
const limpio = fs.readFileSync('doc_limpio.xml', 'utf8');

const changes = diff.diffChars(raw, limpio);

let numChanges = 0;
changes.forEach(part => {
    if (part.added || part.removed) {
        numChanges++;
        console.log((part.added ? "ADDED: " : "REMOVED: ") + part.value);
    }
});
console.log("Total changes:", numChanges);

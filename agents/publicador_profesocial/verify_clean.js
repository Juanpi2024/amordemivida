const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const targetFile = 'temp_pablo/matematica_1m/PLANIFICACION_CLASE_A_CLASE__MARZO__LIMPIO_DRIVE.docx';

if (!fs.existsSync(targetFile)) {
    console.error('File not found:', targetFile);
    process.exit(1);
}

const zip = new AdmZip(fs.readFileSync(targetFile));
const entries = zip.getEntries();

console.log('--- Verifying White Text Patterns ---');
let foundWhite = false;

entries.forEach(entry => {
    if (entry.entryName.endsWith('.xml') && entry.entryName.startsWith('word/')) {
        const content = entry.getData().toString('utf8');

        // Patterns that represent white text or shading
        // We look for FFFFFF or white in tags or attributes
        const patterns = [
            { name: 'w:val="FFFFFF"', reg: /w:val="[fF]{6}"/ },
            { name: 'w:val="white"', reg: /w:val="white"/i },
            { name: 'w:color="FFFFFF"', reg: /w:color="[fF]{6}"/ },
            { name: 'fillcolor="white"', reg: /fillcolor="white"/i },
            { name: 'DrawingML White', reg: /<a:srgbClr\s+val="([fF]{6}|white|WHITE)"/i }
        ];

        patterns.forEach(p => {
            if (p.reg.test(content)) {
                console.log(`[!] Found ${p.name} in ${entry.entryName}`);
                // Print a snippet
                const match = content.match(new RegExp(`.{0,50}${p.reg.source}.{0,50}`, 'i'));
                if (match) console.log(`    Snippet: ...${match[0]}...`);
                foundWhite = true;
            }
        });
    }
});

if (!foundWhite) {
    console.log('✅ No white text patterns found in word/ XML files.');
} else {
    console.log('❌ Still found white text patterns.');
}

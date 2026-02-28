const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetFile = 'C:/Users/Casa/clawd/agents/publicador_profesocial/temp_pablo/matematica_1m/PLANIFICACION_CLASE_A_CLASE__MARZO__LIMPIO_DRIVE.docx';
const extractDir = 'C:/Users/Casa/clawd/agents/publicador_profesocial/temp_pablo/extracted_marzo';

try {
    if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

    const zipPath = targetFile.replace('.docx', '.zip');
    fs.copyFileSync(targetFile, zipPath);
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`);
    fs.unlinkSync(zipPath);

    console.log('--- Checking ALL XML files for White Patterns ---');

    const files = [];
    function walkSync(dir) {
        fs.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                walkSync(filePath);
            } else if (file.endsWith('.xml')) {
                files.push(filePath);
            }
        });
    }
    walkSync(extractDir);

    files.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativeName = path.relative(extractDir, filePath);

        const patterns = [
            { name: 'white color', reg: /w:(color|val|fill)="([fF]{6}|white)"/gi },
            { name: 'theme background1', reg: /themeColor="(background1|white|bg1|lt1)"/gi },
            { name: 'DrawingML srgb white', reg: /<a:srgbClr\s+val="([fF]{6}|white|WHITE)"/gi },
            { name: 'vml white', reg: /fillcolor="([fF]{6}|white|WHITE)"/gi }
        ];

        patterns.forEach(p => {
            let match;
            while ((match = p.reg.exec(content)) !== null) {
                console.log(`❌ Found ${p.name} (${match[0]}) in ${relativeName}`);
                console.log(`   Context: ...${content.substring(match.index - 50, match.index + 50)}...`);
            }
        });
    });

} catch (e) {
    console.error('Error:', e);
}

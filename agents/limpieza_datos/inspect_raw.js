const AdmZip = require('adm-zip');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const file = "D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO\\CS NATURALES\\BIOLOGIA\\unidad 3\\agosto\\PLANIFICACION_CLASE_A_CLASE__AGOSTO_89624_20210610_20200221_111713.DOC";
const tempDir = __dirname;
const sofficePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

const result = spawnSync(sofficePath, [
    '--headless',
    '--convert-to', 'docx',
    '--outdir', tempDir,
    file
]);

const convertedPath = path.join(tempDir, 'PLANIFICACION_CLASE_A_CLASE__AGOSTO_89624_20210610_20200221_111713.docx');
if (fs.existsSync(convertedPath)) {
    console.log("Converted successfully, analyzing document.xml...");
    const admZip = new AdmZip(fs.readFileSync(convertedPath));
    const entry = admZip.getEntry('word/document.xml') || admZip.getEntry('word\\document.xml');
    if (entry) {
        let content = entry.getData().toString('utf8');
        const colorMatches = content.match(/<w:color[^>]*>/gi) || [];
        console.log("Colors in raw converted docx:", [...new Set(colorMatches)]);

        const highlightMatches = content.match(/<w:highlight[^>]*>/gi) || [];
        console.log("Highlights in raw:", [...new Set(highlightMatches)]);

        const themeMatches = content.match(/w:themeColor[^=>]+="[^"]+"/gi) || [];
        console.log("themeColors in raw:", [...new Set(themeMatches)]);
    } else {
        console.log("No document.xml found in converted");
    }
} else {
    console.log("Conversion failed");
}

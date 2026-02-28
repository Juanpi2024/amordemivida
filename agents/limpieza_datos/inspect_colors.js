const AdmZip = require('adm-zip');

const file = "D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO\\CS NATURALES\\BIOLOGIA\\unidad 3\\agosto\\LIMPIO\\PLANIFICACION_CLASE_A_CLASE__AGOSTO_89624_20210610_20200221_111713_LIMPIO_DRIVE.docx";
const zip = new AdmZip(file);

// check for backslashes in entry names
let docEntry = zip.getEntry('word/document.xml') || zip.getEntry('word\\document.xml');

if (!docEntry) {
    zip.getEntries().forEach(entry => {
        if (entry.entryName === 'word\\document.xml') docEntry = entry;
    });
}

const content = docEntry.getData().toString('utf8');
const wColors = content.match(/<w:color[^>]*>/gi) || [];
console.log("Unique w:color elements in output:", [...new Set(wColors)]);

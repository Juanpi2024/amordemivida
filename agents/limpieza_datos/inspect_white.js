const AdmZip = require('adm-zip');

const file = "D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO\\CS NATURALES\\BIOLOGIA\\unidad 3\\agosto\\LIMPIO\\PLANIFICACION_CLASE_A_CLASE__AGOSTO_89624_20210610_20200221_111713_LIMPIO_DRIVE.docx";
const zip = new AdmZip(file);

// check for backslashes in entry names
let docEntry = zip.getEntry('word/document.xml') || zip.getEntry('word\\document.xml');

if (!docEntry) {
    // maybe we need to fix the slashes
    zip.getEntries().forEach(entry => {
        if (entry.entryName === 'word\\document.xml') docEntry = entry;
    });
}

if (docEntry) {
    const content = docEntry.getData().toString('utf8');

    // search for any color attribute
    const allColors = content.match(/w:val="([a-fA-F0-9]{6}|white|auto|clear)"/gi) || [];
    const uniqueColors = [...new Set(allColors)];
    console.log("Colors found:", uniqueColors);

    // search specifically around the white area if we know what to look for, 
    // or just colors not "auto"
    const wColors = content.match(/w:color[^>]*>/gi) || [];
    const uniqueWColors = [...new Set(wColors)];
    console.log("w:color tags:", uniqueWColors.slice(0, 10)); // just sample

    const highlightTags = content.match(/<w:highlight[^>]*>/gi) || [];
    console.log("Highlights:", [...new Set(highlightTags)]);

    const shdTags = content.match(/<w:shd[^>]*>/gi) || [];
    const uniqueShdTags = [...new Set(shdTags)];
    console.log("Shadings:", uniqueShdTags);

} else {
    console.log("No document.xml found:", zip.getEntries().map(e => e.entryName));
}

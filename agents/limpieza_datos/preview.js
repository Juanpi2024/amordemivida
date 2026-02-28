const AdmZip = require('adm-zip');
const fs = require('fs');

const zip = new AdmZip('PLANIFICACION_CLASE_A_CLASE__AGOSTO_89624_20210610_20200221_111713_LIMPIO.docx');
const doc = zip.getEntry('word/document.xml') || zip.getEntry('word\\document.xml');
const text = doc.getData().toString('utf8');

// Also print the `<w:color w:val="auto"/>` count
console.log('w:color auto:', text.match(/w:color[^>]*"auto"/g)?.length || 0);
console.log('w:shd fill auto:', text.match(/w:fill="auto"/g)?.length || 0);

// Just print the first 500 characters of the body text to see if text exists
const textOnly = text.replace(/<[^>]+>/g, '');
console.log("Text preview:", textOnly.substring(0, 500));

const AdmZip = require('../limpieza_datos/node_modules/adm-zip');
const z = new AdmZip('temp_pablo/PLANIFICACION_CLASE_A_CLASE_NOVIEMBRE_LIMPIO_DRIVE.docx');
z.extractAllTo('temp_pablo/extracted_nov', true);
console.log('Done extraction');

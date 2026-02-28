const fs = require('fs');

const { cleanDeep, removeHeaders, replaceText } = require('./modules/docx-cleaner');

(async () => {
    // We already have the converted docx as PLANIFICACION_CLASE_A_CLASE__AGOSTO_89624_20210610_20200221_111713.docx
    const convertedPath = "PLANIFICACION_CLASE_A_CLASE__AGOSTO_89624_20210610_20200221_111713.docx"
    const cleanedPath = convertedPath.replace('.docx', '_LIMPIO.docx');

    await cleanDeep(convertedPath, cleanedPath);
    await replaceText(cleanedPath, /mi aula/gi, 'mi drive', cleanedPath);

    // now we have both
    console.log("Done");
})();

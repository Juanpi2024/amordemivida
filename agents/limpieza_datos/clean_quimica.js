const fs = require('fs');
const path = require('path');
const { cleanDeep, removeHeaders, replaceText } = require('./modules/docx-cleaner');
const { convertAndCleanDoc } = require('./skills/doc-legacy-cleaner/doc-converter');

const rootDir = 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO\\CS NATURALES\\QUIMICA';

async function processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const tempDir = path.join(path.dirname(filePath), 'LIMPIO');

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
        if (ext === '.docx') {
            const cleanPath = path.join(tempDir, path.basename(filePath, '.docx') + '_LIMPIO_DRIVE.docx');
            console.log(`Procesando DOCX nativo: ${filePath}`);

            const metaResult = await cleanDeep(filePath, cleanPath);
            if (metaResult.success) {
                await removeHeaders(cleanPath, cleanPath);
                await replaceText(cleanPath, /mi aula/gi, 'mi drive', cleanPath);
                console.log(`✅ Transformado: ${cleanPath}`);
            } else {
                console.error(`❌ Error en DOCX: ${metaResult.error}`);
            }
        } else if (ext === '.doc') {
            console.log(`Procesando legacy DOC: ${filePath}`);
            const result = await convertAndCleanDoc(filePath, tempDir);
            if (result.success) {
                console.log(`✅ Transformado: ${result.outputPath}`);
            } else {
                console.error(`❌ Error en DOC: ${result.error}`);
            }
        }
    } catch (err) {
        console.error(`❌ Excepción procesando ${filePath}:`, err);
    }
}

async function scanAndProcess(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (entry.name !== 'LIMPIO') {
                await scanAndProcess(fullPath);
            }
        } else if (entry.isFile()) {
            if (entry.name.toLowerCase().includes('planificacion_clase_a_clase') && !fullPath.includes('LIMPIO')) {
                await processFile(fullPath);
            }
        }
    }
}

(async () => {
    console.log(`Comenzando búsqueda en Química: ${rootDir}`);
    await scanAndProcess(rootDir);
    console.log('Finalizado.');
})();

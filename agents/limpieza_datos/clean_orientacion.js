const fs = require('fs');
const path = require('path');
const { cleanDeep, removeHeaders, replaceText } = require('./modules/docx-cleaner');
const { convertAndCleanDoc } = require('./skills/doc-legacy-cleaner/doc-converter');

// Configuración de la ruta de Orientación
const rootDir = 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO\\ORIENTACION 1 md';

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
    if (!fs.existsSync(dir)) {
        console.error(`❌ El directorio no existe: ${dir}`);
        return;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        try {
            if (entry.isDirectory()) {
                if (entry.name !== 'LIMPIO') {
                    await scanAndProcess(fullPath);
                }
            } else if (entry.isFile()) {
                const fileName = entry.name.toLowerCase();
                // Filtro inclusivo como en Historia
                const isLessonPlan = fileName.includes('planificacion') || fileName.includes('clase_a_clase');
                const isSolucionario = fileName.includes('solucionario');

                if (isLessonPlan && !isSolucionario && !fullPath.includes('LIMPIO')) {
                    await processFile(fullPath);
                }
            }
        } catch (fileErr) {
            console.error(`❌ Error procesando entrada ${fullPath}:`, fileErr.message);
        }
    }
}

(async () => {
    try {
        console.log(`\n🚀 COMENZANDO LIMPIEZA DE ORIENTACIÓN: ${rootDir}`);
        console.log(`================================================================`);
        await scanAndProcess(rootDir);
        console.log(`\n✅ FINALIZADO.`);
    } catch (err) {
        console.error(`\n❌ ERROR FATAL EN EL SCRIPT:`, err);
        process.exit(1);
    }
})();

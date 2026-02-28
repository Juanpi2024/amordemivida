/**
 * test-skill.js
 * 
 * Prueba el skill doc-legacy-cleaner con un archivo .DOC real.
 * 
 * Uso:
 *   node agents/limpieza_datos/skills/doc-legacy-cleaner/test-skill.js [ruta-archivo.doc]
 * 
 * Si no se pasa argumento, busca el primer .doc en la carpeta tecnología.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { convertAndCleanDoc, findLibreOffice, isLegacyDoc } = require('./doc-converter');

// -----------------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------------
const CARPETA_TEST = 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\Religion\\religion catolica';
const TEMP_DIR = path.join(__dirname, 'temp_test');

// -----------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------
async function main() {
    console.log('\n🔬 TEST — doc-legacy-cleaner skill');
    console.log('='.repeat(50));

    // 1. Verificar LibreOffice
    console.log('\n[1] Detectando LibreOffice...');
    const soffice = findLibreOffice();
    if (!soffice) {
        console.error('❌ LibreOffice NO encontrado. Instálalo en https://www.libreoffice.org/download/');
        process.exit(1);
    }
    console.log(`   ✅ LibreOffice encontrado en: ${soffice}`);

    // 2. Seleccionar archivo de prueba
    let testFile = process.argv[2];

    if (!testFile) {
        console.log('\n[2] Buscando un archivo .DOC de prueba en Religión Católica...');
        try {
            const result = execSync(
                `powershell -command "Get-ChildItem '${CARPETA_TEST}' -Filter '*.doc' -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName"`,
                { encoding: 'utf8', timeout: 60000 }
            ).trim();
            testFile = result;
        } catch (e) {
            console.error('   ❌ No se pudo buscar archivos automáticamente.');
            console.log('   💡 Pasa la ruta manualmente: node test-skill.js "C:\\ruta\\al\\archivo.doc"');
            process.exit(1);
        }
    }

    if (!testFile || !fs.existsSync(testFile)) {
        console.error(`❌ Archivo no encontrado: ${testFile}`);
        process.exit(1);
    }

    console.log(`   📄 Archivo de prueba: ${path.basename(testFile)}`);
    console.log(`   📁 Ruta: ${testFile}`);

    // 3. Verificar si es .doc legacy
    console.log('\n[3] Verificando tipo de archivo...');
    const legacy = isLegacyDoc(testFile);
    console.log(`   ${legacy ? '✅ Es .DOC binario legacy (OLE2)' : 'ℹ️  No es .DOC binario legacy'}`);

    // 4. Crear carpeta temporal
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // 5. Ejecutar pipeline completo
    console.log('\n[4] Ejecutando pipeline convertAndCleanDoc...');
    console.log('-'.repeat(50));

    const startTime = Date.now();
    const result = await convertAndCleanDoc(testFile, TEMP_DIR);
    const totalMs = Date.now() - startTime;

    console.log('-'.repeat(50));

    if (result.success) {
        const sizeKB = Math.round(fs.statSync(result.outputPath).size / 1024);
        console.log(`\n✅ ÉXITO — Pipeline completado en ${(totalMs / 1000).toFixed(1)}s`);
        console.log(`   📄 Archivo limpio: ${path.basename(result.outputPath)}`);
        console.log(`   📦 Tamaño: ${sizeKB} KB`);
        console.log(`   📁 Ruta: ${result.outputPath}`);
        console.log('\n📊 Pasos ejecutados:');
        console.log(`   LibreOffice: ${result.steps.libreoffice?.path || 'N/A'}`);
        console.log(`   Conversión:  ${result.steps.convert?.success ? '✅' : '❌'} (${((result.steps.convert?.durationMs || 0) / 1000).toFixed(1)}s)`);
        console.log(`   cleanDeep:   ${result.steps.cleanDeep?.success ? '✅' : '⚠️'}`);
        console.log(`   removeHdrs:  ${result.steps.removeHeaders?.success ? '✅' : '⚠️'} (modified: ${result.steps.removeHeaders?.modified})`);
        console.log(`   replaceText: ${result.steps.replaceText?.success ? '✅' : '⚠️'} (${result.steps.replaceText?.matches || 0} reemplazos)`);
        console.log('\n🎉 El skill está listo para usarse en los scripts de publicación.');
    } else {
        console.error(`\n❌ FALLO — ${result.error}`);
        console.log('\n📊 Pasos hasta el fallo:');
        console.dir(result.steps, { depth: 3 });
        process.exit(1);
    }
}

main().catch(err => {
    console.error('\n💥 Error inesperado:', err);
    process.exit(1);
});

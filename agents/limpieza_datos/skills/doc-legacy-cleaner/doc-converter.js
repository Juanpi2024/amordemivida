/**
 * doc-converter.js
 * 
 * Skill: doc-legacy-cleaner
 * 
 * Convierte archivos .DOC binarios (Word 97-2003) a .docx moderno
 * usando LibreOffice headless, luego aplica el pipeline completo de
 * limpieza (metadata, headers, text replacement).
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Importar pipeline de limpieza existente
const { cleanDeep, removeHeaders, replaceText } = require('../../modules/docx-cleaner');
const AdmZip = require('adm-zip');

// --------------------------------------------------------------------------
// CONFIGURACIÓN
// --------------------------------------------------------------------------

// Ruta a LibreOffice en Windows (ajustar si está instalado en otro lugar)
const LIBREOFFICE_PATHS = [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    'soffice' // Si está en PATH del sistema
];

const CONVERSION_TIMEOUT_MS = 45000; // 45 segundos por archivo

// --------------------------------------------------------------------------
// DETECTAR LIBREOFFICE
// --------------------------------------------------------------------------

function findLibreOffice() {
    for (const soffice of LIBREOFFICE_PATHS) {
        // Primero intentar verificación por existencia de archivo (más rápido)
        if (soffice !== 'soffice') {
            try {
                if (fs.existsSync(soffice)) {
                    return soffice;
                }
            } catch (e) { /* continuar */ }
        } else {
            // Para 'soffice' en PATH, intentar ejecutarlo
            try {
                const result = spawnSync(soffice, ['--version'], { timeout: 8000, shell: true });
                if (result.status === 0) {
                    return soffice;
                }
            } catch (e) {
                continue;
            }
        }
    }
    return null;
}

// --------------------------------------------------------------------------
// CONVERSIÓN DOC → DOCX (usando LibreOffice headless)
// --------------------------------------------------------------------------

/**
 * Convierte un archivo .DOC a .docx usando LibreOffice modo headless.
 * 
 * @param {string} inputPath - Ruta al archivo .DOC original
 * @param {string} outputDir - Carpeta donde se guardará el .docx convertido
 * @param {string} sofficePath - Ruta al ejecutable de LibreOffice
 * @returns {{ success: boolean, outputPath?: string, error?: string, durationMs?: number }}
 */
function convertDocToDocx(inputPath, outputDir, sofficePath) {
    const startTime = Date.now();

    if (!fs.existsSync(inputPath)) {
        return { success: false, error: `Archivo no encontrado: ${inputPath}` };
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // LibreOffice convierte el archivo y lo guarda en outputDir con extensión .docx
    const result = spawnSync(sofficePath, [
        '--headless',
        '--convert-to', 'docx',
        '--outdir', outputDir,
        inputPath
    ], {
        timeout: CONVERSION_TIMEOUT_MS,
        encoding: 'utf8'
    });

    const durationMs = Date.now() - startTime;

    if (result.status !== 0) {
        const errMsg = result.stderr || result.error?.message || 'Error desconocido en LibreOffice';
        return { success: false, error: errMsg, durationMs };
    }

    // LibreOffice genera el archivo con el mismo nombre pero extensión .docx
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const convertedPath = path.join(outputDir, `${baseName}.docx`);

    if (!fs.existsSync(convertedPath)) {
        return {
            success: false,
            error: `LibreOffice finalizó pero no se encontró el archivo convertido: ${convertedPath}`,
            durationMs
        };
    }

    return { success: true, outputPath: convertedPath, durationMs };
}

// --------------------------------------------------------------------------
// FUNCIÓN PRINCIPAL: CONVERTIR + LIMPIAR COMPLETO
// --------------------------------------------------------------------------

/**
 * Pipeline completo para archivos .DOC:
 * 1. Detecta LibreOffice
 * 2. Convierte .DOC → .docx
 * 3. cleanDeep() → elimina metadatos
 * 4. removeHeaders() → elimina encabezados/pies de página (logos)
 * 5. replaceText() → reemplaza "mi aula" por "mi drive"
 * 
 * @param {string} inputPath - Ruta al archivo .DOC
 * @param {string} tempDir - Carpeta temporal para archivos intermedios
 * @param {object} [options] - Opciones adicionales
 * @param {string} [options.searchText] - Texto a buscar (default: /mi aula/gi)
 * @param {string} [options.replaceWith] - Texto de reemplazo (default: "mi drive")
 * @returns {Promise<{ success: boolean, outputPath?: string, error?: string, steps?: object }>}
 */
async function convertAndCleanDoc(inputPath, tempDir, options = {}) {
    const {
        searchText = /mi aula/gi,
        replaceWith = 'mi drive'
    } = options;

    const steps = {
        libreoffice: null,
        convert: null,
        cleanDeep: null,
        removeHeaders: null,
        replaceText: null
    };

    // ---- PASO 0: Detectar LibreOffice ----
    const sofficePath = findLibreOffice();
    steps.libreoffice = sofficePath ? { found: true, path: sofficePath } : { found: false };

    if (!sofficePath) {
        return {
            success: false,
            error: 'LibreOffice no encontrado. Instálalo en https://www.libreoffice.org/download/',
            steps
        };
    }

    console.log(`🔄 Convirtiendo DOC → DOCX: ${path.basename(inputPath)}`);

    // ---- PASO 1: Convertir DOC → DOCX ----
    const convertResult = convertDocToDocx(inputPath, tempDir, sofficePath);
    steps.convert = convertResult;

    if (!convertResult.success) {
        return {
            success: false,
            error: `Fallo en conversión LibreOffice: ${convertResult.error}`,
            steps
        };
    }

    const convertedDocxPath = convertResult.outputPath;
    console.log(`   ✅ Convertido en ${(convertResult.durationMs / 1000).toFixed(1)}s → ${path.basename(convertedDocxPath)}`);

    // ---- NORMALIZAR ZIP (fix ADM-ZIP "No descriptor present") ----
    // LibreOffice genera docx con data descriptors que adm-zip no tolera.
    // Re-leer y re-escribir con adm-zip normaliza el formato.
    console.log(`   🔧 Normalizando formato ZIP...`);
    try {
        const admZip = new AdmZip(fs.readFileSync(convertedDocxPath));
        admZip.writeZip(convertedDocxPath);
        console.log(`      ✅ ZIP normalizado.`);
    } catch (zipErr) {
        console.warn(`      ⚠️ No se pudo normalizar ZIP: ${zipErr.message} (continuando...)`);
    }

    // Ruta definitiva del archivo final limpio
    const baseName = path.basename(convertedDocxPath, '.docx');
    const finalCleanedPath = path.join(tempDir, `${baseName}_LIMPIO_DRIVE.docx`);

    // ---- PASO 2: cleanDeep ----
    const metaResult = await cleanDeep(convertedDocxPath, finalCleanedPath);
    steps.cleanDeep = metaResult;

    if (!metaResult.success && !fs.existsSync(finalCleanedPath)) {
        // Si cleanDeep falla pero el archivo convertido existe, usarlo directamente
        fs.copyFileSync(convertedDocxPath, finalCleanedPath);
    }

    // ---- PASO 3: removeHeaders ----
    console.log(`   💣 Eliminando Headers y Footers...`);
    const headerResult = await removeHeaders(finalCleanedPath, finalCleanedPath);
    steps.removeHeaders = headerResult;

    if (headerResult.success) {
        if (headerResult.modified) {
            console.log(`      ✅ Headers eliminados.`);
        } else {
            console.log(`      ℹ️ Sin headers detectados.`);
        }
    } else {
        console.warn(`      ⚠️ removeHeaders falló: ${headerResult.error}`);
    }

    // ---- PASO 4: replaceText ----
    const replaceResult = await replaceText(
        finalCleanedPath,
        searchText,
        replaceWith,
        finalCleanedPath
    );
    steps.replaceText = replaceResult;

    if (replaceResult.success) {
        console.log(`   ✅ Texto del cuerpo revisado.`);
        if (replaceResult.matches > 0) {
            console.log(`      (Se hicieron ${replaceResult.matches} reemplazos de "mi aula" → "mi drive")`);
        }
    } else {
        console.warn(`   ⚠️ replaceText falló: ${replaceResult.error}`);
    }

    // Limpiar archivo intermedio (el .docx sin limpiar)
    try {
        if (fs.existsSync(convertedDocxPath) && convertedDocxPath !== finalCleanedPath) {
            fs.unlinkSync(convertedDocxPath);
        }
    } catch (e) { /* ignore cleanup error */ }

    return {
        success: true,
        outputPath: finalCleanedPath,
        steps
    };
}

// --------------------------------------------------------------------------
// FUNCIÓN HELPER: ¿Es un archivo .DOC legacy?
// --------------------------------------------------------------------------

/**
 * Detecta si un archivo es un .DOC binario legacy (no procesable por adm-zip)
 * vs un .DOCX moderno (XML comprimido).
 * 
 * @param {string} filePath
 * @returns {boolean}
 */
function isLegacyDoc(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.docx') return false;
    if (ext !== '.doc') return false;

    // Verificar magic bytes: DOC binario empieza con D0 CF 11 E0 (OLE2)
    try {
        const buf = Buffer.alloc(8);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buf, 0, 8, 0);
        fs.closeSync(fd);
        return buf[0] === 0xD0 && buf[1] === 0xCF && buf[2] === 0x11 && buf[3] === 0xE0;
    } catch (e) {
        return false; // Si no se puede leer, asumir que no es binario
    }
}

/**
 * Convierte un archivo HTML a .docx usando LibreOffice modo headless.
 */
function convertHtmlToDocx(inputPath, outputDir, sofficePath) {
    if (!sofficePath) sofficePath = findLibreOffice();
    if (!sofficePath) return { success: false, error: 'LibreOffice no encontrado' };

    const result = spawnSync(sofficePath, [
        '--headless',
        '--convert-to', 'docx',
        '--outdir', outputDir,
        inputPath
    ], {
        timeout: CONVERSION_TIMEOUT_MS,
        encoding: 'utf8'
    });

    if (result.status !== 0) {
        return { success: false, error: result.stderr || 'Error en LibreOffice' };
    }

    const baseName = path.basename(inputPath, path.extname(inputPath));
    const convertedPath = path.join(outputDir, `${baseName}.docx`);

    return fs.existsSync(convertedPath) 
        ? { success: true, outputPath: convertedPath }
        : { success: false, error: 'Archivo no generado' };
}

module.exports = {
    convertAndCleanDoc,
    convertDocToDocx,
    findLibreOffice,
    isLegacyDoc,
    convertHtmlToDocx
};

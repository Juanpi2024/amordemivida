/**
 * publish_religion_1b.js
 * 
 * Publicación masiva: Religión Católica — 1° Básico
 * 
 * Con REVISIÓN PREVIA: escanea y lista archivos antes de publicar.
 * Usa el skill doc-legacy-cleaner para archivos .DOC binarios.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { convertAndCleanDoc, isLegacyDoc } = require('../limpieza_datos/skills/doc-legacy-cleaner/doc-converter');
const { cleanDeep, removeHeaders, replaceText } = require('../limpieza_datos/modules/docx-cleaner');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env') });

// Credenciales
const EMAIL = process.env.PROFESOCIAL_EMAIL || 'profeyeca2021@gmail.com';
const PASSWORD = process.env.PROFESOCIAL_PASSWORD || 'Juanpi2018';

// Configuración Base
const COMMON_CONFIG = {
    precio: '6',
    minAge: '5',
    maxAge: '7',
    resourceType: 'lesson',
    asignatura: 'Religión Católica',
    nivel: 'Primer Básico',
    basePath: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\primero basico asig\\Religion\\REL. CATOLICA LIS'
};

const TEMP_DIR = path.join(__dirname, 'temp_cleaned', 'religion_1b');

// Mapeo de meses
const MONTH_UNIT_MAP = {
    'marzo': 'Unidad 1', 'abril': 'Unidad 1', 'mayo': 'Unidad 1',
    'junio': 'Unidad 2', 'julio': 'Unidad 2',
    'agosto': 'Unidad 3', 'septiembre': 'Unidad 3',
    'octubre': 'Unidad 4', 'noviembre': 'Unidad 4', 'diciembre': 'Unidad 4'
};

const monthOrder = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Buscar planificaciones recursivamente
function findFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) {
        console.warn(`⚠️ Directorio no encontrado: ${dir}`);
        return fileList;
    }

    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        let stat;
        try { stat = fs.statSync(fullPath); } catch (e) { continue; }

        if (stat.isDirectory()) {
            findFiles(fullPath, fileList);
        } else if (/PLANIFICACION/i.test(item) && /\.(doc|docx)$/i.test(item) && !item.startsWith('~$') && !item.includes('ANUAL')) {
            const lowerPath = fullPath.toLowerCase();
            const lowerName = item.toLowerCase();
            let mesEncontrado = null;

            for (const mes of Object.keys(MONTH_UNIT_MAP)) {
                if (lowerPath.includes(mes) || lowerName.includes(mes)) {
                    mesEncontrado = mes.charAt(0).toUpperCase() + mes.slice(1);
                    break;
                }
            }

            if (mesEncontrado) {
                fileList.push({
                    path: fullPath,
                    name: item,
                    mes: mesEncontrado,
                    unidad: MONTH_UNIT_MAP[mesEncontrado.toLowerCase()] || 'General',
                    ext: path.extname(item).toLowerCase()
                });
            }
        }
    }
    return fileList;
}

function generarMetadatos(item) {
    const titulo = `Planificación Clase a Clase: ${item.mes} | ${COMMON_CONFIG.asignatura} ${COMMON_CONFIG.nivel}`;

    const descripcion = `
        <strong>✝️ Planificación Detallada Clase a Clase - Mes de ${item.mes}</strong><br><br>
        Recurso pedagógico completo para la asignatura de <strong>${COMMON_CONFIG.asignatura}</strong> en <strong>${COMMON_CONFIG.nivel}</strong>.<br><br>
        
        <strong>✅ Incluye:</strong>
        <ul>
            <li>Planificación diaria estructurada (Inicio, Desarrollo, Cierre).</li>
            <li>Objetivos de Aprendizaje (OA) de Religión Católica.</li>
            <li>Indicadores de evaluación y actitudes.</li>
            <li>Valores y virtudes trabajadas según el currículum.</li>
            <li>Actividades lúdicas y reflexivas para formación valórica.</li>
        </ul><br>
        
        <strong>💡 ¿Por qué descargar este recurso?</strong>
        <ul>
            <li>Ahorra tiempo valioso de planificación.</li>
            <li>Alineado a los programas del Ministerio de Educación.</li>
            <li>Ideal para educadores de Religión de NB1 (1° Básico).</li>
        </ul><br>
        
        <em>Perteneciente a la <strong>${item.unidad}</strong>. ¡Descárgalo ahora!</em>
    `;

    const tags = [
        COMMON_CONFIG.asignatura,
        COMMON_CONFIG.nivel,
        'Planificación',
        item.mes,
        'Religión',
        'Valores',
        'Formación Valórica',
        'NB1',
        item.unidad,
        'Clase a clase',
        'Material Docente',
        'Educación Religiosa',
        'Primer Básico'
    ];

    return { titulo, descripcion, tags };
}

// Pipeline de limpieza según tipo de archivo
async function procesarArchivo(item) {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

    const ext = item.ext;
    const baseName = path.basename(item.path, ext);
    const cleanedPath = path.join(TEMP_DIR, `${item.mes}_${baseName}_LIMPIO_DRIVE.docx`);

    if (ext === '.doc') {
        // --- Pipeline DOC legacy (LibreOffice) ---
        console.log(`   🔄 DOC binario detectado → usando LibreOffice`);
        const result = await convertAndCleanDoc(item.path, TEMP_DIR);
        if (!result.success) {
            console.error(`   ❌ Conversión fallida: ${result.error}`);
            return null;
        }
        // Renombrar al nombre esperado si difiere
        if (result.outputPath !== cleanedPath) {
            try { fs.renameSync(result.outputPath, cleanedPath); } catch (e) { return result.outputPath; }
        }
        return cleanedPath;

    } else {
        // --- Pipeline DOCX moderno ---
        console.log(`   📄 DOCX moderno → pipeline directo`);
        const metaResult = await cleanDeep(item.path, cleanedPath);
        if (!metaResult.success && !fs.existsSync(cleanedPath)) {
            console.error(`   ❌ cleanDeep falló y no hay output.`);
            return null;
        }

        await removeHeaders(cleanedPath, cleanedPath);
        await replaceText(cleanedPath, /mi aula/gi, 'mi drive', cleanedPath);
        return cleanedPath;
    }
}

// Confirmación en consola
async function confirmarPublicacion(archivos) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 REVISIÓN PREVIA — Archivos a publicar:');
    console.log('='.repeat(60));
    archivos.forEach((f, i) => {
        console.log(`  ${i + 1}. [${f.ext.toUpperCase()}] ${f.mes} (${f.unidad})`);
        console.log(`     ${f.name}`);
    });
    console.log('='.repeat(60));
    console.log(`\n✅ Total: ${archivos.length} planificaciones`);
    console.log('   Asignatura : Religión Católica');
    console.log('   Nivel      : 1° Básico');
    console.log('   Precio     : $' + COMMON_CONFIG.precio + ' monedas');
    console.log('   Rango edad : ' + COMMON_CONFIG.minAge + ' - ' + COMMON_CONFIG.maxAge + ' años');
    console.log('\n⚠️  Presiona ENTER para iniciar la publicación, o Ctrl+C para cancelar...');

    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question('', () => {
            rl.close();
            resolve();
        });
    });
}

(async () => {
    console.log(`\n✝️  RELIGIÓN CATÓLICA 1° BÁSICO — Limpieza y Publicación`);
    console.log('='.repeat(60));

    // 1. Escanear archivos
    console.log(`\n🔍 Escaneando: ${COMMON_CONFIG.basePath}`);
    const archivos = findFiles(COMMON_CONFIG.basePath);

    if (archivos.length === 0) {
        console.error('❌ No se encontraron planificaciones. Verifica la ruta.');
        process.exit(1);
    }

    // Ordenar por mes
    archivos.sort((a, b) => monthOrder.indexOf(a.mes) - monthOrder.indexOf(b.mes));

    // ===== REVISIÓN PREVIA (pausar antes de publicar) =====
    await confirmarPublicacion(archivos);

    console.log('\n🚀 Iniciando publicación...\n');

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    try {
        // Login
        console.log('🌍 Iniciando sesión en Profe.Social...');
        await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });
        if (await page.isVisible('#user_email')) {
            await page.fill('#user_email', EMAIL);
            await page.fill('#user_password', PASSWORD);
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle' }),
                page.click('button.is-primary.is-block')
            ]);
            console.log('✅ Login exitoso.');
        }

        // Procesar cada archivo
        for (const item of archivos) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📅 PROCESANDO: ${item.mes} — ${item.unidad}`);
            console.log(`   Archivo: ${item.name}`);

            // Limpiar
            const finalPath = await procesarArchivo(item);
            if (!finalPath) {
                console.error(`   ⚠️ Se OMITE ${item.mes} por fallo en limpieza.`);
                continue;
            }
            console.log(`   ✅ Listo para subir: ${path.basename(finalPath)}`);

            const meta = generarMetadatos(item);

            // Publicar
            await page.goto('https://profe.social/posts/new', { waitUntil: 'domcontentloaded' });

            await page.fill('#post_title', meta.titulo);
            await page.fill('#post_coin_price', COMMON_CONFIG.precio);

            await page.waitForSelector('trix-editor');
            await page.evaluate((html) => {
                const editor = document.querySelector('trix-editor');
                if (editor && editor.editor) {
                    editor.editor.loadHTML('');
                    editor.editor.insertHTML(html);
                }
            }, meta.descripcion);

            await page.fill('#post_min_age', COMMON_CONFIG.minAge);
            await page.fill('#post_max_age', COMMON_CONFIG.maxAge);
            await page.selectOption('#post_resource_type', COMMON_CONFIG.resourceType);

            // Etiquetas
            const tagInputSelector = 'input[placeholder*="Etiquetas"]';
            await page.waitForSelector(tagInputSelector);
            for (const tag of meta.tags) {
                await page.click(tagInputSelector);
                await page.fill(tagInputSelector, tag);
                await page.press(tagInputSelector, 'Enter');
                await page.waitForTimeout(350);
            }

            // Subir archivo
            console.log(`   📁 Subiendo archivo...`);
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.setInputFiles(finalPath);
                console.log('   ⏳ Esperando carga (10s)...');
                await page.waitForTimeout(10000);
            } else {
                console.error('   ❌ Input de archivo no encontrado. Saltando...');
                continue;
            }

            // Checkboxes
            await page.evaluate(() => {
                document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    if (!cb.checked) cb.click();
                });
            });

            // Publicar
            console.log('   🚀 Publicando...');
            await page.waitForTimeout(2000);

            const publishSelectors = [
                'input[type="submit"][name="commit"]',
                'button.is-primary.is-large',
                'button:has-text("Publicar")',
                'input[value="Publicar"]',
                'form[action="/posts"] input[type="submit"]'
            ];

            let clicked = false;
            for (const sel of publishSelectors) {
                const btn = await page.$(sel);
                if (btn && await btn.isVisible()) {
                    await btn.click();
                    clicked = true;
                    break;
                }
            }

            if (!clicked) {
                await page.evaluate(() => {
                    const form = document.querySelector('form[action="/posts"]') || document.querySelector('form');
                    if (form) form.submit();
                });
            }

            // Confirmación
            try {
                await page.waitForURL('**/posts/*', { timeout: 60000 });
                if (!page.url().includes('/new')) {
                    console.log(`   ✅ PUBLICADO: ${item.mes} → ${page.url()}`);
                }
            } catch (e) {
                console.error(`   ⚠️ Timeout esperando redirección.`);
                await page.screenshot({ path: path.join(__dirname, `religion1b_error_${item.mes}.png`) });
            }

            await page.waitForTimeout(3000);
        }

        console.log('\n🏁 FIN — Religión Católica 1° Básico completado.');

    } catch (err) {
        console.error('❌ ERROR CRÍTICO:', err);
        await page.screenshot({ path: path.join(__dirname, 'religion1b_fatal_error.png') });
    } finally {
        await browser.close();
    }
})();

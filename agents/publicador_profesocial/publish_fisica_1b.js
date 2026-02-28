/**
 * publish_fisica_1b.js
 * Publicación masiva: Educación Física y Salud — 1° Básico
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { convertAndCleanDoc } = require('../limpieza_datos/skills/doc-legacy-cleaner/doc-converter');
const { cleanDeep, removeHeaders, replaceText } = require('../limpieza_datos/modules/docx-cleaner');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env') });

const EMAIL = process.env.PROFESOCIAL_EMAIL || 'profeyeca2021@gmail.com';
const PASSWORD = process.env.PROFESOCIAL_PASSWORD || 'Juanpi2018';

const COMMON_CONFIG = {
    precio: '6', minAge: '5', maxAge: '7',
    resourceType: 'lesson',
    asignatura: 'Educación Física y Salud',
    nivel: 'Primer Básico',
    basePath: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\primero basico asig\\ed fisica LIS'
};

const TEMP_DIR = path.join(__dirname, 'temp_cleaned', 'fisica_1b');
const MONTH_UNIT_MAP = {
    'marzo': 'Unidad 1', 'abril': 'Unidad 1', 'mayo': 'Unidad 1',
    'junio': 'Unidad 2', 'julio': 'Unidad 2',
    'agosto': 'Unidad 3', 'septiembre': 'Unidad 3',
    'octubre': 'Unidad 4', 'noviembre': 'Unidad 4', 'diciembre': 'Unidad 4'
};
const monthOrder = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function findFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) { console.warn(`⚠️ No encontrado: ${dir}`); return fileList; }
    for (const item of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, item);
        let stat; try { stat = fs.statSync(fullPath); } catch (e) { continue; }
        if (stat.isDirectory()) { findFiles(fullPath, fileList); continue; }
        if (/PLANIFICACION/i.test(item) && /\.(doc|docx)$/i.test(item) && !item.startsWith('~$') && !item.includes('ANUAL')) {
            const lowerPath = fullPath.toLowerCase(), lowerName = item.toLowerCase();
            for (const mes of Object.keys(MONTH_UNIT_MAP)) {
                if (lowerPath.includes(mes) || lowerName.includes(mes)) {
                    const mesLabel = mes.charAt(0).toUpperCase() + mes.slice(1);
                    fileList.push({
                        path: fullPath, name: item, mes: mesLabel,
                        unidad: MONTH_UNIT_MAP[mes], ext: path.extname(item).toLowerCase()
                    });
                    break;
                }
            }
        }
    }
    return fileList;
}

function generarMetadatos(item) {
    const titulo = `Planificación Clase a Clase: ${item.mes} | ${COMMON_CONFIG.asignatura} ${COMMON_CONFIG.nivel}`;
    const descripcion = `
        <strong>🏃‍♂️ Planificación Detallada Clase a Clase - Mes de ${item.mes}</strong><br><br>
        Recurso pedagógico completo para la asignatura de <strong>${COMMON_CONFIG.asignatura}</strong> en <strong>${COMMON_CONFIG.nivel}</strong>.<br><br>
        <strong>✅ Incluye:</strong>
        <ul>
            <li>Planificación diaria estructurada (Calentamiento, Actividad Central, Vuelta a la calma).</li>
            <li>Objetivos de Aprendizaje (OA) de Educación Física y Salud.</li>
            <li>Enfoque en el desarrollo de habilidades motrices básicas y vida activa.</li>
            <li>Actividades de juego motor, coordinación y trabajo en equipo.</li>
            <li>Sugerencias de seguridad y materiales para cada sesión.</li>
        </ul><br>
        <strong>💡 ¿Por qué descargar este recurso?</strong>
        <ul>
            <li>Ahorra tiempo en la planificación de tus sesiones de educación física.</li>
            <li>Alineado fielmente al currículo del Ministerio de Educación.</li>
            <li>Ideal para promover hábitos de vida saludable desde el primer año de enseñanza básica.</li>
        </ul><br>
        <em>Perteneciente a la <strong>${item.unidad}</strong>. ¡Descárgalo ahora!</em>
    `;
    const tags = [COMMON_CONFIG.asignatura, COMMON_CONFIG.nivel, 'Planificación', item.mes,
        'Educación Física', 'Vida Saludable', 'Deportes', 'NB1', item.unidad,
        'Clase a clase', 'Material Docente', 'Primer Básico', 'Motricidad'];
    return { titulo, descripcion, tags };
}

async function procesarArchivo(item) {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    const ext = item.ext;
    const baseName = path.basename(item.path, ext);
    const cleanedPath = path.join(TEMP_DIR, `${item.mes}_${baseName}_LIMPIO_DRIVE.docx`);
    if (ext === '.doc') {
        process.stdout.write(`   🔄 DOC → LibreOffice`);
        const result = await convertAndCleanDoc(item.path, TEMP_DIR);
        if (!result.success) { console.error(`   ❌ ${result.error}`); return null; }
        if (result.outputPath !== cleanedPath) { try { fs.renameSync(result.outputPath, cleanedPath); } catch (e) { return result.outputPath; } }
        return cleanedPath;
    } else {
        process.stdout.write(`   📄 DOCX → pipeline directo`);
        const metaResult = await cleanDeep(item.path, cleanedPath);
        if (!metaResult.success && !fs.existsSync(cleanedPath)) { console.error(`   ❌ cleanDeep falló`); return null; }
        await removeHeaders(cleanedPath, cleanedPath);
        await replaceText(cleanedPath, /mi aula/gi, 'mi drive', cleanedPath);
        return cleanedPath;
    }
}

async function confirmarPublicacion(archivos) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 REVISIÓN PREVIA — Archivos a publicar:');
    console.log('='.repeat(60));
    archivos.forEach((f, i) => { console.log(`  ${i + 1}. [${f.ext.toUpperCase()}] ${f.mes} (${f.unidad})\n     ${f.name}`); });
    console.log('='.repeat(60));
    console.log(`\n✅ Total: ${archivos.length} | Asignatura: ${COMMON_CONFIG.asignatura} | Nivel: ${COMMON_CONFIG.nivel}`);
    console.log('\n⚠️  Presiona ENTER para publicar, o Ctrl+C para cancelar...');
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question('', () => { rl.close(); resolve(); });
    });
}

(async () => {
    console.log(`\n🏃‍♂️  EDUCACIÓN FÍSICA 1° BÁSICO — Limpieza y Publicación`);
    console.log('='.repeat(60));
    console.log(`\n🔍 Escaneando: ${COMMON_CONFIG.basePath}`);
    const archivos = findFiles(COMMON_CONFIG.basePath);
    if (archivos.length === 0) { console.error('❌ Sin planificaciones.'); process.exit(1); }
    archivos.sort((a, b) => monthOrder.indexOf(a.mes) - monthOrder.indexOf(b.mes));
    await confirmarPublicacion(archivos);
    console.log('\n🚀 Iniciando publicación...\n');

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    try {
        console.log('🌍 Iniciando sesión...');
        await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });
        if (await page.isVisible('#user_email')) {
            await page.fill('#user_email', EMAIL);
            await page.fill('#user_password', PASSWORD);
            await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle' }), page.click('button.is-primary.is-block')]);
            console.log('✅ Login exitoso.');
        }
        for (const item of archivos) {
            console.log(`\n${'='.repeat(60)}\n📅 PROCESANDO: ${item.mes} — ${item.unidad}\n   Archivo: ${item.name}`);
            const finalPath = await procesarArchivo(item);
            if (!finalPath) { console.error(`   ⚠️ OMITIDO: ${item.mes}`); continue; }
            console.log(`\n   ✅ Listo para subir: ${path.basename(finalPath)}`);
            const meta = generarMetadatos(item);
            await page.goto('https://profe.social/posts/new', { waitUntil: 'domcontentloaded' });
            await page.fill('#post_title', meta.titulo);
            await page.fill('#post_coin_price', COMMON_CONFIG.precio);
            await page.waitForSelector('trix-editor');
            await page.evaluate((html) => { const ed = document.querySelector('trix-editor'); if (ed?.editor) { ed.editor.loadHTML(''); ed.editor.insertHTML(html); } }, meta.descripcion);
            await page.fill('#post_min_age', COMMON_CONFIG.minAge);
            await page.fill('#post_max_age', COMMON_CONFIG.maxAge);
            await page.selectOption('#post_resource_type', COMMON_CONFIG.resourceType);
            const tagSel = 'input[placeholder*="Etiquetas"]';
            await page.waitForSelector(tagSel);
            for (const tag of meta.tags) { await page.click(tagSel); await page.fill(tagSel, tag); await page.press(tagSel, 'Enter'); await page.waitForTimeout(350); }
            console.log(`   📁 Subiendo...`);
            const fi = await page.$('input[type="file"]');
            if (fi) { await fi.setInputFiles(finalPath); await page.waitForTimeout(10000); }
            else { console.error('   ❌ Input file no encontrado.'); continue; }
            await page.evaluate(() => document.querySelectorAll('input[type="checkbox"]').forEach(cb => { if (!cb.checked) cb.click(); }));
            console.log('   🚀 Publicando...');
            await page.waitForTimeout(2000);
            const sels = ['input[type="submit"][name="commit"]', 'button.is-primary.is-large', 'button:has-text("Publicar")', 'input[value="Publicar"]', 'form[action="/posts"] input[type="submit"]'];
            let clicked = false;
            for (const sel of sels) { const btn = await page.$(sel); if (btn && await btn.isVisible()) { await btn.click(); clicked = true; break; } }
            if (!clicked) await page.evaluate(() => { const f = document.querySelector('form[action="/posts"]') || document.querySelector('form'); if (f) f.submit(); });
            try {
                await page.waitForURL('**/posts/*', { timeout: 60000 });
                if (!page.url().includes('/new')) console.log(`   ✅ PUBLICADO: ${item.mes} → ${page.url()}`);
            } catch (e) { console.error(`   ⚠️ Timeout.`); await page.screenshot({ path: path.join(__dirname, `fisica1b_error_${item.mes}.png`) }); }
            await page.waitForTimeout(3000);
        }
        console.log('\n🏁 FIN — Educación Física 1° Básico completado.');
    } catch (err) { console.error('❌ ERROR:', err); await page.screenshot({ path: path.join(__dirname, 'fisica1b_fatal.png') }); }
    finally { await browser.close(); }
})();

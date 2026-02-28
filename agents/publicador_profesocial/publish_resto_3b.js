/**
 * publish_resto_3b.js
 * Publicación masiva para las demás asignaturas de 3° Básico.
 * Sin tiempo de espera para vista previa según lo solicitado.
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

const LEVEL = 'Tercero Básico';
const BASE_PATH = 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\ASIGNATURAS 3 bas';

const SUBJECTS = [
    { dir: 'Ed fisica LIS', name: 'Educación Física y Salud', tags: ['Educación Física', 'Salud', 'Motor'] },
    { dir: 'Naturales LIS', name: 'Ciencias Naturales', tags: ['Ciencias Naturales', 'Experimentos', 'Naturaleza'] },
    { dir: 'Religion LIS', name: 'Religión', tags: ['Religión', 'Valores'] },
    { dir: 'Tecnologia LIS', name: 'Tecnología', tags: ['Tecnología', 'Herramientas', 'Innovación'] },
    { dir: 'ingles LIS', name: 'Inglés', tags: ['Inglés', 'English', 'Idiomas'] },
    { dir: 'matematica LIS', name: 'Matemática', tags: ['Matemática', 'Números', 'Geometría'] },
    { dir: 'musica LIS', name: 'Música', tags: ['Música', 'Arte', 'Instrumentos'] },
    { dir: 'orientacion LIS', name: 'Orientación', tags: ['Orientación', 'Autoestima', 'Convivencia'] },
    { dir: 'visuales LIS', name: 'Artes Visuales', tags: ['Artes Visuales', 'Pintura', 'Manualidades'] }
];

const TEMP_BASE = path.join(__dirname, 'temp_cleaned', 'resto_3b');
const MONTH_UNIT_MAP = {
    'marzo': 'Unidad 1', 'abril': 'Unidad 1', 'mayo': 'Unidad 1',
    'junio': 'Unidad 2', 'julio': 'Unidad 2',
    'agosto': 'Unidad 3', 'septiembre': 'Unidad 3', 'octubre': 'Unidad 3',
    'noviembre': 'Unidad 4', 'diciembre': 'Unidad 4'
};
const monthOrder = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function findFiles(dir, subject, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    for (const item of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, item);
        let stat; try { stat = fs.statSync(fullPath); } catch (e) { continue; }
        if (stat.isDirectory()) { findFiles(fullPath, subject, fileList); continue; }
        if (/PLANIFICACION/i.test(item) && /\.(doc|docx)$/i.test(item) && !item.startsWith('~$') && !item.includes('ANUAL')) {
            const lowerPath = fullPath.toLowerCase(); const lowerName = item.toLowerCase();
            for (const mes of Object.keys(MONTH_UNIT_MAP)) {
                if (lowerPath.includes(mes) || lowerName.includes(mes)) {
                    if (!lowerPath.includes('limpio')) {
                        fileList.push({
                            path: fullPath, name: item, mes: mes.charAt(0).toUpperCase() + mes.slice(1),
                            unidad: MONTH_UNIT_MAP[mes], ext: path.extname(item).toLowerCase(),
                            subjectObj: subject
                        });
                    }
                    break;
                }
            }
        }
    }
    return fileList;
}

function generarMetadatos(item) {
    const titulo = `Planificación Clase a Clase: ${item.mes} | ${item.subjectObj.name} ${LEVEL}`;
    const descripcion = `
        <strong>📚 Planificación Detallada Clase a Clase - Mes de ${item.mes}</strong><br><br>
        Recurso pedagógico completo para <strong>${item.subjectObj.name}</strong> en <strong>${LEVEL}</strong>.<br><br>
        <strong>✅ Incluye:</strong>
        <ul>
            <li>Planificación diaria estructurada (Inicio, Desarrollo, Cierre).</li>
            <li>Objetivos de Aprendizaje (OA).</li>
            <li>Indicadores de evaluación.</li>
        </ul><br>
        <strong>💡 ¿Por qué descargar este recurso?</strong>
        <ul>
            <li>Ahorra tiempo valioso de planificación.</li>
            <li>Alineado al currículo del Ministerio de Educación de Chile.</li>
        </ul><br>
        <em>Perteneciente a la <strong>${item.unidad}</strong>. ¡Descárgalo ahora!</em>
    `;
    const tags = ['Tercero Básico', 'Planificación', item.mes, 'NB2', item.unidad, 'Clase a clase', 'Material Docente', ...item.subjectObj.tags];
    return { titulo, descripcion, tags };
}

async function procesarArchivo(item) {
    const tempDir = path.join(TEMP_BASE, item.subjectObj.dir);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const ext = item.ext;
    const baseName = path.basename(item.path, ext);
    const cleanedPath = path.join(tempDir, `${item.mes}_${baseName}_LIMPIO_DRIVE.docx`);

    if (ext === '.doc') {
        const result = await convertAndCleanDoc(item.path, tempDir);
        if (!result.success) return null;
        if (result.outputPath !== cleanedPath) { try { fs.renameSync(result.outputPath, cleanedPath); } catch (e) { return result.outputPath; } }
        return cleanedPath;
    } else {
        const metaResult = await cleanDeep(item.path, cleanedPath);
        if (!metaResult.success && !fs.existsSync(cleanedPath)) return null;
        await removeHeaders(cleanedPath, cleanedPath);
        await replaceText(cleanedPath, /mi aula/gi, 'mi drive', cleanedPath);
        return cleanedPath;
    }
}

(async () => {
    console.log(`\n🤖 PUBLICACIÓN MASIVA RESTO DE ASIGNATURAS - TERCERO BÁSICO`);
    console.log('='.repeat(60));

    let archivosTotales = [];
    for (const sub of SUBJECTS) {
        const subPath = path.join(BASE_PATH, sub.dir);
        if (fs.existsSync(subPath)) {
            const archivos = findFiles(subPath, sub);
            archivosTotales.push(...archivos);
        }
    }

    if (archivosTotales.length === 0) { console.error('❌ Sin planificaciones a publicar.'); process.exit(1); }

    // Ordenar por Asignatura -> Mes
    archivosTotales.sort((a, b) => {
        if (a.subjectObj.name === b.subjectObj.name) {
            return monthOrder.indexOf(a.mes) - monthOrder.indexOf(b.mes);
        }
        return a.subjectObj.name.localeCompare(b.subjectObj.name);
    });

    console.log(`\n✅ Total a publicar: ${archivosTotales.length} archivos`);
    console.log('⏳ Empezando confirmación automática de 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const browser = await chromium.launch({ headless: false, slowMo: 50 });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    try {
        console.log('🌍 Iniciando sesión en ProfeSocial...');
        await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });
        if (await page.isVisible('#user_email')) {
            await page.fill('#user_email', EMAIL);
            await page.fill('#user_password', PASSWORD);
            await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle' }), page.click('button.is-primary.is-block')]);
            console.log('✅ Login exitoso.');
        }

        for (const item of archivosTotales) {
            console.log(`\n${'='.repeat(60)}\n📌 [${item.subjectObj.name}] PROCESANDO: ${item.mes} — ${item.unidad}`);

            const finalPath = await procesarArchivo(item);
            if (!finalPath) { console.error(`   ⚠️ OMITIDO: ${item.mes}`); continue; }

            const meta = generarMetadatos(item);
            await page.goto('https://profe.social/posts/new', { waitUntil: 'domcontentloaded' });

            await page.fill('#post_title', meta.titulo);
            await page.fill('#post_coin_price', '6');

            await page.waitForSelector('trix-editor');
            await page.evaluate((html) => { const ed = document.querySelector('trix-editor'); if (ed?.editor) { ed.editor.loadHTML(''); ed.editor.insertHTML(html); } }, meta.descripcion);

            await page.fill('#post_min_age', '8');
            await page.fill('#post_max_age', '10');
            await page.selectOption('#post_resource_type', 'lesson');

            const tagSel = 'input[placeholder*="Etiquetas"]';
            await page.waitForSelector(tagSel);

            // Subconjunto de tags para no saturar
            const safeTags = meta.tags.slice(0, 7);
            for (const tag of safeTags) {
                await page.click(tagSel);
                await page.fill(tagSel, tag);
                await page.press(tagSel, 'Enter');
                await page.waitForTimeout(100);
            }

            const fi = await page.$('input[type="file"]');
            if (fi) {
                await fi.setInputFiles(finalPath);
                // SIN tiempo artificial artificial: Carga directa
                console.log('   📁 Archivo cargado a nivel DOM.');
            } else {
                console.error('   ❌ Input file no encontrado.');
                continue;
            }

            await page.evaluate(() => document.querySelectorAll('input[type="checkbox"]').forEach(cb => { if (!cb.checked) cb.click(); }));

            console.log('   🚀 Confirmando publicación rápidamente...');

            const sels = ['input[type="submit"][name="commit"]', 'button.is-primary.is-large', 'button:has-text("Publicar")', 'input[value="Publicar"]', 'form[action="/posts"] input[type="submit"]'];
            let clicked = false;
            for (const sel of sels) { const btn = await page.$(sel); if (btn && await btn.isVisible()) { await btn.click(); clicked = true; break; } }
            if (!clicked) await page.evaluate(() => { const f = document.querySelector('form[action="/posts"]') || document.querySelector('form'); if (f) f.submit(); });

            try {
                await page.waitForURL('**/posts/*', { timeout: 30000 });
                if (!page.url().includes('/new')) console.log(`   ✅ PUBLICADO CON ÉXITO: ${item.mes} → ${page.url()}`);
            } catch (e) {
                console.error(`   ⚠️ Timeout logueando url.`);
            }
        }
        console.log('\n🏁 FIN — Publicación Resto Asignaturas 3° Básica completada.');
    } catch (err) {
        console.error('❌ ERROR FATAL:', err);
    } finally {
        await browser.close();
    }
})();

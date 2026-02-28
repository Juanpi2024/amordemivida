/**
 * publish_4bas.js
 * Publicación masiva para las asignaturas de 4° Básico.
 * Mantiene la regla de 8 segundos de espera para la vista previa.
 * Diferencia entre Religión Católica y Evangélica.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env') });

const EMAIL = process.env.PROFESOCIAL_EMAIL || 'profeyeca2021@gmail.com';
const PASSWORD = process.env.PROFESOCIAL_PASSWORD || 'Juanpi2018';

const LEVEL = 'Cuarto Básico';
const BASE_PATH = 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\ASIGNATURAS 4 BAS';

const SUBJECTS = [
    { dir: 'Ed fisica LIS', name: 'Educación Física y Salud', tags: ['Educación Física', 'Salud'] },
    { dir: 'Naturales LIS', name: 'Ciencias Naturales', tags: ['Ciencias Naturales', 'Experimentos'] },
    { dir: 'Religion LIS/religion catolica LIS', name: 'Religión Católica', tags: ['Religión Católica', 'Valores'] },
    { dir: 'Religion LIS/Religion Evangelica LIS', name: 'Religión Evangélica', tags: ['Religión Evangélica', 'Valores'] },
    { dir: 'Tecnologia LIS', name: 'Tecnología', tags: ['Tecnología', 'Innovación'] },
    { dir: 'historia LIS', name: 'Historia, Geografía y Ciencias Sociales', tags: ['Historia', 'Geografía'] },
    { dir: 'ingles LIS', name: 'Inglés', tags: ['Inglés', 'Idiomas'] },
    { dir: 'lenguaje LIS', name: 'Lenguaje y Comunicación', tags: ['Lenguaje', 'Literatura'] },
    { dir: 'matematica LIS', name: 'Matemática', tags: ['Matemática', 'Números'] },
    { dir: 'musica LIS', name: 'Música', tags: ['Música', 'Arte'] },
    { dir: 'orientacion LIS', name: 'Orientación', tags: ['Orientación', 'Convivencia'] },
    { dir: 'visuales LIS', name: 'Artes Visuales', tags: ['Artes Visuales', 'Pintura'] }
];

const MONTH_UNIT_MAP = {
    'marzo': 'Unidad 1', 'abril': 'Unidad 1', 'mayo': 'Unidad 1',
    'junio': 'Unidad 2', 'julio': 'Unidad 2',
    'agosto': 'Unidad 3', 'septiembre': 'Unidad 3', 'octubre': 'Unidad 3',
    'noviembre': 'Unidad 4', 'diciembre': 'Unidad 4'
};
const monthOrder = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function findFiles(dir, subject, fileList = []) {
    const fullDir = path.join(BASE_PATH, dir);
    if (!fs.existsSync(fullDir)) return fileList;

    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(fullDir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'LIMPIO') {
                const cleanFiles = fs.readdirSync(fullPath);
                for (const file of cleanFiles) {
                    if (file.includes('_LIMPIO_DRIVE.docx')) {
                        const lowerFile = file.toLowerCase();
                        let foundMonth = 'Sin Mes';
                        for (const mes of Object.keys(MONTH_UNIT_MAP)) {
                            if (lowerFile.includes(mes)) {
                                foundMonth = mes.charAt(0).toUpperCase() + mes.slice(1);
                                break;
                            }
                        }
                        fileList.push({
                            path: path.join(fullPath, file),
                            name: file,
                            mes: foundMonth,
                            unidad: MONTH_UNIT_MAP[foundMonth.toLowerCase()] || 'Unidad General',
                            subjectObj: subject
                        });
                    }
                }
            } else {
                // Recursively find in other subdirectories if needed (but we usually expect files in root or monthly folders)
                // Skip 'LIMPIO' to avoid double counting if already handled above
                findFiles(path.join(dir, entry.name), subject, fileList);
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
            <li>Objetivos de Aprendizaje (OA) curriculares.</li>
            <li>Indicadores de evaluación y sugerencias metodológicas.</li>
        </ul><br>
        <strong>💡 ¿Por qué descargar este recurso?</strong>
        <ul>
            <li>Ahorra tiempo valioso de diseño instruccional.</li>
            <li>Alineado al currículo del Ministerio de Educación (MINEDUC).</li>
        </ul><br>
        <em>Perteneciente a la <strong>${item.unidad}</strong>. ¡Optimiza tus clases ahora!</em>
    `;
    const tags = [LEVEL, 'Planificación', item.mes, item.unidad, 'Material Docente', ...item.subjectObj.tags];
    return { titulo, descripcion, tags };
}

(async () => {
    console.log(`\n🤖 INICIANDO PUBLICACIÓN MASIVA - ${LEVEL}`);
    console.log('='.repeat(60));

    let archivosTotales = [];
    for (const sub of SUBJECTS) {
        findFiles(sub.dir, sub, archivosTotales);
    }

    // Dedup paths just in case
    const uniqueArchivos = [];
    const seenPaths = new Set();
    for (const a of archivosTotales) {
        if (!seenPaths.has(a.path)) {
            seenPaths.add(a.path);
            uniqueArchivos.push(a);
        }
    }

    if (uniqueArchivos.length === 0) {
        console.error('❌ No se encontraron archivos limpios para publicar.');
        process.exit(1);
    }

    // Ordenar por Asignatura -> Mes
    uniqueArchivos.sort((a, b) => {
        if (a.subjectObj.name === b.subjectObj.name) {
            return monthOrder.indexOf(a.mes) - monthOrder.indexOf(b.mes);
        }
        return a.subjectObj.name.localeCompare(b.subjectObj.name);
    });

    console.log(`\n✅ Archivos listos para subir: ${uniqueArchivos.length}`);
    console.log(`👤 Cuenta: ${EMAIL}`);
    console.log(`⏳ Regla de oro: Espera de 8s para vista previa activa.`);
    console.log('\nEmpezando en 3 segundos...');
    await new Promise(r => setTimeout(r, 3000));

    const browser = await chromium.launch({ headless: false, slowMo: 50 });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    try {
        console.log('🌍 Conectando a ProfeSocial...');
        await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });
        if (await page.isVisible('#user_email')) {
            await page.fill('#user_email', EMAIL);
            await page.fill('#user_password', PASSWORD);
            await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle' }), page.click('button.is-primary.is-block')]);
            console.log('✅ Sesión iniciada.');
        }

        for (const item of uniqueArchivos) {
            console.log(`\n${'='.repeat(60)}\n📌 [${item.subjectObj.name}] Mes: ${item.mes}`);

            const meta = generarMetadatos(item);
            await page.goto('https://profe.social/posts/new', { waitUntil: 'domcontentloaded' });

            await page.fill('#post_title', meta.titulo);
            await page.fill('#post_coin_price', '6');

            await page.waitForSelector('trix-editor');
            await page.evaluate((html) => {
                const ed = document.querySelector('trix-editor');
                if (ed?.editor) { ed.editor.loadHTML(''); ed.editor.insertHTML(html); }
            }, meta.descripcion);

            await page.fill('#post_min_age', '9');
            await page.fill('#post_max_age', '11');
            await page.selectOption('#post_resource_type', 'lesson');

            const tagSel = 'input[placeholder*="Etiquetas"]';
            await page.waitForSelector(tagSel);
            for (const tag of meta.tags.slice(0, 8)) {
                await page.click(tagSel);
                await page.fill(tagSel, tag);
                await page.press(tagSel, 'Enter');
                await page.waitForTimeout(150);
            }

            const fi = await page.$('input[type="file"]');
            if (fi) {
                console.log('   📁 Adjuntando archivo...');
                await fi.setInputFiles(item.path);
                console.log('   ⏳ Esperando 10 segundos para la vista previa...');
                await page.waitForTimeout(10000);
            }

            await page.evaluate(() => {
                document.querySelectorAll('input[type="checkbox"]').forEach(cb => { if (!cb.checked) cb.click(); });
            });

            console.log('   🚀 Publicando...');
            const sels = [
                'input[type="submit"][name="commit"]',
                'button.is-primary.is-large',
                'button:has-text("Publicar")',
                'input[value="Publicar"]'
            ];
            let clicked = false;
            for (const sel of sels) {
                const btn = await page.$(sel);
                if (btn && await btn.isVisible()) {
                    await btn.click();
                    clicked = true;
                    break;
                }
            }
            if (!clicked) await page.evaluate(() => { document.querySelector('form')?.submit(); });

            try {
                await page.waitForURL('**/posts/*', { timeout: 30000 });
                console.log(`   ✅ ÉXITO: ${page.url()}`);
            } catch (e) {
                console.error(`   ⚠️ No se detectó redirección confirmada.`);
            }
            await page.waitForTimeout(2000);
        }
        console.log('\n🏁 Finalización de carga masiva 4° Básico.');
    } catch (err) {
        console.error('❌ ERROR CRÍTICO:', err.message);
    } finally {
        await browser.close();
    }
})();

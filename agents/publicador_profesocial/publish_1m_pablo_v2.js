/**
 * 🚀 Publicador Universal 1° Medio — Cuenta Pablo v3
 * 
 * Mejoras v3:
 * - Upload: dispatch manual de evento 'change' para Stimulus.js
 * - Timeout extendido a 45s para AJAX upload
 * - Screenshot de debug en uploads fallidos
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env.pablo2010') });
const { convertAndCleanDoc } = require('../limpieza_datos/skills/doc-legacy-cleaner/doc-converter');
const { cleanDeep, removeHeaders } = require('../limpieza_datos/modules/docx-cleaner');

const CACHE_FILE = path.join(__dirname, 'published_cache_1m.json');
let publishedCache = [];
if (fs.existsSync(CACHE_FILE)) {
    try {
        publishedCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch (e) { /* ignore parse error */ }
}
function addToCache(filePath) {
    if (!publishedCache.includes(filePath)) {
        publishedCache.push(filePath);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(publishedCache, null, 2));
    }
}

// ============================================================
// CONFIGURACIÓN DE ASIGNATURAS
// ============================================================
const BASE = 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO';

const ASIGNATURAS = [
    {
        id: 'matematica',
        subject: 'Matemática',
        emoji: '🔢',
        paths: [path.join(BASE, 'MATEMATICA', 'MAT. CON DUA')],
        tags: ['Matemática', '1° Medio', 'Planificación'],
    },
    {
        id: 'historia',
        subject: 'Historia, Geografía y Ciencias Sociales',
        emoji: '🌍',
        paths: [path.join(BASE, 'HISTORIA', 'HIST. CON DUA')],
        tags: ['Historia', '1° Medio', 'Planificación'],
    },
    {
        id: 'ingles',
        subject: 'Idioma Extranjero Inglés',
        emoji: '🇬🇧',
        paths: [path.join(BASE, 'INGLES')],
        tags: ['Inglés', 'English', '1° Medio', 'Planificación'],
    },
    {
        id: 'biologia',
        subject: 'Ciencias Naturales - Biología',
        emoji: '🧬',
        paths: [path.join(BASE, 'CS NATURALES', 'BIOLOGIA')],
        tags: ['Biología', 'Ciencias', '1° Medio', 'Planificación'],
    },
    {
        id: 'quimica',
        subject: 'Ciencias Naturales - Química',
        emoji: '🧪',
        paths: [path.join(BASE, 'CS NATURALES', 'QUIMICA')],
        tags: ['Química', 'Ciencias', '1° Medio', 'Planificación'],
    },
    {
        id: 'fisica',
        subject: 'Ciencias Naturales - Física',
        emoji: '⚛️',
        paths: [path.join(BASE, 'CS NATURALES', 'FISICA')],
        tags: ['Física', 'Ciencias', '1° Medio', 'Planificación'],
    },
    {
        id: 'orientacion',
        subject: 'Orientación',
        emoji: '🧭',
        paths: [path.join(BASE, 'ORIENTACION 1 md')],
        tags: ['Orientación', '1° Medio', 'Planificación'],
    },
    {
        id: 'tecnologia',
        subject: 'Tecnología',
        emoji: '🔧',
        paths: [path.join(BASE, 'TECNOLOGICA')],
        tags: ['Tecnología', '1° Medio', 'Planificación'],
    },
    {
        id: 'visuales',
        subject: 'Artes Visuales',
        emoji: '🎨',
        paths: [path.join(BASE, 'VISUALES')],
        tags: ['Artes Visuales', '1° Medio', 'Planificación'],
    },
];

// Filtrar por argumento CLI
const args = process.argv.slice(2);
const targetSubjects = args.length > 0
    ? ASIGNATURAS.filter(a => args.includes(a.id))
    : ASIGNATURAS;

const TEMP_DIR = path.join(__dirname, 'temp_pablo');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const MONTH_ORDER = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function findFiles(dirs) {
    const fileList = [];
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        _scanDir(dir, fileList);
    }
    return fileList.sort((a, b) => MONTH_ORDER.indexOf(a.mes) - MONTH_ORDER.indexOf(b.mes));
}

function _scanDir(dir, fileList) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            _scanDir(filePath, fileList);
        } else {
            const ext = path.extname(file).toLowerCase();
            const name = file.toUpperCase();
            if ((ext === '.docx' || ext === '.doc') &&
                (name.includes('PLANIFICACION') || name.includes('CLASE_A_CLASE')) &&
                !name.includes('ANUAL') &&
                !name.includes('~$')) {

                let mes = 'Varios';
                const mesMatch = filePath.match(/(marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
                if (mesMatch) mes = mesMatch[0].charAt(0).toUpperCase() + mesMatch[0].slice(1).toLowerCase();

                let unidad = '';
                const unidadMatch = filePath.match(/unidad\s?(\d|I+)/i);
                if (unidadMatch) unidad = ` (Unidad ${unidadMatch[1]})`;

                fileList.push({ path: filePath, name: file, mes, unidad, ext });
            }
        }
    }
}

/**
 * Sube un archivo y espera a que el botón se habilite.
 * Profe.Social usa Stimulus.js con data-action="edit-post#uploadFile"
 * que escucha el evento 'change' y hace AJAX upload al servidor.
 */
async function uploadFile(page, filePath) {
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
        console.log('      ⚠️ No se encontró input[type=file]');
        return false;
    }

    // 1. setInputFiles establece los archivos en el input
    await fileInput.setInputFiles(filePath);

    // 2. Disparar evento 'change' manualmente con bubbles para que Stimulus lo capture
    await page.evaluate(() => {
        const input = document.querySelector('input[type="file"]');
        if (input) {
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    // 3. Dar un momento para que el AJAX upload comience
    await page.waitForTimeout(3000);

    // 4. Esperar hasta 45s: botón habilitado O error de archivo
    try {
        const result = await Promise.race([
            page.waitForSelector('button[data-form-target="publishButton"]:not([disabled])', { timeout: 45000 })
                .then(() => 'ready'),
            page.waitForFunction(() => {
                const bodyText = document.body.innerText.toLowerCase();
                return bodyText.includes('archivo ha producido un error') ||
                    bodyText.includes('error al subir');
            }, { timeout: 45000 })
                .then(() => 'file_error'),
        ]);

        if (result === 'file_error') {
            console.log(`      ⚠️ Profe.Social rechazó: ${path.basename(filePath)}`);
            return false;
        }
        console.log('      ✅ Archivo aceptado');
        return true;
    } catch (e) {
        // Timeout — verificar si tal vez el botón ya está habilitado
        const btn = await page.$('button[data-form-target="publishButton"]:not([disabled])');
        if (btn) {
            console.log('      ✅ Botón habilitado (tras timeout)');
            return true;
        }

        // Debug: capturar screenshot y texto visible
        const screenshotPath = path.join(__dirname, `v3_upload_debug_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath });

        // Obtener estado del formulario para debug
        const debugInfo = await page.evaluate(() => {
            const btn = document.querySelector('button[data-form-target="publishButton"]');
            const fileInfo = document.querySelector('.file-info, [data-edit-post-target]');
            return {
                btnText: btn ? btn.textContent.trim() : 'no btn',
                btnDisabled: btn ? btn.disabled : 'no btn',
                url: window.location.href,
                visibleErrors: Array.from(document.querySelectorAll('.notification, .help, .is-danger'))
                    .map(el => el.textContent.trim())
                    .filter(t => t.length > 0)
            };
        });
        console.log('      🔍 Debug:', JSON.stringify(debugInfo));
        console.log(`      📸 Screenshot: ${path.basename(screenshotPath)}`);
        return false;
    }
}

/**
 * Llena el formulario de publicación
 */
async function fillForm(page, title, desc, tags) {
    await page.fill('#post_title', title);

    await page.waitForSelector('trix-editor');
    await page.evaluate((h) => {
        const ed = document.querySelector('trix-editor');
        if (ed && ed.editor) { ed.editor.loadHTML(''); ed.editor.insertHTML(h); }
    }, desc);

    for (const tag of tags) {
        await page.fill('input[placeholder*="Etiquetas"]', tag);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
    }

    await page.fill('#post_coin_price', '6');
    await page.fill('#post_min_age', '14');
    await page.fill('#post_max_age', '16');
    await page.selectOption('#post_resource_type', { value: 'lesson' });
    await page.evaluate(() => document.querySelectorAll('input[type="checkbox"]').forEach(c => { if (!c.checked) c.click(); }));
}

// ============================================================
// FLUJO PRINCIPAL
// ============================================================

(async () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 PUBLICADOR 1° MEDIO — Cuenta Pablo v3`);
    console.log(`   Asignaturas: ${targetSubjects.map(a => a.id).join(', ')}`);
    console.log(`${'='.repeat(60)}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    // === LOGIN ===
    try {
        console.log('🌍 Navegando a login...');
        await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });

        await page.waitForSelector('#user_email');
        await page.fill('#user_email', '');
        await page.type('#user_email', process.env.PROFESOCIAL_EMAIL, { delay: 80 });
        await page.type('#user_password', process.env.PROFESOCIAL_PASSWORD, { delay: 80 });

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => { }),
            page.keyboard.press('Enter')
        ]);
        await page.waitForTimeout(3000);

        if (page.url().includes('sign_in') || page.url().includes('login')) {
            console.error('❌ Login fallido.');
            await page.screenshot({ path: path.join(__dirname, 'v3_login_fail.png') });
            process.exit(1);
        }
        console.log('✅ Logueado correctamente.\n');
    } catch (e) {
        console.error('❌ Error en login:', e.message);
        process.exit(1);
    }

    // === PUBLICAR POR ASIGNATURA ===
    const resumen = [];

    for (const asig of targetSubjects) {
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`${asig.emoji} ${asig.subject.toUpperCase()}`);
        console.log(`${'─'.repeat(50)}`);

        const archivos = findFiles(asig.paths);
        if (archivos.length === 0) {
            console.log('   (sin archivos de planificación)');
            resumen.push({ asig: asig.id, total: 0, ok: 0, fail: 0 });
            continue;
        }
        console.log(`   📁 ${archivos.length} archivos encontrados\n`);

        let ok = 0, fail = 0;
        const tempSubDir = path.join(TEMP_DIR, asig.id);
        if (!fs.existsSync(tempSubDir)) fs.mkdirSync(tempSubDir, { recursive: true });

        for (const item of archivos) {
            console.log(`   📅 ${item.mes}${item.unidad} — ${item.name}`);

            if (publishedCache.includes(item.path)) {
                console.log(`      ⏭️ SALTANDO: Ya fue publicado anteriormente.`);
                continue;
            }

            let fileToUpload = item.path;
            const originalFile = item.path;

            // Procesar y Limpiar
            if (item.ext === '.doc') {
                try {
                    const res = await convertAndCleanDoc(item.path, tempSubDir);
                    if (res.success) {
                        fileToUpload = res.outputPath;
                        console.log('      🪄 .doc convertido y limpiado a .docx');
                    } else {
                        console.log('      ⚠️ Falló conversión de .doc. Se subirá original.');
                    }
                } catch (e) {
                    console.log(`      ⚠️ Error al convertir .doc: ${e.message}`);
                }
            } else if (item.ext === '.docx') {
                try {
                    let shortName = item.name.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
                    const cleanedPath = path.join(tempSubDir, `${shortName}_TEMP.docx`);
                    await cleanDeep(item.path, cleanedPath);
                    await removeHeaders(cleanedPath, cleanedPath);
                    fileToUpload = cleanedPath;
                    console.log('      🧹 Limpiado OK');
                } catch (e) {
                    console.log(`      ⚠️ Limpieza falló, se usará original: ${e.message}`);
                }
            }

            // Navegar al formulario
            try {
                await page.goto('https://profe.social/posts/new', { waitUntil: 'networkidle' });
                await page.waitForSelector('#post_title', { timeout: 20000 });
            } catch (e) {
                console.log('      ❌ No se pudo cargar el formulario');
                fail++;
                continue;
            }

            // Datos del post
            const title = `Planificación Clase a Clase ${item.mes} - ${asig.subject} - 1° Medio`;
            const desc = `<strong>${asig.emoji} Planificación Mensual Clase a Clase - ${item.mes}</strong><br><br>Recurso pedagógico diseñado para el nivel de <strong>Primero Medio</strong>, correspondiente al mes de <strong>${item.mes}</strong>.<br><br><strong>✅ Incluye:</strong><br>• Planificación clase a clase detallada<br>• Objetivos de Aprendizaje (OA) alineados al currículum vigente<br>• Actividades de Inicio, Desarrollo y Cierre para cada sesión<br>• Indicadores de evaluación y sugerencias metodológicas<br>• Diseño con enfoque DUA (Diseño Universal para el Aprendizaje)<br><br><strong>📚 Asignatura:</strong> ${asig.subject}<br><strong>📅 Mes:</strong> ${item.mes}<br><strong>🎯 Nivel:</strong> 1° Medio<br><br>Material listo para imprimir y utilizar en el aula. Ideal para docentes que buscan una planificación estructurada y alineada con los planes y programas del Ministerio de Educación de Chile.`;
            const tags = [...asig.tags, item.mes];

            // Llenar formulario
            await fillForm(page, title, desc, tags);

            // === SUBIDA CON FALLBACK ===
            console.log(`      📤 Subiendo: ${path.basename(fileToUpload)}`);
            let uploaded = await uploadFile(page, fileToUpload);

            if (!uploaded && fileToUpload !== originalFile) {
                console.log(`      🔄 Fallback al original: ${path.basename(originalFile)}`);
                await page.goto('https://profe.social/posts/new', { waitUntil: 'networkidle' });
                await page.waitForSelector('#post_title', { timeout: 20000 });
                await fillForm(page, title, desc, tags);
                uploaded = await uploadFile(page, originalFile);
            }

            if (!uploaded) {
                console.log('      ❌ Archivo rechazado');
                fail++;
                continue;
            }

            // Publicar
            try {
                console.log('      🚀 Publicando...');
                await page.click('button[data-form-target="publishButton"]');
                await page.waitForURL(/posts\/(\d+)/, { timeout: 60000 });
                console.log(`      ✅ Publicado: ${page.url()}`);
                ok++;
                addToCache(item.path);
                await page.waitForTimeout(2000);
            } catch (e) {
                console.log(`      ❌ Error al publicar: ${e.message.substring(0, 100)}`);
                await page.screenshot({ path: path.join(__dirname, `v3_error_${asig.id}_${item.mes}.png`) });
                fail++;
            }
        }

        resumen.push({ asig: asig.id, total: archivos.length, ok, fail });
    }

    // === RESUMEN FINAL ===
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMEN FINAL');
    console.log(`${'='.repeat(60)}`);
    for (const r of resumen) {
        const status = r.fail === 0 ? '✅' : '⚠️';
        console.log(`   ${status} ${r.asig}: ${r.ok}/${r.total} publicados (${r.fail} fallidos)`);
    }
    console.log(`${'='.repeat(60)}\n`);

    await browser.close();
    process.exit();
})();

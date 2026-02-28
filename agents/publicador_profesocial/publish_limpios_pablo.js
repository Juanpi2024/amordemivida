/**
 * 🚀 Publicador de Archivos Limpios — Cuenta Pablo v4
 * 
 * Este script ya NO limpia los archivos, asume que YA están limpios
 * y se encuentran en directorios que terminan en "LIMPIO" con el sufojo "_LIMPIO_DRIVE.docx".
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env.pablo2010') });

// ============================================================
// CONFIGURACIÓN DE ASIGNATURAS YA LIMPIAS
// ============================================================
const BASE = 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO';

const ASIGNATURAS = [
    {
        id: 'lenguaje',
        subject: 'Lenguaje y Comunicación',
        emoji: '📖',
        paths: [path.join(BASE, 'LENGUAJE', 'LENG. SIN DUA')],
        tags: ['Lenguaje', '1° Medio', 'Planificación'],
    },
    {
        id: 'matematica',
        subject: 'Matemática',
        emoji: '🔢',
        paths: [path.join(BASE, 'MATEMATICA', 'MAT. CON DUA')],
        tags: ['Matemática', '1° Medio', 'Planificación'],
    },
    {
        id: 'biologia',
        subject: 'Ciencias Naturales - Biología',
        emoji: '🧬',
        paths: [path.join(BASE, 'CS NATURALES', 'BIOLOGIA')],
        tags: ['Biología', 'Ciencias', '1° Medio', 'Planificación'],
    },
];

const MONTH_ORDER = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function findCleanedFiles(dirs) {
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

            // Solo buscar archivos _LIMPIO_DRIVE.docx
            if (ext === '.docx' && name.includes('_LIMPIO_DRIVE')) {

                let mes = 'Varios';
                const mesMatch = filePath.match(/(marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
                if (mesMatch) mes = mesMatch[0].charAt(0).toUpperCase() + mesMatch[0].slice(1).toLowerCase();

                let unidad = '';
                const unidadMatch = filePath.match(/unidad\s?(\d|I+)/i);
                if (unidadMatch) unidad = ` (Unidad ${unidadMatch[1]})`;

                fileList.push({ path: filePath, name: file, mes, unidad });
            }
        }
    }
}

/**
 * Sube un archivo y espera a que el botón se habilite.
 */
async function uploadFile(page, filePath) {
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
        console.log('      ⚠️ No se encontró input[type=file]');
        return false;
    }

    await fileInput.setInputFiles(filePath);

    // Disparar evento para Stimulus
    await page.evaluate(() => {
        const input = document.querySelector('input[type="file"]');
        if (input) {
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    await page.waitForTimeout(3000); // Ajax start

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
            console.log(`      ⚠️ Profe.Social rechazó el archivo.`);
            return false;
        }
        console.log('      ✅ Archivo aceptado (Botón habilitado)');
        return true;
    } catch (e) {
        // En caso de timeout verificar si se habilitó por las moscas
        const btn = await page.$('button[data-form-target="publishButton"]:not([disabled])');
        if (btn) return true;

        console.log('      ❌ Error en la carga (Timeout o fallo).');
        return false;
    }
}

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

    await page.fill('#post_coin_price', '6'); // 6 Profecoins solicitados
    await page.fill('#post_min_age', '14');
    await page.fill('#post_max_age', '16');
    await page.selectOption('#post_resource_type', { label: 'Clase' }); // Categoría Clase solicitada

    // Checkboxes (Gratis temporalmente y licencia)
    await page.evaluate(() => document.querySelectorAll('input[type="checkbox"]').forEach(c => { if (!c.checked) c.click(); }));
}

// ============================================================
// FLUJO PRINCIPAL
// ============================================================

(async () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 PUBLICADOR ARCHIVOS LIMPIOS — Cuenta Pablo`);
    console.log(`   Asignaturas: Lenguaje, Matemática, Biología`);
    console.log(`${'='.repeat(60)}\n`);

    const browser = await chromium.launch({ headless: true });
    // Guardar estado en un contexto para no perder la sesión entre asignaturas
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    // === LOGIN ===
    try {
        console.log('🌍 Navegando a login (profepablo2010)...');
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
            console.error('❌ Login fallido. Verifica las credenciales.');
            process.exit(1);
        }
        console.log('✅ Logueado correctamente.\n');
    } catch (e) {
        console.error('❌ Error en login:', e.message);
        process.exit(1);
    }

    // === PUBLICAR ===
    const resumen = [];

    for (const asig of ASIGNATURAS) {
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`${asig.emoji} ${asig.subject.toUpperCase()}`);
        console.log(`${'─'.repeat(50)}`);

        const archivos = findCleanedFiles(asig.paths);
        if (archivos.length === 0) {
            console.log('   (sin archivos listos para publicar)');
            resumen.push({ asig: asig.id, total: 0, ok: 0, fail: 0 });
            continue;
        }
        console.log(`   📁 ${archivos.length} archivos .docx listos encontrados\n`);

        let ok = 0, fail = 0;

        for (const item of archivos) {
            console.log(`   📅 Publicando: ${item.mes}${item.unidad}`);

            // Navegar al formulario
            try {
                // Agregar retry de nevegación en caso de que Profe.Social de timeout
                await Promise.race([
                    page.goto('https://profe.social/posts/new', { waitUntil: 'networkidle' }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de navigación')), 30000))
                ]);
                await page.waitForSelector('#post_title', { timeout: 20000 });
            } catch (e) {
                console.log('      ❌ No se pudo cargar el formulario');
                fail++;
                continue;
            }

            // Datos del post
            const title = `Planificación Clase a Clase ${item.mes} - ${asig.subject} - 1° Medio`;
            const desc = `<strong>${asig.emoji} Planificación Mensual Clase a Clase - ${item.mes}</strong><br><br>Recurso pedagógico diseñado para el nivel de <strong>Primero Medio</strong>, correspondiente al mes de <strong>${item.mes}</strong>.<br><br><strong>✅ Incluye:</strong><br>• Planificación clase a clase detallada<br>• Objetivos de Aprendizaje (OA) alineados al currículum vigente<br>• Actividades de Inicio, Desarrollo y Cierre para cada sesión<br>• Indicadores de evaluación y sugerencias metodológicas<br>• Diseño estructurado sin logotipos comerciales<br><br><strong>📚 Asignatura:</strong> ${asig.subject}<br><strong>📅 Mes:</strong> ${item.mes}<br><strong>🎯 Nivel:</strong> 1° Medio<br><br>Material en formato <strong>Word (.docx) editable</strong> listo para imprimir y utilizar en el aula por el docente.`;
            const tags = [...asig.tags, item.mes];

            // Llenar formulario
            await fillForm(page, title, desc, tags);

            // Subir archivo limpio
            console.log(`      📤 Subiendo: ${item.name}`);
            let uploaded = await uploadFile(page, item.path);

            if (!uploaded) {
                console.log('      ❌ Archivo rechazado por la plataforma. Saltando.');
                fail++;
                continue;
            }

            // Publicar
            try {
                console.log('      🚀 Haciendo click en Publicar...');
                await page.click('button[data-form-target="publishButton"]');
                await page.waitForURL(/posts\/(\d+)/, { timeout: 60000 });
                console.log(`      ✅ Publicado exitosamente: ${page.url()}`);
                ok++;
                await page.waitForTimeout(2000);
            } catch (e) {
                console.log(`      ❌ Error al enviar publicación: ${e.message.substring(0, 100)}`);
                await page.screenshot({ path: path.join(__dirname, `error_clean_${asig.id}_${item.mes}.png`) });
                fail++;
            }
        }

        resumen.push({ asig: asig.id, total: archivos.length, ok, fail });
    }

    // === RESUMEN FINAL ===
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMEN FINAL DE LIMPIOS PUBLICADOS');
    console.log(`${'='.repeat(60)}`);
    for (const r of resumen) {
        const status = r.fail === 0 && r.total > 0 ? '✅' : (r.total === 0 ? 'ℹ️' : '⚠️');
        console.log(`   ${status} ${r.asig}: ${r.ok}/${r.total} publicados (${r.fail} fallidos)`);
    }
    console.log(`${'='.repeat(60)}\n`);

    await browser.close();
    process.exit();
})();

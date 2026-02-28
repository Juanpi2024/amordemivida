/**
 * 🚀 Publicador de Archivos Limpios — Física y Química — Cuenta Pablo
 * 
 * Publica los archivos _LIMPIO_DRIVE.docx de Física y Química de 1° Medio
 * Precio: 6 Profecoins por recurso, categoría: Clase
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env.pablo2010') });

const BASE = 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO\\CS NATURALES';

const ASIGNATURAS = [
    {
        id: 'fisica',
        subject: 'Ciencias Naturales - Física',
        emoji: '⚛️',
        paths: [path.join(BASE, 'FISICA')],
        tags: ['Física', 'Ciencias', '1° Medio', 'Planificación'],
    },
    {
        id: 'quimica',
        subject: 'Ciencias Naturales - Química',
        emoji: '🧪',
        paths: [path.join(BASE, 'QUIMICA')],
        tags: ['Química', 'Ciencias', '1° Medio', 'Planificación'],
    },
];

const MONTH_ORDER = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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

async function uploadFile(page, filePath) {
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) { console.log('      ⚠️ No se encontró input[type=file]'); return false; }
    await fileInput.setInputFiles(filePath);
    await page.evaluate(() => {
        const input = document.querySelector('input[type="file"]');
        if (input) {
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    await page.waitForTimeout(3000);
    try {
        const result = await Promise.race([
            page.waitForSelector('button[data-form-target="publishButton"]:not([disabled])', { timeout: 45000 }).then(() => 'ready'),
            page.waitForFunction(() => {
                const bodyText = document.body.innerText.toLowerCase();
                return bodyText.includes('archivo ha producido un error') || bodyText.includes('error al subir');
            }, { timeout: 45000 }).then(() => 'file_error'),
        ]);
        if (result === 'file_error') { console.log(`      ⚠️ Profe.Social rechazó el archivo.`); return false; }
        console.log('      ✅ Archivo aceptado');
        return true;
    } catch (e) {
        const btn = await page.$('button[data-form-target="publishButton"]:not([disabled])');
        if (btn) return true;
        console.log('      ❌ Timeout en la carga.');
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
    await page.fill('#post_coin_price', '6');
    await page.fill('#post_min_age', '14');
    await page.fill('#post_max_age', '16');
    try { await page.selectOption('#post_resource_type', { label: 'Clase' }); } catch (e) {
        try { await page.selectOption('#post_resource_type', { value: 'lesson' }); } catch (e2) { }
    }
    await page.evaluate(() => document.querySelectorAll('input[type="checkbox"]').forEach(c => { if (!c.checked) c.click(); }));
}

(async () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 PUBLICADOR FÍSICA Y QUÍMICA — Cuenta Pablo`);
    console.log(`${'='.repeat(60)}\n`);

    const browser = await chromium.launch({ headless: true });
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
            console.error('❌ Login fallido.'); process.exit(1);
        }
        console.log('✅ Logueado correctamente.\n');
    } catch (e) {
        console.error('❌ Error en login:', e.message); process.exit(1);
    }

    const resumen = [];

    for (const asig of ASIGNATURAS) {
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`${asig.emoji} ${asig.subject.toUpperCase()}`);
        console.log(`${'─'.repeat(50)}`);

        const archivos = findCleanedFiles(asig.paths);
        if (archivos.length === 0) {
            console.log('   (sin archivos _LIMPIO_DRIVE.docx en las carpetas)');
            resumen.push({ asig: asig.id, total: 0, ok: 0, fail: 0 });
            continue;
        }
        console.log(`   📁 ${archivos.length} archivos listos\n`);

        let ok = 0, fail = 0;

        for (const item of archivos) {
            console.log(`   📅 ${item.mes}${item.unidad} — ${item.name}`);
            try {
                await page.goto('https://profe.social/posts/new', { waitUntil: 'networkidle', timeout: 30000 });
                await page.waitForSelector('#post_title', { timeout: 20000 });
            } catch (e) {
                console.log('      ❌ No se pudo cargar el formulario'); fail++; continue;
            }

            const title = `Planificación Clase a Clase ${item.mes} - ${asig.subject} - 1° Medio`;
            const desc = `<strong>${asig.emoji} Planificación Mensual Clase a Clase - ${item.mes}</strong><br><br>Recurso pedagógico diseñado para el nivel de <strong>Primero Medio</strong>, correspondiente al mes de <strong>${item.mes}</strong>.<br><br><strong>✅ Incluye:</strong><br>• Planificación clase a clase detallada<br>• Objetivos de Aprendizaje (OA) alineados al currículum vigente<br>• Actividades de Inicio, Desarrollo y Cierre para cada sesión<br>• Indicadores de evaluación y sugerencias metodológicas<br>• Sin logotipos ni marcas comerciales<br><br><strong>📚 Asignatura:</strong> ${asig.subject}<br><strong>📅 Mes:</strong> ${item.mes}<br><strong>🎯 Nivel:</strong> 1° Medio<br><br>Archivo Word editable (.docx) listo para usar en clases.`;
            const tags = [...asig.tags, item.mes];

            await fillForm(page, title, desc, tags);

            console.log(`      📤 Subiendo: ${item.name}`);
            const uploaded = await uploadFile(page, item.path);

            if (!uploaded) { console.log('      ❌ Archivo rechazado. Saltando.'); fail++; continue; }

            try {
                console.log('      🚀 Publicando...');
                await page.click('button[data-form-target="publishButton"]');
                await page.waitForURL(/posts\/(\d+)/, { timeout: 60000 });
                console.log(`      ✅ Publicado: ${page.url()}`);
                ok++;
                await page.waitForTimeout(2000);
            } catch (e) {
                console.log(`      ❌ Error al publicar: ${e.message.substring(0, 80)}`);
                await page.screenshot({ path: path.join(__dirname, `error_${asig.id}_${item.mes}.png`) });
                fail++;
            }
        }

        resumen.push({ asig: asig.id, total: archivos.length, ok, fail });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMEN FINAL');
    console.log(`${'='.repeat(60)}`);
    for (const r of resumen) {
        const s = r.fail === 0 && r.total > 0 ? '✅' : (r.total === 0 ? 'ℹ️' : '⚠️');
        console.log(`   ${s} ${r.asig}: ${r.ok}/${r.total} publicados (${r.fail} fallidos)`);
    }
    console.log(`${'='.repeat(60)}\n`);

    await browser.close();
    process.exit();
})();

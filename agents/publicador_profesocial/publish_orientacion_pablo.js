/**
 * 🚀 Publicador de Archivos Limpios — Orientación — Cuenta Pablo
 * 
 * Publica los archivos _LIMPIO_DRIVE.docx de Orientación de 1° Medio
 * Precio: 6 Profecoins por recurso, categoría: Clase
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env.pablo2010') });

const BASE = 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO\\ORIENTACION 1 md';

const ASIGNATURAS = [
    {
        id: 'orientacion',
        subject: 'Orientación',
        emoji: '🌱',
        paths: [BASE],
        tags: ['Orientación', '1° Medio', 'Crecimiento Personal', 'Bienestar', 'Planificación'],
    }
];

const MONTH_ORDER = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function findCleanedFiles(dirs) {
    const fileList = [];
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        _scanDir(dir, fileList);
    }
    // Ordenar por mes según el array MONTH_ORDER
    return fileList.sort((a, b) => {
        const orderA = MONTH_ORDER.indexOf(a.mes);
        const orderB = MONTH_ORDER.indexOf(b.mes);
        return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
    });
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

        if (result === 'file_error') {
            console.log(`      ⚠️ Profe.Social rechazó el archivo.`);
            return false;
        }

        console.log('      ✅ Archivo aceptado (esperando vista previa...)');
        await page.waitForTimeout(5000);

        return true;
    } catch (e) {
        const btn = await page.$('button[data-form-target="publishButton"]:not([disabled])');
        if (btn) return true;
        console.log('      ❌ Timeout en la carga del archivo.');
        return false;
    }
}

async function fillForm(page, title, desc, tags) {
    await page.fill('#post_title', title);

    await page.waitForSelector('trix-editor');
    await page.evaluate((h) => {
        const ed = document.querySelector('trix-editor');
        if (ed && ed.editor) {
            ed.editor.loadHTML('');
            ed.editor.insertHTML(h);
        }
    }, desc);

    for (const tag of tags) {
        await page.fill('input[placeholder*="Etiquetas"]', tag);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
    }

    await page.fill('#post_coin_price', '6');
    await page.fill('#post_min_age', '14');
    await page.fill('#post_max_age', '16');

    try {
        await page.selectOption('#post_resource_type', { label: 'Clase' });
    } catch (e) {
        try { await page.selectOption('#post_resource_type', { value: 'lesson' }); } catch (e2) { }
    }

    await page.evaluate(() => {
        document.querySelectorAll('input[type="checkbox"]').forEach(c => {
            if (!c.checked) c.click();
        });
    });
}

(async () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 PUBLICADOR ORIENTACIÓN 1° MEDIO — Cuenta Pablo`);
    console.log(`${'='.repeat(60)}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        console.log('🌍 Navegando a login (profepablo2010)...');
        await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });
        await page.waitForSelector('#user_email');
        await page.fill('#user_email', process.env.PROFESOCIAL_EMAIL);
        await page.fill('#user_password', process.env.PROFESOCIAL_PASSWORD);
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => { }),
            page.keyboard.press('Enter')
        ]);
        await page.waitForTimeout(3000);
        if (page.url().includes('sign_in') || page.url().includes('login')) {
            console.error('❌ Login fallido.');
            process.exit(1);
        }
        console.log('✅ Logueado correctamente.\n');
    } catch (e) {
        console.error('❌ Error en login:', e.message);
        process.exit(1);
    }

    for (const asig of ASIGNATURAS) {
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`${asig.emoji} ${asig.subject.toUpperCase()}`);
        console.log(`${'─'.repeat(50)}`);

        const archivos = findCleanedFiles(asig.paths);
        if (archivos.length === 0) {
            console.log('   (no se encontraron archivos limpios)');
            continue;
        }
        console.log(`   📁 Se publicarán ${archivos.length} recursos\n`);

        for (const item of archivos) {
            console.log(`   📅 ${item.mes}${item.unidad} — ${item.name}`);

            try {
                await page.goto('https://profe.social/posts/new', { waitUntil: 'networkidle', timeout: 30000 });
                await page.waitForSelector('#post_title', { timeout: 20000 });
            } catch (e) {
                console.log('      ❌ No se pudo cargar el formulario. Reintentando...');
                continue;
            }

            const title = `Planificación Clase a Clase ${item.mes} - ${asig.subject} - 1° Medio`;
            const desc = `<strong>${asig.emoji} Planificación Mensual de Orientación - ${item.mes}</strong><br><br>Recurso pedagógico diseñado para el nivel de <strong>Primero Medio</strong>.<br><br><strong>✅ Contenido destacable:</strong><br>• Planificación clase a clase completa<br>• Desarrollo de habilidades socioemocionales<br>• Actividades de reflexión y crecimiento<br>• Sin logos ni marcas de agua<br><br><strong>📚 Asignatura:</strong> ${asig.subject}<br><strong>📅 Mes:</strong> ${item.mes}<br><strong>🎯 Nivel:</strong> 1° Medio<br><br>Material editable (.docx) de alta calidad.`;
            const tags = [...asig.tags, item.mes];

            await fillForm(page, title, desc, tags);

            console.log(`      📤 Subiendo archivo...`);
            const uploaded = await uploadFile(page, item.path);

            if (!uploaded) {
                console.log('      ❌ Fallo en la subida. Saltando.');
                continue;
            }

            try {
                console.log('      🚀 Publicando...');
                await page.click('button[data-form-target="publishButton"]');
                await page.waitForURL(/posts\/(\d+)/, { timeout: 60000 });
                console.log(`      ✅ Éxito: ${page.url().replace('/edit', '')}`);
                await page.waitForTimeout(2000);
            } catch (e) {
                console.log(`      ❌ Error: ${e.message.substring(0, 50)}`);
            }
        }
    }

    console.log(`\n✅ PROCESO FINALIZADO`);
    await browser.close();
    process.exit(0);
})();

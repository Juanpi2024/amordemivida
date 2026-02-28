const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env.pablo2010') });
const { convertAndCleanDoc } = require('../limpieza_datos/skills/doc-legacy-cleaner/doc-converter');
const { cleanDeep, removeHeaders, replaceText } = require('../limpieza_datos/modules/docx-cleaner');

const COMMON_CONFIG = {
    subject: 'Matemática',
    level: 'Primero Medio',
    price: '6',
    age_range: '14 - 16 años',
    basePath: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO\\MATEMATICA\\MAT. CON DUA',
};

const TEMP_DIR = path.join(__dirname, 'temp_pablo', 'matematica_1m');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

(async () => {
    console.log(`\n🔢 MATEMÁTICA 1° MEDIO — Cuenta Pablo (Modo Evasivo)`);
    const archivos = findFiles(COMMON_CONFIG.basePath);
    if (archivos.length === 0) process.exit(1);

    const monthOrder = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    archivos.sort((a, b) => monthOrder.indexOf(a.mes) - monthOrder.indexOf(b.mes));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        console.log('🌍 Navegando a login...');
        await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });

        console.log('   ✍️ Escribiendo credenciales...');
        await page.waitForSelector('#user_email');
        await page.fill('#user_email', '');
        await page.type('#user_email', process.env.PROFESOCIAL_EMAIL, { delay: 100 });
        await page.type('#user_password', process.env.PROFESOCIAL_PASSWORD, { delay: 100 });

        console.log('   ⌨️ Presionando Enter...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => { }),
            page.keyboard.press('Enter')
        ]);

        await page.waitForTimeout(5000);

        if (page.url().includes('sign_in') || page.url().includes('login')) {
            console.log('   ⚠️ No se detectó navegación exitosa. Probando click en botón...');
            await page.click('button[type="submit"], .button.is-primary.is-fullwidth');
            await page.waitForTimeout(5000);
        }

        console.log(`   📍 URL Actual: ${page.url()}`);
        if (page.url().includes('sign_in')) {
            console.error('❌ Login Fallido definitivamente.');
            await page.screenshot({ path: path.join(__dirname, 'last_fail_login.png') });
            process.exit(1);
        }
        console.log('✅ Logueado.');

        for (const item of archivos) {
            if (item.mes !== 'Marzo') continue;
            console.log(`\n📅 ${item.mes} — ${item.name}`);
            let file = item.path;
            const finalPath = path.join(TEMP_DIR, `${item.mes}_${item.name}_LIMPIO.docx`);
            if (path.extname(file).toLowerCase() === '.doc') {
                const res = await convertAndCleanDoc(file, TEMP_DIR);
                if (res.success) file = res.outputPath; else continue;
            } else {
                fs.copyFileSync(file, finalPath);
                await cleanDeep(finalPath, finalPath);
                await removeHeaders(finalPath, finalPath);
                await replaceText(finalPath, /mi aula/gi, 'mi drive', finalPath);
                file = finalPath;
            }

            console.log('   📂 Formulario (Upload Primero)...');
            await page.goto('https://profe.social/posts/new', { waitUntil: 'networkidle' });

            await (await page.waitForSelector('input[type="file"]', { state: 'attached' })).setInputFiles(file);
            console.log('   ⏳ Subiendo y esperando redirección a edición...');

            try {
                await page.waitForURL(/\/posts\/\d+\/edit/, { timeout: 30000 });
                console.log('   📍 Redirigido a edición: ' + page.url());
            } catch (e) {
                console.log('   ⚠️ No se detectó redirección automática, procediendo en página actual.');
            }

            const meta = generarMetadatos(item);
            await page.fill('#post_title', meta.title);

            await page.waitForSelector('trix-editor');
            await page.evaluate((h) => {
                const ed = document.querySelector('trix-editor');
                if (ed && ed.editor) { ed.editor.loadHTML(''); ed.editor.insertHTML(h); }
            }, meta.description);

            for (const tag of meta.tags) {
                await page.fill('input[data-application-target="tagInput"]', tag).catch(() => page.fill('input[placeholder*="Etiquetas"]', tag));
                await page.keyboard.press('Enter');
                await page.waitForTimeout(300);
            }

            await page.fill('#post_coin_price', '6');
            await page.fill('#post_min_age', '14');
            await page.fill('#post_max_age', '16');
            await page.selectOption('#post_resource_type', { value: 'lesson' });

            const checkboxes = await page.$$('input[type="checkbox"]');
            for (let c of checkboxes) await c.check({ force: true }).catch(() => { });

            console.log('   🚀 Finalizando publicación...');
            const publishSelectors = [
                'button[type="submit"].is-primary',
                'button:has-text("Publicar")',
                'input[type="submit"][value="Publicar"]'
            ];
            let clicked = false;
            for (const sel of publishSelectors) {
                const btn = await page.$(sel);
                if (btn && await btn.isVisible()) {
                    await btn.click({ force: true });
                    clicked = true;
                    console.log('      🔸 Click en:', sel);
                    break;
                }
            }
            if (!clicked) {
                await page.evaluate(() => {
                    const form = document.querySelector('form');
                    if (form) form.submit();
                });
            }

            await page.waitForURL(/\/posts\/\d+$/, { timeout: 60000 });
            console.log(`   ✅ OK: ${page.url()}`);
            await page.waitForTimeout(3000);
        }
    } catch (e) {
        console.error('❌ ERROR:', e);
        await page.screenshot({ path: path.join(__dirname, 'last_error_pablo.png') });
    } finally {
        await browser.close();
        process.exit();
    }
})();

function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findFiles(filePath, fileList);
        } else {
            const ext = path.extname(file).toLowerCase();
            const name = file.toUpperCase();
            if ((ext === '.docx' || ext === '.doc') &&
                name.includes('PLANIFICACION') &&
                !name.includes('ANUAL') &&
                !name.includes('~$') && !name.includes('LIMPI')) {
                let mes = 'Varios';
                const mesMatch = filePath.match(/(marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
                if (mesMatch) mes = mesMatch[0].charAt(0).toUpperCase() + mesMatch[0].slice(1).toLowerCase();
                fileList.push({ path: filePath, name: file, mes });
            }
        }
    });
    return fileList;
}

function generarMetadatos(item) {
    const mainSubject = 'Matemática';
    return {
        title: `Planificación Clase a Clase ${item.mes} - ${mainSubject} 1° Medio`,
        description: `
            <strong>📊 Planificación Profesional Clase a Clase - Primero Medio</strong><br><br>
            Recurso pedagógico completo y detallado para la asignatura de <strong>Matemática</strong>.<br><br>
            <strong>✅ Contenido destacable:</strong>
            <ul>
                <li>Estructura de clase completa: Inicio, Desarrollo y Cierre.</li>
                <li>Objetivos de Aprendizaje (OA) actualizados según currículum vigente.</li>
                <li>Indicadores de evaluación claros y precisos.</li>
                <li>Sugerencias metodológicas para atención a la diversidad (DUA).</li>
                <li>Material listo para aplicar en el aula o adaptar.</li>
            </ul><br>
            Optimiza tu tiempo docente con este material de alta calidad, diseñado para facilitar el proceso de enseñanza-aprendizaje en el nivel de 1° Medio.
        `,
        tags: [mainSubject, '1° Medio', 'Planificación', item.mes, 'Chile', 'Material Docente']
    };
}

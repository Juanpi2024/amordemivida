const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env.pablo2010') });
const { convertAndCleanDoc } = require('../limpieza_datos/skills/doc-legacy-cleaner/doc-converter');
const { cleanDeep, removeHeaders, replaceText } = require('../limpieza_datos/modules/docx-cleaner');

// Configuración de la materia
const COMMON_CONFIG = {
    subject: 'Lengua y Literatura',
    level: 'Primero Medio',
    price: '6',
    age_range: '14 - 16 años',
    basePath: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO\\LENGUAJE\\LENG. SIN DUA',
};

const TEMP_DIR = path.join(__dirname, 'temp_pablo');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findFiles(filePath, fileList);
        } else {
            const ext = path.extname(file).toLowerCase();
            const name = file.toUpperCase();

            // Archivos ya procesados exitosamente
            const yaPublicados = [
                'PLANIFICACION_CLASE_A_CLASE__ABRIL_Y_1RA_SEMANA_MAYO.DOC'.toUpperCase(),
                'PLANIFICACION_CLASE_A_CLASE_FEBRERO_ULTIMA_SEMANA_Y_MARZO_93957_20210608_20200408_003526.DOC'.toUpperCase()
            ];

            if ((ext === '.docx' || ext === '.doc') &&
                name.includes('PLANIFICACION') &&
                !name.includes('ANUAL') &&
                !name.includes('~$') &&
                !name.includes('LIMPI') &&
                !yaPublicados.includes(name)) {

                let mes = 'Varios';
                const mesMatch = filePath.match(/(marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
                if (mesMatch) mes = mesMatch[0].charAt(0).toUpperCase() + mesMatch[0].slice(1).toLowerCase();

                let unidad = 'General';
                const unidadMatch = filePath.match(/unidad\s?(\d|I+)/i);
                if (unidadMatch) unidad = 'Unidad ' + unidadMatch[1];

                fileList.push({ path: filePath, name: file, mes, unidad });
            }
        }
    });
    return fileList;
}

function generarMetadatos(item) {
    const title = `Planificación Clase a Clase ${item.mes} - ${COMMON_CONFIG.subject} - ${COMMON_CONFIG.level}`;
    const description = `
        <p>Completa planificación clase a clase para el mes de <strong>${item.mes}</strong> en la asignatura de <strong>${COMMON_CONFIG.subject}</strong> para <strong>${COMMON_CONFIG.level}</strong>.</p>
        <p>Este recurso ha sido revisado y actualizado (Febrero 2026), eliminando logos y referencias antiguas para que esté listo para ser usado en tu Drive o entorno virtual.</p>
        <ul>
            <li><strong>Nivel:</strong> ${COMMON_CONFIG.level}</li>
            <li><strong>Mes:</strong> ${item.mes}</li>
            <li><strong>Unidad:</strong> ${item.unidad}</li>
            <li><strong>Formato:</strong> .docx (Editable)</li>
        </ul>
        <p>Contenido descargable de alta calidad para profesores que buscan optimizar su tiempo administrativo.</p>
    `;
    const tags = [COMMON_CONFIG.subject, COMMON_CONFIG.level, 'Planificación', item.mes, 'Chile'];
    return { title, description, tags };
}

async function confirmarPublicacion(archivos) {
    console.log('\n==================================');
    console.log('📋 REVISIÓN PREVIA — Archivos a publicar:');
    console.log('==================================');
    archivos.forEach((file, index) => {
        const ext = path.extname(file.path).toUpperCase();
        console.log(`  ${index + 1}. [${ext}] ${file.mes} (${file.unidad})`);
        console.log(`     ${file.name}`);
    });
    console.log('==================================\n');
    console.log(`✅ Total: ${archivos.length} | Asignatura: ${COMMON_CONFIG.subject} | Nivel: ${COMMON_CONFIG.level}`);
    console.log('\n⚠️  Cuenta: ' + process.env.PROFESOCIAL_EMAIL);
    console.log('⚠️  Presiona ENTER para publicar, o Ctrl+C para cancelar...');

    return new Promise(resolve => {
        process.stdin.once('data', () => resolve(true));
    });
}

(async () => {
    console.log('\n📚 LENGUAJE 1° MEDIO (Cuenta Pablo) — Limpieza y Publicación');
    console.log('============================================================\n');

    const archivos = findFiles(COMMON_CONFIG.basePath);
    if (archivos.length === 0) {
        console.log('❌ No se encontraron planificaciones mensuales.');
        return;
    }

    await confirmarPublicacion(archivos);

    console.log('\n🚀 Iniciando publicación...');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('🌍 Navegando a Profe.Social (Sign In)...');
        await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle', timeout: 90000 });

        console.log('🌍 Ingresando credenciales...');

        // Esperar y llenar email
        await page.waitForSelector('#user_email', { timeout: 60000 });
        await page.fill('#user_email', process.env.PROFESOCIAL_EMAIL);

        // Llenar password
        await page.fill('#user_password', process.env.PROFESOCIAL_PASSWORD);

        console.log('🌍 Clic en botón de ingreso...');
        await Promise.all([
            page.click('button.is-primary.is-block'),
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 90000 }).catch(() => { })
        ]);

        console.log('✅ Login procesado.');

        for (const item of archivos) {
            console.log('\n' + '='.repeat(40));
            console.log(`📅 PROCESANDO: ${item.mes} — ${item.unidad}`);
            console.log(`   Archivo: ${item.name}`);

            const ext = path.extname(item.path).toLowerCase();
            let finalFileToUpload = '';

            if (ext === '.doc') {
                console.log('   🔄 DOC → LibreOffice');
                const result = await convertAndCleanDoc(item.path, TEMP_DIR);
                if (result.success) {
                    finalFileToUpload = result.outputPath;
                } else {
                    console.error('   ❌ Error limpiando DOC. Saltando...');
                    continue;
                }
            } else {
                console.log('   📄 DOCX → pipeline directo');

                const baseName = path.basename(item.path, '.docx');
                const cleanName = baseName.replace(/[0-9]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '').replace(/_?(LIMPIO|LIMPIA)/gi, '');
                let workingPath = path.join(TEMP_DIR, `${cleanName}_LIMPIO_DRIVE.docx`);
                fs.copyFileSync(item.path, workingPath);

                // 1. Limpieza de metadatos
                console.log('   🧹 Limpiando metadatos (cleanDeep)...');
                const metaResult = await cleanDeep(workingPath, workingPath);
                if (!metaResult.success) {
                    console.error('   ❌ Error en cleanDeep:', metaResult.error);
                }

                // 2. Eliminar headers y footers
                console.log('   💣 Eliminando Headers y Footers...');
                await removeHeaders(workingPath, workingPath);

                // 3. Reemplazo de texto
                console.log('   🔍 Reemplazando "mi aula" por "mi drive"...');
                const replaceResult = await replaceText(workingPath, /mi aula/gi, 'mi drive', workingPath);
                if (replaceResult.success && replaceResult.matches > 0) {
                    console.log(`      ✅ (Se hicieron ${replaceResult.matches} reemplazos)`);
                }

                finalFileToUpload = workingPath;
            }

            console.log('   📁 Navegando a la página de creación...');
            await page.goto('https://profe.social/posts/new', { waitUntil: 'domcontentloaded', timeout: 90000 });

            await page.waitForSelector('#post_title', { timeout: 60000 });

            const meta = generarMetadatos(item);
            await page.fill('#post_title', meta.title);

            // Descripción (trix-editor)
            await page.waitForSelector('trix-editor');
            await page.evaluate((html) => {
                const editor = document.querySelector('trix-editor');
                if (editor && editor.editor) {
                    editor.editor.loadHTML('');
                    editor.editor.insertHTML(html);
                }
            }, meta.description);

            // Tags
            const tagInputSelector = 'input[placeholder*="Etiquetas"]';
            await page.waitForSelector(tagInputSelector);
            for (const tag of meta.tags) {
                await page.fill(tagInputSelector, tag);
                await page.keyboard.press('Enter');
                await page.waitForTimeout(300);
            }

            // Precio
            await page.fill('#post_coin_price', COMMON_CONFIG.price);

            // Rango de edad (min/max)
            await page.fill('#post_min_age', '14');
            await page.fill('#post_max_age', '16');

            // Tipo de recurso
            await page.selectOption('#post_resource_type', { value: 'lesson' });

            // Upload
            console.log('   📤 Cargando archivo...');
            const inputFile = await page.$('input[type="file"]');
            await inputFile.setInputFiles(finalFileToUpload);

            // Checkboxes (Términos, Privacidad, etc.)
            await page.evaluate(() => {
                document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    if (!cb.checked) cb.click();
                });
            });

            // Esperar carga final del archivo (10s para seguridad)
            console.log('   ⏳ Esperando carga final (10s)...');
            await page.waitForTimeout(10000);

            console.log('   🚀 Publicando...');
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
                    console.log(`   🔸 Click en: ${sel}`);
                    break;
                }
            }

            if (!clicked) {
                console.log('   🔸 Fallback: Enlace directo al formulario.');
                await page.evaluate(() => {
                    const form = document.querySelector('form[action="/posts"]') || document.querySelector('form');
                    if (form) form.submit();
                });
            }

            // Esperar confirmación
            await page.waitForURL(/posts\/(\d+)/, { timeout: 60000 });
            console.log(`   ✅ PUBLICADO: ${item.mes} → ${page.url()}`);
        }

        console.log('\n🏁 FIN — Lenguaje 1° Medio completado.');

    } catch (error) {
        console.error('❌ ERROR FATAL:', error);
        await page.screenshot({ path: path.join(__dirname, 'error_login_pablo.png') });
        console.log('📸 Captura de error guardada en: error_login_pablo.png');
    } finally {
        await browser.close();
        process.exit();
    }
})();

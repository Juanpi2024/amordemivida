const LeninRedactor = require('./lenin_redactor');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const EMAIL = process.env.PROFESOCIAL_EMAIL;
const PASSWORD = process.env.PROFESOCIAL_PASSWORD;

// Estado de publicaciones
const STATE_FILE = path.join(__dirname, 'published_5bas.json');
let publishedFiles = [];
if (fs.existsSync(STATE_FILE)) {
    publishedFiles = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}


// Función para extraer metadatos del nombre del archivo
function parseFileInfo(filePath) {
    const upperPath = filePath.toUpperCase();
    let asignatura = "Asignatura desconocida";

    // Mapeo detallado de palabras clave a Asignaturas
    const subjectMap = [
        { key: "CIENCIAS NATURALES", value: "Ciencias Naturales" },
        { key: "CS NATURALES", value: "Ciencias Naturales" },
        { key: "CS. NAT.", value: "Ciencias Naturales" },
        { key: "CNATURALES", value: "Ciencias Naturales" },
        { key: "ARTES VISUALES", value: "Artes Visuales" },
        { key: "VISUALES", value: "Artes Visuales" },
        { key: "ED FISICA", value: "Educación Física" },
        { key: "EDUCACION FISICA", value: "Educación Física" },
        { key: "HISTORIA", value: "Historia y Geografía" },
        { key: "INGLES", value: "Inglés" },
        { key: "LENGUAJE", value: "Lenguaje y Comunicación" },
        { key: "MATEMATICA", value: "Matemática" },
        { key: "MUSICA", value: "Música" },
        { key: "ORIENTACION", value: "Orientación" },
        { key: "RELIGION", value: "Religión" },
        { key: "TECNOLOGIA", value: "Tecnología" },
        { key: "TECNOLOGICA", value: "Tecnología" }
    ];

    // Intento 1: Path completo
    for (const item of subjectMap) {
        if (upperPath.includes(item.key)) {
            asignatura = item.value;
            break;
        }
    }

    // Intento 2: Segmentos del path (carpetas)
    if (asignatura === "Asignatura desconocida") {
        const parts = filePath.split(path.sep);
        for (const part of parts.reverse()) {
            const upperPart = part.toUpperCase();
            for (const item of subjectMap) {
                if (upperPart === item.key || upperPart.includes(item.key)) {
                    asignatura = item.value;
                    break;
                }
            }
            if (asignatura !== "Asignatura desconocida") break;
        }
    }

    // Refinar Religión a Evangélica o Católica
    if (asignatura === "Religión") {
        if (upperPath.includes("EVANGELICA")) {
            asignatura = "Religión Evangélica";
        } else if (upperPath.includes("CATOLICA")) {
            asignatura = "Religión Católica";
        }
    }

    let mes = "Mes desconocido";
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    for (const m of meses) {
        if (upperPath.includes(m.toUpperCase())) {
            mes = m;
            break;
        }
    }

    if (asignatura === "Asignatura desconocida") {
        throw new Error(`CRITICAL: No se pudo determinar la asignatura para el archivo: ${filePath}. Se detiene la publicación por seguridad.`);
    }

    return { asignatura, mes, tema: `Planificación ${asignatura} 5° Básico - ${mes}` };
}

(async () => {
    // 1. Obtener archivos si el array está vacío
    const glob = require('glob');
    const cleanedFilesRaw = glob.sync("D:/Users/Pablo/Desktop/ESCRITORIO TRABAJO 2023/mi aula editado/SEGUNDO CICLO/ASIGNATURAS 5 bas/**/LIMPIO/*_LIMPIO_DRIVE.docx");

    const normalizedPublished = publishedFiles.map(f => path.normalize(f));
    const cleanedFiles = cleanedFilesRaw.filter(f => !normalizedPublished.includes(path.normalize(f)));

    console.log(`🔴 LENIN BULK 5°: Encontrados ${cleanedFilesRaw.length} archivos. Saltando ${cleanedFilesRaw.length - cleanedFiles.length} ya publicados. Quedan ${cleanedFiles.length} por publicar.`);

    if (!EMAIL || !PASSWORD) {
        console.error('❌ ERROR: Faltan credenciales');
        process.exit(1);
    }

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const redactor = new LeninRedactor();

    try {
        // LOGIN
        console.log('🌍 Iniciando sesión con profeyeca...');
        await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });

        if (await page.isVisible('#user_email')) {
            await page.fill('#user_email', EMAIL);
            await page.fill('#user_password', PASSWORD);
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle' }),
                page.click('button.is-primary.is-block')
            ]);
            console.log('✅ Intento de login enviado.');
        } else {
            console.log('ℹ️ Ya hay una sesión activa o la página de login es distinta.');
        }

        await page.screenshot({ path: 'debug_after_login.login.png' });
        await page.waitForTimeout(2000); // Dar tiempo a que la sesión se asiente

        for (const filePath of cleanedFiles) {
            const info = parseFileInfo(filePath);
            console.log(`\n📦 PROCESANDO: ${info.tema}`);
            console.log(`   📂 Asignatura detectada: ${info.asignatura}`);
            console.log(`   📅 Mes detectado: ${info.mes}`);
            console.log(`   📁 Ruta: ${filePath}`);

            // FASE 0: Generar metadatos persuasivos
            const metadatos = await redactor.generarMetadatos(info.tema);
            if (!metadatos) {
                console.error(`   ❌ Falló generación de metadatos para: ${info.tema}. Saltando.`);
                continue;
            }

            await page.goto('https://profe.social/posts/new', { waitUntil: 'networkidle' });
            await page.screenshot({ path: 'debug_new_post_page.png' });

            if (!await page.isVisible('#post_title')) {
                console.error('❌ ERROR: No se visualiza el formulario de publicación. Verifique sesión.');
                await page.screenshot({ path: 'error_form_not_visible.png' });
                // Re-intento de login si perdimos sesión
                continue;
            }

            // 1. TÍTULO Y PRECIO
            await page.fill('#post_title', metadatos.titulo);
            await page.fill('#post_coin_price', '6'); // Estándar solicitado

            // 2. DESCRIPCIÓN (Trix)
            await page.evaluate((html) => {
                const editor = document.querySelector('trix-editor');
                if (editor && editor.editor) {
                    editor.editor.loadHTML(html);
                }
            }, metadatos.descripcionHTML);

            // 3. EDAD Y TIPO
            await page.fill('#post_min_age', '10');
            await page.fill('#post_max_age', '12');
            await page.selectOption('#post_resource_type', 'lesson');

            // 4. ETIQUETAS
            const tagInput = 'input[placeholder*="Etiquetas"]';
            for (const tag of metadatos.etiquetas) {
                await page.fill(tagInput, tag);
                await page.press(tagInput, 'Enter');
                await page.waitForTimeout(300);
            }

            // 5. CARGA DE ARCHIVO
            console.log('   📤 Cargando archivo...');
            await page.setInputFiles('input[name="post[file]"]', filePath);

            console.log('   ⏳ Esperando 40 segundos para carga libre...');
            await page.waitForTimeout(40000); // Wait unconditionally
            console.log('   ✓ Espera finalizada.');

            // 6. DECLARACIÓN
            await page.check('input#post_declared_ownership');

            // 7. PUBLICAR
            console.log('   🚀 Presionando PUBLICAR...');
            try {
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }),
                    page.click('button[data-form-target="publishButton"]')
                ]);
                console.log(`   ✅ PUBLICACIÓN EXITOSA: ${metadatos.titulo}`);
                // GUARDAR ESTADO
                publishedFiles.push(filePath);
                fs.writeFileSync(STATE_FILE, JSON.stringify(publishedFiles, null, 2));
            } catch (navErr) {
                console.warn(`   ⚠️ Advertencia de navegación: ${navErr.message}. Verificando estado...`);
                // Si llegamos aquí, a veces es porque ya se publicó pero no detectamos el cambio de URL
                await page.waitForTimeout(5000);
                if (page.url().includes('/posts/')) {
                    console.log('   ✅ Confirmado por URL: Publicación exitosa.');
                    publishedFiles.push(filePath);
                    fs.writeFileSync(STATE_FILE, JSON.stringify(publishedFiles, null, 2));
                } else {
                    console.error('   ❌ No se pudo confirmar la publicación. Continuando con el siguiente.');
                }
            }

            // Pausa estratégica entre archivos
            await page.waitForTimeout(5000);
        }

        console.log('\n🏁 TODAS LAS PUBLICACIONES DE 5° BÁSICO COMPLETADAS.');

    } catch (err) {
        console.error('❌ ERROR DURANTE LA PUBLICACIÓN MASIVA:', err.message);
        await page.screenshot({ path: `error_bulk_5bas_${Date.now()}.png` });
    } finally {
        await browser.close();
    }
})();

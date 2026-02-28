const { chromium } = require('playwright');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env') });

// Credenciales directas o fallback a .env
const EMAIL = process.env.PROFESOCIAL_EMAIL || 'profeyeca2021@gmail.com';
const PASSWORD = process.env.PROFESOCIAL_PASSWORD || 'Juanpi2018';

// Configuración general
const COMMON_CONFIG = {
    precio: '6',
    minAge: '6',
    maxAge: '8',
    resourceType: 'lesson',
    asignatura: 'Matemática',
    nivel: 'Segundo Básico'
};

// Lista de archivos a publicar obtenida del escaneo
const FILES_TO_PUBLISH = [
    {
        mes: 'Marzo',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\matematica 2d\\unidad 1\\marzo\\PLANIFICACION_CLASE_A_CLASE_MES_MARZO_MATEMATICA_2DO_BASICO_96282_20200603_20200402_163118.DOC',
        unidad: 'Unidad 1'
    },
    {
        mes: 'Abril',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\matematica 2d\\unidad 1\\abril\\PLANIFICACION_CLASE_A_CLASE_MES_ABRIL_MATEMATICA_2DO_BASICO_96545_20200603_20200402_163138.DOC',
        unidad: 'Unidad 1'
    },
    {
        mes: 'Mayo',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\matematica 2d\\unidad 1\\mayo\\PLANIFICACION_CLASE_A_CLASE_MES_DE_MAYO_UNIDAD_1_MATEMATICA_2DO_BASICO_97378_20200603_20200402_163145.DOC',
        unidad: 'Unidad 1'
    },
    {
        mes: 'Junio',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\matematica 2d\\unidad 2\\junio\\PLANIFICACION_CLASE_A_CLASE_MES_DE_JUNIO_UNIDAD_2_MATEMATICA_2DO_BASICO_98205_20200603_20200402_163155.DOC',
        unidad: 'Unidad 2'
    },
    {
        mes: 'Julio',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\matematica 2d\\unidad 2\\julio\\PLANIFICACION_CLASE_A_CLASE_MES_DE_JULIO_UNIDAD_2_MATEMATICA_2DO_BASICO_98686_20200603_20200402_165811.DOC',
        unidad: 'Unidad 2'
    },
    {
        mes: 'Agosto',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\matematica 2d\\unidad 3\\agosto\\PLANIFICACION_CLASE_A_CLASE_MES_AGOSTO_UNIDAD_3_MATEMATICA_2DO_BASICO_93164_20200603_20190730_143900.DOC',
        unidad: 'Unidad 3'
    },
    {
        mes: 'Septiembre',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\matematica 2d\\unidad 3\\septiembre\\PLANIFICACION_CLASE_A_CLASE_MES_DE_SEPTIEMBRE_UNIDAD_3_MATEMATICA_2DO_BASICO_99509_20200603_20200402_165830.DOC',
        unidad: 'Unidad 3'
    },
    {
        mes: 'Octubre',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\matematica 2d\\unidad 4\\octubre\\PLANIFICACION_CLASE_A_CLASE_MES_DE_OCTUBRE_UNIDAD_4_MATEMATICA_2DO_BASICO_100195_20200603_20200402_165847.DOC',
        unidad: 'Unidad 4'
    },
    {
        mes: 'Noviembre',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\matematica 2d\\unidad 4\\noviembre\\PLANIFICACION_CLASE_A_CLASE_MES_DE_NOVIEMBRE_UNIDAD_4_MATEMATICA_2DO_BASICO_100641_20200603_20200402_165853.DOC',
        unidad: 'Unidad 4'
    },
    {
        mes: 'Diciembre',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\matematica 2d\\unidad 4\\diciembre\\PLANIFICACION_CLASE_A_CLASE_MES_DE_DICIEMBRE_UNIDAD_4_MATEMATICA_2DO_BASICO_101109_20200603_20200402_165902.DOC',
        unidad: 'Unidad 4'
    }
];

// Generador de metadatos dinámico
function generarMetadatos(item) {
    const titulo = `Planificación Clase a Clase: ${item.mes} | ${COMMON_CONFIG.asignatura} ${COMMON_CONFIG.nivel}`;

    // Descripción persuasiva HTML
    const descripcion = `
        <strong>📅 Planificación Detallada Clase a Clase - Mes de ${item.mes}</strong><br><br>
        Recurso pedagógico completo y listo para utilizar en la asignatura de <strong>${COMMON_CONFIG.asignatura}</strong> para <strong>${COMMON_CONFIG.nivel}</strong>.<br><br>
        
        <strong>✅ Características del Material:</strong>
        <ul>
            <li>Planificación estructurada clase a clase.</li>
            <li>Objetivos de Aprendizaje (OA) claramente definidos.</li>
            <li>Secuencia didáctica completa: Inicio, Desarrollo y Cierre.</li>
            <li>Actividades desafiantes y acordes a la edad (${COMMON_CONFIG.minAge}-${COMMON_CONFIG.maxAge} años).</li>
            <li>Material alineado con el currículum vigente.</li>
        </ul><br>
        
        <strong>🚀 Beneficios para el Docente:</strong>
        <ul>
            <li>Ahorra horas de planificación frente al computador.</li>
            <li>Asegura la cobertura curricular del mes de ${item.mes}.</li>
            <li>Llega al aula con todo organizado y listo para enseñar.</li>
        </ul><br>
        
        <em>Este recurso corresponde a la <strong>${item.unidad}</strong>. ¡Descárgalo y optimiza tu tiempo docente!</em>
    `;

    const tags = [
        COMMON_CONFIG.asignatura,
        COMMON_CONFIG.nivel,
        'Planificación',
        item.mes,
        'NB1',
        item.unidad,
        'Clase a clase',
        'Material Docente',
        'Recursos para el Aula',
        'Educación Básica',
        'Docente de Matemáticas',
        'Actividades Escolares'
    ];

    return { titulo, descripcion, tags };
}

(async () => {
    console.log(`🔴 LENIN MATH 2D v2: Iniciando publicación masiva de ${FILES_TO_PUBLISH.length} archivos...`);

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    try {
        // --- LOGIN ÚNICO ---
        console.log('🌍 Iniciando sesión en Profe.Social...');
        await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });

        if (await page.isVisible('#user_email')) {
            await page.fill('#user_email', EMAIL);
            await page.fill('#user_password', PASSWORD);
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle' }),
                page.click('button.is-primary.is-block')
            ]);
            console.log('✅ Login exitoso.');
        } else {
            console.log('ℹ️ Sesión ya activa.');
        }

        // --- PROCESAMIENTO DE LA COLA ---
        for (const item of FILES_TO_PUBLISH) {
            console.log(`\n============== PROCESANDO: ${item.mes} ==============`);
            const meta = generarMetadatos(item);

            await page.goto('https://profe.social/posts/new', { waitUntil: 'domcontentloaded' });

            // 1. TÍTULO
            console.log(`✍️ Título: ${meta.titulo}`);
            await page.fill('#post_title', meta.titulo);

            // 2. PRECIO
            console.log(`💰 Precio: ${COMMON_CONFIG.precio} coins`);
            await page.fill('#post_coin_price', COMMON_CONFIG.precio);

            // 3. DESCRIPCIÓN (Trix) - Espera mejorada
            console.log('📝 Inyectando descripción...');
            await page.waitForSelector('trix-editor');
            await page.evaluate((html) => {
                const editor = document.querySelector('trix-editor');
                if (editor && editor.editor) {
                    editor.editor.loadHTML(''); // Limpiar
                    editor.editor.insertHTML(html);
                }
            }, meta.descripcion);

            // 4. EDAD Y TIPO
            await page.fill('#post_min_age', COMMON_CONFIG.minAge);
            await page.fill('#post_max_age', COMMON_CONFIG.maxAge);
            await page.selectOption('#post_resource_type', COMMON_CONFIG.resourceType);

            // 5. ETIQUETAS
            console.log('🏷️ Etiquetas:', meta.tags.join(', '));
            const tagInputSelector = 'input[placeholder*="Etiquetas"]';
            await page.waitForSelector(tagInputSelector); // Asegurar que el input existe
            for (const tag of meta.tags) {
                await page.click(tagInputSelector); // Click para enfocar
                await page.fill(tagInputSelector, tag);
                await page.press(tagInputSelector, 'Enter');
                // IMPORTANTE: Espera corta para que la etiqueta se procese
                await page.waitForTimeout(500);
            }

            // 6. ARCHIVO
            console.log(`📁 Subiendo archivo: ${path.basename(item.path)}`);
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                try {
                    await fileInput.setInputFiles(item.path);
                    // Espera más generosa y explícita para la subida
                    console.log('   ⏳ Esperando subida de archivo (10s)...');
                    await page.waitForTimeout(10000);
                } catch (e) {
                    console.error(`❌ Error subiendo archivo ${item.path}:`, e.message);
                    continue;
                }
            } else {
                console.error('❌ No se encontró el input de archivo.');
                continue;
            }

            // 7. CHECKBOXES
            await page.evaluate(() => {
                document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    if (!cb.checked) cb.click();
                });
            });

            // 8. PUBLICAR - Estrategia de Selectores Múltiples
            console.log('🚀 Intentando Publicar...');

            // Pausa breve para asegurar que el botón se habilite tras validaciones
            await page.waitForTimeout(2000);

            // Selectores en orden de probabilidad
            const publishSelectors = [
                'input[type="submit"][name="commit"]',
                'button.is-primary.is-large',
                'button:has-text("Publicar")',
                'input[value="Publicar"]',
                // Fallback para selector CSS específico si los anteriores fallan
                'form[action="/posts"] input[type="submit"]'
            ];

            let clicked = false;
            for (const selector of publishSelectors) {
                const btn = await page.$(selector);
                if (btn && await btn.isVisible()) {
                    console.log(`   👆 Click en: ${selector}`);

                    // Esperar a que sea clickable por seguridad
                    try { await btn.click({ timeout: 5000 }); }
                    catch (e) {
                        console.warn(`   ⚠️ Click falló en ${selector}, intentando JS Force Click...`);
                        await page.evaluate((s) => document.querySelector(s).click(), selector);
                    }

                    clicked = true;
                    break;
                }
            }

            if (!clicked) {
                console.warn('⚠️ Botón no encontrado visualmente. Intentando envío forzoso de formulario...');
                await page.evaluate(() => {
                    const form = document.querySelector('form[action="/posts"]') || document.querySelector('form');
                    if (form) form.submit();
                });
            }

            // Confirmación de éxito
            console.log('   ⏳ Esperando redirección de éxito...');
            try {
                // Esperamos salir de la página de "new"
                await page.waitForURL('**/posts/*', { timeout: 60000, waitUtil: 'domcontentloaded' });

                if (!page.url().includes('/new')) {
                    console.log(`✅ ÉXITO: Publicado en ${page.url()}`);
                } else {
                    console.warn('⚠️ Alerta: Seguimos en /new. Revisar captura de error.');
                    await page.screenshot({ path: `error_publicacion_${item.mes}.png` });
                }
            } catch (e) {
                console.error('❌ Timeout esperando confirmación. Puede que haya fallado o sea muy lento.');
                await page.screenshot({ path: `timeout_publicacion_${item.mes}.png` });
            }

            // Pausa entre ítems
            await page.waitForTimeout(3000);
        }

        console.log('\n🏁 TODAS LAS PUBLICACIONES FINALIZADAS.');

    } catch (err) {
        console.error('❌ ERROR GENERAL:', err);
        await page.screenshot({ path: 'error_general_matematica_fatal.png' });
    } finally {
        await browser.close();
    }
})();

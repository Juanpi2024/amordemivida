const { chromium } = require('playwright');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env') });

// Credenciales
const EMAIL = process.env.PROFESOCIAL_EMAIL || 'profeyeca2021@gmail.com';
const PASSWORD = process.env.PROFESOCIAL_PASSWORD || 'Juanpi2018';

// Configuración Base - CIENCIAS NATURALES 2°
const COMMON_CONFIG = {
    precio: '6',
    minAge: '6',
    maxAge: '8', // 2do básico (7-8 años aprox)
    resourceType: 'lesson',
    asignatura: 'Ciencias Naturales',
    nivel: 'Segundo Básico'
};

// Rutas actualizadas para CIENCIAS NATURALES
const FILES_TO_PUBLISH = [
    {
        mes: 'Marzo',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\Naturales\\unidad 1\\marzo\\PLANIFICACION_CLASE_A_CLASE_MES_ABRIL_CIENCIAS_2DO_BASICO_96350_20200603_20200402_171956.DOC',
        unidad: 'Unidad 1'
    },
    {
        mes: 'Abril',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\Naturales\\unidad 1\\abril\\PLANIFICACION_CLASE_A_CLASE_MES_ABRIL_CIENCIAS_2DO_BASICO_96499_20200603_20200402_172003.DOC',
        unidad: 'Unidad 1'
    },
    {
        mes: 'Mayo',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\Naturales\\unidad 2\\mayo\\PLANIFICACION_CLASE_A_CLASE_MES_DE_MAYO_UNIDAD_2_CIENCIAS_SOCIALES_2DO_BASICO_97519_20200604_20200402_172013.DOC',
        unidad: 'Unidad 2'
    },
    {
        mes: 'Junio',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\Naturales\\unidad 2\\junio\\PLANIFICACION_CLASE_A_CLASE_MES_DE_JUNIO_UNIDAD_2_CIENCIAS_NATURALES_2DO_BASICO_98297_20200604_20200402_172020.DOC',
        unidad: 'Unidad 2'
    },
    {
        mes: 'Julio',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\Naturales\\unidad 2\\julio\\PLANIFICACION_CLASE_A_CLASE_MES_DE_JULIO_UNIDAD_2_CIENCIAS_NATURALES_2DO_BASICO_98639_20200604_20200402_172031.DOC',
        unidad: 'Unidad 2'
    },
    {
        mes: 'Agosto',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\Naturales\\unidad 3\\agosto\\PLANIFICACION_CLASE_A_CLASE_MES_DE_AGOSTO_UNIDAD_3_CIENCIAS_NATURALES_2DO_BASICO_93545_20200604_20180802_081429.DOC',
        unidad: 'Unidad 3'
    },
    {
        mes: 'Septiembre',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\Naturales\\unidad 3\\septiembre\\PLANIFICACION_CLASE_A_CLASE_MES_DE_SEPTIEMBRE_UNIDAD_3CIENCIAS_2DO_BASICO_99361_20200604_20200402_172040.DOC',
        unidad: 'Unidad 3'
    },
    {
        mes: 'Octubre',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\Naturales\\unidad 4\\octubre\\PLANIFICACION_CLASE_A_CLASE_MES_DE_Soctubre_UNIDAD_4_CIENCIAS_NATURALES_octubre.doc',
        unidad: 'Unidad 4'
    },
    {
        mes: 'Noviembre',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\Naturales\\unidad 4\\noviembre\\PLANIFICACION_CLASE_A_CLASE_MES_DE_NOVIEMBRE_UNIDAD_4_CIENCIAS_NATURALES_2DO_BASICO_103266_20200604_20190319_092114.DOC',
        unidad: 'Unidad 4'
    },
    {
        mes: 'Diciembre',
        path: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\Naturales\\unidad 4\\diciembre\\PLANIFICACION_CLASE_A_CLASE_MES_DE_DICIEMBRE_UNIDAD_4_CIENCIAS_NATURALES_2DO_BASICO_100991_20200604_20200402_172056.DOC',
        unidad: 'Unidad 4'
    }
];

function generarMetadatos(item) {
    const titulo = `Planificación Clase a Clase: ${item.mes} | ${COMMON_CONFIG.asignatura} ${COMMON_CONFIG.nivel}`;

    // Descripción persuasiva HTML
    const descripcion = `
        <strong>🌍 Planificación Detallada Clase a Clase - Mes de ${item.mes}</strong><br><br>
        Recurso pedagógico completo para la asignatura de <strong>${COMMON_CONFIG.asignatura}</strong> en <strong>${COMMON_CONFIG.nivel}</strong>.<br><br>
        
        <strong>✅ Incluye:</strong>
        <ul>
            <li>Planificación diaria estructurada (Inicio, Desarrollo, Cierre).</li>
            <li>Objetivos de Aprendizaje (OA) curriculares.</li>
            <li>Indicadores de evaluación.</li>
            <li>Actividades prácticas y experimentales sugeridas para niños de ${COMMON_CONFIG.minAge} a ${COMMON_CONFIG.maxAge} años.</li>
        </ul><br>
        
        <strong>💡 ¿Por qué descargar este recurso?</strong>
        <ul>
            <li>¡Listo para aplicar en el aula! Sin ediciones complejas.</li>
            <li>Cumple con los estándares ministeriales.</li>
            <li>Optimiza tu tiempo de preparación de clases.</li>
        </ul><br>
        
        <em>Perteneciente a la <strong>${item.unidad}</strong> de Ciencias Naturales.</em>
    `;

    const tags = [
        COMMON_CONFIG.asignatura,
        COMMON_CONFIG.nivel,
        'Planificación',
        item.mes,
        'Ciencias',
        'NB1',
        item.unidad,
        'Clase a clase',
        'Experimentación',
        'Naturaleza',
        'Material Docente',
        'Recursos TIC'
    ];

    return { titulo, descripcion, tags };
}

// --- SCRIPT PRINCIPAL (Copia optimizada del script de matemáticas) ---
(async () => {
    console.log(`🌿 LENIN SCIENCE 2D: Iniciando publicación masiva de ${FILES_TO_PUBLISH.length} archivos...`);

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    try {
        // --- LOGIN ---
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

        // --- BUCLE DE PUBLICACIÓN ---
        for (const item of FILES_TO_PUBLISH) {
            console.log(`\n============== PROCESANDO: ${item.mes} ==============`);
            const meta = generarMetadatos(item);

            await page.goto('https://profe.social/posts/new', { waitUntil: 'domcontentloaded' });

            // 1. TÍTULO
            console.log(`✍️ Título: ${meta.titulo}`);
            await page.fill('#post_title', meta.titulo);

            // 2. PRECIO
            await page.fill('#post_coin_price', COMMON_CONFIG.precio);

            // 3. DESCRIPCIÓN (Trix)
            console.log('📝 Inyectando descripción...');
            await page.waitForSelector('trix-editor');
            await page.evaluate((html) => {
                const editor = document.querySelector('trix-editor');
                if (editor && editor.editor) {
                    editor.editor.loadHTML('');
                    editor.editor.insertHTML(html);
                }
            }, meta.descripcion);

            // 4. EDAD Y TIPO
            await page.fill('#post_min_age', COMMON_CONFIG.minAge);
            await page.fill('#post_max_age', COMMON_CONFIG.maxAge);
            await page.selectOption('#post_resource_type', COMMON_CONFIG.resourceType);

            // 5. ETIQUETAS
            console.log(`🏷️ ${meta.tags.length} etiquetas...`);
            const tagInputSelector = 'input[placeholder*="Etiquetas"]';
            await page.waitForSelector(tagInputSelector);
            for (const tag of meta.tags) {
                await page.click(tagInputSelector);
                await page.fill(tagInputSelector, tag);
                await page.press(tagInputSelector, 'Enter');
                await page.waitForTimeout(400);
            }

            // 6. ARCHIVO
            console.log(`📁 Subiendo archivo: ${path.basename(item.path)}`);
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                try {
                    await fileInput.setInputFiles(item.path);
                    console.log('   ⏳ Esperando procesamiento (10s)...');
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

            // 8. PUBLICAR
            console.log('🚀 Intentando Publicar...');
            await page.waitForTimeout(2000);

            const publishSelectors = [
                'input[type="submit"][name="commit"]',
                'button.is-primary.is-large',
                'button:has-text("Publicar")',
                'input[value="Publicar"]',
                'form[action="/posts"] input[type="submit"]'
            ];

            let clicked = false;
            for (const selector of publishSelectors) {
                const btn = await page.$(selector);
                if (btn && await btn.isVisible()) {
                    console.log(`   👆 Click en: ${selector}`);
                    try { await btn.click({ timeout: 5000 }); }
                    catch (e) {
                        console.warn('   ⚠️ Click falló, intentando JS force...');
                        await page.evaluate((s) => document.querySelector(s).click(), selector);
                    }
                    clicked = true;
                    break;
                }
            }

            if (!clicked) {
                console.warn('⚠️ Fallback a form.submit()...');
                await page.evaluate(() => {
                    const form = document.querySelector('form[action="/posts"]') || document.querySelector('form');
                    if (form) form.submit();
                });
            }

            // Confirmación
            console.log('   ⏳ Esperando redirección...');
            try {
                await page.waitForURL('**/posts/*', { timeout: 60000, waitUtil: 'domcontentloaded' });
                if (!page.url().includes('/new')) {
                    console.log(`✅ PUBLICADO: ${item.mes} | URL: ${page.url()}`);
                }
            } catch (e) {
                console.error('⚠️ ALERTA: Posible timeout en redirección.');
                await page.screenshot({ path: `naturales_error_${item.mes}.png` });
            }

            await page.waitForTimeout(3000);
        }

        console.log('\n🏁 FIN DEL PROCESO DE CIENCIAS NATURALES.');

    } catch (err) {
        console.error('❌ ERROR GENERAL:', err);
    } finally {
        await browser.close();
    }
})();

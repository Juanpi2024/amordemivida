const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { cleanDeep, replaceText, removeHeaders } = require('../limpieza_datos/modules/docx-cleaner');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env') });

// Credenciales
const EMAIL = process.env.PROFESOCIAL_EMAIL || 'profeyeca2021@gmail.com';
const PASSWORD = process.env.PROFESOCIAL_PASSWORD || 'Juanpi2018';

// Configuración Base - LENGUAJE 2°
const COMMON_CONFIG = {
    precio: '6',
    minAge: '6',
    maxAge: '8',
    resourceType: 'lesson',
    asignatura: 'Lenguaje y Comunicación',
    nivel: 'Segundo Básico',
    basePath: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\PRIMER CICLO\\segundo basico\\ASIGNATURAS\\lenguaje 2d'
};

// Mapeo de meses
const MONTH_UNIT_MAP = {
    'marzo': 'Unidad 1', 'abril': 'Unidad 1', 'mayo': 'Unidad 1',
    'junio': 'Unidad 2', 'julio': 'Unidad 2',
    'agosto': 'Unidad 3', 'septiembre': 'Unidad 3',
    'octubre': 'Unidad 4', 'noviembre': 'Unidad 4', 'diciembre': 'Unidad 4'
};

// Función para encontrar archivos recursivamente
function findFiles(dir, pattern, fileList = []) {
    if (!fs.existsSync(dir)) {
        console.warn(`⚠️ Directorio no encontrado: ${dir}`);
        return fileList;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        let stat;
        try {
            stat = fs.statSync(filePath);
        } catch (e) {
            continue; // Skip inaccessible files
        }

        if (stat.isDirectory()) {
            findFiles(filePath, pattern, fileList);
        } else {
            // Busco que incluya "PLANIFICACION" (case insensitive) y sea DOC/DOCX
            if (pattern.test(file) && /\.(doc|docx)$/i.test(file)) {

                const lowerName = file.toLowerCase();
                const lowerPath = filePath.toLowerCase();

                // Extraer mes
                let mesEncontrado = null;
                for (const mes of Object.keys(MONTH_UNIT_MAP)) {
                    // Check if month is in path or filename
                    if (lowerPath.includes(mes) || lowerName.includes(mes)) {
                        mesEncontrado = mes.charAt(0).toUpperCase() + mes.slice(1);
                        break;
                    }
                }

                if (mesEncontrado) {
                    fileList.push({
                        path: filePath,
                        name: file,
                        mes: mesEncontrado,
                        unidad: MONTH_UNIT_MAP[mesEncontrado.toLowerCase()] || 'General'
                    });
                }
            }
        }
    }
    return fileList;
}

function generarMetadatos(item) {
    const titulo = `Planificación Clase a Clase: ${item.mes} | ${COMMON_CONFIG.asignatura} ${COMMON_CONFIG.nivel}`;

    const descripcion = `
        <strong>📜 Planificación Detallada Clase a Clase - Mes de ${item.mes}</strong><br><br>
        Recurso pedagógico completo para la asignatura de <strong>${COMMON_CONFIG.asignatura}</strong> en <strong>${COMMON_CONFIG.nivel}</strong>.<br><br>
        
        <strong>✅ Ejes de Aprendizaje:</strong>
        <ul>
            <li>Lectura: Desarrollo de fluidez y comprensión lectora.</li>
            <li>Escritura: Producción de textos breves y creatividad.</li>
            <li>Comunicación Oral: Expresión y audición activa.</li>
            <li>Manejo de la Lengua: Vocabulario y gramática contextualizada.</li>
        </ul><br>
        
        <strong>💡 Incluye:</strong>
        <ul>
            <li>Objetivos de Aprendizaje (OA) priorizados.</li>
            <li>Actividades lúdicas y desafiantes.</li>
            <li>Indicadores de evaluación.</li>
            <li>Sugerencias de recursos literarios y no literarios.</li>
        </ul><br>
        
        <em>Perteneciente a la <strong>${item.unidad}</strong>. ¡Descárgalo ahora!</em>
    `;

    const tags = [
        COMMON_CONFIG.asignatura,
        COMMON_CONFIG.nivel,
        'Planificación',
        item.mes,
        'Lenguaje',
        'Lectura',
        'Escritura',
        'NB1',
        item.unidad,
        'Clase a clase',
        'Material Docente',
        'Comprensión Lectora',
        'Literacidad'
    ];

    return { titulo, descripcion, tags };
}

(async () => {
    console.log(`🏰 LENIN LANGUAGE 2D: Iniciando proceso de Limpieza y Publicación...`);

    // 1. ESCANEO DE ARCHIVOS
    console.log(`🔍 Escaneando directorio base: ${COMMON_CONFIG.basePath}`);
    const rawFiles = findFiles(COMMON_CONFIG.basePath, /PLANIFICACION/i);

    // Filtrar duplicados o versiones basura
    const cleanFiles = rawFiles.filter(f => !f.name.startsWith('~$') && !f.name.includes('ANUAL'));
    console.log(`✅ Se encontraron ${cleanFiles.length} planificaciones mensuales.`);

    if (cleanFiles.length === 0) {
        console.error('❌ No se encontraron archivos para procesar. Abortando.');
        return;
    }

    // Ordenar por mes
    const monthOrder = ['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    cleanFiles.sort((a, b) => monthOrder.indexOf(a.mes) - monthOrder.indexOf(b.mes));

    cleanFiles.forEach(f => console.log(`   - ${f.mes}: ${f.name}`));

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    try {
        // LOGIN
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
        }

        // PROCESAR CADA ARCHIVO
        for (const item of cleanFiles) {
            console.log(`\n============== PROCESANDO: ${item.mes} (${item.unidad}) ==============`);

            // --- 2. LIMPIEZA Y REEMPLAZO ---
            const tempDir = path.join(__dirname, 'temp_cleaned');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            // Nombre del archivo de salida limpio
            const cleanerOutputName = `${item.mes}_${path.basename(item.path, path.extname(item.path))}_LIMPIO_DRIVE.docx`;
            const cleanedPath = path.join(tempDir, cleanerOutputName);

            console.log(`🧹 Ejecutando limpieza profunda en: ${item.name}`);

            let finalUploadPath = item.path; // Fallback al original

            // PASO A: Limpieza de Metadatos (Deep Clean)
            const metaResult = await cleanDeep(item.path, cleanedPath);

            // Si cleanDeep funcionó (o copió), seguimos con headers y texto
            if (metaResult.success || (metaResult.outputPath && fs.existsSync(metaResult.outputPath))) {
                let currentPath = cleanedPath;

                // PASO B: Headers y Footers (Nuclear Option)
                console.log(`   💣 Eliminando Headers y Footers...`);
                const headerResult = await removeHeaders(currentPath, currentPath);
                if (headerResult.success && headerResult.modified) {
                    console.log(`      ✅ Headers eliminados.`);
                } else if (headerResult.success) {
                    console.log(`      ℹ️ Sin headers detectados.`);
                }

                // PASO C: Reemplazo de Texto (Cuerpo)
                const replaceResult = await replaceText(
                    currentPath,
                    /mi aula/gi,
                    "mi drive",
                    currentPath
                );

                if (replaceResult.success) {
                    finalUploadPath = currentPath;
                    console.log(`   ✅ Texto del cuerpo revisado.`);
                    if (replaceResult.matches > 0) console.log(`      (Se hicieron ${replaceResult.matches} reemplazos)`);
                } else {
                    console.error(`   ❌ Falló reemplazo de texto: ${replaceResult.error}`);
                    // Aún usamos el archivo limpio de metadatos/headers
                    finalUploadPath = currentPath;
                }
            } else {
                console.warn(`   ⚠️ No se pudo limpiar (posible DOC binario). Usando original.`);
            }

            const meta = generarMetadatos(item);

            // --- 3. PUBLICACIÓN ---
            await page.goto('https://profe.social/posts/new', { waitUntil: 'domcontentloaded' });

            await page.fill('#post_title', meta.titulo);
            await page.fill('#post_coin_price', COMMON_CONFIG.precio);

            await page.waitForSelector('trix-editor');
            await page.evaluate((html) => {
                const editor = document.querySelector('trix-editor');
                if (editor && editor.editor) {
                    editor.editor.loadHTML('');
                    editor.editor.insertHTML(html);
                }
            }, meta.descripcion);

            await page.fill('#post_min_age', COMMON_CONFIG.minAge);
            await page.fill('#post_max_age', COMMON_CONFIG.maxAge);
            await page.selectOption('#post_resource_type', COMMON_CONFIG.resourceType);

            // Etiquetas
            const tagInputSelector = 'input[placeholder*="Etiquetas"]';
            await page.waitForSelector(tagInputSelector);
            for (const tag of meta.tags) {
                await page.click(tagInputSelector);
                await page.fill(tagInputSelector, tag);
                await page.press(tagInputSelector, 'Enter');
                await page.waitForTimeout(300);
            }

            // Subida
            console.log(`📁 Subiendo archivo...`);
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.setInputFiles(finalUploadPath);
                console.log('   ⏳ Esperando carga (10s)...');
                await page.waitForTimeout(10000);
            }

            await page.evaluate(() => {
                document.querySelectorAll('input[type="checkbox"]').forEach(cb => { if (!cb.checked) cb.click(); });
            });

            // Publicar
            console.log('🚀 Publicando...');
            await page.waitForTimeout(2000);

            const publishSelectors = ['input[type="submit"][name="commit"]', 'button.is-primary.is-large', 'button:has-text("Publicar")', 'input[value="Publicar"]'];
            let clicked = false;
            for (const sel of publishSelectors) {
                const btn = await page.$(sel);
                if (btn && await btn.isVisible()) {
                    await btn.click();
                    clicked = true;
                    break;
                }
            }

            if (!clicked) {
                await page.evaluate(() => { const f = document.querySelector('form[action="/posts"]'); if (f) f.submit(); });
            }

            // Confirmación
            try {
                await page.waitForURL('**/posts/*', { timeout: 60000 });
                if (!page.url().includes('/new')) {
                    console.log(`✅ PUBLICADO: ${item.mes}`);
                }
            } catch (e) {
                console.error('⚠️ Timeout esperando redirección.');
                await page.screenshot({ path: `lenguaje_error_${item.mes}.png` });
            }

            await page.waitForTimeout(3000);
        }

        console.log('\n🏁 FIN DEL PROCESO DE LENGUAJE.');

    } catch (err) {
        console.error('❌ ERROR CRÍTICO:', err);
    } finally {
        await browser.close();
    }
})();

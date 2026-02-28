const fs = require('fs');

const data = {
    'publish_matematica_1m_pablo.js': { subject: 'Matemática' },
    'publish_biologia_1m_pablo.js': { subject: 'Ciencias Naturales - Biología' },
    'publish_quimica_1m_pablo.js': { subject: 'Ciencias Naturales - Química' },
    'publish_fisica_1m_pablo.js': { subject: 'Ciencias Naturales - Física' },
    'publish_ingles_1m_pablo.js': { subject: 'Idioma Extranjero Inglés' },
    'publish_historia_1m_pablo.js': { subject: 'Historia, Geografía y Ciencias Sociales' }
};

Object.keys(data).forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Mejorar metadatos (descripcion larga)
    const metaStart = content.indexOf('function generarMetadatos(item) {');
    const metaFixed = `function generarMetadatos(item) {
    const mainSubject = '${data[file].subject.split(' - ').pop()}';
    return {
        title: \`Planificación Clase a Clase \${item.mes} - \${mainSubject} 1° Medio\`,
        description: \`
            <strong>📊 Planificación Profesional Clase a Clase - Primero Medio</strong><br><br>
            Recurso pedagógico completo y detallado para la asignatura de <strong>${data[file].subject}</strong>.<br><br>
            <strong>✅ Contenido destacable:</strong>
            <ul>
                <li>Estructura de clase completa: Inicio, Desarrollo y Cierre.</li>
                <li>Objetivos de Aprendizaje (OA) actualizados según currículum vigente.</li>
                <li>Indicadores de evaluación claros y precisos.</li>
                <li>Sugerencias metodológicas para atención a la diversidad (DUA).</li>
                <li>Material listo para aplicar en el aula o adaptar.</li>
            </ul><br>
            Optimiza tu tiempo docente con este material de alta calidad, diseñado para facilitar el proceso de enseñanza-aprendizaje en el nivel de 1° Medio.
        \`,
        tags: ['\${mainSubject}', '1° Medio', 'Planificación', item.mes, 'Chile', 'Material Docente']
    };
}
`;
    if (metaStart !== -1) {
        content = content.substring(0, metaStart) + metaFixed;
    }

    // 2. Corregir flujo: UPLOAD PRIMERO, LUEGO LLENAR
    const flowStart = content.indexOf("console.log('   📂 Formulario...');");
    const flowEnd = content.indexOf("await page.waitForURL(/posts\\/(\\d+)/");

    if (flowStart !== -1 && flowEnd !== -1) {
        let beforeFlow = content.substring(0, flowStart);
        let afterFlow = content.substring(content.indexOf('}', flowEnd));

        const fixedFlow = `console.log('   📂 Formulario (Upload Primero)...');
            await page.goto('https://profe.social/posts/new', { waitUntil: 'networkidle' });
            
            // Subir primero para que la redirección /edit ocurra ANTES de llenar los campos
            await (await page.waitForSelector('input[type="file"]')).setInputFiles(file);
            console.log('   ⏳ Subiendo y esperando redirección a edición...');
            
            // Esperar a que la URL cambie de /new a /posts/XYZ/edit
            try {
                await page.waitForURL(/\\/posts\\/\\d+\\/edit/, { timeout: 30000 });
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

            // Tags
            for (const tag of meta.tags) {
                await page.fill('input[data-application-target="tagInput"]', tag).catch(() => page.fill('input[placeholder*="Etiquetas"]', tag));
                await page.keyboard.press('Enter');
                await page.waitForTimeout(300);
            }

            await page.fill('#post_coin_price', '6');
            await page.fill('#post_min_age', '14');
            await page.fill('#post_max_age', '16');
            await page.selectOption('#post_resource_type', { value: 'lesson' });

            // Checkboxes
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

            await page.waitForURL(/posts\\/(\\d+)/, { timeout: 60000 });
`;
        content = beforeFlow + fixedFlow + afterFlow;
    }

    fs.writeFileSync(file, content);
    console.log('Applied UPLOAD-FIRST flow to', file);
});

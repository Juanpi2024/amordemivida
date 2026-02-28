const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env.pablo2010') });
const { convertAndCleanDoc } = require('../limpieza_datos/skills/doc-legacy-cleaner/doc-converter');
const { cleanDeep, removeHeaders, replaceText } = require('../limpieza_datos/modules/docx-cleaner');

const COMMON_CONFIG = {
    subject: 'Ciencias Naturales - Química',
    level: 'Primero Medio',
    price: '6',
    age_range: '14 - 16 años',
    basePath: 'D:\\Users\\Pablo\\Desktop\\ESCRITORIO TRABAJO 2023\\mi aula editado\\ENSEÑANZA MEDIA\\PRIMERO MEDIO\\CS NATURALES\\QUIMICA',
};

const TEMP_DIR = path.join(__dirname, 'temp_pablo', 'quimica_1m');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function findFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
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
    const mainSubject = 'Química';
    return {
        title: `Planificación Clase a Clase ${item.mes} - ${mainSubject} 1° Medio`,
        description: `
            <strong>📊 Planificación Profesional Clase a Clase - Primero Medio</strong><br><br>
            Recurso pedagógico completo y detallado para la asignatura de <strong>Ciencias Naturales - Química</strong>.<br><br>
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
        tags: ['${mainSubject}', '1° Medio', 'Planificación', item.mes, 'Chile', 'Material Docente']
    };
}

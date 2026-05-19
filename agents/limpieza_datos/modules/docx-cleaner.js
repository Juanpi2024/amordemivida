/**
 * 🛡️ docx-cleaner.js - Módulo de Limpieza Profunda v2.2
 * 
 * ASPECTOS CRÍTICOS:
 * 1. REPARACIÓN ZIP: Usa PowerShell para normalizar archivos (evita error "No descriptor present").
 * 2. TEXTO INVISIBLE: Corrige colores blancos y temas para asegurar legibilidad post-limpieza.
 * 3. EXHAUSTIVIDAD: Procesa automáticamente todos los XML internos.
 */

const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

/**
 * Analiza metadatos de un archivo DOCX
 * @param {string} filePath - Ruta al archivo DOCX
 * @returns {Object} Metadatos encontrados
 */
async function analyzeMetadata(filePath) {
    const metadata = {
        path: filePath,
        name: path.basename(filePath),
        hasMetadata: false,
        creator: null,
        lastModifiedBy: null,
        company: null,
        manager: null,
        hasComments: false,
        commentsCount: 0,
        hasRevisions: false,
        hasMacros: false,
        hasCustomXml: false,
        title: null
    };

    try {
        const zip = new AdmZip(filePath);

        // Analizar docProps/core.xml
        const coreXml = zip.getEntry('docProps/core.xml');
        if (coreXml) {
            const content = coreXml.getData().toString('utf8');

            const creatorMatch = content.match(/<dc:creator>(.*?)<\/dc:creator>/);
            if (creatorMatch && creatorMatch[1].trim()) {
                metadata.creator = creatorMatch[1].trim();
                metadata.hasMetadata = true;
            }

            const lastModMatch = content.match(/<cp:lastModifiedBy>(.*?)<\/cp:lastModifiedBy>/);
            if (lastModMatch && lastModMatch[1].trim()) {
                metadata.lastModifiedBy = lastModMatch[1].trim();
                metadata.hasMetadata = true;
            }

            const titleMatch = content.match(/<dc:title>(.*?)<\/dc:title>/);
            if (titleMatch && titleMatch[1].trim()) {
                metadata.title = titleMatch[1].trim();
            }
        }

        // Analizar docProps/app.xml
        const appXml = zip.getEntry('docProps/app.xml');
        if (appXml) {
            const content = appXml.getData().toString('utf8');

            const companyMatch = content.match(/<Company>(.*?)<\/Company>/);
            if (companyMatch && companyMatch[1].trim()) {
                metadata.company = companyMatch[1].trim();
                metadata.hasMetadata = true;
            }

            const managerMatch = content.match(/<Manager>(.*?)<\/Manager>/);
            if (managerMatch && managerMatch[1].trim()) {
                metadata.manager = managerMatch[1].trim();
                metadata.hasMetadata = true;
            }
        }

        // Buscar comentarios
        const commentsXml = zip.getEntry('word/comments.xml');
        if (commentsXml) {
            const content = commentsXml.getData().toString('utf8');
            const matches = content.match(/<w:comment /g);
            if (matches) {
                metadata.hasComments = true;
                metadata.commentsCount = matches.length;
                metadata.hasMetadata = true;
            }
        }

        // Buscar revisiones (track changes)
        const settingsXml = zip.getEntry('word/settings.xml');
        if (settingsXml) {
            const content = settingsXml.getData().toString('utf8');
            if (content.includes('<w:trackRevisions')) {
                metadata.hasRevisions = true;
            }
        }

        // Buscar Macros (vbaProject.bin suele indicar macros)
        if (zip.getEntry('word/vbaProject.bin') || zip.getEntry('word/vbaData.xml')) {
            metadata.hasMacros = true;
            metadata.hasMetadata = true;
        }

        // Buscar Custom XML
        const entries = zip.getEntries();
        if (entries.some(e => e.entryName.startsWith('customXml/'))) {
            metadata.hasCustomXml = true;
            metadata.hasMetadata = true;
        }

    } catch (err) {
        metadata.error = err.message;
    }

    return metadata;
}

/**
 * Genera el nombre de archivo limpio según las reglas del usuario:
 * - Solo texto (sin números)
 * - Agregar "_LIMPIO"
 * @param {string} originalName - Nombre original del archivo
 * @returns {string} Nombre limpio
 */
function cleanFileName(originalName) {
    const ext = path.extname(originalName);
    let name = path.basename(originalName, ext);

    // 1. Quitar números
    name = name.replace(/[0-9]/g, '');

    // 2. Limpiar guiones bajos duplicados o sobrantes por quitar los números
    name = name.replace(/_+/g, '_');
    name = name.replace(/^_|_$/g, '');

    // 3. Quitar la palabra "LIMPIO" o "LIMPIA" si ya la tiene para no duplicar
    name = name.replace(/_?(LIMPIO|LIMPIA)/gi, '');

    return `${name}_LIMPIO${ext}`;
}

/**
 * Limpieza profunda de un archivo DOCX
 * @param {string} inputPath - Ruta al archivo original
 * @param {string} outputPath - Ruta al archivo limpio (opcional)
 * @returns {Object} Resultado de la limpieza
 */
async function cleanDeep(inputPath, outputPath = null) {
    if (!outputPath) {
        const dir = path.dirname(inputPath);
        const newName = cleanFileName(path.basename(inputPath));
        outputPath = path.join(dir, newName);
    }

    let workPath = outputPath;
    fs.copyFileSync(inputPath, workPath);

    // Normalizar ZIP antes de procesar para evitar "No descriptor present"
    try {
        const baseDir = path.dirname(workPath);
        const randId = Date.now() + '_' + Math.floor(Math.random() * 1000);
        const zipTmpPath = path.join(baseDir, `repair_${randId}.zip`);
        const zipInPath = path.join(baseDir, `in_${randId}.zip`);
        fs.copyFileSync(workPath, zipInPath);
        const tempUnzip = path.join(baseDir, `_tmp_clean_${randId}`);
        // Expandir y re-comprimir como .zip, luego renombrar a .docx
        const psCmd = `powershell -Command "Expand-Archive -Path '${zipInPath}' -DestinationPath '${tempUnzip}' -Force; Compress-Archive -Path '${tempUnzip}/*' -DestinationPath '${zipTmpPath}' -Force; Remove-Item -Path '${tempUnzip}' -Recurse -Force; Remove-Item -Path '${zipInPath}' -Force"`;
        require('child_process').execSync(psCmd);
        if (fs.existsSync(zipTmpPath)) {
            fs.copyFileSync(zipTmpPath, workPath);
            fs.unlinkSync(zipTmpPath);
        }
    } catch (e) { /* silent fail, attempt direct */ }

    try {
        const zip = new AdmZip(fs.readFileSync(workPath));
        let cleaned = [];

        // 1. Propiedades del documento e información personal (core.xml)
        const coreEntry = zip.getEntry('docProps/core.xml');
        if (coreEntry) {
            let content = coreEntry.getData().toString('utf8');
            content = content.replace(/<dc:creator>.*?<\/dc:creator>/g, '<dc:creator></dc:creator>');
            content = content.replace(/<cp:lastModifiedBy>.*?<\/cp:lastModifiedBy>/g, '<cp:lastModifiedBy></cp:lastModifiedBy>');
            content = content.replace(/<dc:title>.*?<\/dc:title>/g, '<dc:title></dc:title>');
            content = content.replace(/<dc:subject>.*?<\/dc:subject>/g, '<dc:subject></dc:subject>');
            content = content.replace(/<cp:keywords>.*?<\/cp:keywords>/g, '<cp:keywords></cp:keywords>');
            content = content.replace(/<dc:description>.*?<\/dc:description>/g, '<dc:description></dc:description>');

            zip.updateFile('docProps/core.xml', Buffer.from(content, 'utf8'));
            cleaned.push('Información personal (Autor, Creador)');
        }

        // 2. Propiedades de la aplicación (app.xml - Empresa, Manager)
        const appEntry = zip.getEntry('docProps/app.xml');
        if (appEntry) {
            let content = appEntry.getData().toString('utf8');
            content = content.replace(/<Company>.*?<\/Company>/g, '<Company></Company>');
            content = content.replace(/<Manager>.*?<\/Manager>/g, '<Manager></Manager>');
            content = content.replace(/<Application>.*?<\/Application>/g, '<Application></Application>');

            zip.updateFile('docProps/app.xml', Buffer.from(content, 'utf8'));
            cleaned.push('Propiedades de aplicación (Empresa, Manager)');
        }

        // 3. Comentarios, revisiones y versiones
        if (zip.getEntry('word/comments.xml')) {
            zip.deleteFile('word/comments.xml');
            cleaned.push('Comentarios');
        }
        if (zip.getEntry('word/commentsExtended.xml')) {
            zip.deleteFile('word/commentsExtended.xml');
            cleaned.push('Comentarios extendidos');
        }

        // 4. Datos XML personalizados
        const entries = zip.getEntries();
        const customXmlEntries = entries.filter(e => e.entryName.startsWith('customXml/'));
        for (const entry of customXmlEntries) {
            zip.deleteFile(entry.entryName);
        }
        if (customXmlEntries.length > 0) cleaned.push('Datos XML personalizados');

        // 5. Macros y controles ActiveX (Quitar vbaProject.bin)
        if (zip.getEntry('word/vbaProject.bin')) {
            zip.deleteFile('word/vbaProject.bin');
            cleaned.push('Macros (VBA Project)');
        }
        if (zip.getEntry('word/vbaData.xml')) {
            zip.deleteFile('word/vbaData.xml');
            cleaned.push('Datos de Macros');
        }

        // 6. Propiedades personalizadas
        if (zip.getEntry('docProps/custom.xml')) {
            zip.deleteFile('docProps/custom.xml');
            cleaned.push('Propiedades personalizadas');
            modified = true;
        }

        // 7. Borrar thumbnails
        if (zip.getEntry('docProps/thumbnail.jpeg')) {
            zip.deleteFile('docProps/thumbnail.jpeg');
            cleaned.push('Miniatura del documento');
            modified = true;
        }

        // 8. Corregir textos invisibles (Blanco sobre Blanco) debido a la eliminación de las imágenes de fondo.
        const entriesToDeWhite = [
            ...entries.filter(e => e.entryName.endsWith('.xml')).map(e => e.entryName)
        ];

        entriesToDeWhite.forEach(entryName => {
            const entry = zip.getEntry(entryName);
            if (entry) {
                let content = entry.getData().toString('utf8');
                let initialContent = content;

                // REGLA AGRESIVA: Eliminar CUALQUIER etiqueta de color para forzar automático (negro)
                content = content.replace(/<w:color\s+[^>]*\/>/gi, '');

                // REGLA AGRESIVA: Eliminar cualquier etiqueta de resaltado
                content = content.replace(/<w:highlight\s+[^>]*\/>/gi, '');

                // REGLA AGRESIVA: Eliminar sombreados (fondos) de párrafo y texto, dejarlos transparentes
                content = content.replace(/<w:shd\s+[^>]*\/>/gi, '<w:shd w:val="clear" w:color="auto" w:fill="auto"/>');

                // VML (Common in older docs/textboxes) - Reset a seguro
                content = content.replace(/fillcolor="[^"]*"/gi, 'fillcolor="window"');
                content = content.replace(/color="[^"]*"/gi, 'color="windowtext"');
                content = content.replace(/strokeColor="[^"]*"/gi, 'strokeColor="windowtext"');

                // DrawingML (Modern textboxes/shapes) - Reset a negro
                content = content.replace(/<a:srgbClr\s+val="[^"]*"[^>]*\/>/gi, '<a:srgbClr val="000000"/>');
                content = content.replace(/<a:srgbClr\s+val="[^"]*"[^>]*>/gi, '<a:srgbClr val="000000">');
                content = content.replace(/<a:schemeClr\s+val="[^"]*"[^>]*\/>/gi, '<a:schemeClr val="tx1"/>');

                if (content !== initialContent) {
                    zip.updateFile(entryName, Buffer.from(content, 'utf8'));
                    modified = true;
                }
            }
        });

        // Guardar archivo limpio
        fs.writeFileSync(outputPath, zip.toBuffer());

        return {
            success: true,
            outputPath,
            cleaned: cleaned,
            cleanedCount: cleaned.length
        };

    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Reemplaza texto en el contenido DOCX (cuerpo, encabezados, pies de página)
 * @param {string} inputPath - Ruta al archivo DOCX
 * @param {string|RegExp} searchValue - Texto a buscar (string o regex)
 * @param {string} replaceValue - Texto de reemplazo
 * @param {string} outputPath - Ruta de salida (opcional)
 */
async function replaceText(inputPath, searchValue, replaceValue, outputPath = null) {
    if (!outputPath) {
        // Generar nombre por defecto si no se especifica
        const dir = path.dirname(inputPath);
        const name = path.basename(inputPath, path.extname(inputPath));
        outputPath = path.join(dir, `${name}_REPLACED.docx`);
    }

    let workPath = outputPath;
    if (inputPath !== workPath) {
        fs.copyFileSync(inputPath, workPath);
    }

    // Normalizar ZIP antes de procesar
    try {
        const baseDir = path.dirname(workPath);
        const randId = Date.now() + '_' + Math.floor(Math.random() * 1000);
        const zipTmpPath = path.join(baseDir, `repair_r_${randId}.zip`);
        const zipInPath = path.join(baseDir, `rin_${randId}.zip`);
        fs.copyFileSync(workPath, zipInPath);
        const tempUnzip = path.join(baseDir, `_tmp_rep_${randId}`);
        const psCmd = `powershell -Command "Expand-Archive -Path '${zipInPath}' -DestinationPath '${tempUnzip}' -Force; Compress-Archive -Path '${tempUnzip}/*' -DestinationPath '${zipTmpPath}' -Force; Remove-Item -Path '${tempUnzip}' -Recurse -Force; Remove-Item -Path '${zipInPath}' -Force"`;
        require('child_process').execSync(psCmd);
        if (fs.existsSync(zipTmpPath)) {
            fs.copyFileSync(zipTmpPath, workPath);
            fs.unlinkSync(zipTmpPath);
        }
    } catch (e) { /* silent fail */ }

    try {
        const zip = new AdmZip(fs.readFileSync(workPath));
        let modifiedCount = 0;

        // Archivos XML a procesar
        const targetPatterns = [
            'word/document.xml',       // Cuerpo (standard)
            'word\\document.xml',      // Cuerpo (powershell zip)
            /^word[\\\/]header\d+\.xml$/,  // Encabezados
            /^word[\\\/]footer\d+\.xml$/   // Pies de página
        ];

        const entries = zip.getEntries();
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Preparar Regex para búsqueda global e insensible a mayúsculas
        let searchRegex;
        if (searchValue instanceof RegExp) {
            searchRegex = searchValue;
        } else {
            searchRegex = new RegExp(escapeRegExp(searchValue), 'gi'); // Case insensitive global
        }

        entries.forEach(entry => {
            let isTarget = false;
            for (const pattern of targetPatterns) {
                if (pattern instanceof RegExp) {
                    if (pattern.test(entry.entryName)) isTarget = true;
                } else {
                    if (entry.entryName === pattern) isTarget = true;
                }
            }

            if (isTarget) {
                let content = entry.getData().toString('utf8');
                // Buscar si hay coincidencias
                if (searchRegex.test(content)) {
                    // Reemplazo
                    const newContent = content.replace(searchRegex, replaceValue);
                    zip.updateFile(entry.entryName, Buffer.from(newContent, 'utf8'));
                    modifiedCount++;
                }
            }
        });

        if (modifiedCount > 0) {
            fs.writeFileSync(outputPath, zip.toBuffer());
            return { success: true, modified: true, outputPath, matches: modifiedCount };
        } else {
            // Si no hubo cambios, copiar el archivo original al destino
            if (inputPath !== outputPath) {
                // Escribir buffer para asegurar seguridad in situ
                fs.writeFileSync(outputPath, zip.toBuffer());
            }
            return { success: true, modified: false, outputPath, matches: 0 };
        }

    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Elimina completamente encabezados y pies de página (útil para quitar marcas de agua/logos)
 * @param {string} inputPath 
 * @param {string} outputPath 
 */
async function removeHeaders(inputPath, outputPath = null) {
    if (!outputPath) {
        const dir = path.dirname(inputPath);
        const name = path.basename(inputPath, path.extname(inputPath));
        outputPath = path.join(dir, `${name}_NO_HEADERS.docx`);
    }

    try {
        const zip = new AdmZip(fs.readFileSync(inputPath));
        const entries = zip.getEntries();
        let modified = false;

        // XML vacío válido para header/footer
        const emptyXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="Header"/></w:pPr></w:p></w:hdr>';
        const emptyFooterXML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="Footer"/></w:pPr></w:p></w:ftr>';

        // Imagen 1x1 pixel PNG transparente y vacía para destruir logos sin corromper el zip
        const emptyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

        entries.forEach(entry => {
            const name = entry.entryName;

            // Detectar y vaciar headers
            if (/^word[\\\/]header\d+\.xml$/.test(name)) {
                zip.updateFile(name, Buffer.from(emptyXML, 'utf8'));
                modified = true;
            }
            // Detectar y vaciar footers
            if (/^word[\\\/]footer\d+\.xml$/.test(name)) {
                zip.updateFile(name, Buffer.from(emptyFooterXML, 'utf8'));
                modified = true;
            }
        });

        fs.writeFileSync(outputPath, zip.toBuffer());
        return { success: true, modified: modified, outputPath };

    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = {
    analyzeMetadata,
    cleanDeep,
    cleanFileName,
    replaceText,
    removeHeaders
};

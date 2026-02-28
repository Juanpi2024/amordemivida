# DOC Legacy Cleaner Skill

## Metadata

```yaml
name: doc-legacy-cleaner
description: >
  Converts old binary .DOC files (Word 97-2003) to .docx using LibreOffice, then applies
  the full cleaning pipeline (metadata removal, header/footer deletion, text replacement).
  Extends docx-cleaner pipeline to support legacy document formats.
```

---

## ¿Por qué existe este Skill?

Los archivos `.DOC` son formato binario propietario (OLE2 Compound Document). A diferencia de `.docx`, **no son XML interno comprimido**, por lo que herramientas como `adm-zip` no pueden abrirlos para modificar encabezados, metadatos ni texto.

**Solución:** Usar **LibreOffice en modo headless** para convertir `.DOC` → `.docx`, y luego aplicar el pipeline existente (`cleanDeep` + `removeHeaders` + `replaceText`).

---

## Requisitos

### 1. LibreOffice instalado

LibreOffice debe estar instalado en el sistema. Descarga gratuita en: <https://www.libreoffice.org/download/download/>

**Ruta típica en Windows:**

```
C:\Program Files\LibreOffice\program\soffice.exe
```

**Verificar instalación:**

```powershell
& "C:\Program Files\LibreOffice\program\soffice.exe" --version
```

### 2. Módulo Node.js `docx-cleaner.js`

El skill depende del módulo existente en:

```
agents/limpieza_datos/modules/docx-cleaner.js
```

---

## Función Principal: `convertAndCleanDoc`

El skill provee la función `convertAndCleanDoc` en el módulo helper `doc-converter.js`.

### Lógica del proceso

```
1. Recibir ruta de archivo .DOC
2. Ejecutar LibreOffice headless → convierte .DOC a .docx (carpeta temp)
3. Aplicar cleanDeep()    → elimina metadatos (autor, empresa, revisiones)
4. Aplicar removeHeaders() → elimina encabezados/pies de página (logotipos, "mi aula")
5. Aplicar replaceText()   → reemplaza texto en el cuerpo ("mi aula" → "mi drive")
6. Retornar ruta del archivo .docx limpio listo para publicar
```

---

## Integración en Scripts de Publicación

### Importación

```js
const { convertAndCleanDoc } = require('../../limpieza_datos/skills/doc-legacy-cleaner/doc-converter');
```

### Uso dentro del loop de publicación

```js
// Detectar si es .DOC o .DOCX y limpiar apropiadamente
let finalUploadPath = null;

const ext = path.extname(item.path).toLowerCase();

if (ext === '.docx') {
    // Pipeline directo para DOCX modernos
    const metaResult = await cleanDeep(item.path, cleanedPath);
    if (metaResult.success) {
        await removeHeaders(cleanedPath, cleanedPath);
        await replaceText(cleanedPath, /mi aula/gi, 'mi drive', cleanedPath);
        finalUploadPath = cleanedPath;
    }
} else if (ext === '.doc') {
    // Pipeline extendido para DOC legacy via LibreOffice
    const result = await convertAndCleanDoc(item.path, tempDir);
    if (result.success) {
        finalUploadPath = result.outputPath;
    }
}

if (!finalUploadPath) {
    console.error(`🛑 No se pudo limpiar ${item.name}. Omitiendo publicación.`);
    continue;
}
```

---

## Notas de Fidelidad

- LibreOffice hace una conversión **muy fiel** al original. Tablas, imágenes, formatos y texto se conservan.
- La conversión puede tardar **2-5 segundos** por archivo dependiendo del tamaño.
- Los encabezados con **imágenes** (logos, marcas de agua como "mi aula") se eliminan completamente con `removeHeaders()`, que vacía los XML de `header*.xml` dentro del docx resultante.
- Los archivos `.DOC` **protegidos con contraseña** no pueden ser convertidos y devolverán error.

---

## Troubleshooting

| Problema | Causa | Solución |
|---|---|---|
| `soffice` no encontrado | LibreOffice no instalado o path incorrecto | Instalar LibreOffice y verificar la ruta en `doc-converter.js` |
| Timeout en conversión | Archivo muy grande o LibreOffice colgado | Aumentar `timeout` en `spawnSync` (default: 30s) |
| Archivo protegido con contraseña | DOC tiene restricción de acceso | Abrirlo manualmente en Word, guardar sin contraseña, y re-intentar |
| Formato visual diferente al original | Limitación de compatibilidad LibreOffice | Revisión manual del archivo convertido |

---

## Ejemplo de Salida

```
🔄 Convirtiendo DOC → DOCX: PLANIFICACION_CLASE_A_CLASE__MARZO.DOC
   ✅ Convertido en 2.3s → /temp/PLANIFICACION...LIMPIO.docx
   💣 Eliminando Headers y Footers...
      ✅ Headers eliminados (imágenes y texto de "mi aula" removidos).
   ✅ Texto del cuerpo revisado. (3 reemplazos de "mi aula" → "mi drive")
```

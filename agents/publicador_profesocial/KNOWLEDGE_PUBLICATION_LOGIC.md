# Soluciones Técnicas para Publicación y Documentos (ProfeSocial)

## 1. Problema de Publicaciones en Blanco (Redirect Race Condition)

**Contexto**: Al subir archivos en Profe.Social, el sistema redirige de `/posts/new` a `/posts/ID/edit`.
**Falla**: Si el script llena el título y descripción *antes* de la redirección, Profe.Social a veces guarda el post vacío o los datos se pierden durante el salto.
**Solución ("Upload-First Flow")**:

1. Ir a `/posts/new`.
2. Subir el archivo inmediatamente al input.
3. Esperar la redirección usando `page.waitForURL(/\/posts\/\d+\/edit/)`.
4. Solo entonces llenar el Título (`#post_title`), Descripción (`trix-editor`) y Tags.
5. Este orden garantiza que los datos se guarden correctamente en el registro persistente del post.

## 2. Reparación de Archivos DOCX Corruptos (No descriptor present)

**Contexto**: `adm-zip` arroja el error `ADM-ZIP: No descriptor present` frecuentemente con archivos generados por LibreOffice o convertidores online.
**Solución**: Normalizar el ZIP usando PowerShell antes de procesarlo en Node.js.
**Código Sugerido**:

```javascript
const psCmd = `powershell -Command "Expand-Archive -Path '${input}' -DestinationPath '${temp}' -Force; Compress-Archive -Path '${temp}/*' -DestinationPath '${output}.zip' -Force; Move-Item -Path '${output}.zip' -Destination '${output}' -Force"`;
```

*Nota: PowerShell solo comprime a `.zip`, por lo que hay que renombrar el resultado a `.docx` después.*

## 3. Corrección de Texto Invisible (Letra Blanca)

**Contexto**: Al eliminar imágenes de fondo o "watermarks", el texto que era blanco (para ser legible sobre fondo oscuro) se vuelve invisible sobre el fondo blanco de Word.
**Solución**: El módulo `docx-cleaner.js` debe iterar sobre **todos** los archivos XML (`word/document.xml`, `word/styles.xml`, `word/theme/theme1.xml`, etc.) y reemplazar:

- `w:val="FFFFFF"` -> `w:val="auto"`
- `w:themeColor="background1"` -> `w:themeColor="text1"`
- `w:shd w:fill="FFFFFF"` -> `w:shd w:fill="auto"`
- DrawingML y VML colors (`<a:srgbClr val="FFFFFF">`).

## 4. Iteración de Checkboxes en Playwright

**Error común**: Usar `page.$('input[type="checkbox"]')` solo devuelve el primero.
**Correcto**: Usar `page.$$('input[type="checkbox"]')` para obtener un array y recorrerlo con un `for...of` para marcar todos los términos y condiciones.

## 5. Validación Visual de Vista Previa (Crucial)

**Contexto**: Al subir un archivo, Profe.Social genera una miniatura/vista previa. Si se guarda el post antes de que esto cargue, el recurso aparece sin imagen en la galería, lo cual es inaceptable.
**Falla**: Guardar inmediatamente después de que el botón de publicar se habilite.
**Regla de Oro**:

1. Subir archivo.
2. Esperar a que el botón de publicar esté habilitado.
3. **VERIFICAR** visualmente (o esperar un tiempo prudencial adicional) que la vista previa del documento sea visible en el formulario.
4. **NUNCA** publicar si el recuadro de vista previa está en blanco o con error de carga.

# Estándar de Publicación y Limpieza de Archivos (Profe.Social)

Este documento define el **Estándar de Oro** para la preparación y publicación de documentos docentes, basado en las instrucciones del usuario para eliminar marcas de agua ("mi aula") y limpiar metadatos.

## 1. Proceso de Limpieza (Obligatorio)

Antes de subir CUALQUIER archivo `.docx` o `.doc` (que sea en realidad un ZIP/XML), se debe ejecutar el siguiente pipeline de limpieza:

### A. Limpieza de Metadatos (`cleanDeep`)

- Eliminar autores, creadores, compañías, managers.
- Borrar comentarios y revisiones.
- Eliminar macros y vbaProject.bin.
- Borrar miniaturas.

### B. Eliminación de Encabezados y Pies de Página (`removeHeaders`)

- **CRÍTICO**: Reemplazar todo el contenido de `word/header*.xml` y `word/footer*.xml` con XML vacío válido.
- Esto asegura la eliminación de logotipos, marcas de agua, y textos persistentes como "mi aula".

### C. Reemplazo de Texto en el Cuerpo (`replaceText`)

- Buscar cadenas específicas (ej: "mi aula") y reemplazarlas por la marca del usuario ("mi drive").
- Realizar esto SOBRE el archivo ya limpio de los pasos anteriores.

## 2. Automatización (Script Modelo)

El script de referencia es `publish_historia_complete.js` (o `publish_ingles_2d.js`).
Utiliza el módulo `docx-cleaner.js` que centraliza estas funciones.

## 3. Configuración de Publicación

- **Plataforma**: Profe.Social
- **Precios**: 6 ProfeCoins (Estándar mensual)
- **Edad**: 6-8 años (Segundo Básico)
- **Tipo**: "Lesson" (Clase a clase)
- **Descripción**: HTML enriquecido con listas y emojis.
- **Etiquetas**: Mínimo 8-10 etiquetas relevantes.
- **VISTA PREVIA**: **SIEMPRE** esperar a que aparezca la imagen de vista previa del documento antes de hacer clic en "Publicar". Una publicación sin vista previa se considera defectuosa.

---
*Este estándar debe aplicarse a todas las futuras asignaturas.*

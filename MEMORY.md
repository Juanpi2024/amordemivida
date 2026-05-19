# Memoria a Largo Plazo - Proyecto ProfeSocial

### Modelo de Trabajo para Publicación de Evaluaciones

1. **Limpieza y Unificación (Pre-requisito)**:
   - Todo archivo debe pasar por `evaluaciones_unificadas.js` para eliminar metadatos, logos y datos sensibles (versión `_LIMPIA.docx`).
   - Si existiera una pauta de corrección o solucionario, se debe fusionar y estructurar el contenido con GPT-4o-mini (versión `_UNIFICADA.docx`).

2. **Mapeo de Atributos**:
   - Para cada publicación pendiente, el agente debe generar un mapeo cruzando el archivo localizado en `ESCRITORIO TRABAJO 2023` con la carpeta de salidos limpios (`temp_cleaned`).
   - **Es mandatorio** extraer y asignar al archivo:
     1. El tipo de instrumento (Ej. Prueba, Guía, Control).
     2. Asignatura Correspondiente.
     3. Nivel Escolar (Ej. 1ro Medio, 4to Medio).
     4. Unidad especificada (Unidad 1, Unidad 2, etc, a partir de la ruta).
     5. Temática tratada o Título (analizado o extraído de forma programática).

3. **Inyección en Formulario y Automatización (Profe.Social)**:
   - Toda evaluación debe publicarse exclusivamente a través de la categoría de recurso '**Evaluación**' del dropdown. (En el pasado, era Prueba/Examen).
   - El modelo de automatización usa Puppeteer/Playwright para recorrer este mapeo y automatizar cada campo con pausas de sincronización robustas de al menos 3 a 5 segundos de espera post-login (`.keyboard.press('Enter')`).
   - El precio estandarizado para pruebas y evaluaciones preparadas de forma integral es de **6 ProfeCoins**.
   - Los **Tags/etiquetas** son vitales: Deben incluir siempre la Asignatura, Unidad, Nivel, y "Evaluación".

### Iniciativa: Competencias para el Futuro (Mayo 2026)

1. **Objetivo**: Crear una base de datos de "Blueprints" (proyectos base) altamente estéticos y funcionales que puedan ser modificados rápidamente mediante prompts.
2. **Ubicación**: `d:\antigravity\clawd\competencias para el futuro`.
3. **Ejes de Desarrollo**:
   - **Dashboards Premium**: Bases en React/HTML para visualización de datos educativos.
   - **Scrapers Modulares**: Para extracción de datos en sitios de transparencia y Mercado Público.
   - **Generadores Pedagógicos**: Automatización de documentos y materiales para ProfeSocial.
4. **Metodología**: Utilizar estos esqueletos para reducir el tiempo de desarrollo de 10 a 1, manteniendo una calidad visual superior que "asombre" al usuario final.

### Pendiente Inmediato (Próxima Sesión):
- Seguir aplicando este modelo sistemáticamente a las evaluaciones del resto de los niveles que ya se encuentran limpios en el directorio de `limpieza_datos/temp_cleaned`.
- Poblar la carpeta de `blueprints` con una base de **"Proyecto Ganador"** para postulaciones de fondos públicos.
- Prioridades esperadas: **Ciencias** e **Historia**.

### Actualizaciones de Infraestructura (Mayo 2026):
- **Protocolos CEIA:** Se completó la migración a un diseño de **"Documento Continuo"** en colaboración con el agente Jules. Se eliminó la navegación por baldosas para dar prioridad a la legibilidad legal y normativa.
- **Misión Tierra:** Se completó el pulido premium de la app didáctica utilizando GSAP y principios de "Antigravity Design". Repositorio Git local inicializado. Listo para despliegue en Vercel.

### Nueva Línea de Producto: Aplicaciones "Érase una vez..." (PREMIUM)
- **Concepto**: Desarrollar aplicaciones web educativas inmersivas que simulen el formato del clásico programa de TV "Érase una vez... (el cuerpo humano, el espacio)".
- **Mecánica**: El alumno "viaja por el contenido" como si fuera una nave explorando el cuerpo, el espacio o la historia.
- **Agente Especialista**: Se ha creado un agente dedicado llamado **Leo** (ubicado en `agents/erase_una_vez_leo/`) encargado de diseñar interfaces narrativas, interacciones gamificadas y el "storytelling" interactivo de estas misiones.
- **Plan Premium Completo**: Documentado en `agents/erase_una_vez_leo/PLAN_PREMIUM.md`.
- **Características Premium**:
  - Videos YouTube curados por estación (máx 5 min, canales educativos verificados, cargados con `lite-youtube-embed`)
  - Motor de 6 tipos de minijuegos (quiz, drag&drop, memory, secuencia, V/F, mapas SVG interactivos)
  - Mapa de viaje con estaciones desbloqueables (ciclo: Video → Material → Desafío)
  - Sistema de XP, rangos (Cadete → Comandante Estelar) y diplomas digitales personalizados
  - Monetización vía ProfeSocial (8-12 ProfeCoins por app) y acceso directo en Vercel
- **Primera app completada**: Misión Tierra (Geografía 3ro Básico, personalizada para Juanpi)
- **Próximas prioridades**: Cuerpo Humano (4to Básico), Historia de Chile Colonial (5to Básico)

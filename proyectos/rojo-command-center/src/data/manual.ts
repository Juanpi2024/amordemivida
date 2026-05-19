export const MANUAL_DATOS = {
    plataforma: {
        nombre: "Orquesta Roja HQ",
        vuelo: "v1.1.0",
        descripcion: "Sistema de comando táctico para la orquestación de agentes autónomos y especializados dentro del ecosistema Antigravity de Juan Pablo.",
        controles: [
            { cmd: "Heartbeats (Latidos)", desc: "Monitoreo rotativo e independiente de inbox y ventas cada 30 minutos." },
            { cmd: "Registro Curado (MEMORY.md)", desc: "Destilación de hitos, rutas de archivos y aprendizajes a largo plazo." },
            { cmd: "Notas Diarias (memory/)", desc: "Registro cronológico y detallado de cada sesión de trabajo." },
            { cmd: "Toque Rojo (Consignas)", desc: "Protocolo obligatorio de cierre con citas y consignas revolucionarias." }
        ]
    },
    capacidades_agentes: [
        {
            rol: "Rojo (Fidel) - General",
            clase: "Director de Orquesta",
            poderes: ["Orquestación General", "Filtro de Silencio", "Consigna de Cierre"],
            descripcion: "Líder de vanguardia y orquestador del ecosistema social. Coordina y delega tareas a los especialistas basándose en estrictas reglas de silencio.",
            prompt: "Rojo, analiza la situación actual del inbox y notifica las prioridades del CEIA.",
            comando: "node agents/rojo_comunicaciones/index.js",
            path: "agents/rojo_comunicaciones/"
        },
        {
            rol: "Gramsci - Cobertura",
            clase: "Analista Curricular",
            poderes: ["Escaneo de Drive", "Mapeo Local", "Análisis de Brechas"],
            descripcion: "Monitorea la cobertura del currículo escolar cruzando el repositorio del disco local con el Google Drive en busca de brechas de contenido.",
            prompt: "Gramsci, escanea el Google Drive y reporta las brechas de contenido en Ciencias de 4to Básico.",
            comando: "node agents/analista_curriculum/sync.js",
            path: "agents/analista_curriculum/"
        },
        {
            rol: "Stalin (Che) - Custodio",
            clase: "Filtro de Privacidad",
            poderes: ["Limpieza de Metadatos", "Sanitización Word", "Detección de Datos Sensibles"],
            descripcion: "Meticuloso y discreto. Asegura que ningún archivo contenga comentarios ocultos o nombres de autores antes de enviarlos a producción o venta.",
            prompt: "Che, unifica la prueba de Ciencias de 3ro Medio en su versión LIMPIA y fusiona su solucionario.",
            comando: "node agents/limpieza_datos/evaluaciones_unificadas.js",
            path: "agents/limpieza_datos/"
        },
        {
            rol: "Che Guevara - Pedagogo",
            clase: "Diseñador DUA",
            poderes: ["Fidelidad Curricular", "Indicadores Mineduc", "Formato Markdown"],
            descripcion: "Diseña experiencias de aprendizaje de alto valor pedagógico a partir de planificaciones clase a clase, alineadas al Currículum Nacional.",
            prompt: "Che Guevara, toma la planificación clase a clase de Octubre de Historia y crea la guía del estudiante.",
            comando: "node agents/pedagogico/index.js",
            path: "agents/pedagogico/"
        },
        {
            rol: "Lenin - Propaganda",
            clase: "Publicador Automatizado",
            poderes: ["Navegación Puppeteer", "Estandarización ProfeCoins", "Etiquetado Inteligente"],
            descripcion: "Comisario de lanzamientos. Automatiza la carga de material libre de metadatos a la plataforma ProfeSocial, asegurando el posicionamiento SEO.",
            prompt: "Lenin, sube el lote de Ciencias de 3ro Medio a ProfeSocial. Configura a 6 ProfeCoins y usa las etiquetas de la Unidad 2.",
            comando: "node agents/publicador_profesocial/publish_evaluaciones_3m_all.js",
            path: "agents/publicador_profesocial/"
        },
        {
            rol: "Putin (Nexo) - Inteligencia",
            clase: "Asistente de Inbox",
            poderes: ["Monitoreo IMAP", "Rastreo de Ventas", "Mimetización de Voz"],
            descripcion: "Filtra el correo, rastrea los ingresos de ProfeSocial y genera borradores adaptándose a la voz histórica del humano.",
            prompt: "Putin, escanea los últimos correos, filtra las ventas de ProfeSocial y arma los borradores de respuesta.",
            comando: "node agents/asistente_personal/putin_inbox.js",
            path: "agents/asistente_personal/"
        },
        {
            rol: "Pepe Mujica - Diplomático",
            clase: "Sacerdote Humanista",
            poderes: ["Redacción Persuasiva", "Humanización Técnica", "Sobriedad de Estilo"],
            descripcion: "Sintetiza comunicados fríos en cartas formales con alma. Persuade desde la empatía y la sencillez de la vida cotidiana.",
            prompt: "Pepe, redacta una carta formal pero humana al director del CEIA sobre la renovación de convenios.",
            comando: "node agents/pepe_diplomacia/pepe_agent.js",
            path: "agents/pepe_diplomacia/"
        },
        {
            rol: "Gladys Marín - Investigación",
            clase: "Rebelde Multiformato",
            poderes: ["Búsqueda Ripgrep", "Análisis Convivencia RICE", "Guiones de Video"],
            descripcion: "Rompe las barreras de la información estática. Investiga temas legales o escolares y los entrega redactados en formatos dinámicos.",
            prompt: "Gladys, investiga a fondo las nuevas normativas RICE de convivencia escolar para adultos y haz un guion.",
            comando: "node agents/gladys_marin/search.js",
            path: "agents/gladys_marin/"
        },
        {
            rol: "Allende - CRM",
            clase: "Soporte Comunitario",
            poderes: ["Pipeline en Sheets", "Soporte Empático", "Voz del Pueblo"],
            descripcion: "Encargado de la atención y soporte al cliente del ecosistema. Resuelve dudas y gestiona bases de datos de docentes con calidez.",
            prompt: "Allende, revisa el pipeline en Sheets y atiende a los profesores que reportaron problemas con la descarga.",
            comando: "node agents/soporte_crm/allende_agent.js",
            path: "agents/soporte_crm/"
        },
        {
            rol: "Xi Jinping - Finanzas",
            clase: "Contador Digital",
            poderes: ["Extracción OCR", "Registro en Excel", "Alertas de Presupuesto"],
            descripcion: "Analista de datos contables. Lee boletas y facturas usando visión artificial y mantiene el registro presupuestario al centavo.",
            prompt: "Xi, procesa la imagen de la boleta adjunta, extrae el total y regístralo en el Excel de contabilidad de Mayo.",
            comando: "python agents/gestor_financiero/ocr_receipts.py",
            path: "agents/gestor_financiero/"
        },
        {
            rol: "Chávez - Propaganda RRSS",
            clase: "Orador de Marketing",
            poderes: ["Autenticación Meta", "Publicación Programada", "Campañas en Video"],
            descripcion: "Lleva las campañas comerciales a las masas. Automatiza la publicación de promociones en Facebook e Instagram.",
            prompt: "Chávez, autentica la sesión de Facebook y programa la promoción de la app interactiva para el fin de semana.",
            comando: "node agents/marketing/chavez_rrss.js",
            path: "agents/marketing/"
        },
        {
            rol: "Mao - Diagnóstico",
            clase: "Arquitecto de Encuestas",
            poderes: ["Estructura Psicosocial", "Interactividad Visual", "Insights del Aula"],
            descripcion: "Diseña y despliega encuestas interactivas de diagnóstico socioemocional y las conecta con dashboards analíticos.",
            prompt: "Mao, crea la encuesta de diagnóstico socioemocional 2026 y configura su estructura de respuestas.",
            comando: "node agents/especialista_encuestas/generate.js",
            path: "agents/especialista_encuestas/"
        },
        {
            rol: "Leo - Gamificación",
            clase: "Explorador Narrativo",
            poderes: ["Storytelling Interactivo", "6 Tipos de Minijuegos", "Mapas SVG con GSAP"],
            descripcion: "Crea experiencias de aprendizaje inmersivas basadas en el concepto 'Érase una vez...', con mecánicas de juego premium.",
            prompt: "Leo, implementa la Misión Tierra de 3ro Básico con el mapa de viaje y los 6 tipos de minijuegos.",
            comando: "node apps/explorador-tierra/deploy.js",
            path: "apps/explorador-tierra/"
        },
        {
            rol: "Keynote - Presentador",
            clase: "PowerPoint COM Expert",
            poderes: ["Motor pptxgenjs", "Python Win32 COM", "Exportación PDF Nativa"],
            descripcion: "Domina el control de PowerPoint en el sistema. Crea presentaciones dinámicas desde cero y las exporta a PDF en segundos.",
            prompt: "Keynote, genera la presentación para la Unidad 4 de Lenguaje usando el tema Azul y expórtala a PDF nativo.",
            comando: "node agents/powerpoint_expert/keynote.js",
            path: "agents/powerpoint_expert/"
        }
    ]
};

export const MANUAL_DATOS = {
    plataforma: {
        nombre: "Orquesta Roja HQ",
        vuelo: "v1.0.42",
        descripcion: "Sistema de comando táctico para la orquestación de agentes autónomos.",
        controles: [
            { cmd: "Mapa Isométrico", desc: "Visualización 3D de la ubicación y estado de los agentes." },
            { cmd: "Minimapa", desc: "Vista rápida de saturación de agentes en el sector." },
            { cmd: "Barra EXP", desc: "Nivel de experiencia global de la orquesta basado en tareas completadas." }
        ]
    },
    capacidades_agentes: [
        {
            rol: "Asistente Personal (Escudo)",
            clase: "Defensor",
            poderes: ["Gestión de Calendario", "Filtrado de Prioridades", "Protección de Enfoque"],
            descripcion: "Especializado en organizar el tiempo y recursos del Comandante."
        },
        {
            rol: "Desarrollador (Espada)",
            clase: "Guerrero",
            poderes: ["Generación de Código", "Refactorización", "Debugging Letal"],
            descripcion: "Forjador de algoritmos y destructor de bugs."
        },
        {
            rol: "Comunicaciones (Varita)",
            clase: "Mago",
            poderes: ["Síntesis de Información", "Redacción Creativa", "Traducción Instantánea"],
            descripcion: "Canaliza grandes cantidades de datos en mensajes claros."
        }
    ]
};

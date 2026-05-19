const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env') });

class AntonioGramsci {
    constructor() {
        this.name = "Antonio Gramsci";
        // Rotamos a la siguiente llave (8) porque la 7 alcanzó su límite de cuota
        const apiKey = process.env.GEMINI_KEY_8 || process.env.GEMINI_KEY_9 || process.env.GEMINI_KEY_7;
        if (!apiKey) {
            console.error("❌ Falta la llave de Gemini en rojo_comunicaciones/.env");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        // gemini-2.0-flash está disponible y gratis en las nuevas llaves
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 20,
            }
        });
    }

    async analizarUnidadCurricular(curso, asignatura, filename, retries = 3) {
        const promptTemplate = `
Eres un analista experto en el Currículum Nacional de Educación Básica y Media de Chile.
Tu tarea es clasificar archivos educativos sueltos, enviándolos a la Unidad temática que estrictamente corresponda según el Ministerio de Educación chileno.

Contexto del archivo a clasificar:
Nivel/Curso: ${curso}
Asignatura: ${asignatura}
Nombre del archivo de contenido: "${filename}"

Basado en el currículum de ese curso, ese contenido/título pertenece a:
¿Unidad 1, Unidad 2, Unidad 3 o Unidad 4? Si trata de lectura transversal en clases de lenguaje o no tiene un eje claro, responde "PLAN LECTOR" o "GENERAL" o "EVALUACIONES".

IMPORTANTE: TU RESPUESTA DEBE SER EXACTAMENTE UNA DE ESTAS CADENAS Y NADA MÁS:
"UNIDAD 1"
"UNIDAD 2"
"UNIDAD 3"
"UNIDAD 4"
"PLAN LECTOR"
"EVALUACIONES"
"GENERAL"

Ejemplo 1 de respuesta: UNIDAD 1
Ejemplo 2 de respuesta: PLAN LECTOR
Ejemplo 3 de respuesta: UNIDAD 2`;

        try {
            const result = await this.model.generateContent(promptTemplate);
            const responseText = result.response.text();
            const respuestaIA = responseText.trim().toUpperCase();
            
            // Validar salida estricta
            const permitidas = ["UNIDAD 1", "UNIDAD 2", "UNIDAD 3", "UNIDAD 4", "PLAN LECTOR", "EVALUACIONES", "GENERAL"];
            
            for (const p of permitidas) {
                if (respuestaIA.includes(p)) return p;
            }

            return "GENERAL"; // Solo si la IA misma no dio una respuesta clara
        } catch (error) {
            // Manejo de Rate Limit (429) o errores temporales
            if (retries > 0 && (error.message.includes('429') || error.message.includes('exhausted'))) {
                console.warn(`\n⚠️ Límite alcanzado para: ${filename.slice(0,20)}. Reintentando en 15s... (${retries} restantes)`);
                await new Promise(resolve => setTimeout(resolve, 15000));
                return this.analizarUnidadCurricular(curso, asignatura, filename, retries - 1);
            }

            console.error(`\n🧠 [${this.name}] ERROR CRÍTICO para ${filename}:`, error.message);
            throw error; // Lanzamos el error para que el proceso se detenga y no llene de "GENERAL" las carpetas
        }
    }
}

module.exports = AntonioGramsci;

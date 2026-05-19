require('dotenv').config({ path: require('path').join(__dirname, '../rojo_comunicaciones/.env') });
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Lenin - Especialista en Redacción y Difusión Revolucionaria
 */
class LeninRedactor {
    async generarMetadatos(tema) {
        console.log(`🚩 [Lenin] Redactando metadatos estratégicos para: ${tema}...`);

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `Eres Lenin, un experto en marketing educativo y redacción persuasiva. 
                        Tu misión es crear metadatos para un recurso en ProfeSocial que capten la atención y demuestren valor pedagógico.
                        REGLAS CRÍTICAS:
                        1. La descripción debe tener entre 200 y 400 caracteres.
                        2. NUNCA menciones que el archivo está "limpio de metadatos" o "sin logos comerciales". 
                        3. Enfócate en los beneficios pedagógicos, la calidad del contenido y la facilidad de uso.
                        4. Usa un tono profesional pero entusiasta e INCLUYE EMOJIS (como 📝, ✅, ⭐, 📚) para que sea visualmente atractivo.
                        5. ASEGÚRATE de mencionar explícitamente a qué UNIDAD pertenece el material en la descripción.
                        Formato de salida: JSON con {titulo, descripcionHTML, etiquetas (array), precio_sugerido}.`
                    },
                    { role: 'user', content: `Crea los metadatos para un material de evaluación para el curso ${tema.curso}, asignatura ${tema.asignatura}, unidad ${tema.unidad}. Tema específico: ${tema.tema}` }
                ],
                response_format: { type: "json_object" }
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error("❌ Error en redacción IA:", error);
            return null;
        }
    }
}

module.exports = LeninRedactor;

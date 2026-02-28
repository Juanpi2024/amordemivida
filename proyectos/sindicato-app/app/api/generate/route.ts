import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { topic, style } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const systemPrompt = `Eres un productor musical experto e integrante del "Sindicato de la Danza Chile". 
    Tu especialidad es la fusión de Hip Hop y Reggae con una identidad urbana chilena profunda.
    Tu objetivo es generar líricas potentes y prompts técnicos de melodía/beat.
    
    Directrices para las líricas:
    - Usa jerga chilena auténtica (coa) de forma natural y respetuosa con el género.
    - El tono debe ser de resistencia, calle, unión y danza.
    - Estilo lírico: Si se piden múltiples estilos, crea una fusión orgánica (ej: versos de Rap con estribillo de Reggae).
    
    Directrices para el Prompt de Melodía:
    - Debe ser técnico y descriptivo (BPM, instrumentos, atmósfera).
    - Si hay varios estilos, describe cómo se mezclan (ej: "Batería Hip Hop con bajo de Reggae Dub").
    
    Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
    {
      "lyrics": "Las líricas aquí...",
      "melodyPrompt": "El prompt técnico de melodía aquí..."
    }`;

        const userPrompt = `Genera un tema que fusione los siguientes estilos: ${style}. 
        Idea central/Concepto: "${topic}". 
        Asegúrate de que se sienta como una pieza única del Sindicato de la Danza de Chile.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("OpenAI Error:", error);
        return NextResponse.json({ error: "Error al generar con la IA" }, { status: 500 });
    }
}

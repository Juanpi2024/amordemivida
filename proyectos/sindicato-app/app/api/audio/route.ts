import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Usando Gemini 3 Flash Preview, confirmado como el modelo disponible para esta API Key
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const systemInstruction = `Eres un motor de generación musical especializado en Chile y Google Labs.
        Tu tarea es recibir un "Melody Prompt" técnico y expandirlo a una estructura rítmica y armónica completa.
        Por ahora, genera una descripción detallada de cómo sonaría este beat paso a paso.
        (En el futuro, esta API conectará directamente con Lyria para generar el archivo de audio).`;

        const result = await model.generateContent([
            systemInstruction,
            `Genera la estructura musical para: ${prompt}`
        ]);

        const text = result.response.text();

        const lowerPrompt = prompt.toLowerCase();
        let audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"; // Default urban beat

        if (lowerPrompt.includes("hip hop")) audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        if (lowerPrompt.includes("reggae")) audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
        if (lowerPrompt.includes("dancehall")) audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3";

        return NextResponse.json({
            audioDescription: text,
            audioUrl: audioUrl
        });
    } catch (error: any) {
        console.error("Gemini Error Details:", {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return NextResponse.json({
            error: "Error en la generación de audio",
            details: error.message
        }, { status: 500 });
    }
}

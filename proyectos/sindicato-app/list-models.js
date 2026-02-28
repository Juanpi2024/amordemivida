const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const key = "AIzaSyBVU4yAx1fcjwxdW0FJAcJ8A83QSMPzJ-I";
    try {
        const genAI = new GoogleGenerativeAI(key);
        // El SDK de Node.js no tiene un método directo listModels expuesto así de simple en versiones viejas
        // Pero podemos intentar instanciar uno genérico
        console.log("Intentando listar modelos via fetch manual o similar...");
        // Usaremos el endpoint oficial para ver si la key es válida
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log("MODELS:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("FAILURE:", error.message);
    }
}

listModels();

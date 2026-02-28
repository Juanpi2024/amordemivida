const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
    const key = "AIzaSyBVU4yAx1fcjwxdW0FJAcJ8A83QSMPzJ-I";
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const result = await model.generateContent("Hola, genera un beat de prueba.");
        console.log("SUCCESS:", result.response.text());
    } catch (error) {
        console.error("FAILURE:", error.message);
    }
}

testKey();

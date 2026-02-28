const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const qrcode = require('qrcode');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const ElevenLabs = require('elevenlabs-node');
const { buscarContactos, syncWhatsAppContacts } = require('./contacts_manager');
require('dotenv').config();

process.on('uncaughtException', (err) => {
    console.error('❌ CRASH DETECTADO EN ROJO:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ PROMESA RECHAZADA SIN MANEJO:', reason);
});

console.log('🚀 Iniciando Agente Rojo (index.js)...');

// 1. Configurar OpenAI (Motor Principal)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// 2. Configurar Voz
// 2. Configurar Voz (Usaremos OpenAI TTS ahora, así que siempre activo si hay OpenAI Key)
const voiceEnabled = !!process.env.OPENAI_API_KEY;

// 3. Configurar WhatsApp Client
console.log('⏳ Inicializando motor WhatsApp...');
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 120000
    }
});

// --- MOTOR GEMINI (CUARTEL GENERAL) CON ROTACIÓN ---
const geminiKeys = [
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4,
    process.env.GEMINI_KEY_5,
    process.env.GEMINI_KEY_6
].filter(k => k && !k.startsWith('#'));

let currentKeyIndex = 0;
let lastBotMessageTime = 0;
let botMessageCount = 0;

async function generarRespuestaGemini(history, retryCount = 0) {
    if (retryCount >= geminiKeys.length) {
        console.log("⚠️ Todas las llaves Gemini fallaron. Usando OpenAI como respaldo físico.");
        return null;
    }

    const apiKey = geminiKeys[currentKeyIndex];
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        // Convertir historial formato OpenAI a Gemini
        const contents = history.map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
        }));

        const result = await model.generateContent({ contents });
        return result.response.text();
    } catch (error) {
        console.error(`❌ Error con Gemini Key ${currentKeyIndex + 1}:`, error.message);
        currentKeyIndex = (currentKeyIndex + 1) % geminiKeys.length;
        return generarRespuestaGemini(history, retryCount + 1);
    }
}

// --- MOTOR DE VOZ (OPENAI TTS) ---
async function generarRespuestaVoz(texto) {
    if (!voiceEnabled) return null;
    try {
        console.log('🎤 Generando audio con OpenAI TTS...');
        const fileName = `res_audio_${Date.now()}.mp3`;
        const filePath = path.join(__dirname, 'temp_audio', fileName);

        // Asegurar que existe el directorio (recursive: true es más seguro)
        if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "onyx", // Voces: alloy, echo, fable, onyx, nova, shimmer
            input: texto,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.promises.writeFile(filePath, buffer);

        console.log(`✅ Audio generado exitosamente: ${filePath}`);

        // Actualizar contadores del Circuit Breaker
        lastBotMessageTime = Date.now();
        botMessageCount++;

        return filePath;
    } catch (error) {
        console.error("❌ Error generando voz OpenAI:", error);
        return null; // Fallback a solo texto sin crashear
    }
}



const ROJO_SYSTEM_PROMPT = `Eres ROJO, Comandante de Comunicaciones y Director de Orquesta de Juan Pablo.

Tienes CAPACIDAD DE VOZ (OpenAI TTS):
- Si el usuario pide 'audio', 'voz', 'escucharte' o 'habla', O el usuario te envía un mensaje de voz, TU RESPUESTA TAMBIÉN SERÁ DE VOZ.
- NUNCA digas "no puedo enviar audio" o "no tengo capacidades de voz".

REGLAS DE RESPUESTA:
1. WHATSAPP: Sé ULTRA CONCISO (Máximo 2 líneas). Solo confirma la acción.
2. COMANDO EXEC: Aquí es donde va el TRABAJO REAL. Si envías un correo, el parámetro "mensaje" debe ser EXTENSO, DETALLADO y COMPLETO.
3. No uses el símbolo "|" dentro del texto del mensaje del comando EXEC, ya que es el separador de parámetros. Use comas o puntos.
4. Si el usuario pide el "detalle de los agentes", utiliza la siguiente información:

DETAGENTES DISPONIBLES (La Orquesta):
- gladys: Investigadora (research).
- lenin: Publicador ProfeSocial (publish).
- che: Pedagogo/Guías (crearGuia).
- putin: Email y Contactos (send, read_inbox).
  * Acciones: 
    - read_inbox: Revisa los últimos correos.
    - send|contacto|asunto|mensaje: Envía correo a un contacto.
- allende: CRM y Gestión Social (gestionar).
- xi: Finanzas y Auditoría (auditar).
- chavez: Marketing y Estrategia (crearCampaña).
- stalin: Limpieza de Datos y Archivos (clean).
- gramsci: Analista de Curriculum (analizar).
- pepe: Diplomacia y Síntesis (synthesize).
- korda: Fotógrafo y Visión (organizar|<ruta_origen>|<ruta_destino>).

DIRECTIVA PRIME: Si el usuario pide una acción (ej: enviar correo), DEBES USAR [[EXEC:agente|acción|parámetros]] con datos REALES.
   - CORRECTO (WA): "Entendido. Enviando detalle... [[EXEC:putin|send|mi|Detalle Agentes|Aquí tienes el detalle: 1. Gladys: Búsqueda... 2. Lenin: Publicador... (y seguir con todos)]]"

AGENTES Y ACCIONES:
- putin: send_report|contacto (Usa esto para enviar el detalle completo de los agentes).
- putin: send|contacto|asunto|mensaje (Mensajes personalizados).
- putin: read_inbox`;

const chatHistory = {};

async function activarAgente(messageObj, agentLine) {
    const [agent, action, ...paramsParts] = agentLine.split('|');

    // PROTECCIÓN CONTRA PLACEHOLDERS LITERALES
    const placeholders = ['destinatario', 'asunto', 'mensaje', 'contacto'];
    const hasPlaceholders = paramsParts.some(p => placeholders.includes(p.toLowerCase()));

    if (hasPlaceholders) {
        console.error(`❌ [ORQUESTADOR] Error: Se detectaron placeholders literales en el comando: ${agentLine}`);
        await messageObj.reply('⚠️ Error: Comando incompleto. Por favor, especifica destinatario, asunto y mensaje real.');
        return;
    }

    // Construir string de argumentos: cada parte entre comillas para manejar espacios
    const args = paramsParts.map(p => `"${p.replace(/"/g, '\\"')}"`).join(' ');

    console.log(`🚀 [ORQUESTADOR] Activando agente: ${agent} para acción: ${action}`);
    console.log(`   📝 Argumentos: ${args}`);

    let command = "";
    let cwd = "";
    let esperaRespuesta = false;

    switch (agent.toLowerCase()) {
        case 'gladys':
            command = `node agent.js ${args} "presentation"`;
            cwd = path.join(__dirname, '../gladys_marin');
            break;
        case 'lenin':
            command = `node profesocial_bot.js ${args}`;
            cwd = path.join(__dirname, '../publicador_profesocial');
            break;
        case 'che':
            command = `node index.js ${args}`;
            cwd = path.join(__dirname, '../pedagogico');
            break;
        case 'putin':
            cwd = path.join(__dirname, '../asistente_personal');
            if (action === 'read_inbox') {
                command = `node putin_agent.js read_inbox`;
                esperaRespuesta = true;
            } else if (action === 'send') {
                command = `node putin_agent.js send ${args}`;
            } else if (action === 'send_report') {
                command = `node putin_agent.js send_report ${args}`;
                esperaRespuesta = true;
            }
            break;
        case 'allende':
            command = `node allende_agent.js ${args}`;
            cwd = path.join(__dirname, '../soporte_crm');
            break;
        case 'xi':
            command = `node xi_agent.js ${args}`;
            cwd = path.join(__dirname, '../gestor_financiero');
            break;
        case 'chavez':
            command = `node chavez_agent.js ${args}`;
            cwd = path.join(__dirname, '../marketing');
            break;
        case 'stalin':
            if (action === 'sync_contacts') {
                console.log('🔄 Ejecutando sincronización de contactos vía Stalin...');
                const count = await syncWhatsAppContacts(client);
                return `✅ Sincronización completada. ${count} contactos actualizados en Rojo.`;
            }
            command = `node limpieza.js --clean ${args}`; // Asumimos limpieza por defecto si se invoca
            cwd = path.join(__dirname, '../limpieza_datos');
            break;
        case 'gramsci':
            command = `node gramsci_agent.js ${args}`;
            cwd = path.join(__dirname, '../analista_curriculum');
            break;
        case 'pepe':
            command = `node pepe_agent.js synthesize ${args}`;
            cwd = path.join(__dirname, '../pepe_diplomacia');
            esperaRespuesta = true;
            break;
        case 'korda':
            command = `node index.js ${args}`;
            cwd = path.join(__dirname, '../korda_fotografo');
            break;
    }

    if (command && cwd) {
        exec(command, { cwd }, async (err, stdout, stderr) => {
            if (err) {
                console.error(`❌ Error en ${agent}:`, err.message);
                return;
            }
            console.log(`✅ ${agent} finalizado.`);

            // Loguear siempre el output del agente para debugging
            if (stdout.trim()) console.log(`📄 Salida ${agent}: ${stdout.trim()}`);

            // Si el comando genera una respuesta que debe ir a WhatsApp (como read_inbox)
            if (esperaRespuesta && stdout) {
                await client.sendMessage(messageObj.from, `✅ *Informe de ${agent}:*\n\n${stdout}`);
            }
        });
    }
}

// --- FUNCIONES SENSORIALES (Audio y Visión) ---
async function procesarAudio(msg) {
    try {
        console.log('👂 [ROJO] Descargando nota de voz...');
        const media = await msg.downloadMedia();
        if (!media) throw new Error('No se pudo descargar el audio.');

        const buffer = Buffer.from(media.data, 'base64');
        const tempPath = path.join(__dirname, `temp_audio/audio_${Date.now()}.ogg`);

        if (!fs.existsSync(path.dirname(tempPath))) fs.mkdirSync(path.dirname(tempPath));
        fs.writeFileSync(tempPath, buffer);

        console.log('🎧 [ROJO] Transcribiendo con Whisper...');
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempPath),
            model: "whisper-1",
            language: "es" // Forzar español para mejor precisión
        });

        // Limpieza
        fs.unlinkSync(tempPath);

        console.log(`🗣️ [ROJO] Transcripción: "${transcription.text}"`);
        return transcription.text;
    } catch (error) {
        console.error('❌ Error en procesarAudio:', error);
        return null; // Fallback a texto vacío
    }
}

async function procesarImagen(msg) {
    try {
        console.log('👁️ [ROJO] Analizando imagen...');
        const media = await msg.downloadMedia();
        if (!media) throw new Error('No se pudo descargar la imagen.');

        // GPT-4o Vision acepta base64 directamente
        const base64Image = `data:${media.mimetype};base64,${media.data}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo", // O gpt-4o cuando esté disponible full
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analiza esta imagen y describe qué ves. Si hay texto, transcríbelo. Si parece un error, diagnostícalo. Sé conciso." },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ],
            max_tokens: 300
        });

        const analisis = response.choices[0].message.content;
        console.log(`👁️ [ROJO] Análisis visual: "${analisis}"`);
        return `[IMAGEN ANALIZADA]: ${analisis}`;
    } catch (error) {
        console.error('❌ Error en procesarImagen:', error);
        return '[Error analizando imagen]';
    }
}

async function generarRespuestaTexto(msg, mensajeUsuario) {
    const userId = msg.from;
    try {
        // Cargar Base de Conocimiento y Memoria dinámicamente
        let knowledge = "";
        try {
            knowledge = fs.readFileSync(path.join(__dirname, 'knowledge_base.md'), 'utf8');
            const memory = fs.readFileSync(path.join(__dirname, '../../MEMORY.md'), 'utf8');
            knowledge += "\n\nMEMORIA GLOBAL:\n" + memory;
        } catch (e) {
            console.log("⚠️ No se pudo cargar knowledge_base o MEMORY.md");
        }

        const systemPrompt = ROJO_SYSTEM_PROMPT + "\n\nCONTEXTO SOCIAL:\n" + knowledge;

        if (!chatHistory[userId]) chatHistory[userId] = [{ role: 'system', content: systemPrompt }];
        let history = chatHistory[userId];

        // Lógica especial para contactos
        const lowerMsg = mensajeUsuario.toLowerCase();
        if (lowerMsg.includes('contacto') || lowerMsg.includes('busca a')) {
            const query = mensajeUsuario.replace(/rojo|busca|a|en|mis|contactos|de|gmail/gi, '').trim();
            if (query) {
                const results = buscarContactos(query);
                if (results.length > 0) {
                    const contactsStr = results.map(c => `- ${c.nombre}: ${c.correo} (${c.telefono})`).join('\n');
                    return `✅ He encontrado estos contactos:\n${contactsStr}`;
                } else {
                    return `⚠️ No encontré contactos para "${query}".`;
                }
            }
        }

        history.push({ role: 'user', content: mensajeUsuario });
        if (history.length > 20) history = [history[0], ...history.slice(-18)];

        let respuesta = "";
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: history,
                max_tokens: 150,
                temperature: 0.5
            });
            respuesta = completion.choices[0].message.content;
        } catch (error) {
            console.error("⚠️ Error OpenAI. Recurriendo al Cuartel General de Reserva (Gemini):", error.message);
            const geminiRes = await generarRespuestaGemini(history);
            if (geminiRes) {
                respuesta = geminiRes;
            } else {
                throw new Error("Ambas inteligencias fallaron.");
            }
        }
        // Regex mejorado para capturar saltos de línea con [\s\S]
        const execMatch = respuesta.match(/\[\[EXEC:([\s\S]+?)\]\]/);
        if (execMatch) {
            activarAgente(msg, execMatch[1]);
            respuesta = respuesta.replace(/\[\[EXEC:[\s\S]+?\]\]/, '').trim();
        }
        history.push({ role: 'assistant', content: respuesta });
        chatHistory[userId] = history;

        // Actualizar contadores del Circuit Breaker
        lastBotMessageTime = Date.now();
        botMessageCount++;

        return respuesta;
    } catch (error) {
        console.error("Error en generarRespuestaTexto:", error);
        return "⚠️ Error de conexión con el Cuartel General.";
    }
}

client.on('qr', (qr) => {
    console.log('🔴 NUEVO QR GENERADO. Por favor, escanea la imagen qr_code.png en la carpeta del agente.');
    qrcode.toFile(path.join(__dirname, 'qr_code.png'), qr);
});

client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Cargando WhatsApp: ${percent}% - ${message}`);
});

client.on('authenticated', () => {
    console.log('✅ SESIÓN AUTENTICADA.');
});

client.on('ready', () => console.log('🔴 ROJO EN LÍNEA Y LISTO.'));

const startTime = Math.floor(Date.now() / 1000);

client.on('message_create', async msg => {
    console.log(`📩 [DEBUG] Nuevo mensaje detectado: "${msg.body}" | Tipo: ${msg.type} | FromMe: ${msg.fromMe} | From: ${msg.from}`);

    const isAudio = (msg.type === 'ptt' || msg.type === 'audio');

    // 🛑 CIRCUIT BREAKER DE EMERGENCIA 🛑
    if (msg.fromMe && isAudio) {
        // Si el ultimo mensaje fue del bot (o generado por code) hace menos de 10 seg, IGNORAR
        const timeSinceLastBotMsg = Date.now() - lastBotMessageTime;
        if (timeSinceLastBotMsg < 10000) {
            console.log(`🛑 [CIRCUIT BREAKER] Ignorando audio propio enviado hace ${timeSinceLastBotMsg}ms.`);
            return;
        }
    }

    // 0. Ignorar mensajes propios para no auto-responderse
    // EXCEPCIÓN: Si es audio (ptt/audio) O si contiene la palabra 'rojo'
    if (msg.fromMe && !isAudio && !msg.body.toLowerCase().includes('rojo')) {
        console.log(`⏭️ [DEBUG] Mensaje ignorado por ser FromMe sin palabra clave 'rojo' ni ser audio`);
        return;
    }

    // 0.1 Ignorar mensajes antiguos (historial al iniciar)
    if (msg.timestamp < startTime - 30) {
        console.log(`⏭️ [DEBUG] Mensaje ignorado por ser antiguo (${msg.timestamp} < ${startTime - 30})`);
        return;
    }

    if (msg.body.startsWith('✅') || msg.body.startsWith('⚠️') || msg.body.startsWith('🤖')) return;

    // 0.2 Limitador de caudal (Rate Limiter)
    if (botMessageCount >= 3) {
        const timeSinceLastBlock = Date.now() - lastBotMessageTime;
        if (timeSinceLastBlock < 60000) { // 1 minuto de enfriamiento
            console.log(`🛑 [RATE LIMIT] Límite de 3 mensajes/min excedido. Ignorando.`);
            return;
        } else {
            botMessageCount = 0; // Resetear después de 1 min
        }
    }

    // Ignorar mensajes de estado o sistema
    if (msg.type === 'e2e_notification' || msg.type === 'protocol_notification') return;

    // ... (rest of the code) ...

    // Detectar si es un mensaje relevante (Audio, Imagen o Texto dirigido a Rojo)
    let processingBody = msg.body;
    let isRelevante = false;

    // 1. Detección de Audio (PTT = Push To Talk / Nota de voz)
    if (msg.hasMedia && (msg.type === 'ptt' || msg.type === 'audio')) {
        console.log('🎤 Nota de voz detectada.');
        const transcripcion = await procesarAudio(msg);

        if (transcripcion) {
            // VERIFICACIÓN ESTRICTA DE KEYWORD EN AUDIO
            const keywords = ['rojo', 'rojo,', 'hola rojo', 'oye rojo'];
            const hasKeyword = keywords.some(k => transcripcion.toLowerCase().includes(k));

            if (hasKeyword) {
                processingBody = transcripcion; // Reemplazamos el cuerpo vacío por la transcripción
                isRelevante = true;
                await msg.react('👂'); // Feedback visual: "Escuchando"
            } else {
                console.log(`🔇 Audio ignorado: No contiene la palabra clave 'Rojo'. Transcripción: "${transcripcion}"`);
            }
        }
    }

    // 2. Detección de Imagen
    else if (msg.hasMedia && msg.type === 'image') {
        // [CORRECCIÓN] SOLO procesar si el caption menciona a "Rojo"
        if (msg.body && msg.body.toLowerCase().includes('rojo')) {
            const analisis = await procesarImagen(msg);
            if (analisis) {
                // Si el usuario puso texto junto a la foto (caption), lo unimos
                processingBody = (msg.body ? msg.body + "\n" : "") + analisis;
                isRelevante = true;
                await msg.react('👁️'); // Feedback visual: "Viendo"
            }
        } else {
            console.log(`🔇 Imagen ignorada: Caption no contiene 'Rojo'.`);
        }
    }

    // 3. Detección de Texto Normal
    else if (msg.type === 'chat' && msg.body) {
        if (msg.body.toLowerCase().includes('rojo')) {
            isRelevante = true;
        } else {
            console.log(`🔇 Texto ignorado: No contiene 'Rojo'. Msg: "${msg.body}"`);
        }
    }

    // Si no es relevante, ignorar
    if (!isRelevante) {
        return;
    }

    // Limpieza del prefijo "Rojo" si existe en texto transcrito o escrito
    const cleanBody = processingBody.replace(/^rojo[,:\s]*/i, '').trim();

    // ⚡ INTERCEPCIÓN DE COMANDOS DIRECTOS (Para evitar que el LLM se confunda)
    if (cleanBody.toLowerCase().includes('sincroniza') && cleanBody.toLowerCase().includes('contactos')) {
        console.log('⚡ Comando de sincronización detectado vía keyword.');
        let respuestaSync = await activarAgente(msg, 'stalin|sync_contacts');
        await msg.reply(respuestaSync);
        return;
    }

    if (!cleanBody) return;

    console.log(`📩 PROCESANDO (Final): ${cleanBody}`);

    // Mostrar "Escribiendo..." mientras piensa
    const chat = await msg.getChat();
    await chat.sendStateTyping();

    const respuestaTexto = await generarRespuestaTexto(msg, cleanBody);
    console.log(`🤖 Respuesta: ${respuestaTexto}`);

    let respuestaFinal = respuestaTexto.startsWith('✅') ? respuestaTexto : `✅ ${respuestaTexto}`;

    // Si el usuario envió audio, respondemos con audio también
    const esAudioOriginal = (msg.hasMedia && (msg.type === 'ptt' || msg.type === 'audio'));
    const keywordsAudio = ['audio', 'voz', 'escuchar', 'habla', 'dime', 'cuentame'];
    const pideAudio = keywordsAudio.some(k => cleanBody.toLowerCase().includes(k));

    if (esAudioOriginal || cleanBody.length > 50 || pideAudio) {
        const audioPath = await generarRespuestaVoz(respuestaTexto);
        if (audioPath) {
            const media = MessageMedia.fromFilePath(audioPath);
            await client.sendMessage(msg.from, media, { sendAudioAsVoice: true });
            // Limpieza del audio temporal
            setTimeout(() => { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); }, 5000);
        }
    }

    await client.sendMessage(msg.from, respuestaFinal);
});

client.on('disconnected', (reason) => {
    console.log('❌ Rojo se desconectó:', reason);
    process.exit(1); // Forzar salida para que PM2 reinicie
});

client.initialize();


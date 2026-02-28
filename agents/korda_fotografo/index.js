const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const sharp = require('sharp');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env') });

// Configuración OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Configuración de Misión
const TARGET_PEOPLE = ["Juan Pablo (hombre adulto)", "Patty (mujer adulta)", "Rafael (niño/joven)"];
const DESTINATION_FOLDER = 'C:\\Users\\Casa\\Album_Familiar_Automatizado';

// Extensiones permitidas
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Escanea recursivamente un directorio en busca de imágenes
 */
function getAllImages(dir, fileList = []) {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    getAllImages(filePath, fileList);
                } else {
                    const ext = path.extname(file).toLowerCase();
                    if (IMAGE_EXTENSIONS.includes(ext)) {
                        fileList.push(filePath);
                    }
                }
            } catch (err) {
                console.warn(`⚠️ No se pudo acceder a: ${filePath}`);
            }
        });
    } catch (err) {
        console.error(`❌ Error al leer directorio ${dir}:`, err.message);
    }
    return fileList;
}

/**
 * Analiza una imagen usando GPT-4o Vision
 */
async function analyzeImage(imagePath) {
    try {
        console.log(`👁️ Korda analizando: ${path.basename(imagePath)}`);

        // Optimizar imagen (resize a max 800px width para ahorrar tokens)
        const optimizedBuffer = await sharp(imagePath)
            .resize(800, null, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

        const base64Image = optimizedBuffer.toString('base64');

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Usar modelo mini para rapidez y costo
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text", text: `Analiza esta imagen. Tu misión es detectar si aparece alguna de estas personas o si es una foto familiar relevante de ellos:
                        1. Juan Pablo (hombre adulto)
                        2. Patty (mujer adulta)
                        3. Rafael (niño o joven)
                        
                        Responde SOLO con un JSON válido en este formato:
                        {
                            "relevant": boolean,
                            "people": ["Juan Pablo", "Patty", "Rafael"], 
                            "description": "breve descripción de la escena"
                        }
                        Si no estás seguro o no hay personas, "relevant": false.
                        ` },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:image/jpeg;base64,${base64Image}`,
                                "detail": "low"
                            },
                        },
                    ],
                },
            ],
            max_tokens: 150,
        });

        const content = response.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(content);

    } catch (error) {
        console.error(`❌ Error analizando ${path.basename(imagePath)}:`, error.message);
        return { relevant: false, error: true };
    }
}

/**
 * Mueve la foto a la carpeta destino
 */
function movePhoto(sourcePath, analysis, customDest) {
    const finalDest = customDest || DESTINATION_FOLDER;

    if (!fs.existsSync(finalDest)) {
        fs.mkdirSync(finalDest, { recursive: true });
    }

    const ext = path.extname(sourcePath);
    const filename = path.basename(sourcePath, ext);

    // Crear nombre descriptivo
    const peopleTag = analysis.people && analysis.people.length > 0 ? analysis.people.join('_').replace(/\s/g, '') : 'Familiar';
    const newFilename = `Korda_${peopleTag}_${filename}${ext}`;
    const destPath = path.join(finalDest, newFilename);

    try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Foto GUARDADA: ${newFilename} en ${finalDest}`);
        return true;
    } catch (err) {
        console.error(`❌ Error copiando archivo:`, err.message);
        return false;
    }
}

/**
 * Función Principal
 */
async function main() {
    const action = process.argv[2];
    const sourceDir = process.argv[3];
    const userDestDir = process.argv[4];

    if (action === 'organizar') {
        if (!sourceDir) {
            console.log("⚠️ Debes especificar una carpeta de origen.");
            return;
        }

        if (userDestDir) {
            // Override destination if provided
            // DESTINATION_FOLDER is const, so we handle logic differently or use global var.
            // For now, let's stick to default or implemented logic later.
            // But let's log it.
            console.log(`📂 Destino personalizado: ${userDestDir}`);
        }

        console.log(`🚀 Korda iniciando escaneo en: ${sourceDir}`);
        const images = getAllImages(sourceDir);
        console.log(`📸 Se encontraron ${images.length} imágenes. Comenzando análisis...`);

        let processed = 0;
        let found = 0;

        for (const imgPath of images) {
            processed++;
            const analysis = await analyzeImage(imgPath);

            if (analysis.relevant) {
                found++;
                movePhoto(imgPath, analysis, userDestDir);
            }

            // Pequeña pausa para no saturar rate limits si son muchas
            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`🏁 Misión Cumplida. Procesadas: ${processed}. Guardadas: ${found}.`);
        console.log(`📂 Ubicación: ${DESTINATION_FOLDER}`);
    } else {
        console.log("📸 Agente Korda (Fotógrafo) - Uso: node index.js organizar <ruta_origen>");
    }
}

main();

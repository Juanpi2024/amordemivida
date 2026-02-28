const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env') });
const nodemailer = require('nodemailer');
const PutinInbox = require('./putin_inbox');
const { buscarContactos } = require('./contacts_manager');

// Cargar contactos
const contactsPath = path.join(__dirname, 'contacts.json');
let contacts = {};
if (fs.existsSync(contactsPath)) {
    contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
}

/**
 * Putin (Nexo) - Especialista en Inteligencia y Comunicaciones
 * Misión: Gestión de correos, agenda y filtrado de urgencias.
 */

/**
 * Envía un correo electrónico, intentando resolver el destinatario por alias
 */
async function sendEmailAsPutin(target, subject, text, html, attachmentPath = null) {
    let targetEmail = contacts[target.toLowerCase()];

    // Si no está en contacts.json, buscar en CSV
    if (!targetEmail) {
        console.log(`🔎 [Putin Nexo] Alias "${target}" no encontrado en memoria. Buscando en base de datos CSV...`);
        const results = buscarContactos(target);
        if (results.length > 0) {
            targetEmail = results[0].correo;
            console.log(`✅ [Putin Nexo] Contacto encontrado en CSV: ${results[0].nombre} <${targetEmail}>`);
        } else {
            targetEmail = target; // Asumir que es un correo directo si no se encuentra
        }
    }

    // Normalizar correo (manejar "arroba" y espacios)
    targetEmail = targetEmail.replace(/\s*arroba\s*/gi, '@').replace(/\s*punto\s*/gi, '.').trim();

    // Validación de formato de correo simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
        console.error(`❌ [Putin Nexo] Error Crítico: "${targetEmail}" no es una dirección de correo válida.`);
        console.log('🐻 PUTIN: "Niet. Dirección inválida. Corregir antes de enviar."');
        return false;
    }

    console.log(`🇷🇺 [Putin Nexo] Iniciando protocolo de comunicación hacia: ${targetEmail}`);
    if (attachmentPath) console.log(`📎 [Putin Nexo] Adjuntando archivo: ${attachmentPath}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: `"Putin (Nexo Communications)" <${process.env.SMTP_USER}>`,
        to: targetEmail,
        subject: `[NEXO] ${subject}`,
        text: text,
        html: `
            <div style="font-family: 'Courier New', Courier, monospace; border-left: 5px solid #000; padding: 20px; background-color: #f9f9f9;">
                <div style="font-weight: bold; color: #d32f2f; margin-bottom: 10px;">🇷🇺 DISPACHO DE INTELIGENCIA - NEXO</div>
                ${html}
                <div style="margin-top: 30px; font-size: 0.8em; color: #555;">
                    --- DOCUMENTO CIFRADO ---<br>
                    <strong>Agente:</strong> Putin (Nexo)<br>
                    <strong>Destino:</strong> ${targetEmail}
                </div>
            </div>
        `
    };

    if (attachmentPath && fs.existsSync(attachmentPath)) {
        mailOptions.attachments = [{
            filename: path.basename(attachmentPath),
            path: attachmentPath
        }];
    } else if (attachmentPath) {
        console.warn(`⚠️ [Putin Nexo] El archivo adjunto no existe: ${attachmentPath}`);
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [Putin Nexo] Comunicación enviada con éxito:', info.messageId);
        console.log('🐻 PUTIN: "Confía, pero verifica. Misión completada."');
        return true;
    } catch (error) {
        console.error('❌ [Putin Nexo] Error en la interconexión de correo:', error);
        return false;
    }
}

/**
 * Lee la bandeja de entrada y devuelve un string formateado para WhatsApp
 */
async function getInboxSummary(limit = 5) {
    const inbox = new PutinInbox();
    const emails = await inbox.readLastEmails(limit);

    if (!emails || emails.length === 0) return "📭 Bandeja de entrada vacía o error de conexión.";

    let summary = "*📬 Últimos correos recibidos:*\n\n";
    emails.forEach((e, i) => {
        summary += `${i + 1}. *De:* ${e.from}\n   *Tema:* ${e.subject}\n   *Resumen:* ${e.summary}\n\n`;
    });

    return summary;
}

// Ejecución por línea de comandos para orquestación Rojo
if (require.main === module) {
    const action = process.argv[2];
    const param = process.argv[3];

    if (action === 'read_inbox') {
        getInboxSummary(5).then(res => {
            console.log(res);
        });
    } else if (action === 'send_report') {
        const target = process.argv[3];
        const reportBody = `
            <h3>📋 Ecosistema de Agentes de Juan Pablo</h3>
            <p>Aquí tienes el detalle de los especialistas que componen tu Orquesta:</p>
            <ul>
                <li><strong>🍎 Fidel (Pedagogo):</strong> Genera guías, actividades y evaluaciones basadas en el currículum chileno. Ubicado en <code>depositos_materiales/</code>.</li>
                <li><strong>🛡️ El Che (Custodio):</strong> Sanitiza archivos Word, elimina metadatos y asegura la privacidad antes de la venta.</li>
                <li><strong>🚀 Lenin (Publicador):</strong> Sube materiales limpios a ProfeSocial, configura precios y descripciones.</li>
                <li><strong>📊 Stalin (Estratega Curricular):</strong> Analiza Google Drive y repositorios para identificar brechas de contenido.</li>
                <li><strong>📈 Xi Jinping (Marketing):</strong> Investiga ProfeSocial para detectar materiales más vendidos y sugiere títulos de alta conversión.</li>
                <li><strong>📧 Putin (Nexo):</strong> Monitor de email, filtrado de urgencias y asistente de agenda personal.</li>
                <li><strong>🧾 Marx (Contador):</strong> Extrae datos de imágenes de boletas y gestiona el registro de adquisiciones.</li>
                <li><strong>📝 Mao (Diseñador Insights):</strong> Diseña encuestas psicosociales y educativas con dashboards estéticos.</li>
                <li><strong>🌐 Ho Chi Minh (Arquitecto Web):</strong> Transforma datos de Excel en páginas web responsivas.</li>
                <li><strong>🤝 Allende (Soporte CRM):</strong> Atiende usuarios y gestiona el pipeline en Google Sheets.</li>
            </ul>
            <p><strong>Rojo</strong> es tu Comandante de Comunicaciones y quien orquesta a todos estos especialistas.</p>
        `;

        const memoryPath = path.join(__dirname, '../../MEMORY.md');
        sendEmailAsPutin(target, "Reporte Detallado de Agentes Especialistas", "Reporte de Agentes", reportBody, memoryPath).then(res => {
            console.log(res ? '📧 Reporte enviado correctamente con adjunto MEMORY.md.' : '❌ Error al enviar reporte.');
        });
    } else if (action === 'send') {
        // Formato: send "alias/email" "subject" "body" "attachmentPath"
        const target = process.argv[3];
        const subject = process.argv[4] || "Instrucción de Rojo";
        const body = process.argv[5] || "Sin contenido.";
        const attachment = process.argv[6] || null;

        sendEmailAsPutin(target, subject, body, `<p>${body}</p>`, attachment).then(res => {
            console.log(res ? '✅ OK' : '❌ FALLO');
        });
    }
}

module.exports = { sendEmailAsPutin, getInboxSummary };

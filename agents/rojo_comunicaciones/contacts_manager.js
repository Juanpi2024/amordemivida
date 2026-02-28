const fs = require('fs');
const path = require('path');

const CONTACTS_FILE = 'c:/Users/Casa/Downloads/base datos solo mayores y separados correos.csv';

/**
 * Busca contactos en el archivo CSV local.
 * @param {string} query - El nombre o apellido a buscar.
 * @returns {Array} - Lista de contactos encontrados.
 */
const WHATSAPP_CONTACTS_FILE = path.join(__dirname, 'whatsapp_contacts.json');

/**
 * Sincroniza los contactos de WhatsApp y los guarda en un JSON local.
 * @param {object} client - Cliente de WhatsApp Web.js
 */
async function syncWhatsAppContacts(client) {
    console.log('🔄 Sincronizando contactos de WhatsApp...');
    try {
        const contacts = await client.getContacts();
        const validContacts = contacts
            .filter(c => c.id.server === 'c.us' && (c.name || c.pushname)) // Solo usuarios, no grupos
            .map(c => ({
                nombre: c.name || c.pushname,
                numero: c.number,
                id: c.id._serialized, // ID completo para enviar mensajes
                pushname: c.pushname,
                type: 'whatsapp'
            }));

        fs.writeFileSync(WHATSAPP_CONTACTS_FILE, JSON.stringify(validContacts, null, 2));
        console.log(`✅ ${validContacts.length} contactos de WhatsApp guardados en ${WHATSAPP_CONTACTS_FILE}`);
        return validContacts.length;
    } catch (error) {
        console.error('❌ Error sincronizando contactos:', error);
        return 0;
    }
}

/**
 * Busca contactos en CSV local y JSON de WhatsApp.
 * @param {string} query - El nombre o apellido a buscar.
 * @returns {Array} - Lista de contactos encontrados.
 */
function buscarContactos(query) {
    const results = [];
    const cleanQuery = query.toLowerCase().replace(/profe|profesora|asistente|sr|sra/gi, '').trim();
    const queryLower = cleanQuery || query.toLowerCase();

    // 1. Buscar en CSV (Base de Datos Local)
    if (fs.existsSync(CONTACTS_FILE)) {
        try {
            const content = fs.readFileSync(CONTACTS_FILE, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());

            for (let i = 1; i < lines.length; i++) {
                const cells = lines[i].split(';');
                if (cells.length < 4) continue;

                const nombre = cells[0] || '';
                const apellidoP = cells[1] || '';
                const apellidoM = cells[2] || '';
                const correo = cells[3] || '';
                const telefono = cells[4] || '';
                const nombreCompleto = `${nombre} ${apellidoP} ${apellidoM}`.trim();

                if (nombreCompleto.toLowerCase().includes(queryLower) || correo.toLowerCase().includes(queryLower)) {
                    results.push({
                        nombre: nombreCompleto,
                        correo,
                        telefono: telefono.trim(),
                        origen: 'CSV',
                        score: nombreCompleto.toLowerCase().startsWith(queryLower) ? 2 : 1
                    });
                }
            }
        } catch (error) {
            console.error('Error leyendo CSV:', error);
        }
    }

    // 2. Buscar en JSON (Contactos de WhatsApp)
    if (fs.existsSync(WHATSAPP_CONTACTS_FILE)) {
        try {
            const waContacts = JSON.parse(fs.readFileSync(WHATSAPP_CONTACTS_FILE, 'utf8'));
            for (const c of waContacts) {
                if (c.nombre && c.nombre.toLowerCase().includes(queryLower)) {
                    results.push({
                        nombre: c.nombre,
                        correo: 'N/A', // WhatsApp no da correos usualmente
                        telefono: c.numero,
                        id: c.id,
                        origen: 'WhatsApp',
                        score: c.nombre.toLowerCase().startsWith(queryLower) ? 2 : 1
                    });
                }
            }
        } catch (error) {
            console.error('Error leyendo contactos de WhatsApp:', error);
        }
    }

    // Ordenar por score (mayor primero)
    results.sort((a, b) => b.score - a.score);
    return results;
}

module.exports = { buscarContactos, syncWhatsAppContacts };

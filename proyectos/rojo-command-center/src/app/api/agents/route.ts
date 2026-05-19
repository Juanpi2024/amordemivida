
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    let AGENTS_DIR = path.resolve(process.cwd(), '../../agents');
    
    // Check fallback absolute paths if relative doesn't resolve
    if (!fs.existsSync(AGENTS_DIR)) {
        const fallbackPaths = [
            'D:\\antigravity\\clawd\\agents',
            'C:\\Users\\Casa\\clawd\\agents'
        ];
        for (const p of fallbackPaths) {
            if (fs.existsSync(p)) {
                AGENTS_DIR = p;
                break;
            }
        }
    }

    try {
        // Check if we are in a local environment where the path exists
        if (!fs.existsSync(AGENTS_DIR)) {
            throw new Error(`Local agents directory not found at: ${AGENTS_DIR}`);
        }

        const folders = fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const agentsData = folders.map(folderName => {
            const folderPath = path.join(AGENTS_DIR, folderName);
            const identityPath = path.join(folderPath, 'IDENTITY.md');

            let name = folderName;
            let role = 'Agent';
            let status = 'idle';

             // Try to read IDENTITY.md for better name/role/emoji
            let emoji = '';
            if (fs.existsSync(identityPath)) {
                try {
                    const content = fs.readFileSync(identityPath, 'utf-8');
                    
                    // Name match: e.g. - **Nombre:** Rojo or Name: Rojo
                    const nameMatch = content.match(/(?:Nombre|Nombre clave):\s*(?:\*\*)?([^\*\n\r]+)(?:\*\*)?/i) || content.match(/# (?:IDENTITY\.md - )?([^\n\r]+)/i);
                    if (nameMatch) name = nameMatch[1].trim();
                    
                    // Role match: e.g. - **Rol:** Especialista or Role: Especialista
                    const roleMatch = content.match(/(?:Role|Rol|Misión):\s*(?:\*\*)?([^\*\n\r]+)(?:\*\*)?/i);
                    if (roleMatch) role = roleMatch[1].trim();

                    // Emoji match: e.g. - **Emoji:** 🚀 or Emoji: 🚀
                    const emojiMatch = content.match(/(?:Emoji):\s*(?:\*\*)?([^\*\n\r]+)(?:\*\*)?/i);
                    if (emojiMatch) emoji = emojiMatch[1].trim();
                } catch (e) {
                    console.warn(`Could not read identity for ${folderName}`, e);
                }
            }

            // Check for activity in the last 15 minutes by scanning folder files
            let lastModified = 0;
            try {
                if (fs.existsSync(folderPath)) {
                    const files = fs.readdirSync(folderPath);
                    files.forEach(f => {
                        if (f !== 'node_modules' && f !== '.git' && !f.endsWith('.md')) {
                            const p = path.join(folderPath, f);
                            try {
                                const stats = fs.statSync(p);
                                if (stats.isFile() && stats.mtimeMs > lastModified) {
                                    lastModified = stats.mtimeMs;
                                }
                            } catch (err) {
                                // Ignore file stat errors
                            }
                        }
                    });
                }
            } catch (e) {
                console.warn(`Could not check activity for ${folderName}`, e);
            }

            const now = Date.now();

            if (lastModified > 0 && (now - lastModified) < 15 * 60 * 1000) { // 15 mins
                status = 'working';
            }

            return {
                id: folderName,
                name,
                role,
                status,
                emoji,
                lastActive: lastModified,
            };
        });

        return NextResponse.json(agentsData);
    } catch (error) {
        console.warn('Falling back to MOCK DATA due to error:', error);

        // MOCK DATA FOR DEMO / VERCEL
        const mockAgents = [
            { id: 'demo-1', name: 'Rojo-Core', role: 'Director de Orquesta', status: 'working', lastActive: Date.now() },
            { id: 'demo-2', name: 'Analista-Datos', role: 'Mago de Datos', status: 'working', lastActive: Date.now() - 5000 },
            { id: 'demo-3', name: 'Constructor-UI', role: 'Ingeniero Frontend', status: 'idle', lastActive: Date.now() - 1200000 },
            { id: 'demo-4', name: 'Vigilante-Logs', role: 'Sentinela', status: 'error', lastActive: Date.now() - 60000 }
        ];

        return NextResponse.json(mockAgents);
    }
}


import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const AGENTS_DIR = 'C:\\Users\\Casa\\clawd\\agents';

    try {
        // Check if we are in a local environment where the path exists
        if (!fs.existsSync(AGENTS_DIR)) {
            throw new Error('Local agents directory not found (likely running on Vercel)');
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

            // Try to read IDENTITY.md for better name/role
            if (fs.existsSync(identityPath)) {
                try {
                    const content = fs.readFileSync(identityPath, 'utf-8');
                    const roleMatch = content.match(/Role:\s*(.*)/i);
                    if (roleMatch) role = roleMatch[1].trim();
                } catch (e) {
                    console.warn(`Could not read identity for ${folderName}`, e);
                }
            }

            // Check for activity in the last 10 minutes
            const filesToCheck = ['output.log', 'output_real.txt', 'test_output.txt', 'index.js'];
            let lastModified = 0;

            filesToCheck.forEach(f => {
                const p = path.join(folderPath, f);
                if (fs.existsSync(p)) {
                    try {
                        const stats = fs.statSync(p);
                        if (stats.mtimeMs > lastModified) lastModified = stats.mtimeMs;
                    } catch (e) {
                        console.warn(`Could not stat file ${p}`, e);
                    }
                }
            });

            const now = Date.now();

            if (lastModified > 0 && (now - lastModified) < 10 * 60 * 1000) { // 10 mins
                status = 'working';
            }

            return {
                id: folderName,
                name,
                role,
                status,
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

const { chromium } = require('playwright');
const fs = require('fs');
require('dotenv').config();

const EMAIL = process.env.PROFESOCIAL_EMAIL;
const PASSWORD = process.env.PROFESOCIAL_PASSWORD;

(async () => {
    console.log('🔍 Iniciando agente verificador de publicaciones en ProfeSocial...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Login
    await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });
    if (await page.isVisible('#user_email')) {
        await page.fill('#user_email', EMAIL);
        await page.fill('#user_password', PASSWORD);
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            page.click('button.is-primary.is-block')
        ]);
    }
    console.log('✅ Login exitoso. Buscando el perfil del usuario...');

    // 2. Ir al perfil
    // Al loguearnos, usualmente la foto de perfil tiene un enlace al dashboard o perfil
    await page.goto('https://profe.social/users/yeca.toledo', { waitUntil: 'networkidle' }).catch(() => { });

    // Si esa no es la URL, intentaremos buscar todos los títulos visibles en el dashboard
    await page.goto('https://profe.social/my_posts', { waitUntil: 'networkidle' }).catch(() => { });

    // Y otra opción
    await page.goto('https://profe.social/dashboard', { waitUntil: 'networkidle' }).catch(() => { });

    // Una forma infalible es extraer todos los links que contengan /posts/ de la página actual y obtener sus textos
    console.log('📄 Extrayendo títulos de publicaciones recientes...');

    // Navegaremos a la página de recursos del usuario o buscaremos en la plataforma
    // ProfeSocial tiene una sección de "Mis Aportes" o "Mis Recursos"
    await page.goto('https://profe.social/users/me/posts', { waitUntil: 'networkidle' }).catch(() => { });

    // Intentamos extraer cualquier título de post en la página actual
    const titles = await page.evaluate(() => {
        // En ProfeSocial los títulos suelen estar en <h3> o enlaces dentro de tarjetas
        const anchors = Array.from(document.querySelectorAll('a'));
        const postLinks = anchors.filter(a => a.href.includes('/posts/') && !a.href.includes('/edit') && !a.href.includes('/new'));
        return postLinks.map(a => a.innerText.trim()).filter(text => text.length > 5);
    });

    console.log(`✅ Se encontraron ${titles.length} títulos de publicaciones en la vista principal.`);

    // Guardar en cache
    let cacheList = [];
    if (fs.existsSync('published_cache.json')) {
        cacheList = JSON.parse(fs.readFileSync('published_cache.json'));
    }

    const newSet = new Set([...cacheList, ...titles]);
    const finalCache = Array.from(newSet);

    fs.writeFileSync('published_cache.json', JSON.stringify(finalCache, null, 2));
    console.log(`💾 Caché actualizado. Total de publicaciones únicas registradas: ${finalCache.length}`);

    await browser.close();
})();

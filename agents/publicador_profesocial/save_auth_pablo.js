const { chromium } = require('playwright');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env.pablo2010') });

(async () => {
    console.log('🌍 Iniciando guardado de sesión para Pablo...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('   🔗 Navigating to /users/sign_in...');
        await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });
        console.log(`   📍 Current URL: ${page.url()}`);

        const hasEmail = await page.isVisible('#user_email');
        if (!hasEmail) {
            console.log('   ⚠️ #user_email not found. Checking for alternative fields...');
            await page.screenshot({ path: path.join(__dirname, 'debug_no_email.png') });
            const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => i.id + ' | ' + i.name));
            console.log('   Inputs found:', inputs);
        }

        console.log('   ✍️ Typing credentials...');
        await page.fill('#user_email', process.env.PROFESOCIAL_EMAIL);
        await page.fill('#user_password', process.env.PROFESOCIAL_PASSWORD);

        console.log('   🖱️ Click en Login...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(e => console.log('      Navigation timeout or aborted:', e.message)),
            page.click('input[type="submit"], button[type="submit"]')
        ]);

        console.log(`   📍 Post-Login URL: ${page.url()}`);
        await page.waitForTimeout(5000);

        if (page.url().includes('sign_in') || page.url().includes('login')) {
            console.error('❌ Login Fallido.');
            await page.screenshot({ path: path.join(__dirname, 'fail_login_details.png') });
        } else {
            console.log('✅ Éxito. Guardando auth_pablo.json');
            await context.storageState({ path: path.join(__dirname, 'auth_pablo.json') });
        }
    } catch (e) {
        console.error('❌ Error fatal:', e);
    } finally {
        await browser.close();
    }
})();

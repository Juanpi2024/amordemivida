/**
 * 🚨 URGENTE: Eliminar publicaciones sin limpiar de Matemática 1° Medio
 * Posts: 96064, 96066, 96067, 96068, 96069, 96070, 96071, 96072, 96073, 96074
 */
const { chromium } = require('playwright');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../rojo_comunicaciones/.env.pablo2010') });

const POSTS_TO_DELETE = [96064, 96066, 96067, 96068, 96069, 96070, 96071, 96072, 96073, 96074];

(async () => {
    console.log('🚨 ELIMINANDO publicaciones sin limpiar...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    // Login
    await page.goto('https://profe.social/users/sign_in', { waitUntil: 'networkidle' });
    await page.waitForSelector('#user_email');
    await page.fill('#user_email', '');
    await page.type('#user_email', process.env.PROFESOCIAL_EMAIL, { delay: 80 });
    await page.type('#user_password', process.env.PROFESOCIAL_PASSWORD, { delay: 80 });
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => { }),
        page.keyboard.press('Enter')
    ]);
    await page.waitForTimeout(3000);

    if (page.url().includes('sign_in')) {
        console.error('❌ Login fallido');
        process.exit(1);
    }
    console.log('✅ Logueado\n');

    let deleted = 0;
    for (const postId of POSTS_TO_DELETE) {
        console.log(`🗑️ Eliminando post ${postId}...`);
        try {
            // Ir al post
            await page.goto(`https://profe.social/posts/${postId}`, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(1000);

            // Buscar el menú de opciones (tres puntos) o botón eliminar
            // Intentar el menú de opciones del post
            const menuBtn = await page.$('[data-action*="dropdown"], .dropdown-trigger, button[aria-haspopup], .more-options');
            if (menuBtn) {
                await menuBtn.click();
                await page.waitForTimeout(500);
            }

            // Buscar enlace/botón de eliminar
            const deleteLink = await page.$('a[data-method="delete"], a:has-text("Eliminar"), button:has-text("Eliminar")');
            if (deleteLink) {
                // Aceptar el diálogo de confirmación
                page.on('dialog', async dialog => {
                    console.log(`   📝 Diálogo: ${dialog.message()}`);
                    await dialog.accept();
                });

                await deleteLink.click();
                await page.waitForTimeout(3000);
                console.log(`   ✅ Post ${postId} eliminado`);
                deleted++;
            } else {
                // Intentar vía la página de edición
                console.log(`   🔄 Intentando desde página de edición...`);
                await page.goto(`https://profe.social/posts/${postId}/edit`, { waitUntil: 'networkidle', timeout: 15000 });
                await page.waitForTimeout(1000);

                // Buscar botón eliminar en la página de edición
                const editDeleteBtn = await page.$('a:has-text("Eliminar"), button:has-text("Eliminar"), a[data-method="delete"]');
                if (editDeleteBtn) {
                    page.on('dialog', async dialog => {
                        await dialog.accept();
                    });
                    await editDeleteBtn.click();
                    await page.waitForTimeout(3000);
                    console.log(`   ✅ Post ${postId} eliminado`);
                    deleted++;
                } else {
                    // Intentar DELETE vía fetch API
                    console.log(`   🔄 Intentando DELETE vía API...`);
                    const csrfToken = await page.evaluate(() => {
                        const meta = document.querySelector('meta[name="csrf-token"]');
                        return meta ? meta.getAttribute('content') : null;
                    });

                    if (csrfToken) {
                        const result = await page.evaluate(async ({ postId, token }) => {
                            const resp = await fetch(`/posts/${postId}`, {
                                method: 'DELETE',
                                headers: {
                                    'X-CSRF-Token': token,
                                    'Accept': 'text/html',
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                }
                            });
                            return { status: resp.status, ok: resp.ok };
                        }, { postId, token: csrfToken });

                        if (result.ok) {
                            console.log(`   ✅ Post ${postId} eliminado vía API`);
                            deleted++;
                        } else {
                            console.log(`   ❌ API respondió ${result.status}`);
                            await page.screenshot({ path: path.join(__dirname, `delete_fail_${postId}.png`) });
                        }
                    } else {
                        console.log(`   ❌ No se pudo obtener CSRF token`);
                        await page.screenshot({ path: path.join(__dirname, `delete_fail_${postId}.png`) });
                    }
                }
            }
        } catch (e) {
            console.log(`   ❌ Error: ${e.message.substring(0, 80)}`);
            await page.screenshot({ path: path.join(__dirname, `delete_fail_${postId}.png`) }).catch(() => { });
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 RESULTADO: ${deleted}/${POSTS_TO_DELETE.length} eliminados`);
    console.log(`${'='.repeat(50)}`);

    await browser.close();
    process.exit();
})();

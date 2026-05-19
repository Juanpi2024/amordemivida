const { chromium } = require('playwright');
(async () => {
    console.log('Starting browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();
    
    try {
        console.log('Navigating to SLEP portal...');
        await page.goto('https://sistemas.arbol-logika.com/slep-los-alamos/index.jsp', { waitUntil: 'networkidle', timeout: 60000 });
        
        console.log('Waiting for frames to load...');
        await page.waitForTimeout(5000); // Extra time for frames
        
        console.log('Taking screenshot...');
        await page.screenshot({ path: 'd:/antigravity/clawd/slep_homepage.png', fullPage: true });
        
        console.log('Extracting text content...');
        const text = await page.evaluate(() => document.body.innerText);
        console.log('--- TEXT CONTENT START ---');
        console.log(text);
        console.log('--- TEXT CONTENT END ---');
        
        const frames = page.frames();
        console.log(`Found ${frames.length} frames.`);
        for (let i = 0; i < frames.length; i++) {
            const frameText = await frames[i].innerText('body').catch(() => 'Could not read frame');
            console.log(`--- FRAME ${i} CONTENT ---`);
            console.log(frameText);
        }

    } catch (err) {
        console.error('Error during execution:', err);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();

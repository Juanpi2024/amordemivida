const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, 'assets');

async function optimizeImages() {
    try {
        const files = fs.readdirSync(assetsDir);
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

        console.log(`Found ${imageFiles.length} images to optimize...`);

        if (imageFiles.length === 0) {
            console.log("No images found to optimize.");
            return;
        }

        let galleryHtml = '';

        for (const file of imageFiles) {
            const inputPath = path.join(assetsDir, file);
            const outputFilename = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            const outputPath = path.join(assetsDir, outputFilename);

            console.log(`Optimizing ${file} -> ${outputFilename}...`);

            // Resize to max width 800px (good for gallery), convert to webp, 80% quality
            await sharp(inputPath)
                .resize(800, null, { withoutEnlargement: true }) // Maintain aspect ratio
                .webp({ quality: 80 })
                .toFile(outputPath);

            // Add to HTML snippet for easy copy-paste or automatic injection
            galleryHtml += `<div class="gallery-item"><img src="assets/${outputFilename}" alt="Recuerdo con Yeka" loading="lazy"></div>\n`;
        }

        console.log("Optimization complete!");
        console.log("\n--- GALLERY HTML SNIPPET ---\n");
        console.log(galleryHtml);

        // Optionally save the snippet to a file
        fs.writeFileSync(path.join(__dirname, 'gallery_snippet.html'), galleryHtml);

    } catch (error) {
        console.error("Error optimizing images:", error);
    }
}

optimizeImages();

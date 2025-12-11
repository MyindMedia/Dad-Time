/**
 * Icon Generator Script
 * Converts SVG icons to PNG in multiple sizes
 *
 * Run with: node scripts/generate-icons.js
 *
 * Note: This requires sharp to be installed
 * Install with: npm install --save-dev sharp
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');

const icons = [
  { input: 'icon.svg', outputs: ['icon-192.png', 'icon-512.png'], sizes: [192, 512] },
  { input: 'icon-visit.svg', output: 'icon-visit.png', size: 192 },
  { input: 'icon-trip.svg', output: 'icon-trip.png', size: 192 },
  { input: 'icon-expense.svg', output: 'icon-expense.png', size: 192 },
];

async function generateIcon(inputFile, outputFile, size) {
  const inputPath = join(publicDir, inputFile);
  const outputPath = join(publicDir, outputFile);

  try {
    const svgBuffer = readFileSync(inputPath);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✅ Generated ${outputFile} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Error generating ${outputFile}:`, error.message);
  }
}

async function generateAllIcons() {
  console.log('🎨 Generating app icons...\n');

  // Main app icons
  const mainSvg = readFileSync(join(publicDir, 'icon.svg'));
  await sharp(mainSvg).resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'));
  console.log('✅ Generated icon-192.png (192x192)');

  await sharp(mainSvg).resize(512, 512).png().toFile(join(publicDir, 'icon-512.png'));
  console.log('✅ Generated icon-512.png (512x512)');

  // Shortcut icons
  await generateIcon('icon-visit.svg', 'icon-visit.png', 192);
  await generateIcon('icon-trip.svg', 'icon-trip.png', 192);
  await generateIcon('icon-expense.svg', 'icon-expense.png', 192);

  console.log('\n✨ All icons generated successfully!');
}

generateAllIcons().catch(console.error);

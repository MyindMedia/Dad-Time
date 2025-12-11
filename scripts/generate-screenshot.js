import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const svgBuffer = readFileSync(join(publicDir, 'screenshot-mobile.svg'));

sharp(svgBuffer)
  .resize(390, 844)
  .png()
  .toFile(join(publicDir, 'screenshot-mobile.png'))
  .then(() => console.log('✅ Generated screenshot-mobile.png'))
  .catch(err => console.error('❌ Error:', err));

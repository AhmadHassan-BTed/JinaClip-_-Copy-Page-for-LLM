import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Files and directories to include in the extension distribution
const ASSETS = [
  'manifest.json',
  'icons',
  'src',
  'LICENSE'
];

async function build() {
  console.log('🚀 Starting professional build...');

  try {
    // 1. Clean previous build
    if (fs.existsSync(DIST)) {
      await fs.remove(DIST);
      console.log('🧹 Cleaned existing dist/ folder.');
    }

    // 2. Create dist folder
    await fs.ensureDir(DIST);

    // 3. Copy assets
    for (const asset of ASSETS) {
      const srcPath = path.join(ROOT, asset);
      const destPath = path.join(DIST, asset);

      if (fs.existsSync(srcPath)) {
        await fs.copy(srcPath, destPath);
        console.log(`✅ Copied ${asset} to dist/`);
      } else {
        console.warn(`⚠️ Warning: ${asset} not found, skipping.`);
      }
    }

    console.log('\n✨ Build complete! Point Chrome to the "dist" folder.');
  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
}

build();

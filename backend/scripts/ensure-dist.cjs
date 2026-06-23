/**
 * Ensures dist/main.js exists before nest start --watch tries to run it.
 * Avoids MODULE_NOT_FOUND when dist was deleted or not yet compiled.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const mainJs = path.join(root, 'dist', 'main.js');

if (!fs.existsSync(mainJs)) {
  console.log('[ensure-dist] dist/main.js not found — running nest build...');
  execSync('npx nest build', { stdio: 'inherit', cwd: root, env: process.env });
}

if (!fs.existsSync(mainJs)) {
  console.error('[ensure-dist] Build failed: dist/main.js still missing.');
  process.exit(1);
}

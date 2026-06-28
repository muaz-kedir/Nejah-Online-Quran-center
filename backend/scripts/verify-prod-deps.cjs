/**
 * Fail fast before production start if native bcrypt slipped into node_modules
 * (causes "Cannot find module 'wide-align'" on Render).
 *
 * Usage: node scripts/verify-prod-deps.cjs [--skip-dist]
 */
const fs = require('fs');
const path = require('path');

const skipDist = process.argv.includes('--skip-dist');
const root = path.join(__dirname, '..');
const bcryptPath = path.join(root, 'node_modules', 'bcrypt');
const bcryptjsPath = path.join(root, 'node_modules', 'bcryptjs');
const mainPath = path.join(root, 'dist', 'main.js');

const errors = [];

if (fs.existsSync(bcryptPath)) {
  errors.push(
    'node_modules/bcrypt is present — remove it (use bcryptjs only). Run: npm ci',
  );
}

if (!fs.existsSync(bcryptjsPath)) {
  errors.push('node_modules/bcryptjs is missing — run: npm ci');
}

if (!skipDist && !fs.existsSync(mainPath)) {
  errors.push('dist/main.js is missing — run: npm run build');
}

try {
  require('bcryptjs');
} catch (err) {
  errors.push(`bcryptjs failed to load: ${err.message}`);
}

if (errors.length > 0) {
  console.error('[verify-prod-deps] Production dependency check failed:');
  for (const line of errors) {
    console.error(`  - ${line}`);
  }
  process.exit(1);
}

console.log(
  `[verify-prod-deps] OK (node ${process.version}, bcryptjs present, dist ready)`,
);

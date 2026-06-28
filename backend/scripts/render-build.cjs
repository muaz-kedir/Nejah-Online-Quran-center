/**
 * Render build: clean install from lockfile, verify deps, compile.
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

function run(cmd) {
  console.log(`[render-build] ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root, env: process.env });
}

console.log(`[render-build] Node ${process.version}`);

run('npm ci');

run('node scripts/verify-prod-deps.cjs --skip-dist');
run('npm run build');
run('node scripts/verify-prod-deps.cjs');

console.log('[render-build] Build complete');

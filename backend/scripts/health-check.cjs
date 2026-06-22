/**
 * Check backend health (Render or local).
 * Usage:
 *   npm run health:check
 *   npm run health:check:local
 *   node scripts/health-check.cjs https://your-server.com/health
 */
const url =
  process.argv[2] ||
  process.env.HEALTH_URL ||
  'https://nejah-online-quran-center.onrender.com/health';

fetch(url)
  .then(async (res) => {
    const body = await res.text();
    console.log('URL:', url);
    console.log('Status:', res.status);
    console.log(body);
    if (!res.ok) process.exitCode = 1;
  })
  .catch((err) => {
    console.error('Health check failed:', err.message);
    process.exitCode = 1;
  });

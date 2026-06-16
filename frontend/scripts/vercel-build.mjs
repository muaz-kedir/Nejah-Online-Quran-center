import { spawnSync } from "node:child_process";

const PRODUCTION_API_URL = "https://nejah-online-quran-center.onrender.com/api";
const PRODUCTION_WS_URL = "https://nejah-online-quran-center.onrender.com";

process.env.VITE_API_URL = process.env.VITE_API_URL?.trim() || PRODUCTION_API_URL;
process.env.VITE_WS_URL = process.env.VITE_WS_URL?.trim() || PRODUCTION_WS_URL;

if (process.env.VERCEL_URL && !process.env.VITE_SITE_URL) {
  process.env.VITE_SITE_URL = `https://${process.env.VERCEL_URL}`;
}

const result = spawnSync("npm", ["run", "build:app"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);

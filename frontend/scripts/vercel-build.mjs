import { spawnSync } from "node:child_process";

if (process.env.VERCEL_URL && !process.env.VITE_SITE_URL) {
  process.env.VITE_SITE_URL = `https://${process.env.VERCEL_URL}`;
}

const result = spawnSync("npm", ["run", "build:app"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);

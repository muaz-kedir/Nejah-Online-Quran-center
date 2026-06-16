import fs from "node:fs";
import path from "node:path";

const RENDER_API = "https://nejah-online-quran-center.onrender.com/api";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") walk(fullPath, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function ensureApiUrlImport(source, file) {
  if (!source.includes("apiUrl(")) return source;
  if (source.includes("apiUrl") && /import[^;]*apiUrl/.test(source)) return source;
  if (file.replace(/\\/g, "/").endsWith("src/lib/api.ts")) return source;

  if (/import\s*\{[^}]*\}\s*from\s*["']@\/lib\/api["']/.test(source)) {
    return source.replace(
      /import\s*\{([^}]*)\}\s*from\s*["']@\/lib\/api["']/,
      (_, imports) => {
        const parts = imports.split(",").map((s) => s.trim()).filter(Boolean);
        if (!parts.includes("apiUrl")) parts.push("apiUrl");
        return `import { ${parts.join(", ")} } from "@/lib/api"`;
      },
    );
  }

  return `import { apiUrl } from "@/lib/api";\n${source}`;
}

function transformSource(source) {
  let next = source;

  // `${API_BASE}/path` or `${API_BASE}${path}` → apiUrl(...) — avoids Lovable ${API_BASE} build transform
  next = next.replace(/`(\$\{API_BASE\})([^`]+)`/g, (_, _base, rest) => {
    if (rest.startsWith("${")) {
      return `apiUrl(\`${rest.slice(1)}\`)`;
    }
    return `apiUrl(\`${rest}\`)`;
  });

  // Remaining standalone ${API_BASE} in templates
  next = next.replace(/\$\{API_BASE\}/g, "");

  // api.ts internal: use concatenation, not ${API_BASE}
  next = next.replace(/`\$\{API_BASE\}\$\{path\}`/g, "API_BASE + path");
  next = next.replace(/`\$\{API_BASE\}\$\{([^}]+)\}`/g, "API_BASE + $$1");

  return next;
}

let count = 0;
for (const file of walk("src")) {
  let source = fs.readFileSync(file, "utf8");
  if (!source.includes("${API_BASE}") && !source.includes("API_BASE +")) continue;

  const original = source;
  source = transformSource(source);
  source = ensureApiUrlImport(source, file);

  if (source !== original) {
    fs.writeFileSync(file, source);
    count += 1;
    console.log("fixed", file);
  }
}

// Rewrite api.ts with production-safe exports (no ${API_BASE} anywhere)
const apiPath = "src/lib/api.ts";
fs.writeFileSync(
  apiPath,
  `const RENDER_API = '${RENDER_API}';
const RENDER_ORIGIN = 'https://nejah-online-quran-center.onrender.com';
const LOCAL_API = 'http://localhost:3000/api';
const LOCAL_ORIGIN = 'http://localhost:3000';

export const API_BASE: string = import.meta.env.DEV
  ? String(import.meta.env.VITE_API_URL || LOCAL_API)
  : RENDER_API;

export const API_ORIGIN: string = import.meta.env.DEV
  ? String(import.meta.env.VITE_WS_URL || LOCAL_ORIGIN).replace(/\\/$/, '')
  : RENDER_ORIGIN;

export const WS_URL = API_ORIGIN;

export function apiAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return API_ORIGIN + (path.startsWith('/') ? path : '/' + path);
}

export function apiHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
  };
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : '/' + path;
  return API_BASE + normalized;
}

export async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: { ...apiHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiError(body, 'Request failed: ' + res.status));
  }
  return res.json();
}

/** NestJS validation errors return message as a string or string[]. */
export function formatApiError(data: unknown, fallback = 'Something went wrong'): string {
  if (!data || typeof data !== 'object') return fallback;
  const message = (data as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}
`,
);

console.log("rewrote", apiPath);
console.log("total files", count);

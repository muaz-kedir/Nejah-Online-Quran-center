import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SW_PATH = resolve(import.meta.dirname, '../public/firebase-messaging-sw.js');

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const allSet = requiredVars.every((v) => process.env[v]?.trim());
if (!allSet) {
  const missing = requiredVars.filter((v) => !process.env[v]?.trim());
  console.warn('[generate-sw] Missing env vars:', missing.join(', '));
  console.warn('[generate-sw] Using unmodified SW (query param fallback)');
  process.exit(0);
}

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY.trim(),
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID.trim(),
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID.trim(),
  appId: process.env.VITE_FIREBASE_APP_ID.trim(),
};

const configJson = JSON.stringify(config);
const code = readFileSync(SW_PATH, 'utf-8');
const updated = code.replace(/__FIREBASE_CONFIG_JSON__/g, configJson);
writeFileSync(SW_PATH, updated, 'utf-8');
console.log('[generate-sw] Firebase config baked into firebase-messaging-sw.js');

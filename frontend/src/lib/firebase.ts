import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let messagingSupported = false;

export async function initFirebase(): Promise<boolean> {
  if (app) return true;

  const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;
  if (!hasConfig) return false;

  try {
    messagingSupported = await isSupported();
    if (!messagingSupported) return false;

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    messaging = getMessaging(app);
    return true;
  } catch {
    return false;
  }
}

export function getFirebaseApp(): FirebaseApp | null {
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  return messaging;
}

export function isMessagingSupported(): boolean {
  return messagingSupported;
}

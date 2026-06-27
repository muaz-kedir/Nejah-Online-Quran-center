import { existsSync, readFileSync } from 'fs';
import { Logger } from '@nestjs/common';
import type { ServiceAccount } from 'firebase-admin/app';

const logger = new Logger('FirebaseConfig');

function sanitizeEnv(value?: string | null): string {
  if (!value) return '';
  let trimmed = value.replace(/^\uFEFF/, '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
}

function normalizeServiceAccount(raw: Record<string, unknown>): ServiceAccount {
  const projectId = String(raw.project_id || raw.projectId || '').trim();
  const clientEmail = String(raw.client_email || raw.clientEmail || '').trim();
  const privateKey = normalizePrivateKey(String(raw.private_key || raw.privateKey || ''));

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Service account JSON is missing project_id, client_email, or private_key',
    );
  }

  return { projectId, clientEmail, privateKey };
}

/** Repair JSON where private_key contains unescaped literal newlines (common on Render/Heroku). */
function repairMultilinePrivateKeyJson(raw: string): string | null {
  const marker = '"private_key"';
  const start = raw.indexOf(marker);
  if (start === -1) return null;

  const valueStart = raw.indexOf('"', start + marker.length);
  if (valueStart === -1) return null;

  const endMarker = '-----END PRIVATE KEY-----';
  const endIdx = raw.indexOf(endMarker, valueStart);
  if (endIdx === -1) return null;

  const closeQuote = raw.indexOf('"', endIdx + endMarker.length);
  if (closeQuote === -1) return null;

  const inner = raw.slice(valueStart + 1, closeQuote);
  const escaped = inner.replace(/\r?\n/g, '\\n');
  return raw.slice(0, valueStart + 1) + escaped + raw.slice(closeQuote);
}

function parseServiceAccountJson(raw: string): ServiceAccount {
  const trimmed = sanitizeEnv(raw);
  if (!trimmed) {
    throw new Error('Firebase service account JSON is empty');
  }

  try {
    return normalizeServiceAccount(JSON.parse(trimmed) as Record<string, unknown>);
  } catch (firstError) {
    const repaired = repairMultilinePrivateKeyJson(trimmed);
    if (repaired) {
      try {
        return normalizeServiceAccount(JSON.parse(repaired) as Record<string, unknown>);
      } catch (repairedError) {
        logger.warn(
          `Firebase JSON repair failed: ${(repairedError as Error).message}`,
        );
      }
    }
    throw firstError;
  }
}

export type FirebaseCredentialSource =
  | 'service_account_fields'
  | 'service_account_json'
  | 'service_account_base64'
  | 'google_application_credentials'
  | null;

export type FirebaseCredentialResult = {
  account: ServiceAccount;
  source: FirebaseCredentialSource;
};

export function loadFirebaseServiceAccount(env: {
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  FIREBASE_SERVICE_ACCOUNT_BASE64?: string;
  GOOGLE_APPLICATION_CREDENTIALS?: string;
}): FirebaseCredentialResult | null {
  const projectId = sanitizeEnv(env.FIREBASE_PROJECT_ID);
  const clientEmail = sanitizeEnv(env.FIREBASE_CLIENT_EMAIL);
  const privateKeyRaw = sanitizeEnv(env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKeyRaw) {
    return {
      account: {
        projectId,
        clientEmail,
        privateKey: normalizePrivateKey(privateKeyRaw),
      },
      source: 'service_account_fields',
    };
  }

  const base64 = sanitizeEnv(env.FIREBASE_SERVICE_ACCOUNT_BASE64);
  if (base64) {
    try {
      const decoded = Buffer.from(base64, 'base64').toString('utf8');
      return {
        account: parseServiceAccountJson(decoded),
        source: 'service_account_base64',
      };
    } catch (error) {
      logger.warn(
        `Invalid FIREBASE_SERVICE_ACCOUNT_BASE64: ${(error as Error).message}. ` +
          'Use FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY instead.',
      );
    }
  }

  const json = sanitizeEnv(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (json) {
    try {
      return {
        account: parseServiceAccountJson(json),
        source: 'service_account_json',
      };
    } catch (error) {
      logger.warn(
        `Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${(error as Error).message}. ` +
          'Remove it on Render or use FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, ' +
          'or FIREBASE_SERVICE_ACCOUNT_BASE64.',
      );
    }
  }

  const credentialsPath = sanitizeEnv(env.GOOGLE_APPLICATION_CREDENTIALS);
  if (credentialsPath && existsSync(credentialsPath)) {
    try {
      const fileContents = readFileSync(credentialsPath, 'utf8');
      return {
        account: parseServiceAccountJson(fileContents),
        source: 'google_application_credentials',
      };
    } catch (error) {
      logger.warn(
        `Failed to read GOOGLE_APPLICATION_CREDENTIALS file: ${(error as Error).message}`,
      );
    }
  }

  return null;
}

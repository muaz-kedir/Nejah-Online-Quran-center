import { Logger } from '@nestjs/common';

const REQUIRED_ZOOM_VARS = ['ZOOM_ACCOUNT_ID', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET'];

const RECOMMENDED_VARS = ['ZOOM_SECRET_TOKEN', 'ENCRYPTION_KEY', 'EXCHANGE_RATE_API_KEY'];

export function validateEnvironment(logger: Logger): void {
  const missing: string[] = [];
  for (const key of REQUIRED_ZOOM_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  for (const key of RECOMMENDED_VARS) {
    if (!process.env[key]) {
      logger.warn(`Recommended environment variable ${key} is not set`);
    }
  }
}

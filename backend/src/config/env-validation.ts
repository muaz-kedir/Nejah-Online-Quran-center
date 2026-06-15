import { Logger } from '@nestjs/common';

const RECOMMENDED_VARS = [
  'ZOOM_ACCOUNT_ID',
  'ZOOM_CLIENT_ID',
  'ZOOM_CLIENT_SECRET',
  'ZOOM_SECRET_TOKEN',
  'ENCRYPTION_KEY',
  'EXCHANGE_RATE_API_KEY',
];

export function validateEnvironment(logger: Logger): void {
  for (const key of RECOMMENDED_VARS) {
    if (!process.env[key]) {
      logger.warn(`Recommended environment variable ${key} is not set. Some features may be unavailable.`);
    }
  }
}

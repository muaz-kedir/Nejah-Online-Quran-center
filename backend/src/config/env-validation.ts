import { Logger } from '@nestjs/common';

const RECOMMENDED_VARS = [
  'ZOOM_ACCOUNT_ID',
  'ZOOM_CLIENT_ID',
  'ZOOM_CLIENT_SECRET',
  'ZOOM_SECRET_TOKEN',
  'ENCRYPTION_KEY',
  'EXCHANGE_RATE_API_KEY',
];

const PRODUCTION_REQUIRED_VARS = ['JWT_SECRET', 'DATABASE_URL'];

export function validateEnvironment(logger: Logger): void {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    for (const key of PRODUCTION_REQUIRED_VARS) {
      if (!process.env[key]) {
        logger.error(`Required environment variable ${key} is not set.`);
      }
    }
    if (!process.env.DATABASE_URL && process.env.DB_SYNC !== 'true') {
      logger.warn(
        'No DATABASE_URL and DB_SYNC is not true — database tables may not be created automatically.',
      );
    }
  }

  for (const key of RECOMMENDED_VARS) {
    if (!process.env[key]) {
      logger.warn(`Recommended environment variable ${key} is not set. Some features may be unavailable.`);
    }
  }
}

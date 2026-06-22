import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { execSync } from 'child_process';
import { validateEnvironment } from './config/env-validation';
import { isAllowedCorsOrigin } from './config/cors-origins';

function freeBackendPort(targetPort: number) {
  try {
    execSync('node scripts/free-port.cjs', {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, PORT: String(targetPort) },
    });
  } catch {
    /* no stale listener */
  }
}

async function listenOnPort(
  app: NestExpressApplication,
  port: number,
  logger: Logger,
  host = '0.0.0.0',
) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    freeBackendPort(port);
    try {
      await app.listen(port, host);
      return;
    } catch (err: any) {
      if (err?.code === 'EADDRINUSE' && attempt < 3) {
        logger.warn(`Port ${port} in use (attempt ${attempt}), retrying...`);
        continue;
      }
      throw err;
    }
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  validateEnvironment(logger);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true, // Enable raw body for Zoom webhook signature verification
  });
  app.enableShutdownHooks();
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration - Allow all localhost origins in development
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (isAllowedCorsOrigin(origin, configService)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-zm-signature', 'x-zm-request-timestamp'],
  });

  // API prefix — exclude Zoom webhook and public health from /api
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api';
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'zoom/webhook', method: RequestMethod.POST },
    ],
  });

  // Serve uploaded files
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Use Render's dynamic port or fallback to 3000
  const port = Number(process.env.PORT) || 3000;

  try {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      console.log('✅ Database connected');
    }
    await listenOnPort(app, port, logger, '0.0.0.0');
    console.log(`🚀 Nejah Backend API is running on: http://localhost:${port}/api`);
  } catch (err: any) {
    if (err?.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use. Stop the other process or set PORT to a different value.`,
      );
    }
    throw err;
  }
}

bootstrap();


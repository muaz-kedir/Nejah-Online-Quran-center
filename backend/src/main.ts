import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
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

  // === ZOOM WEBHOOK: RAW EXPRESS HANDLER ===
  // Runs at the Express level BEFORE NestJS's body-parser and router,
  // completely bypassing all NestJS processing (pipes, interceptors, guards, serializers).
  //
  // NestJS registers its body-parser during app.listen() (AFTER app.use() middleware),
  // so we must add our own body-parser for this path.
  //
  // This ensures req.body is available for URL validation AND the response is
  // sent directly via Express without any NestJS transformation.

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bodyParser = require('body-parser');

  // 1) Parse JSON body for /zoom/webhook (stores req.body + req.rawBody)
  app.use(
    '/zoom/webhook',
    bodyParser.json({
      verify: (req: any, _res: any, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );

  // 2) Handle endpoint.url_validation — short-circuits with exact response
  app.use('/zoom/webhook', (req, res, next) => {
    if (req.method !== 'POST') return next();

    const body = req.body || {};
    const event = body.event;

    if (event === 'endpoint.url_validation') {
      const plainToken = body?.payload?.plainToken;
      const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN?.trim() || '';
      const encryptedToken = secretToken
        ? crypto.createHmac('sha256', secretToken).update(plainToken || '').digest('hex')
        : '';

      const responseBody = { plainToken: plainToken || '', encryptedToken };

      console.log('### ZOOM WEBHOOK VALIDATION (RAW EXPRESS) ###');
      console.log('req.body available:', !!req.body);
      console.log('plainToken:', plainToken);
      console.log('secretToken length:', secretToken.length);
      console.log('secretToken (first 4):', secretToken.substring(0, 4));
      console.log('secretToken (last 4):', secretToken.substring(Math.max(0, secretToken.length - 4)));
      console.log('encryptedToken:', encryptedToken);
      console.log('responseBody:', JSON.stringify(responseBody));
      console.log('Content-Type: application/json');
      console.log('Status: 200');
      console.log('############################################');

      res.status(200).json(responseBody);
      return;
    }

    next();
  });

  // API prefix — exclude Zoom webhook and public health from /api
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api';
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'zoom/webhook', method: RequestMethod.ALL },
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


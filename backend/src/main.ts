import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { validateEnvironment } from './config/env-validation';
import { isAllowedCorsOrigin } from './config/cors-origins';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  validateEnvironment(logger);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
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
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // API prefix
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api');

  // Serve uploaded files
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const port = configService.get('PORT') || 3000;
  try {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      console.log('✅ Database connected');
    }
    await app.listen(port);
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

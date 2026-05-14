import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || 'http://localhost:8080',
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api');

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  console.log(`🚀 Nejah Backend API is running on: http://localhost:${port}/api`);
}

bootstrap();

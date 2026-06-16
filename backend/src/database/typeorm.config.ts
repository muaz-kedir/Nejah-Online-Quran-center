import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export function shouldSynchronizeSchema(configService: ConfigService): boolean {
  if (configService.get<string>('DB_SYNC') === 'false') {
    return false;
  }
  if (configService.get<string>('NODE_ENV') === 'development') {
    return true;
  }
  // Hosted Postgres (Render, Railway, etc.) — create/update tables automatically.
  if (configService.get<string>('DATABASE_URL')) {
    return true;
  }
  return configService.get<string>('DB_SYNC') === 'true';
}

export function createTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
  const synchronize = shouldSynchronizeSchema(configService);
  const databaseUrl = configService.get<string>('DATABASE_URL');

  const shared: Pick<TypeOrmModuleOptions, 'autoLoadEntities' | 'synchronize' | 'logging'> = {
    autoLoadEntities: true,
    synchronize,
    logging: synchronize ? ['error', 'schema'] : ['error'],
  };

  if (databaseUrl) {
    return {
      ...shared,
      type: 'postgres',
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
    };
  }

  return {
    ...shared,
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: Number(configService.get<string>('DB_PORT') || 5432),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME') || configService.get<string>('DB_DATABASE'),
    ssl: false,
  };
}

export async function ensureDatabaseSchema(
  dataSource: DataSource,
  logger: Logger,
): Promise<void> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const entityCount = dataSource.entityMetadatas.length;
  logger.log(`TypeORM registered ${entityCount} entities`);

  if (entityCount === 0) {
    throw new Error(
      'No TypeORM entities registered. Cannot create database tables. Check autoLoadEntities.',
    );
  }

  const result = await dataSource.query<{ reg: string | null }[]>(
    `SELECT to_regclass('public.users') AS reg`,
  );
  const usersTable = result[0]?.reg;

  if (usersTable) {
    logger.log('Database schema ready');
    return;
  }

  logger.warn('users table missing — running schema synchronize now');
  await dataSource.synchronize();
  logger.log('Database schema synchronized');
}

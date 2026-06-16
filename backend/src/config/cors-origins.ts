import { ConfigService } from '@nestjs/config';

export function collectCorsOrigins(configService: ConfigService): string[] {
  const origins = new Set<string>();

  const single = configService.get<string>('CORS_ORIGIN');
  if (single?.trim()) origins.add(single.trim());

  const multiple = configService.get<string>('CORS_ORIGINS');
  if (multiple?.trim()) {
    for (const part of multiple.split(',')) {
      const trimmed = part.trim();
      if (trimmed) origins.add(trimmed);
    }
  }

  const frontendUrl = configService.get<string>('FRONTEND_URL');
  if (frontendUrl?.trim()) origins.add(frontendUrl.trim());

  return [...origins];
}

export function isAllowedCorsOrigin(origin: string, configService: ConfigService): boolean {
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    return true;
  }

  if (origin.endsWith('.vercel.app')) {
    return true;
  }

  return collectCorsOrigins(configService).includes(origin);
}

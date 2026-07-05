import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { verify } from 'jsonwebtoken';

/**
 * Rate limit public/unauthenticated traffic only.
 * Logged-in users (valid JWT) are not throttled — SPA polling would hit 10/min global limits.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  private readonly jwtSecret: string;

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    configService: ConfigService,
  ) {
    super(options, storageService, reflector);
    this.jwtSecret = configService.get<string>('JWT_SECRET') || '';
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (await super.shouldSkip(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const path = String(request.path || request.url || '').split('?')[0];

    if (this.isHealthPath(path)) {
      return true;
    }

    if (this.hasValidJwt(request)) {
      return true;
    }

    return false;
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.ips?.length ? req.ips[0] : req.ip;
    return ip || 'unknown';
  }

  private isHealthPath(path: string): boolean {
    return (
      path === '/health' ||
      path === '/api/health' ||
      path.endsWith('/monitoring/health')
    );
  }

  private hasValidJwt(request: Record<string, any>): boolean {
    if (!this.jwtSecret) return false;

    const auth = request.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) return false;

    try {
      const payload = verify(auth.slice(7), this.jwtSecret) as { sub?: string };
      return Boolean(payload?.sub);
    } catch {
      return false;
    }
  }
}

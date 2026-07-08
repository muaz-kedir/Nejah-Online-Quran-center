import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

const SKIP_PATHS = ['/audit-logs', '/health', '/uploads', '/chat'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, path, body, ip } = request;
    const user = request.user;

    if (SKIP_PATHS.some((p) => path.startsWith(p))) {
      return next.handle();
    }

    const start = Date.now();

    return next.handle().pipe(
      tap((responseBody) => {
        if (method === 'GET') return;

        const duration = Date.now() - start;
        const logEntry = this.auditRepo.create({
          userId: user?.id || null,
          userEmail: user?.email || null,
          userName: user?.name || user?.fullName || null,
          userRole: user?.role || null,
          method,
          path,
          resource: path.split('/').filter(Boolean)[0] || null,
          action: `${method} ${path}`,
          statusCode: context.switchToHttp().getResponse().statusCode,
          requestBody: method !== 'GET' ? body : undefined,
          responseBody:
            method !== 'GET' && duration > 0 ? responseBody : undefined,
          ipAddress: ip,
        });

        this.auditRepo.save(logEntry).catch(() => {});
      }),
    );
  }
}

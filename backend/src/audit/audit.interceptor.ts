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

function describeAction(
  method: string,
  path: string,
  reqBody: Record<string, unknown> | undefined,
  resBody: unknown,
): string {
  const parts = path.split('/').filter(Boolean);
  const resource = parts[0] || '';
  const hasId = parts.length >= 2 && /^[0-9a-f-]{36}$/i.test(parts[1]);
  const subResource = parts.length >= 3 && !/^[0-9a-f-]{36}$/i.test(parts[parts.length - 1])
    ? parts[parts.length - 1]
    : null;

  const getName = (obj: any): string =>
    obj?.fullName || obj?.name || obj?.title || obj?.email || '';

  if (subResource === 'complaints' && method === 'POST') {
    const reason = reqBody?.reason || '';
    return `Filed complaint against ${resource}${reason ? ` (${reason})` : ''}`;
  }

  if (subResource === 'complaints' && method === 'PATCH') {
    return `Resolved complaint about ${resource}`;
  }

  if (method === 'POST' && !hasId) {
    const name = getName(reqBody || resBody);
    switch (resource) {
      case 'teachers': return `Added teacher${name ? `: ${name}` : ''}`;
      case 'students': return `Added student${name ? `: ${name}` : ''}`;
      case 'parents': return `Added parent${name ? `: ${name}` : ''}`;
      case 'admins': return `Added staff member${name ? `: ${name}` : ''}`;
      case 'fee_settings': return 'Created fee setting';
      case 'currency_settings': return 'Created currency setting';
      default: return `Created ${resource}${name ? `: ${name}` : ''}`;
    }
  }

  if (method === 'PATCH' || method === 'PUT') {
    const name = getName(resBody || reqBody);
    if (reqBody) {
      const keys = Object.keys(reqBody);
      if (keys.length === 1) {
        const key = keys[0];
        const val = reqBody[key];
        switch (key) {
          case 'status':
            if (val === 'active') return `Activated ${resource}${name ? `: ${name}` : ''}`;
            if (val === 'inactive') return `Suspended ${resource}${name ? `: ${name}` : ''}`;
            return `Changed ${resource} status to ${val}${name ? ` (${name})` : ''}`;
          case 'monthlySalary':
            return `Updated salary for ${resource}${name ? `: ${name}` : ''}`;
          case 'fullName':
            return `Renamed ${resource} to "${val}"`;
          case 'hourlyRate':
            return `Updated hourly rate for ${resource}${name ? `: ${name}` : ''}`;
          case 'password':
            return `Reset password for ${resource}${name ? `: ${name}` : ''}`;
        }
      }
      if (keys.length > 0) {
        return `Updated ${resource}${name ? `: ${name}` : ''} (${keys.length} field${keys.length > 1 ? 's' : ''})`;
      }
    }
    return `Updated ${resource}${name ? `: ${name}` : ''}`;
  }

  if (method === 'DELETE') {
    const name = getName(resBody || reqBody);
    switch (resource) {
      case 'teachers': return `Deleted teacher${name ? `: ${name}` : ''}`;
      case 'students': return `Deleted student${name ? `: ${name}` : ''}`;
      case 'parents': return `Deleted parent${name ? `: ${name}` : ''}`;
      case 'admins': return `Removed staff member${name ? `: ${name}` : ''}`;
      default: return `Deleted ${resource}${name ? `: ${name}` : ''}`;
    }
  }

  return `${method} ${path}`;
}

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
          action: describeAction(method, path, body, responseBody),
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

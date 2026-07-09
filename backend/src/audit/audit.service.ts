import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(query: {
    userId?: string;
    period?: 'daily' | 'weekly' | 'monthly';
    page?: number;
    limit?: number;
  }) {
    const { userId, period, page = 1, limit = 50 } = query;
    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (period) {
      const now = new Date();
      let start: Date;
      if (period === 'daily') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'weekly') {
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      where.createdAt = MoreThanOrEqual(start);
    }

    const [data, total] = await this.auditRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getDistinctUsers() {
    const users = await this.userRepo.find({
      where: { role: In(['teacher', 'qirat_manager', 'finance_manager']) },
      select: ['id', 'email', 'name', 'role'],
      order: { name: 'ASC' },
    });
    return users.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role }));
  }
}

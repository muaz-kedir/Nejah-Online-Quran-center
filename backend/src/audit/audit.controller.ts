import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AuditService } from './audit.service';

@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  async findAll(
    @Query('userId') userId?: string,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findAll({ userId, period, page, limit });
  }

  @Get('users')
  @Roles(UserRole.SUPER_ADMIN)
  async getUsers() {
    return this.auditService.getDistinctUsers();
  }
}

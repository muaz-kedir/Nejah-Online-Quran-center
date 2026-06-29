import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SessionsAnalyticsService } from './sessions-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('sessions-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsAnalyticsController {
  constructor(private readonly analyticsService: SessionsAnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getDashboardAnalytics() {
    return this.analyticsService.getDashboardAnalytics();
  }

  @Get('monthly')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getMonthlyTrends(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return this.analyticsService.getMonthlyTrends(y, m);
  }
}

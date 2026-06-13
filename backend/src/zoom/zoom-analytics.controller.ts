import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ZoomAnalyticsService } from './zoom-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';

@Controller('zoom-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZoomAnalyticsController {
  constructor(
    private readonly zoomAnalyticsService: ZoomAnalyticsService,
    private readonly teachersService: TeachersService,
  ) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getDashboardAnalytics() {
    return this.zoomAnalyticsService.getDashboardAnalytics();
  }

  @Get('teacher')
  @Roles(UserRole.TEACHER)
  async getTeacherAnalytics(@Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.zoomAnalyticsService.getTeacherAnalytics(teacher.id);
  }

  @Get('teacher/:teacherId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getTeacherAnalyticsById(@Param('teacherId') teacherId: string) {
    return this.zoomAnalyticsService.getTeacherAnalytics(teacherId);
  }

  @Get('student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getStudentAnalytics(@Param('studentId') studentId: string) {
    return this.zoomAnalyticsService.getStudentAnalytics(studentId);
  }

  @Get('monthly')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getMonthlyTrends(@Query('year') year: string, @Query('month') month: string) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return this.zoomAnalyticsService.getMonthlyTrends(y, m);
  }

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getOverview() {
    return this.zoomAnalyticsService.getOverallStats();
  }
}

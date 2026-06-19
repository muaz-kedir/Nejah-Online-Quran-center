import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import { ZoomAnalyticsService } from './zoom-analytics.service';
import { AttendanceIntelligenceService } from './attendance-intelligence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly zoomAnalytics: ZoomAnalyticsService,
    private readonly attendanceIntelligence: AttendanceIntelligenceService,
    private readonly teachersService: TeachersService,
  ) {}

  @Get('teacher/teaching-time')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getMyTeachingTime(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.zoomAnalytics.getTeacherTeachingHours(
      teacher.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('teacher/:teacherId/teaching-time')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getTeacherTeachingTime(
    @Param('teacherId') teacherId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.zoomAnalytics.getTeacherTeachingHours(
      teacherId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('student/learning-time')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getMyLearningTime(
    @Request() req,
    @Query('studentId') studentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const sid = studentId || req.user.studentId;
    if (!sid) {
      return { totalHours: 0, totalMinutes: 0, sessionCount: 0, averageMinutesPerSession: 0, teachingHours: 0, dailyBreakdown: {} };
    }
    return this.zoomAnalytics.getStudentLearningHours(
      sid,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('student/:studentId/learning-time')
  @Roles(UserRole.PARENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getStudentLearningTime(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.zoomAnalytics.getStudentLearningHours(
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('teacher/rankings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getTeacherRankings() {
    return this.zoomAnalytics.getTeacherRankings();
  }

  @Get('session/:sessionId/timeline')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getSessionTimeline(@Param('sessionId') sessionId: string) {
    return this.zoomAnalytics.getSessionTimeline(sessionId);
  }

  @Post('session/:sessionId/reconcile')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async reconcileSession(@Param('sessionId') sessionId: string) {
    await this.attendanceIntelligence.recalculateSession(sessionId);
    return { status: true, message: 'Session analytics recalculated' };
  }
}

import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';
import { LiveSessionAttendanceReportService } from './live-session-attendance-report.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LiveSessionAttendanceReportController {
  constructor(
    private readonly reportService: LiveSessionAttendanceReportService,
    private readonly teachersService: TeachersService,
  ) {}

  @Get('teacher/sessions/:sessionId')
  @Roles(UserRole.TEACHER)
  async getSessionAttendance(
    @Param('sessionId') sessionId: string,
    @Request() req: { user: { id: string } },
  ) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    await this.reportService.assertTeacherSessionAccess(teacher.id, sessionId);
    return this.reportService.getSessionAttendanceSummary(sessionId);
  }

  @Get('teacher/report')
  @Roles(UserRole.TEACHER)
  async getTeacherReport(
    @Request() req: { user: { id: string } },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.reportService.getTeacherAttendanceReport(teacher.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      sessionId,
    });
  }

  @Get('admin/sessions/:sessionId/summary')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getAdminSessionSummary(@Param('sessionId') sessionId: string) {
    return this.reportService.getSessionAttendanceSummary(sessionId);
  }

  @Get('admin/report')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getAdminReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('teacherId') teacherId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return this.reportService.getAdminAttendanceReport({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      teacherId,
      studentId,
      status,
    });
  }

  @Get('admin/report/export')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async exportReport(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('teacherId') teacherId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    const csv = await this.reportService.exportAdminReportCsv({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      teacherId,
      studentId,
      status,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance-report-${Date.now()}.csv`,
    );
    res.send(csv);
  }
}

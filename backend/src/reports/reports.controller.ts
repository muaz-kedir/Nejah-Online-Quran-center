import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DateRangeFilter } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ────────────────────────────────────────────────────────────────────────────────
  // 1. Summary Statistics
  // ────────────────────────────────────────────────────────────────────────────────

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async getSummary(@Query() query: any) {
    const dateRange: DateRangeFilter = {};

    if (query.startDate) {
      dateRange.startDate = query.startDate;
    }

    if (query.endDate) {
      dateRange.endDate = query.endDate;
    }

    return this.reportsService.getSummaryStatistics(dateRange);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 2. Student Performance Data
  // ────────────────────────────────────────────────────────────────────────────────

  @Get('students/performance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async getStudentPerformance(@Query() query: any) {
    const filters: any = {};

    if (query.learningProgram) {
      filters.learningProgram = query.learningProgram;
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.teacherId) {
      filters.teacherId = query.teacherId;
    }

    if (query.country) {
      filters.country = query.country;
    }

    if (query.search) {
      filters.search = query.search;
    }

    if (query.startDate) {
      filters.dateRange = { ...filters.dateRange, startDate: query.startDate };
    }

    if (query.endDate) {
      filters.dateRange = { ...filters.dateRange, endDate: query.endDate };
    }

    if (query.page) {
      filters.page = parseInt(query.page, 10);
    }

    if (query.limit) {
      filters.limit = parseInt(query.limit, 10);
    }

    return this.reportsService.getStudentPerformance(filters);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 3. Teacher Activity Data
  // ────────────────────────────────────────────────────────────────────────────────

  @Get('teachers/activity')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async getTeacherActivity(@Query() query: any) {
    const filters: any = {};

    if (query.startDate) {
      filters.dateRange = { ...filters.dateRange, startDate: query.startDate };
    }

    if (query.endDate) {
      filters.dateRange = { ...filters.dateRange, endDate: query.endDate };
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.country) {
      filters.country = query.country;
    }

    if (query.page) {
      filters.page = parseInt(query.page, 10);
    }

    if (query.limit) {
      filters.limit = parseInt(query.limit, 10);
    }

    return this.reportsService.getTeacherActivity(filters);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 4. Attendance Analytics
  // ────────────────────────────────────────────────────────────────────────────────

  @Get('attendance/analytics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async getAttendanceAnalytics(@Query() query: any) {
    const filters: any = {};

    if (query.startDate) {
      filters.startDate = query.startDate;
    }

    if (query.endDate) {
      filters.endDate = query.endDate;
    }

    if (query.teacherId) {
      filters.teacherId = query.teacherId;
    }

    if (query.studentId) {
      filters.studentId = query.studentId;
    }

    return this.reportsService.getAttendanceAnalytics(filters);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 5. Academic Progress by Learning Track
  // ────────────────────────────────────────────────────────────────────────────────

  @Get('progress/analytics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async getProgressAnalytics(@Query() query: any) {
    const filters: any = {};

    if (query.learningProgram) {
      filters.learningProgram = query.learningProgram;
    }

    if (query.status) {
      filters.status = query.status;
    }

    return this.reportsService.getProgressAnalytics(filters);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 6. Registration Reports
  // ────────────────────────────────────────────────────────────────────────────────

  @Get('registrations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async getRegistrationReports(@Query() query: any) {
    const filters: any = {};

    if (query.startDate) {
      filters.startDate = query.startDate;
    }

    if (query.endDate) {
      filters.endDate = query.endDate;
    }

    if (query.country) {
      filters.country = query.country;
    }

    if (query.level) {
      filters.level = query.level;
    }

    return this.reportsService.getRegistrationReports(filters);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 7. Parent Activity Reports
  // ────────────────────────────────────────────────────────────────────────────────

  @Get('parents/activity')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async getParentActivityReports(@Query() query: any) {
    const filters: any = {};

    if (query.startDate) {
      filters.startDate = query.startDate;
    }

    if (query.endDate) {
      filters.endDate = query.endDate;
    }

    if (query.country) {
      filters.country = query.country;
    }

    return this.reportsService.getParentActivityReports(filters);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 8. Homework Reports
  // ────────────────────────────────────────────────────────────────────────────────

  @Get('homework')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async getHomeworkReports(@Query() query: any) {
    const filters: any = {};

    if (query.startDate) {
      filters.startDate = query.startDate;
    }

    if (query.endDate) {
      filters.endDate = query.endDate;
    }

    if (query.difficulty) {
      filters.difficulty = query.difficulty;
    }

    if (query.status) {
      filters.status = query.status;
    }

    return this.reportsService.getHomeworkReports(filters);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 9. Exam Reports
  // ────────────────────────────────────────────────────────────────────────────────

  @Get('exams')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async getExamReports(@Query() query: any) {
    const filters: any = {};

    if (query.startDate) {
      filters.startDate = query.startDate;
    }

    if (query.endDate) {
      filters.endDate = query.endDate;
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.learningTrack) {
      filters.learningTrack = query.learningTrack;
    }

    return this.reportsService.getExamReports(filters);
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 10. Teacher Replacement Reports
  // ────────────────────────────────────────────────────────────────────────────────

  @Get('teacher-replacements')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async getTeacherReplacementReports(@Query() query: any) {
    const filters: any = {};

    if (query.startDate) {
      filters.startDate = query.startDate;
    }

    if (query.endDate) {
      filters.endDate = query.endDate;
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.reason) {
      filters.reason = query.reason;
    }

    return this.reportsService.getTeacherReplacementReports(filters);
  }
}

import { Controller, Get, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomAnalyticsService } from './zoom-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';
import { Parent } from '../parents/entities/parent.entity';
import { Student } from '../students/entities/student.entity';

@Controller('zoom-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZoomAnalyticsController {
  constructor(
    private readonly zoomAnalyticsService: ZoomAnalyticsService,
    private readonly teachersService: TeachersService,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
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
  @Roles(
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.QIRAT_MANAGER,
  )
  async getStudentAnalytics(@Request() req, @Param('studentId') studentId: string) {
    if (req.user.role === UserRole.PARENT) {
      const parent = await this.parentRepository.findOne({
        where: { user: { id: req.user.id } },
        relations: ['students'],
      });
      if (!parent || !parent.students.some((s) => s.id === studentId)) {
        throw new ForbiddenException('You can only view your own children\'s analytics');
      }
    }
    if (req.user.role === UserRole.STUDENT) {
      const student = await this.studentRepository.findOne({
        where: { id: studentId, userId: req.user.id },
      });
      if (!student) {
        throw new ForbiddenException('You can only view your own analytics');
      }
    }
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

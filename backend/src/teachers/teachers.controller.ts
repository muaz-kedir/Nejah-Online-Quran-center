import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { StudentManagementService } from '../students/student-management.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { ResolveComplaintDto } from './dto/resolve-complaint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(
    private readonly teachersService: TeachersService,
    private readonly studentManagementService: StudentManagementService,
  ) {}

  private authenticatedUserId(req: { user?: { id?: string } }): string {
    const userId = req.user?.id;
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }
    return userId;
  }

  // ─── Teacher self-service (scoped to logged-in teacher only) ───

  @Get('dashboard')
  @Roles(UserRole.TEACHER)
  async getTeacherDashboard(@Req() req: any) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(
      this.authenticatedUserId(req),
    );
    return this.teachersService.getTeacherDashboardData(teacher.id);
  }

  @Get('my-dashboard-stats')
  @Roles(UserRole.TEACHER)
  async getMyDashboardStats(@Req() req: any) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(
      this.authenticatedUserId(req),
    );
    return this.teachersService.getTeacherDashboardStats(teacher.id);
  }

  @Get('students')
  @Roles(UserRole.TEACHER)
  async getTeacherStudents(@Req() req: any, @Query() query: any) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(
      this.authenticatedUserId(req),
    );
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const search = query.search || '';
    return this.teachersService.getTeacherStudents(teacher.id, page, limit, search);
  }

  @Get('students/:studentId')
  @Roles(UserRole.TEACHER)
  async getTeacherStudent(@Req() req: any, @Param('studentId') studentId: string) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(
      this.authenticatedUserId(req),
    );
    return this.teachersService.getFullStudentProfile(teacher.id, studentId);
  }

  @Get('schedule')
  @Roles(UserRole.TEACHER)
  async getTeacherSchedule(@Req() req: any) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(
      this.authenticatedUserId(req),
    );
    return this.teachersService.getTeacherSchedule(teacher.id);
  }

  @Get('notifications')
  @Roles(UserRole.TEACHER)
  async getTeacherNotifications(@Req() req: any, @Query() query: any) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(
      this.authenticatedUserId(req),
    );
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    return this.teachersService.getTeacherNotifications(teacher.id, page, limit);
  }

  @Patch('profile')
  @Roles(UserRole.TEACHER)
  async updateMyProfile(@Req() req: any, @Body() updateTeacherDto: UpdateTeacherDto) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(
      this.authenticatedUserId(req),
    );
    return this.teachersService.update(teacher.id, updateTeacherDto);
  }

  // ─── Admin / staff management ───

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  getOverallStats() {
    return this.teachersService.getOverallStats();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.FINANCE_MANAGER)
  findAll(@Query() queryDto: QueryTeacherDto) {
    return this.teachersService.findAll(queryDto);
  }

  @Get(':id/students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  getAssignedStudents(@Param('id') id: string) {
    return this.studentManagementService.getAssignedStudentsForTeacher(id);
  }

  @Get(':id/analytics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  getAnalytics(@Param('id') id: string) {
    return this.teachersService.getTeacherAnalytics(id);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  async update(@Req() req: any, @Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    // TEACHER role can only update their own profile
    if (req.user?.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(
        this.authenticatedUserId(req),
      );
      if (teacher.id !== id) {
        throw new ForbiddenException('You can only update your own profile');
      }
      return this.teachersService.update(teacher.id, updateTeacherDto);
    }
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }

  @Post(':id/complaints')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async createComplaint(@Req() req: any, @Param('id') id: string, @Body() dto: CreateComplaintDto) {
    const userId = this.authenticatedUserId(req);
    return this.teachersService.createComplaint(id, userId, dto);
  }

  @Get(':id/complaints')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async getComplaints(@Param('id') id: string) {
    return this.teachersService.getTeacherComplaints(id);
  }

  @Patch(':id/complaints/:complaintId/resolve')
  @Roles(UserRole.SUPER_ADMIN)
  async resolveComplaint(
    @Req() req: any,
    @Param('complaintId') complaintId: string,
    @Body() dto: ResolveComplaintDto,
    @Query('status') status: string,
  ) {
    const userId = this.authenticatedUserId(req);
    return this.teachersService.resolveComplaint(complaintId, userId, (status as 'resolved' | 'dismissed') || 'resolved', dto);
  }

  @Post(':id/assign-students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  assignStudents(@Param('id') id: string, @Body('studentIds') studentIds: string[]) {
    return this.teachersService.assignStudents(id, studentIds);
  }
}

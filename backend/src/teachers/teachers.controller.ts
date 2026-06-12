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
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

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
    return this.teachersService.getTeacherStudents(teacher.id, page, limit);
  }

  @Get('students/:studentId')
  @Roles(UserRole.TEACHER)
  async getTeacherStudent(@Req() req: any, @Param('studentId') studentId: string) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(
      this.authenticatedUserId(req),
    );
    return this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
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

  // ─── Admin / staff management ───

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  getOverallStats() {
    return this.teachersService.getOverallStats();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  findAll(@Query() queryDto: QueryTeacherDto) {
    return this.teachersService.findAll(queryDto);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Get(':id/analytics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  getAnalytics(@Param('id') id: string) {
    return this.teachersService.getTeacherAnalytics(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }

  @Post(':id/assign-students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  assignStudents(
    @Param('id') id: string,
    @Body('studentIds') studentIds: string[],
  ) {
    return this.teachersService.assignStudents(id, studentIds);
  }
}

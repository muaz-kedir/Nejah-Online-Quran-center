import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LiveSessionService } from './live-session.service';
import { SessionAttendanceService } from './session-attendance.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { QueryLiveSessionDto } from './dto/query-live-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';
import { ForbiddenException } from '@nestjs/common';

@Controller('live-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LiveSessionController {
  constructor(
    private readonly liveSessionService: LiveSessionService,
    private readonly sessionAttendanceService: SessionAttendanceService,
    private readonly teachersService: TeachersService,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async create(@Request() req, @Body() dto: CreateLiveSessionDto) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      dto.teacherId = teacher.id;
    }
    return this.liveSessionService.create(dto);
  }

  @Post('with-zoom')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async createWithZoom(@Request() req, @Body() dto: CreateLiveSessionDto) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      dto.teacherId = teacher.id;
    }
    return this.liveSessionService.createWithZoom(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  async findAll(@Query() query: QueryLiveSessionDto) {
    return this.liveSessionService.findAll(query);
  }

  @Get('upcoming')
  @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getUpcoming(@Request() req, @Query('studentId') studentId?: string) {
    let teacherId: string | undefined;
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      teacherId = teacher.id;
    }
    return this.liveSessionService.getUpcoming(teacherId, studentId);
  }

  @Get('live')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  async getLiveSessions() {
    return this.liveSessionService.getLiveSessions();
  }

  @Get('today')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getTodaysSessions(@Request() req) {
    let teacherId: string | undefined;
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      teacherId = teacher.id;
    }
    return this.liveSessionService.getTodaysSessions(teacherId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getStats() {
    return this.liveSessionService.getSessionStats();
  }

  @Get('teacher')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getTeacherSessions(@Request() req, @Query('page') page?: number, @Query('limit') limit?: number) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      return this.liveSessionService.getTeacherSessions(teacher.id, page, limit);
    }
    throw new ForbiddenException('Teacher access required');
  }

  @Get('student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getStudentSessions(@Param('studentId') studentId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.liveSessionService.getStudentSessions(studentId, page, limit);
  }

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async findOne(@Param('id') id: string) {
    return this.liveSessionService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async update(@Param('id') id: string, @Body() dto: UpdateLiveSessionDto, @Request() req) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      dto.teacherId = teacher.id;
    }
    return this.liveSessionService.update(id, dto);
  }

  @Post(':id/start')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async start(@Param('id') id: string, @Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.liveSessionService.start(teacher.id, id);
  }

  @Post(':id/complete')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async complete(@Param('id') id: string) {
    return this.liveSessionService.complete(id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cancel(@Param('id') id: string) {
    return this.liveSessionService.cancel(id);
  }
}

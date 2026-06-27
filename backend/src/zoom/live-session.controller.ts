import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { Parent } from '../parents/entities/parent.entity';
import { Student } from '../students/entities/student.entity';
import { ScheduleSessionGeneratorService } from './schedule-session-generator.service';

@Controller('live-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LiveSessionController {
  constructor(
    private readonly liveSessionService: LiveSessionService,
    private readonly sessionAttendanceService: SessionAttendanceService,
    private readonly teachersService: TeachersService,
    private readonly scheduleSessionGenerator: ScheduleSessionGeneratorService,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async findAll(@Query() query: QueryLiveSessionDto) {
    return this.liveSessionService.findAll(query);
  }

  @Get('upcoming')
  @Roles(
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.QIRAT_MANAGER,
  )
  async getUpcoming(@Request() req, @Query('studentId') studentId?: string) {
    let teacherId: string | undefined;
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      teacherId = teacher.id;
    }
    return this.liveSessionService.getUpcoming(teacherId, studentId);
  }

  @Get('live')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
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
  async getTeacherSessions(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      return this.liveSessionService.getTeacherSessions(teacher.id, page, limit);
    }
    throw new ForbiddenException('Teacher access required');
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
  async getStudentSessions(
    @Request() req,
    @Param('studentId') studentId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (req.user.role === UserRole.PARENT) {
      const parent = await this.parentRepository.findOne({
        where: { user: { id: req.user.id } },
        relations: ['students'],
      });
      if (!parent || !parent.students.some((s) => s.id === studentId)) {
        throw new ForbiddenException('You can only view your own children\'s sessions');
      }
    }
    if (req.user.role === UserRole.STUDENT) {
      const student = await this.studentRepository.findOne({
        where: { id: studentId, userId: req.user.id },
      });
      if (!student) {
        throw new ForbiddenException('You can only view your own sessions');
      }
    }
    return this.liveSessionService.getStudentSessions(studentId, page, limit);
  }

  @Get('for-schedule-today/:scheduleId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getSessionForScheduleToday(@Request() req, @Param('scheduleId') scheduleId: string) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertScheduleBelongsToTeacher(teacher.id, scheduleId);
    }
    return this.scheduleSessionGenerator.getTodaySessionForSchedule(scheduleId);
  }

  @Get('student-live/:studentId')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStudentLiveSession(@Request() req, @Param('studentId') studentId: string) {
    if (req.user.role === UserRole.STUDENT) {
      const student = await this.studentRepository.findOne({
        where: { id: studentId, userId: req.user.id },
      });
      if (!student) throw new ForbiddenException('You can only view your own sessions');
    }
    const live = await this.liveSessionService.getStudentActiveLiveSession(studentId);
    const upcoming = await this.liveSessionService.getStudentUpcomingTodaySession(studentId);
    return { live, upcoming };
  }

  @Post(':id/join')
  @Roles(UserRole.TEACHER, UserRole.STUDENT)
  async joinSession(@Param('id') id: string, @Request() req) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      return this.liveSessionService.joinSession(id, {
        teacherId: teacher.id,
        isTeacher: true,
      });
    }

    const student = await this.studentRepository.findOne({ where: { userId: req.user.id } });
    if (!student) throw new ForbiddenException('Student profile not found');
    return this.liveSessionService.joinSession(id, { studentId: student.id, isTeacher: false });
  }

  @Post(':id/leave')
  @Roles(UserRole.TEACHER, UserRole.STUDENT)
  async leaveSession(@Param('id') id: string, @Request() req) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      return this.liveSessionService.leaveSession(id, {
        teacherId: teacher.id,
        isTeacher: true,
      });
    }

    const student = await this.studentRepository.findOne({ where: { userId: req.user.id } });
    if (!student) throw new ForbiddenException('Student profile not found');
    return this.liveSessionService.leaveSession(id, { studentId: student.id, isTeacher: false });
  }

  @Get(':id/classroom')
  @Roles(UserRole.TEACHER, UserRole.STUDENT)
  async getClassroomAccess(@Param('id') id: string, @Request() req) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      return this.liveSessionService.getClassroomAccess(id, {
        teacherId: teacher.id,
        isTeacher: true,
        userName: teacher.fullName,
        userEmail: teacher.email,
      });
    }

    const student = await this.studentRepository.findOne({ where: { userId: req.user.id } });
    if (!student) throw new ForbiddenException('Student profile not found');
    return this.liveSessionService.getClassroomAccess(id, {
      studentId: student.id,
      isTeacher: false,
      userName: student.fullName,
      userEmail: student.email || student.zoomEmail,
    });
  }

  @Post(':id/start')
  @Roles(UserRole.TEACHER)
  async startSession(@Param('id') id: string, @Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.liveSessionService.startSession(id, teacher.id);
  }

  @Post(':id/complete')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async complete(@Param('id') id: string, @Request() req) {
    return this.endSession(id, req);
  }

  @Post(':id/end')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async end(@Param('id') id: string, @Body() body: { completionReason?: string }, @Request() req) {
    return this.endSession(id, req, body?.completionReason);
  }

  @Post(':id/cancel')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cancel(@Param('id') id: string, @Body() body: { cancellationReason?: string }) {
    return this.liveSessionService.cancel(id, body?.cancellationReason);
  }

  @Post(':id/no-show')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markNoShow(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.liveSessionService.markNoShow(id, body?.reason);
  }

  @Post(':id/expire')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markExpired(@Param('id') id: string) {
    return this.liveSessionService.markExpired(id);
  }

  @Get(':id')
  @Roles(
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.QIRAT_MANAGER,
  )
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

  private async endSession(id: string, req: { user: { id: string; role: UserRole } }, completionReason?: string) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      const session = await this.liveSessionService.findById(id);
      if (session.teacherId !== teacher.id) {
        throw new ForbiddenException('You are not assigned to this session');
      }
    }
    return this.liveSessionService.complete(id, completionReason);
  }
}

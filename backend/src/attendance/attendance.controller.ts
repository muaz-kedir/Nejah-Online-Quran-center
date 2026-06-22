import { Controller, Post, Get, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { StartMeetingDto } from './dto/start-meeting.dto';
import { RecordStudentAttendanceDto } from './dto/record-student-attendance.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private teachersService: TeachersService,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  private async resolveStudentIdForUser(req: {
    user: { id: string; role: string };
    query?: { studentId?: string };
  }): Promise<string> {
    if (req.user.role === UserRole.STUDENT) {
      const student = await this.studentsRepository.findOne({
        where: { userId: req.user.id },
      });
      if (!student) {
        throw new ForbiddenException('Student profile not found');
      }
      return student.id;
    }
    const queryId = req.query?.studentId;
    if (!queryId) {
      throw new ForbiddenException('studentId is required');
    }
    return queryId;
  }

  private async resolveTeacherIdForUser(req: {
    user: { id: string; role: string };
  }): Promise<string> {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return teacher.id;
  }

  @Post('sessions')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async createSession(@Request() req, @Body() dto: CreateClassSessionDto) {
    if (req.user.role === UserRole.TEACHER) {
      dto.teacherId = await this.resolveTeacherIdForUser(req);
    }
    return this.attendanceService.createClassSession(dto);
  }

  @Post('sessions/start-meeting')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async startMeeting(@Body() dto: StartMeetingDto) {
    return this.attendanceService.startMeeting(dto);
  }

  @Post('sessions/end')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async endSession(@Body() dto: EndSessionDto) {
    return this.attendanceService.endSession(dto);
  }

  @Post('record')
  @Roles(
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.QIRAT_MANAGER,
  )
  async recordAttendance(@Request() req, @Body() dto: RecordStudentAttendanceDto) {
    if (req.user.role === UserRole.STUDENT) {
      dto.studentId = await this.resolveStudentIdForUser(req);
    } else if (!dto.studentId) {
      throw new BadRequestException('studentId is required');
    }
    return this.attendanceService.recordStudentAttendance(dto);
  }

  @Get('sessions/:id')
  @Roles(
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.QIRAT_MANAGER,
  )
  async getSession(@Param('id') id: string) {
    return this.attendanceService.getClassSessionWithAttendance(id);
  }

  @Get('sessions/by-schedule-today/:scheduleId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getSessionByScheduleToday(@Request() req, @Param('scheduleId') scheduleId: string) {
    let requestingTeacherId: string | undefined;
    if (req.user.role === UserRole.TEACHER) {
      requestingTeacherId = await this.resolveTeacherIdForUser(req);
      await this.teachersService.assertScheduleBelongsToTeacher(requestingTeacherId, scheduleId);
    }
    return this.attendanceService.getLiveClassSessionByScheduleToday(
      scheduleId,
      requestingTeacherId,
    );
  }

  @Get('student/live')
  @Roles(
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.QIRAT_MANAGER,
  )
  async getStudentLiveClass(@Request() req) {
    const studentId = await this.resolveStudentIdForUser(req);
    return this.attendanceService.getStudentLiveClass(studentId);
  }

  @Get('teacher/sessions')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getTeacherSessions(
    @Request() req,
    @Query('date') date?: string,
    @Query('teacherId') teacherIdQuery?: string,
  ) {
    const teacherId =
      req.user.role === UserRole.TEACHER ? await this.resolveTeacherIdForUser(req) : teacherIdQuery;
    const sessionDate = date ? new Date(date) : undefined;
    return this.attendanceService.getTeacherSessions(teacherId as string, sessionDate);
  }

  @Get('student/history')
  @Roles(
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.QIRAT_MANAGER,
  )
  async getStudentHistory(@Request() req, @Query('studentId') studentIdQuery?: string) {
    const studentId = await this.resolveStudentIdForUser({
      user: req.user,
      query: { studentId: studentIdQuery },
    });
    return this.attendanceService.getStudentAttendanceHistory(studentId);
  }

  @Get('student/stats')
  @Roles(
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.QIRAT_MANAGER,
  )
  async getStudentStats(@Request() req, @Query('studentId') studentIdQuery?: string) {
    const studentId = await this.resolveStudentIdForUser({
      user: req.user,
      query: { studentId: studentIdQuery },
    });
    return this.attendanceService.getAttendanceStats(studentId);
  }

  @Get('live-classes')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  async getLiveClasses() {
    return this.attendanceService.getLiveClasses();
  }

  @Get('todays-sessions')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getTodaysSessions(@Request() req) {
    const teacherId =
      req.user.role === UserRole.TEACHER ? await this.resolveTeacherIdForUser(req) : undefined;
    return this.attendanceService.getTodaysSessions(teacherId);
  }

  @Get('all-sessions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getAllSessions(
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.attendanceService.getAllSessions(limitNum, status);
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
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

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private teachersService: TeachersService,
  ) {}

  private async resolveTeacherIdForUser(req: { user: { id: string; role: string } }): Promise<string> {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return teacher.id;
  }

  @Post('sessions')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createSession(@Request() req, @Body() dto: CreateClassSessionDto) {
    if (req.user.role === UserRole.TEACHER) {
      dto.teacherId = await this.resolveTeacherIdForUser(req);
    }
    return this.attendanceService.createClassSession(dto);
  }

  @Post('sessions/start-meeting')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async startMeeting(@Body() dto: StartMeetingDto) {
    return this.attendanceService.startMeeting(dto);
  }

  @Post('sessions/end')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async endSession(@Body() dto: EndSessionDto) {
    return this.attendanceService.endSession(dto);
  }

  @Post('record')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async recordAttendance(@Body() dto: RecordStudentAttendanceDto) {
    return this.attendanceService.recordStudentAttendance(dto);
  }

  @Get('sessions/:id')
  @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSession(@Param('id') id: string) {
    return this.attendanceService.getClassSessionWithAttendance(id);
  }

  @Get('sessions/by-schedule-today/:scheduleId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStudentLiveClass(@Request() req) {
    const studentId = req.user.studentId || req.user.id;
    return this.attendanceService.getStudentLiveClass(studentId);
  }

  @Get('teacher/sessions')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getTeacherSessions(
    @Request() req,
    @Query('date') date?: string,
    @Query('teacherId') teacherIdQuery?: string,
  ) {
    const teacherId =
      req.user.role === UserRole.TEACHER
        ? await this.resolveTeacherIdForUser(req)
        : teacherIdQuery;
    const sessionDate = date ? new Date(date) : undefined;
    return this.attendanceService.getTeacherSessions(teacherId as string, sessionDate);
  }

  @Get('student/history')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStudentHistory(@Request() req, @Query('studentId') studentIdQuery?: string) {
    const studentId = studentIdQuery || req.user.studentId || req.user.id;
    return this.attendanceService.getStudentAttendanceHistory(studentId);
  }

  @Get('student/stats')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStudentStats(@Request() req, @Query('studentId') studentIdQuery?: string) {
    const studentId = studentIdQuery || req.user.studentId || req.user.id;
    return this.attendanceService.getAttendanceStats(studentId);
  }

  @Get('live-classes')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER)
  async getLiveClasses() {
    return this.attendanceService.getLiveClasses();
  }

  @Get('todays-sessions')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getTodaysSessions(@Request() req) {
    const teacherId =
      req.user.role === UserRole.TEACHER ? await this.resolveTeacherIdForUser(req) : undefined;
    return this.attendanceService.getTodaysSessions(teacherId);
  }
}

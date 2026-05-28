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

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('sessions')
  @Roles('teacher', 'admin', 'superadmin')
  async createSession(@Body() dto: CreateClassSessionDto) {
    return this.attendanceService.createClassSession(dto);
  }

  @Post('sessions/start-meeting')
  @Roles('teacher', 'admin', 'superadmin')
  async startMeeting(@Body() dto: StartMeetingDto) {
    return this.attendanceService.startMeeting(dto);
  }

  @Post('sessions/end')
  @Roles('teacher', 'admin', 'superadmin')
  async endSession(@Body() dto: EndSessionDto) {
    return this.attendanceService.endSession(dto);
  }

  @Post('record')
  @Roles('student', 'teacher', 'admin', 'superadmin')
  async recordAttendance(@Body() dto: RecordStudentAttendanceDto) {
    return this.attendanceService.recordStudentAttendance(dto);
  }

  @Get('sessions/:id')
  @Roles('teacher', 'student', 'parent', 'admin', 'superadmin')
  async getSession(@Param('id') id: string) {
    return this.attendanceService.getClassSessionWithAttendance(id);
  }

  @Get('sessions/by-schedule-today/:scheduleId')
  @Roles('teacher', 'admin', 'superadmin')
  async getSessionByScheduleToday(@Param('scheduleId') scheduleId: string) {
    return this.attendanceService.getLiveClassSessionByScheduleToday(scheduleId);
  }

  @Get('student/live')
  @Roles('student', 'parent', 'admin', 'superadmin')
  async getStudentLiveClass(@Request() req) {
    const studentId = req.user.studentId || req.user.id;
    return this.attendanceService.getStudentLiveClass(studentId);
  }

  @Get('teacher/sessions')
  @Roles('teacher', 'admin', 'superadmin')
  async getTeacherSessions(
    @Request() req,
    @Query('date') date?: string,
  ) {
    const teacherId = req.user.teacherId || req.user.id;
    const sessionDate = date ? new Date(date) : undefined;
    return this.attendanceService.getTeacherSessions(teacherId, sessionDate);
  }

  @Get('student/history')
  @Roles('student', 'parent', 'admin', 'superadmin')
  async getStudentHistory(
    @Request() req,
    @Query('studentId') studentIdQuery?: string,
  ) {
    const studentId = studentIdQuery || req.user.studentId || req.user.id;
    return this.attendanceService.getStudentAttendanceHistory(studentId);
  }

  @Get('student/stats')
  @Roles('student', 'parent', 'admin', 'superadmin')
  async getStudentStats(
    @Request() req,
    @Query('studentId') studentIdQuery?: string,
  ) {
    const studentId = studentIdQuery || req.user.studentId || req.user.id;
    return this.attendanceService.getAttendanceStats(studentId);
  }

  @Get('live-classes')
  @Roles('admin', 'superadmin', 'teacher')
  async getLiveClasses() {
    return this.attendanceService.getLiveClasses();
  }

  @Get('todays-sessions')
  @Roles('teacher', 'admin', 'superadmin')
  async getTodaysSessions(@Request() req) {
    const teacherId = req.user.teacherId || req.user.id;
    return this.attendanceService.getTodaysSessions(teacherId);
  }
}

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionAttendanceService } from './session-attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Parent } from '../parents/entities/parent.entity';
import { Student } from '../students/entities/student.entity';

@Controller('session-attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionAttendanceController {
  constructor(
    private readonly sessionAttendanceService: SessionAttendanceService,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  @Get('student/:studentId')
  @Roles(
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.QIRAT_MANAGER,
  )
  async getStudentAttendance(
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
        throw new ForbiddenException('You can only view your own children\'s attendance');
      }
    }
    if (req.user.role === UserRole.STUDENT) {
      const student = await this.studentRepository.findOne({
        where: { id: studentId, userId: req.user.id },
      });
      if (!student) {
        throw new ForbiddenException('You can only view your own attendance');
      }
    }
    return this.sessionAttendanceService.getAttendanceForStudent(studentId, page, limit);
  }

  @Get('student/:studentId/stats')
  @Roles(
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.TEACHER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.QIRAT_MANAGER,
  )
  async getStudentAttendanceStats(@Request() req, @Param('studentId') studentId: string) {
    if (req.user.role === UserRole.PARENT) {
      const parent = await this.parentRepository.findOne({
        where: { user: { id: req.user.id } },
        relations: ['students'],
      });
      if (!parent || !parent.students.some((s) => s.id === studentId)) {
        throw new ForbiddenException('You can only view your own children\'s attendance stats');
      }
    }
    if (req.user.role === UserRole.STUDENT) {
      const student = await this.studentRepository.findOne({
        where: { id: studentId, userId: req.user.id },
      });
      if (!student) {
        throw new ForbiddenException('You can only view your own attendance stats');
      }
    }
    return this.sessionAttendanceService.getAttendanceStats(studentId);
  }

  @Get('session/:sessionId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getSessionAttendance(@Param('sessionId') sessionId: string) {
    return this.sessionAttendanceService.getAttendanceForSession(sessionId);
  }
}
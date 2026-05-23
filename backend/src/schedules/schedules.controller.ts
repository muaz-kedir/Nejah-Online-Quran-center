import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT)
  findAll(
    @Query('studentId') studentId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.schedulesService.findAll(studentId, teacherId);
  }

  @Get('student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT)
  getStudentSchedules(@Param('studentId') studentId: string) {
    return this.schedulesService.getStudentSchedules(studentId);
  }

  @Get('teacher/:teacherId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  getTeacherSchedules(@Param('teacherId') teacherId: string) {
    return this.schedulesService.getTeacherSchedules(teacherId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT)
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }
}

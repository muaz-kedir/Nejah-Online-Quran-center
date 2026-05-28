import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.createSchedule(createScheduleDto);
  }

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

  @Get('teacher/:teacherId/day/:day')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  getTeacherSchedulesByDay(
    @Param('teacherId') teacherId: string,
    @Param('day') day: string,
  ) {
    return this.schedulesService.getTeacherSchedulesByDay(teacherId, day);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT)
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.schedulesService.updateSchedule(id, updateScheduleDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  remove(@Param('id') id: string) {
    return this.schedulesService.deleteSchedule(id);
  }
}

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
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  private readonly logger = new Logger(SchedulesController.name);

  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly teachersService: TeachersService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  async create(@Request() req, @Body() body: any) {
    // Bypass global ValidationPipe to log the raw body before any transformation
    this.logger.log(`=== RAW BODY: ${JSON.stringify(body)} ===`);

    // Manually validate with class-validator
    const dto: CreateScheduleDto = plainToInstance(CreateScheduleDto, body);
    const errors = await validate(dto as object);
    if (errors.length > 0) {
      this.logger.warn(`Validation errors for body ${JSON.stringify(body)}: ${JSON.stringify(errors)}`);
      throw new BadRequestException(errors);
    }

    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      dto.teacherId = teacher.id;
    }
    return this.schedulesService.createSchedule(dto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.QIRAT_MANAGER,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  async findAll(
    @Request() req,
    @Query('studentId') studentId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      return this.schedulesService.findAll(studentId, teacher.id);
    }
    return this.schedulesService.findAll(studentId, teacherId);
  }

  @Get('student/:studentId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.QIRAT_MANAGER,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  async getStudentSchedules(@Request() req, @Param('studentId') studentId: string) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertStudentBelongsToTeacher(teacher.id, studentId);
    }
    return this.schedulesService.getStudentSchedules(studentId);
  }

  @Get('teacher/:teacherId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  async getTeacherSchedules(@Request() req, @Param('teacherId') teacherId: string) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      if (teacherId !== teacher.id) {
        throw new ForbiddenException('You can only view your own schedule');
      }
    }
    return this.schedulesService.getTeacherSchedules(teacherId);
  }

  @Get('teacher/:teacherId/day/:day')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  async getTeacherSchedulesByDay(
    @Request() req,
    @Param('teacherId') teacherId: string,
    @Param('day') day: string,
  ) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      if (teacherId !== teacher.id) {
        throw new ForbiddenException('You can only view your own schedule');
      }
    }
    return this.schedulesService.getTeacherSchedulesByDay(teacherId, day);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.QIRAT_MANAGER,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  async findOne(@Request() req, @Param('id') id: string) {
    const schedule = await this.schedulesService.findOne(id);
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      if (schedule.teacherId !== teacher.id) {
        throw new ForbiddenException('You do not have access to this schedule');
      }
    }
    return schedule;
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertScheduleBelongsToTeacher(teacher.id, id);
      updateScheduleDto.teacherId = teacher.id;
    }
    return this.schedulesService.updateSchedule(id, updateScheduleDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  async remove(@Request() req, @Param('id') id: string) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertScheduleBelongsToTeacher(teacher.id, id);
    }
    return this.schedulesService.deleteSchedule(id);
  }
}

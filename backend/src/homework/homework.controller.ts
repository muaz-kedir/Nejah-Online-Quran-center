import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkStatusDto } from './dto/update-homework-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';

@Controller('homework')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HomeworkController {
  constructor(
    private homeworkService: HomeworkService,
    private teachersService: TeachersService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async create(@Request() req, @Body() dto: CreateHomeworkDto) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertStudentBelongsToTeacher(teacher.id, dto.studentId);
    }
    return this.homeworkService.create(dto);
  }

  @Get('student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  async findByStudent(@Request() req, @Param('studentId') studentId: string) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertStudentBelongsToTeacher(teacher.id, studentId);
    }
    return this.homeworkService.findByStudent(studentId);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateHomeworkStatusDto,
  ) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      const homework = await this.homeworkService.findOne(id);
      await this.teachersService.assertStudentBelongsToTeacher(teacher.id, homework.studentId);
    }
    return this.homeworkService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async remove(@Request() req, @Param('id') id: string) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      const homework = await this.homeworkService.findOne(id);
      await this.teachersService.assertStudentBelongsToTeacher(teacher.id, homework.studentId);
    }
    await this.homeworkService.remove(id);
    return { message: 'Homework deleted successfully' };
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { TeachersService } from '../teachers/teachers.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { DelegateStudentDto } from './dto/delegate-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly teachersService: TeachersService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.PARENT)
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.QIRAT_MANAGER,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  async findAll(@Request() req, @Query() queryDto: QueryStudentDto) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      queryDto.teacherId = teacher.id;
    }
    return this.studentsService.findAll(queryDto);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  getStats() {
    return this.studentsService.getStats();
  }

  @Post('delegate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.PARENT)
  delegateStudentToTeacher(@Body() delegateDto: DelegateStudentDto) {
    return this.studentsService.delegateStudentToTeacher(delegateDto);
  }

  @Get('unassigned')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  getUnassigned() {
    return this.studentsService.findAllUnassigned();
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
    const student = await this.studentsService.findOne(id);
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      if (student.teacherId !== teacher.id) {
        throw new ForbiddenException('You do not have access to this student');
      }
    }
    return student;
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.PARENT)
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  changeStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string; reason: string; notes: string },
  ) {
    return this.studentsService.changeStatus(id, body.status, body.reason, body.notes, req.user.id);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  async resetPassword(@Param('id') id: string, @Body('newPassword') newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    await this.studentsService.resetPassword(id, newPassword);
    return { message: 'Password reset successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';

@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(
    private progressService: ProgressService,
    private teachersService: TeachersService,
  ) {}

  @Get('student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  async getProgress(@Request() req, @Param('studentId') studentId: string) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertStudentBelongsToTeacher(teacher.id, studentId);
    }
    return this.progressService.getOrCreateProgress(studentId);
  }

  @Patch('student/:studentId/log')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async logProgress(
    @Request() req,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertStudentBelongsToTeacher(teacher.id, studentId);
    }
    return this.progressService.logProgress(studentId, dto);
  }

  @Post('student/:studentId/feedback')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async addFeedback(
    @Request() req,
    @Param('studentId') studentId: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    let teacherId: string;
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertStudentBelongsToTeacher(teacher.id, studentId);
      teacherId = teacher.id;
    } else {
      teacherId = req.user.id;
    }
    return this.progressService.addFeedback(teacherId, studentId, dto.content);
  }

  @Get('student/:studentId/feedback')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  async getFeedback(@Request() req, @Param('studentId') studentId: string) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertStudentBelongsToTeacher(teacher.id, studentId);
    }
    return this.progressService.getStudentFeedback(studentId);
  }
}

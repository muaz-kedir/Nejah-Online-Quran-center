import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
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

  @Get('surahs')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  getSurahs() {
    return this.progressService.getSurahList();
  }

  @Get('student/:studentId/learning-context')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  async getLearningContext(@Request() req, @Param('studentId') studentId: string) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
    } else if (req.user.role === UserRole.STUDENT || req.user.role === UserRole.PARENT) {
      await this.progressService.assertUserCanViewStudentProgress(
        req.user.id,
        req.user.role,
        studentId,
      );
    }
    return this.progressService.getLearningContext(studentId);
  }

  @Get('student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  async getProgress(@Request() req, @Param('studentId') studentId: string) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
    } else if (req.user.role === UserRole.STUDENT || req.user.role === UserRole.PARENT) {
      await this.progressService.assertUserCanViewStudentProgress(
        req.user.id,
        req.user.role,
        studentId,
      );
    }
    return this.progressService.getOrCreateProgress(studentId);
  }

  @Get('student/:studentId/logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  async getProgressLogs(
    @Request() req,
    @Param('studentId') studentId: string,
    @Query('limit') limit?: string,
  ) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
    } else if (req.user.role === UserRole.STUDENT || req.user.role === UserRole.PARENT) {
      await this.progressService.assertUserCanViewStudentProgress(
        req.user.id,
        req.user.role,
        studentId,
      );
    }
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.progressService.getStudentLogs(studentId, parsedLimit);
  }

  @Patch('student/:studentId/log')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async logProgress(
    @Request() req,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    let teacherId: string | undefined;
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertTeacherCanManageStudent(teacher.id, studentId);
      teacherId = teacher.id;
    }
    return this.progressService.logProgress(studentId, dto, teacherId);
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
      await this.teachersService.assertTeacherCanManageStudent(teacher.id, studentId);
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
      await this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
    } else if (req.user.role === UserRole.STUDENT || req.user.role === UserRole.PARENT) {
      await this.progressService.assertUserCanViewStudentProgress(
        req.user.id,
        req.user.role,
        studentId,
      );
    }
    return this.progressService.getStudentFeedback(studentId);
  }
}

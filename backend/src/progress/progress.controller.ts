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
import { LevelProgressionService } from './level-progression.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import {
  LevelActionDto,
  RecommendPromotionDto,
  UpdateProgressionSettingsDto,
} from './dto/level-action.dto';
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
    private levelProgressionService: LevelProgressionService,
    private teachersService: TeachersService,
  ) {}

  // -------------------------------------------------- progression settings

  @Get('progression-settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getProgressionSettings() {
    return this.levelProgressionService.getSettings();
  }

  @Patch('progression-settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  updateProgressionSettings(@Body() dto: UpdateProgressionSettingsDto) {
    return this.levelProgressionService.updateSettings(dto);
  }

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

  @Get('student/:studentId/learning-path')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  async getLearningPath(@Request() req, @Param('studentId') studentId: string) {
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
    return this.levelProgressionService.getLearningPath(studentId);
  }

  @Get('student/:studentId/level-history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  async getLevelHistory(@Request() req, @Param('studentId') studentId: string) {
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
    const history = await this.levelProgressionService.getLevelHistory(studentId);
    return history.map((h) => ({
      id: h.id,
      level: h.level,
      learningTrack: h.learningTrack,
      startedAt: h.startedAt,
      completedAt: h.completedAt,
      status: h.status,
      changeType: h.changeType,
      teacherName: h.teacher?.fullName || null,
      progressPercentage: h.progressPercentageSnapshot,
      reason: h.reason,
      createdAt: h.createdAt,
    }));
  }

  @Post('student/:studentId/level-action')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async applyLevelAction(
    @Request() req,
    @Param('studentId') studentId: string,
    @Body() dto: LevelActionDto,
  ) {
    return this.levelProgressionService.applyManualAction(studentId, dto, req.user.id);
  }

  @Post('student/:studentId/recommend-promotion')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async recommendPromotion(
    @Request() req,
    @Param('studentId') studentId: string,
    @Body() dto: RecommendPromotionDto,
  ) {
    if (req.user.role === UserRole.TEACHER) {
      const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
      await this.teachersService.assertTeacherCanManageStudent(teacher.id, studentId);
    }
    await this.levelProgressionService.recommendPromotion(studentId, req.user.id, dto.reason);
    return { success: true, message: 'Student promoted to the next level' };
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

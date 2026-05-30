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

@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get('student/:studentId')
  @Roles('super_admin', 'admin', 'teacher', 'student', 'parent')
  async getProgress(@Param('studentId') studentId: string) {
    return this.progressService.getOrCreateProgress(studentId);
  }

  @Patch('student/:studentId/log')
  @Roles('super_admin', 'admin', 'teacher')
  async logProgress(
    @Param('studentId') studentId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.progressService.logProgress(studentId, dto);
  }

  @Post('student/:studentId/feedback')
  @Roles('super_admin', 'admin', 'teacher')
  async addFeedback(
    @Param('studentId') studentId: string,
    @Body() dto: CreateFeedbackDto,
    @Request() req,
  ) {
    const teacherId = req.user.teacherId || req.user.id;
    return this.progressService.addFeedback(teacherId, studentId, dto.content);
  }

  @Get('student/:studentId/feedback')
  @Roles('super_admin', 'admin', 'teacher', 'student', 'parent')
  async getFeedback(@Param('studentId') studentId: string) {
    return this.progressService.getStudentFeedback(studentId);
  }
}

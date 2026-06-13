import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ZoomService } from './zoom.service';
import { LiveSessionService } from './live-session.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';

@Controller('recordings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecordingController {
  constructor(
    private readonly zoomService: ZoomService,
    private readonly liveSessionService: LiveSessionService,
    private readonly teachersService: TeachersService,
  ) {}

  @Get('session/:sessionId')
  @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getSessionRecordings(@Param('sessionId') sessionId: string) {
    const session = await this.liveSessionService.findById(sessionId);
    if (session.recordingData) {
      return session.recordingData;
    }

    if (session.zoomMeetingId) {
      const recordings = await this.zoomService.getRecordings(session.zoomMeetingId);
      return recordings;
    }

    return [];
  }

  @Get('teacher')
  @Roles(UserRole.TEACHER)
  async getTeacherRecordings(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    const integration = await this.zoomService.getTeacherIntegration(teacher.id);
    if (!integration?.zoomUserId) {
      return [];
    }

    return this.zoomService.listRecordings(integration.zoomUserId, from, to);
  }

  @Get('all')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getAllRecordings(@Query('from') from?: string, @Query('to') to?: string) {
    const integrations = await this.zoomService.getAllIntegrations();
    const allRecordings = [];

    for (const integration of integrations) {
      if (integration.zoomUserId) {
        const recordings = await this.zoomService.listRecordings(
          integration.zoomUserId,
          from,
          to,
        );
        allRecordings.push(...recordings);
      }
    }

    return allRecordings;
  }
}

import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ZoomService } from './zoom.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';
import { Throttle } from '@nestjs/throttler';

function sanitizeIntegration(integration: any) {
  if (!integration) return null;
  const { accessToken, refreshToken, ...safe } = integration;
  return safe;
}

@Controller('zoom-oauth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZoomOAuthController {
  constructor(
    private readonly zoomService: ZoomService,
    private readonly teachersService: TeachersService,
  ) {}

  @Get('user')
  @Roles(UserRole.TEACHER)
  async getOAuthUser(@Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return sanitizeIntegration(await this.zoomService.getTeacherIntegration(teacher.id));
  }

  @Post('refresh')
  @Roles(UserRole.TEACHER)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async refreshToken(@Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    const result = await this.zoomService.refreshTeacherOAuthToken(teacher.id);
    return {
      message: 'Token refreshed successfully',
      expiresAt: result.expiresAt,
    };
  }

  @Get('health')
  @Roles(UserRole.TEACHER)
  async healthCheck(@Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.zoomService.checkZoomConnectionHealth(teacher.id);
  }
}

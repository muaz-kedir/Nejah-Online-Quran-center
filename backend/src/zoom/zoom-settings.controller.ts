import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomService } from './zoom.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';
import { Teacher } from '../teachers/entities/teacher.entity';
import { IsString, IsOptional } from 'class-validator';
import { ZoomIntegration } from './entities/zoom-integration.entity';

class ConnectZoomDto {
  @IsString()
  zoomUserId: string;

  @IsOptional()
  @IsString()
  zoomEmail?: string;
}

class SavePlatformConfigDto {
  @IsString()
  accountId: string;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  secretToken?: string;
}

function sanitizeIntegration(integration: ZoomIntegration | null) {
  if (!integration) return null;
  const { accessToken, refreshToken, ...safe } = integration;
  return safe;
}

@Controller('zoom-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZoomSettingsController {
  constructor(
    private readonly zoomService: ZoomService,
    private readonly teachersService: TeachersService,
    @InjectRepository(Teacher)
    private readonly teachersRepository: Repository<Teacher>,
  ) {}

  @Get('platform')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getPlatformConfig() {
    return this.zoomService.getPlatformConfigStatus();
  }

  @Post('platform')
  @Roles(UserRole.SUPER_ADMIN)
  savePlatformConfig(@Body() dto: SavePlatformConfigDto) {
    return this.zoomService.savePlatformConfig(dto);
  }

  /* ------------------------------------------------------------------ */
  /*  OAuth authorization code flow                                     */
  /* ------------------------------------------------------------------ */

  @Get('oauth/url')
  @Roles(UserRole.TEACHER)
  async getOAuthUrl(@Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    this.zoomService.assertOAuthConfiguredForAuthorize();
    const url = this.zoomService.getOAuthAuthorizationUrl(teacher.id);
    return { url };
  }

  /* ------------------------------------------------------------------ */
  /*  Manual connect (kept for admin use, no longer used by teachers)    */
  /* ------------------------------------------------------------------ */

  @Post('connect')
  @Roles(UserRole.TEACHER)
  async connect(@Request() req, @Body() dto: ConnectZoomDto) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    const result = await this.zoomService.connectTeacherIntegration(
      teacher.id,
      dto.zoomUserId,
      dto.zoomEmail || teacher.email,
    );
    return sanitizeIntegration(result);
  }

  @Post('disconnect')
  @Roles(UserRole.TEACHER)
  async disconnect(@Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    const result = await this.zoomService.disconnectTeacher(teacher.id);
    return sanitizeIntegration(result);
  }

  @Post('teacher/:teacherId/connect')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async connectTeacher(@Param('teacherId') teacherId: string, @Body() dto: ConnectZoomDto) {
    const teacher = await this.teachersService.findOne(teacherId);
    const result = await this.zoomService.connectTeacherIntegration(
      teacherId,
      dto.zoomUserId,
      dto.zoomEmail || teacher.email,
    );
    return sanitizeIntegration(result);
  }

  @Post('teacher/:teacherId/disconnect')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async disconnectTeacher(@Param('teacherId') teacherId: string) {
    const result = await this.zoomService.disconnectTeacher(teacherId);
    return sanitizeIntegration(result);
  }

  @Get('status')
  @Roles(UserRole.TEACHER)
  async getStatus(@Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return sanitizeIntegration(await this.zoomService.getTeacherIntegration(teacher.id));
  }

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getOverview() {
    const [teachers, integrations] = await Promise.all([
      this.teachersRepository.find({ order: { fullName: 'ASC' } }),
      this.zoomService.getAllIntegrations(),
    ]);

    const integrationByTeacher = new Map(integrations.map((i) => [i.teacherId, i]));

    const rows = teachers.map((teacher) => {
      const integration = integrationByTeacher.get(teacher.id) ?? null;
      return {
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        teacherEmail: teacher.email,
        teacherStatus: teacher.status || 'active',
        connectionStatus: integration?.connectionStatus ?? 'disconnected',
        zoomUserId: integration?.zoomUserId ?? null,
        zoomEmail: integration?.zoomEmail ?? null,
        connectedAt: integration?.connectedAt ?? null,
      };
    });

    const connected = rows.filter((r) => r.connectionStatus === 'connected').length;

    return {
      summary: {
        totalTeachers: rows.length,
        connected,
        disconnected: rows.length - connected,
        platformConfigured: this.zoomService.isPlatformConfigured(),
      },
      teachers: rows,
    };
  }

  @Get('all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAll() {
    const integrations = await this.zoomService.getAllIntegrations();
    return integrations.map((i) => sanitizeIntegration(i));
  }

  @Get('user/:zoomUserId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getZoomUser(@Param('zoomUserId') zoomUserId: string) {
    return this.zoomService.getZoomUser(zoomUserId);
  }

  @Get('health')
  @Roles(UserRole.TEACHER)
  async healthCheck(@Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.zoomService.checkZoomConnectionHealth(teacher.id);
  }
}

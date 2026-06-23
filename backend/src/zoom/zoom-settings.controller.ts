import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomService } from './zoom.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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
  return integration;
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

  @Post('platform/verify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async verifyPlatformConfig() {
    const result = await this.zoomService.verifyPlatformAuth();
    const status = this.zoomService.getPlatformConfigStatus();
    return {
      ok: true,
      message: 'Zoom Server-to-Server credentials are valid.',
      source: result.source,
      envConfigured: status.envConfigured,
      databaseConfigured: status.databaseConfigured,
      credentialsConflict: status.credentialsConflict,
    };
  }

  /** One-click connect: saves the teacher's Nejah email — no Zoom API verification. */
  @Post('connect')
  @Roles(UserRole.TEACHER)
  async connect(@CurrentUser() user: { id: string }) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(user.id);
    return this.zoomService.connectTeacherWithNejahEmail(teacher.id, teacher.email);
  }

  @Delete('disconnect')
  @Roles(UserRole.TEACHER)
  async disconnect(@CurrentUser() user: { id: string }) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(user.id);
    await this.zoomService.disconnectTeacher(teacher.id);
    return { connected: false };
  }

  /** Legacy POST disconnect for older clients. */
  @Post('disconnect')
  @Roles(UserRole.TEACHER)
  async disconnectPost(@CurrentUser() user: { id: string }) {
    return this.disconnect(user);
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
  async getStatus(@CurrentUser() user: { id: string }) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(user.id);
    return this.zoomService.getTeacherConnectionStatus(teacher.id, teacher.email);
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
      const connected =
        integration?.connectionStatus === 'connected' || teacher.zoomConnected === true;
      return {
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        teacherEmail: teacher.email,
        teacherStatus: teacher.status || 'active',
        connectionStatus: connected ? 'connected' : 'disconnected',
        zoomUserId: integration?.zoomUserId ?? teacher.zoomUserId ?? null,
        zoomEmail: integration?.zoomEmail ?? teacher.zoomEmail ?? null,
        connectedAt: integration?.connectedAt ?? teacher.zoomConnectedAt ?? null,
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

  @Get('account-users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async listAccountUsers() {
    const users = await this.zoomService.listAccountUsers();
    return { users, total: users.length };
  }

  @Get('health')
  @Roles(UserRole.TEACHER)
  async healthCheck(@CurrentUser() user: { id: string }) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(user.id);
    return this.zoomService.checkZoomConnectionHealth(teacher.id);
  }
}

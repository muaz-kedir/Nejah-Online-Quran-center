import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ZoomService } from './zoom.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';
import { IsString, IsOptional } from 'class-validator';

class ConnectZoomDto {
  @IsString()
  zoomUserId: string;

  @IsOptional()
  @IsString()
  zoomEmail?: string;
}

@Controller('zoom-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZoomSettingsController {
  constructor(
    private readonly zoomService: ZoomService,
    private readonly teachersService: TeachersService,
  ) {}

  @Post('connect')
  @Roles(UserRole.TEACHER)
  async connect(@Request() req, @Body() dto: ConnectZoomDto) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.zoomService.saveTeacherIntegration(teacher.id, dto.zoomUserId, dto.zoomEmail || '');
  }

  @Post('disconnect')
  @Roles(UserRole.TEACHER)
  async disconnect(@Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.zoomService.disconnectTeacher(teacher.id);
  }

  @Get('status')
  @Roles(UserRole.TEACHER)
  async getStatus(@Request() req) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.zoomService.getTeacherIntegration(teacher.id);
  }

  @Get('all')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  async getAll() {
    return this.zoomService.getAllIntegrations();
  }

  @Get('user/:zoomUserId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getZoomUser(@Param('zoomUserId') zoomUserId: string) {
    return this.zoomService.getZoomUser(zoomUserId);
  }
}

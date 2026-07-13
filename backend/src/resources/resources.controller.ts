import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourcesController {
  constructor(
    private readonly resourcesService: ResourcesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT, UserRole.TEACHER)
  async findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
  ) {
    return this.resourcesService.findAll(req.user.id, req.user.role, search, category, type);
  }

  @Get('featured')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT, UserRole.TEACHER)
  async findFeatured(@Request() req) {
    return this.resourcesService.findFeatured(req.user.id, req.user.role);
  }

  @Get('recent')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT, UserRole.TEACHER)
  async findRecent(@Request() req) {
    return this.resourcesService.findRecent(req.user.id, req.user.role);
  }

  @Get('categories')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT, UserRole.TEACHER)
  async getCategories(@Request() req) {
    return this.resourcesService.getCategories(req.user.id, req.user.role);
  }

  @Get('downloads')
  @Roles(UserRole.STUDENT)
  async getDownloadHistory(@Request() req) {
    return this.resourcesService.getDownloadHistory(req.user.id);
  }

  @Post(':id/download')
  @Roles(UserRole.STUDENT)
  async downloadResource(@Request() req, @Param('id') id: string) {
    return this.resourcesService.recordDownload(req.user.id, id);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT, UserRole.TEACHER)
  async findOne(@Request() req, @Param('id') id: string) {
    const resource = await this.resourcesService.findOne(id);
    return resource;
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async create(@Body() dto: any) {
    const resource = await this.resourcesService.create(dto);
    
    // Notify students of the new resource matching their level
    try {
      await this.notificationsService.notifyResourceAdded(resource);
    } catch (err) {
      console.warn('Failed to notify about new resource', err);
    }
    
    return resource;
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.resourcesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.resourcesService.remove(id);
    return { message: 'Resource deleted successfully' };
  }
}

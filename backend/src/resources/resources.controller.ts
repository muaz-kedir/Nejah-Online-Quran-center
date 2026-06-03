import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT, UserRole.TEACHER)
  async findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    // For students, they can only see their assigned resources
    if (req.user.role === UserRole.STUDENT) {
      return this.resourcesService.findAll(undefined, search, category as any);
    }
    return this.resourcesService.findAll(undefined, search, category as any);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT, UserRole.TEACHER)
  async findOne(@Request() req, @Param('id') id: string) {
    const resource = await this.resourcesService.findOne(id);
    // For students, increment download count
    if (req.user.role === UserRole.STUDENT) {
      await this.resourcesService.incrementDownloadCount(id);
    }
    return resource;
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async create(@Body() dto: CreateResourceDto) {
    return this.resourcesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async update(@Param('id') id: string, @Body() dto: UpdateResourceDto) {
    return this.resourcesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async remove(@Param('id') id: string) {
    await this.resourcesService.remove(id);
    return { message: 'Resource deleted successfully' };
  }
}

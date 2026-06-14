import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { FeeConfigService } from './fee-config.service';
import { CreateFeeConfigDto } from './dto/create-fee-config.dto';
import { UpdateFeeConfigDto } from './dto/update-fee-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('fee-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeConfigController {
  constructor(private readonly service: FeeConfigService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  findAll() {
    return this.service.findAll();
  }

  @Get('lookup')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.TEACHER)
  lookup(@Query('goalId') goalId: string, @Query('country') country: string) {
    return this.service.lookup(goalId, country);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(@Body() dto: CreateFeeConfigDto, @Req() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateFeeConfigDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

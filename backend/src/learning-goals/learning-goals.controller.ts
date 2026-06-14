import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LearningGoalsService } from './learning-goals.service';
import { CreateLearningGoalDto } from './dto/create-learning-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('learning-goals')
export class LearningGoalsController {
  constructor(private readonly service: LearningGoalsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.service.findAll();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(@Body() dto: CreateLearningGoalDto) {
    return this.service.create(dto);
  }
}

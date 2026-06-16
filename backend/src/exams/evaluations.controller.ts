import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { QueryEvaluationDto } from './dto/query-evaluation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  create(@Body() createDto: CreateEvaluationDto, @CurrentUser() user: User) {
    return this.evaluationsService.create(createDto, user.id, user.role);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.QIRAT_MANAGER,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  findAll(@Query() queryDto: QueryEvaluationDto, @CurrentUser() user: User) {
    return this.evaluationsService.findAll(queryDto, { id: user.id, role: user.role });
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  getStats(
    @Query('studentId') studentId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('programType') programType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.evaluationsService.getReportsStats({
      studentId,
      teacherId,
      programType,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.QIRAT_MANAGER,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.evaluationsService.findOne(id, { id: user.id, role: user.role });
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  @HttpCode(HttpStatus.OK)
  approvePromotion(
    @Param('id') id: string,
    @Body('approvalNotes') approvalNotes: string,
    @CurrentUser() user: User,
  ) {
    return this.evaluationsService.approvePromotion(id, approvalNotes, user.id);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QIRAT_MANAGER)
  @HttpCode(HttpStatus.OK)
  rejectPromotion(
    @Param('id') id: string,
    @Body('rejectionNotes') rejectionNotes: string,
    @CurrentUser() user: User,
  ) {
    return this.evaluationsService.rejectPromotion(id, rejectionNotes, user.id);
  }
}

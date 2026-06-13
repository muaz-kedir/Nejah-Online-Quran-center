import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TeacherReplacementsService } from './teacher-replacements.service';
import { CreateTeacherReplacementDto } from './dto/create-teacher-replacement.dto';
import { UpdateTeacherReplacementDto } from './dto/update-teacher-replacement.dto';
import { StartReplacementClassDto } from './dto/start-replacement-class.dto';
import { QueryTeacherReplacementDto } from './dto/query-teacher-replacement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('teacher-replacements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherReplacementsController {
  constructor(private readonly replacementsService: TeacherReplacementsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  create(@Request() req, @Body() dto: CreateTeacherReplacementDto) {
    return this.replacementsService.create(dto, req.user.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  findAll(@Request() req, @Query() query: QueryTeacherReplacementDto) {
    return this.replacementsService.findAll(query);
  }

  @Get('temporary-students/:teacherId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  getTemporaryStudents(@Param('teacherId') teacherId: string) {
    return this.replacementsService.getTemporaryStudentsForTeacher(teacherId);
  }

  @Get('reassigned-away/:teacherId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  getReassignedAway(@Param('teacherId') teacherId: string) {
    return this.replacementsService.getReassignedAwayForTeacher(teacherId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  findOne(@Param('id') id: string) {
    return this.replacementsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateTeacherReplacementDto) {
    return this.replacementsService.update(id, dto, req.user.id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER)
  cancel(@Request() req, @Param('id') id: string) {
    return this.replacementsService.cancel(id, req.user.id);
  }

  @Post(':id/start-class')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.QIRAT_MANAGER, UserRole.TEACHER)
  startClass(@Request() req, @Param('id') id: string, @Body() dto: StartReplacementClassDto) {
    return this.replacementsService.startReplacementClass(id, req.user, dto.meetingLink);
  }
}

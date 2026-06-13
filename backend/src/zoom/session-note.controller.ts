import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SessionNoteService } from './session-note.service';
import { CreateSessionNoteDto } from './dto/create-session-note.dto';
import { UpdateSessionNoteDto } from './dto/update-session-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';

@Controller('session-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionNoteController {
  constructor(
    private readonly sessionNoteService: SessionNoteService,
    private readonly teachersService: TeachersService,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER)
  async create(@Request() req, @Body() dto: CreateSessionNoteDto) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    dto.teacherId = teacher.id;
    return this.sessionNoteService.create(dto);
  }

  @Get('session/:sessionId')
  @Roles(
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.QIRAT_MANAGER,
  )
  async findBySession(@Param('sessionId') sessionId: string) {
    return this.sessionNoteService.findBySession(sessionId);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER)
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateSessionNoteDto) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.sessionNoteService.update(id, teacher.id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER)
  async delete(@Request() req, @Param('id') id: string) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    return this.sessionNoteService.delete(id, teacher.id);
  }
}

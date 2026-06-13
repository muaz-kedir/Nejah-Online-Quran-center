import {
  Controller,
  Get,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Parent } from '../parents/entities/parent.entity';
import { LiveSession } from './entities/live-session.entity';

@Controller('parent/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
export class ParentSessionController {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
  ) {}

  @Get()
  async getChildrenSessions(@Request() req) {
    const parent = await this.parentRepository.findOne({
      where: { user: { id: req.user.id } },
      relations: ['students'],
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    const studentIds = parent.students?.map((s) => s.id) || [];
    if (studentIds.length === 0) {
      return { data: [], meta: { total: 0 } };
    }

    const sessions = await this.liveSessionRepository.find({
      where: { studentId: In(studentIds) },
      relations: [
        'teacher',
        'student',
        'schedule',
        'attendances',
        'attendances.student',
        'sessionNotes',
        'sessionNotes.teacher',
      ],
      order: { scheduledStart: 'DESC' },
    });

    return {
      data: sessions,
      meta: { total: sessions.length },
    };
  }
}
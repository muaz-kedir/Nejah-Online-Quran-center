import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionNote, SessionNoteVisibility } from './entities/session-note.entity';
import { CreateSessionNoteDto } from './dto/create-session-note.dto';
import { UpdateSessionNoteDto } from './dto/update-session-note.dto';
import { LiveSession } from './entities/live-session.entity';

@Injectable()
export class SessionNoteService {
  constructor(
    @InjectRepository(SessionNote)
    private readonly sessionNoteRepository: Repository<SessionNote>,
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
  ) {}

  async create(dto: CreateSessionNoteDto): Promise<SessionNote> {
    const note = this.sessionNoteRepository.create({
      sessionId: dto.sessionId,
      teacherId: dto.teacherId,
      content: dto.content,
      visibility: dto.visibility || SessionNoteVisibility.TEACHER_ONLY,
      lessonSummary: dto.lessonSummary || null,
      topicsCovered: dto.topicsCovered || null,
      homeworkAssigned: dto.homeworkAssigned || null,
      completionRemarks: dto.completionRemarks || null,
      studentPerformance: dto.studentPerformance || null,
    });

    return this.sessionNoteRepository.save(note);
  }

  async update(id: string, teacherId: string, dto: UpdateSessionNoteDto): Promise<SessionNote> {
    const note = await this.sessionNoteRepository.findOne({ where: { id } });

    if (!note) {
      throw new NotFoundException('Session note not found');
    }

    if (note.teacherId !== teacherId) {
      throw new ForbiddenException('You can only edit your own notes');
    }

    if (dto.content !== undefined) note.content = dto.content;
    if (dto.visibility !== undefined) note.visibility = dto.visibility;
    if (dto.lessonSummary !== undefined) note.lessonSummary = dto.lessonSummary;
    if (dto.topicsCovered !== undefined) note.topicsCovered = dto.topicsCovered;
    if (dto.homeworkAssigned !== undefined) note.homeworkAssigned = dto.homeworkAssigned;
    if (dto.completionRemarks !== undefined) note.completionRemarks = dto.completionRemarks;
    if (dto.studentPerformance !== undefined) note.studentPerformance = dto.studentPerformance;

    return this.sessionNoteRepository.save(note);
  }

  async findBySession(sessionId: string, userId?: string): Promise<SessionNote[]> {
    const notes = await this.sessionNoteRepository.find({
      where: { sessionId },
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
    });

    const session = await this.liveSessionRepository.findOne({
      where: { id: sessionId },
      select: ['teacherId'],
    });

    const isTeacher = session?.teacherId === userId;

    return notes.filter(
      (note) => note.visibility === SessionNoteVisibility.ALL || isTeacher,
    );
  }

  async delete(id: string, teacherId: string): Promise<void> {
    const note = await this.sessionNoteRepository.findOne({ where: { id } });

    if (!note) {
      throw new NotFoundException('Session note not found');
    }

    if (note.teacherId !== teacherId) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    await this.sessionNoteRepository.remove(note);
  }
}

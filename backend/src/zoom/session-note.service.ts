import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionNote } from './entities/session-note.entity';
import { CreateSessionNoteDto } from './dto/create-session-note.dto';
import { UpdateSessionNoteDto } from './dto/update-session-note.dto';

@Injectable()
export class SessionNoteService {
  constructor(
    @InjectRepository(SessionNote)
    private readonly sessionNoteRepository: Repository<SessionNote>,
  ) {}

  async create(dto: CreateSessionNoteDto): Promise<SessionNote> {
    const note = this.sessionNoteRepository.create({
      sessionId: dto.sessionId,
      teacherId: dto.teacherId,
      content: dto.content,
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

    if (dto.content !== undefined) {
      note.content = dto.content;
    }

    return this.sessionNoteRepository.save(note);
  }

  async findBySession(sessionId: string): Promise<SessionNote[]> {
    return this.sessionNoteRepository.find({
      where: { sessionId },
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
    });
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

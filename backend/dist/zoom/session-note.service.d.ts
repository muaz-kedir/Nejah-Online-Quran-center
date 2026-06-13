import { Repository } from 'typeorm';
import { SessionNote } from './entities/session-note.entity';
import { CreateSessionNoteDto } from './dto/create-session-note.dto';
import { UpdateSessionNoteDto } from './dto/update-session-note.dto';
export declare class SessionNoteService {
    private readonly sessionNoteRepository;
    constructor(sessionNoteRepository: Repository<SessionNote>);
    create(dto: CreateSessionNoteDto): Promise<SessionNote>;
    update(id: string, teacherId: string, dto: UpdateSessionNoteDto): Promise<SessionNote>;
    findBySession(sessionId: string): Promise<SessionNote[]>;
    delete(id: string, teacherId: string): Promise<void>;
}

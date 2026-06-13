import { SessionNoteService } from './session-note.service';
import { CreateSessionNoteDto } from './dto/create-session-note.dto';
import { UpdateSessionNoteDto } from './dto/update-session-note.dto';
import { TeachersService } from '../teachers/teachers.service';
export declare class SessionNoteController {
    private readonly sessionNoteService;
    private readonly teachersService;
    constructor(sessionNoteService: SessionNoteService, teachersService: TeachersService);
    create(req: any, dto: CreateSessionNoteDto): Promise<import("./entities/session-note.entity").SessionNote>;
    findBySession(sessionId: string): Promise<import("./entities/session-note.entity").SessionNote[]>;
    update(req: any, id: string, dto: UpdateSessionNoteDto): Promise<import("./entities/session-note.entity").SessionNote>;
    delete(req: any, id: string): Promise<void>;
}

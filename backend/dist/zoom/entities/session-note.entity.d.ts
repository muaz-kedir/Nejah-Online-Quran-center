import { LiveSession } from './live-session.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
export declare class SessionNote {
    id: string;
    session: LiveSession;
    sessionId: string;
    teacher: Teacher;
    teacherId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

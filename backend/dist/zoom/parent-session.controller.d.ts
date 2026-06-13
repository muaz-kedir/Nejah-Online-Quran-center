import { Repository } from 'typeorm';
import { Parent } from '../parents/entities/parent.entity';
import { LiveSession } from './entities/live-session.entity';
export declare class ParentSessionController {
    private readonly parentRepository;
    private readonly liveSessionRepository;
    constructor(parentRepository: Repository<Parent>, liveSessionRepository: Repository<LiveSession>);
    getChildrenSessions(req: any): Promise<{
        data: LiveSession[];
        meta: {
            total: number;
        };
    }>;
}

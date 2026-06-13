import { LiveSessionStatus } from '../enums/live-session-status.enum';
export declare class CreateLiveSessionDto {
    teacherId: string;
    studentId?: string;
    scheduleId?: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    status?: LiveSessionStatus;
    notes?: string;
    metadata?: any;
}

import { LiveSessionStatus } from '../enums/live-session-status.enum';
export declare class QueryLiveSessionDto {
    teacherId?: string;
    studentId?: string;
    status?: LiveSessionStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    startDate?: string;
    endDate?: string;
}

import { QuranLevel, StudentStatus } from '../entities/student.entity';
export declare class QueryStudentDto {
    search?: string;
    level?: QuranLevel;
    teacherId?: string;
    status?: StudentStatus;
    country?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

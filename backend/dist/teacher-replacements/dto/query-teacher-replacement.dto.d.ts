import { ReplacementStatus } from '../../common/enums/replacement-status.enum';
export declare class QueryTeacherReplacementDto {
    status?: ReplacementStatus;
    studentId?: string;
    originalTeacherId?: string;
    replacementTeacherId?: string;
    search?: string;
    page?: number;
    limit?: number;
}

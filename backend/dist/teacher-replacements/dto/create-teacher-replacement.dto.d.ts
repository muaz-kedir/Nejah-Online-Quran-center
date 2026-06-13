import { ReplacementReason } from '../../common/enums/replacement-reason.enum';
export declare class CreateTeacherReplacementDto {
    originalTeacherId: string;
    replacementTeacherId: string;
    studentIds?: string[];
    selectAllStudents?: boolean;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    reason: ReplacementReason;
    customReason?: string;
    notes?: string;
}

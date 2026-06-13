import { ReplacementReason } from '../../common/enums/replacement-reason.enum';
export declare class UpdateTeacherReplacementDto {
    replacementTeacherId?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    reason?: ReplacementReason;
    customReason?: string;
    notes?: string;
}

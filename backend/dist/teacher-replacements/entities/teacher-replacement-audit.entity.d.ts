import { TeacherReplacement } from './teacher-replacement.entity';
export declare class TeacherReplacementAudit {
    id: string;
    replacementId: string;
    replacement: TeacherReplacement;
    action: string;
    performedBy: string;
    payloadJson: Record<string, unknown>;
    performedAt: Date;
}

import { QuranLevel } from '../../students/entities/student.entity';
export declare class LevelActionDto {
    action: 'promote' | 'demote' | 'repeat' | 'pause' | 'resume';
    targetLevel?: QuranLevel;
    reason?: string;
}
export declare class RecommendPromotionDto {
    reason?: string;
}
export declare class UpdateProgressionSettingsDto {
    quranReadingCompletionMode?: 'full_quran' | 'teacher_recommendation';
    tajweedRequiresEvaluation?: boolean;
}

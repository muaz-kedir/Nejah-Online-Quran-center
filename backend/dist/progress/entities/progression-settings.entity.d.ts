export type QuranReadingCompletionMode = 'full_quran' | 'teacher_recommendation';
export declare class ProgressionSettings {
    id: string;
    quranReadingCompletionMode: QuranReadingCompletionMode;
    tajweedRequiresEvaluation: boolean;
    createdAt: Date;
    updatedAt: Date;
}

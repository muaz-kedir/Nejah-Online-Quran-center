export type LearningTrack = 'qaidah' | 'quran_reading' | 'tajweed' | 'hifz';
export interface CurriculumTopic {
    id: string;
    order: number;
    nameEn: string;
    nameAr: string;
}
export declare const QAIDAH_LESSONS: CurriculumTopic[];
export declare const TAJWEED_TOPICS: CurriculumTopic[];
export declare function resolveLearningTrack(level?: string | null): LearningTrack;
export declare function getTopicsForTrack(track: LearningTrack): CurriculumTopic[];
export declare function getTopicById(track: LearningTrack, topicId: string): CurriculumTopic | undefined;
export declare function getNextTopic(track: LearningTrack, completedIds: string[]): CurriculumTopic | null;
export declare function formatTopicLabel(topic: CurriculumTopic): string;
export declare function getTrackLabel(track: LearningTrack): string;

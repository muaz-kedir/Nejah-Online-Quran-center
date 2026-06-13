import { ProgressService } from './progress.service';
import { LevelProgressionService } from './level-progression.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { LevelActionDto, RecommendPromotionDto, UpdateProgressionSettingsDto } from './dto/level-action.dto';
import { TeachersService } from '../teachers/teachers.service';
export declare class ProgressController {
    private progressService;
    private levelProgressionService;
    private teachersService;
    constructor(progressService: ProgressService, levelProgressionService: LevelProgressionService, teachersService: TeachersService);
    getProgressionSettings(): Promise<import("./entities/progression-settings.entity").ProgressionSettings>;
    updateProgressionSettings(dto: UpdateProgressionSettingsDto): Promise<import("./entities/progression-settings.entity").ProgressionSettings>;
    getSurahs(): import("../common/constants/quran-surahs").QuranSurah[];
    getLearningContext(req: any, studentId: string): Promise<{
        learningTrack: import("../common/constants/learning-curricula").LearningTrack;
        learningTrackLabel: string;
        studentLevel: import("../students/entities/student.entity").QuranLevel;
        topics: {
            label: string;
            isCompleted: boolean;
            isCurrent: boolean;
            isSuggested: boolean;
            id: string;
            order: number;
            nameEn: string;
            nameAr: string;
        }[];
        surahs: import("../common/constants/quran-surahs").QuranSurah[];
        completedTopicIds: string[];
        currentTopic: {
            label: string;
            id: string;
            order: number;
            nameEn: string;
            nameAr: string;
        };
        suggestedTopic: {
            label: string;
            id: string;
            order: number;
            nameEn: string;
            nameAr: string;
        };
        progressSummary: {
            completed: number;
            total: number;
            remaining: number;
            percentage: number;
        };
        promotionStatus: string;
        progressionPaused: boolean;
        lastPosition: {
            surahNumber: number;
            lastStudiedSurah: string;
            lastStudiedPage: number;
            lastStudiedAyah: number;
            currentTopicId: string;
        };
        progress: {
            progressPercentage: number;
            rank: string;
            surahsCount: number;
            ayahsCount: number;
        };
    }>;
    getProgress(req: any, studentId: string): Promise<import("./entities/progress.entity").Progress>;
    getLearningPath(req: any, studentId: string): Promise<{
        currentLevel: import("../students/entities/student.entity").QuranLevel;
        currentTrack: import("../common/constants/learning-curricula").LearningTrack;
        progressionPaused: boolean;
        promotionStatus: string;
        stages: {
            level: import("../students/entities/student.entity").QuranLevel;
            learningTrack: import("../common/constants/learning-curricula").LearningTrack;
            label: string;
            status: "completed" | "upcoming" | "current";
            startedAt: Date;
            completedAt: Date;
            progressPercentage: number;
        }[];
    }>;
    getLevelHistory(req: any, studentId: string): Promise<{
        id: string;
        level: string;
        learningTrack: string;
        startedAt: Date;
        completedAt: Date;
        status: import("./entities/level-history.entity").LevelHistoryStatus;
        changeType: import("./entities/level-history.entity").LevelChangeType;
        teacherName: string;
        progressPercentage: number;
        reason: string;
        createdAt: Date;
    }[]>;
    applyLevelAction(req: any, studentId: string, dto: LevelActionDto): Promise<{
        student: import("../students/entities/student.entity").Student;
        message: string;
    }>;
    recommendPromotion(req: any, studentId: string, dto: RecommendPromotionDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getProgressLogs(req: any, studentId: string, limit?: string): Promise<import("./entities/progress-log.entity").ProgressLog[]>;
    logProgress(req: any, studentId: string, dto: UpdateProgressDto): Promise<import("./entities/progress.entity").Progress>;
    addFeedback(req: any, studentId: string, dto: CreateFeedbackDto): Promise<import("./entities/feedback.entity").Feedback>;
    getFeedback(req: any, studentId: string): Promise<import("./entities/feedback.entity").Feedback[]>;
}

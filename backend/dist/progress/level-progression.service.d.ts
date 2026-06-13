import { Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { StudentLevelHistory, LevelChangeType, LevelHistoryStatus } from './entities/level-history.entity';
import { ProgressionSettings } from './entities/progression-settings.entity';
import { Student, QuranLevel } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Parent } from '../parents/entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { LearningTrack } from '../common/constants/learning-curricula';
export declare const LEVEL_PATH: QuranLevel[];
export declare function getNextLevel(level: QuranLevel): QuranLevel | null;
export declare function getPreviousLevel(level: QuranLevel): QuranLevel | null;
export interface ManualLevelActionDto {
    action: 'promote' | 'demote' | 'repeat' | 'pause' | 'resume';
    targetLevel?: QuranLevel;
    reason?: string;
}
export declare class LevelProgressionService {
    private progressRepository;
    private levelHistoryRepository;
    private settingsRepository;
    private studentRepository;
    private teacherRepository;
    private parentRepository;
    private userRepository;
    private notificationsService;
    constructor(progressRepository: Repository<Progress>, levelHistoryRepository: Repository<StudentLevelHistory>, settingsRepository: Repository<ProgressionSettings>, studentRepository: Repository<Student>, teacherRepository: Repository<Teacher>, parentRepository: Repository<Parent>, userRepository: Repository<User>, notificationsService: NotificationsService);
    getSettings(): Promise<ProgressionSettings>;
    updateSettings(dto: Partial<Pick<ProgressionSettings, 'quranReadingCompletionMode' | 'tajweedRequiresEvaluation'>>): Promise<ProgressionSettings>;
    ensureCurrentHistoryRow(student: Student): Promise<StudentLevelHistory>;
    getLevelHistory(studentId: string): Promise<StudentLevelHistory[]>;
    getLearningPath(studentId: string): Promise<{
        currentLevel: QuranLevel;
        currentTrack: LearningTrack;
        progressionPaused: boolean;
        promotionStatus: string;
        stages: {
            level: QuranLevel;
            learningTrack: LearningTrack;
            label: string;
            status: "completed" | "upcoming" | "current";
            startedAt: Date;
            completedAt: Date;
            progressPercentage: number;
        }[];
    }>;
    private isTrackCurriculumComplete;
    checkAndPromote(student: Student, progress: Progress): Promise<void>;
    recommendPromotion(studentId: string, teacherUserId: string | null, reason?: string): Promise<Progress>;
    private getActiveProgress;
    promote(student: Student, toLevel: QuranLevel, changeType: LevelChangeType, changedByUserId: string | null, reason?: string, closeStatus?: LevelHistoryStatus): Promise<void>;
    applyManualAction(studentId: string, dto: ManualLevelActionDto, adminUserId: string): Promise<{
        student: Student;
        message: string;
    }>;
    private assertValidLevel;
    private collectRecipientUserIds;
    private notifyAllParties;
    private notifyReadyForEvaluation;
}

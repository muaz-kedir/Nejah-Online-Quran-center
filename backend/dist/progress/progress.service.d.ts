import { Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { ProgressLog } from './entities/progress-log.entity';
import { Feedback } from './entities/feedback.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Parent } from '../parents/entities/parent.entity';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { LevelProgressionService } from './level-progression.service';
import { LearningTrack } from '../common/constants/learning-curricula';
export declare class ProgressService {
    private progressRepository;
    private progressLogRepository;
    private feedbackRepository;
    private studentRepository;
    private teacherRepository;
    private parentRepository;
    private levelProgressionService;
    constructor(progressRepository: Repository<Progress>, progressLogRepository: Repository<ProgressLog>, feedbackRepository: Repository<Feedback>, studentRepository: Repository<Student>, teacherRepository: Repository<Teacher>, parentRepository: Repository<Parent>, levelProgressionService: LevelProgressionService);
    getSurahList(): import("../common/constants/quran-surahs").QuranSurah[];
    assertUserCanViewStudentProgress(userId: string, role: string, studentId: string): Promise<void>;
    getOrCreateProgress(studentId: string, track?: LearningTrack): Promise<Progress>;
    private buildProgressSummary;
    getLearningContext(studentId: string): Promise<{
        learningTrack: LearningTrack;
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
    private validateTopicLog;
    private validateSurahLog;
    private applyTopicCompletion;
    private applySurahCompletion;
    logProgress(studentId: string, dto: UpdateProgressDto, teacherId?: string): Promise<Progress>;
    getStudentLogs(studentId: string, limit?: number): Promise<ProgressLog[]>;
    addFeedback(teacherId: string, studentId: string, content: string): Promise<Feedback>;
    getStudentFeedback(studentId: string): Promise<Feedback[]>;
}

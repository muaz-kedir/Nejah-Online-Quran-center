"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const progress_entity_1 = require("./entities/progress.entity");
const progress_log_entity_1 = require("./entities/progress-log.entity");
const feedback_entity_1 = require("./entities/feedback.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const parent_entity_1 = require("../parents/entities/parent.entity");
const level_progression_service_1 = require("./level-progression.service");
const quran_surahs_1 = require("../common/constants/quran-surahs");
const learning_curricula_1 = require("../common/constants/learning-curricula");
const TOTAL_SURAHS = 114;
function calculateRank(percentage) {
    if (percentage >= 90)
        return 'Expert';
    if (percentage >= 70)
        return 'Advanced';
    if (percentage >= 40)
        return 'Intermediate';
    return 'Beginner';
}
function normalizeCompletedIds(ids) {
    return Array.isArray(ids) ? ids : [];
}
let ProgressService = class ProgressService {
    constructor(progressRepository, progressLogRepository, feedbackRepository, studentRepository, teacherRepository, parentRepository, levelProgressionService) {
        this.progressRepository = progressRepository;
        this.progressLogRepository = progressLogRepository;
        this.feedbackRepository = feedbackRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.parentRepository = parentRepository;
        this.levelProgressionService = levelProgressionService;
    }
    getSurahList() {
        return quran_surahs_1.QURAN_SURAHS;
    }
    async assertUserCanViewStudentProgress(userId, role, studentId) {
        if (role === 'student') {
            const student = await this.studentRepository.findOne({
                where: { id: studentId, userId },
            });
            if (!student) {
                throw new common_1.ForbiddenException('You can only view your own progress');
            }
            return;
        }
        if (role === 'parent') {
            const parent = await this.parentRepository.findOne({
                where: { user: { id: userId } },
                relations: ['students'],
            });
            if (!parent?.students?.some((s) => s.id === studentId)) {
                throw new common_1.ForbiddenException("You can only view your children's progress");
            }
        }
    }
    async getOrCreateProgress(studentId, track) {
        let learningTrack = track;
        if (!learningTrack) {
            const student = await this.studentRepository.findOne({ where: { id: studentId } });
            learningTrack = (0, learning_curricula_1.resolveLearningTrack)(student?.level);
        }
        const existing = await this.progressRepository.findOne({
            where: { studentId, learningTrack },
            relations: ['student'],
            order: { createdAt: 'DESC' },
        });
        if (existing) {
            return existing;
        }
        const legacy = await this.progressRepository.findOne({
            where: { studentId, learningTrack: (0, typeorm_2.IsNull)() },
            relations: ['student'],
            order: { createdAt: 'DESC' },
        });
        if (legacy) {
            legacy.learningTrack = learningTrack;
            return this.progressRepository.save(legacy);
        }
        const progress = this.progressRepository.create({
            studentId,
            surahsCount: 0,
            ayahsCount: 0,
            weeksActive: 0,
            progressPercentage: 0,
            rank: 'Beginner',
            learningTrack,
            completedTopicIds: [],
            promotionStatus: 'none',
        });
        return this.progressRepository.save(progress);
    }
    buildProgressSummary(track, completedIds) {
        if (track === 'qaidah' || track === 'tajweed') {
            const total = (0, learning_curricula_1.getTopicsForTrack)(track).length;
            const completed = completedIds.length;
            const percentage = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
            return { completed, total, remaining: Math.max(total - completed, 0), percentage };
        }
        if (track === 'quran_reading' || track === 'hifz') {
            const completed = completedIds.filter((id) => id.startsWith('surah-')).length;
            const percentage = Math.min(Math.round((completed / TOTAL_SURAHS) * 1000) / 10, 100);
            return {
                completed,
                total: TOTAL_SURAHS,
                remaining: Math.max(TOTAL_SURAHS - completed, 0),
                percentage,
            };
        }
        return { completed: 0, total: 0, remaining: 0, percentage: 0 };
    }
    async getLearningContext(studentId) {
        const student = await this.studentRepository.findOne({ where: { id: studentId } });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const learningTrack = (0, learning_curricula_1.resolveLearningTrack)(student.level);
        const progress = await this.getOrCreateProgress(studentId, learningTrack);
        const completedTopicIds = normalizeCompletedIds(progress.completedTopicIds);
        const curriculumTopics = (0, learning_curricula_1.getTopicsForTrack)(learningTrack);
        const suggestedTopic = (0, learning_curricula_1.getNextTopic)(learningTrack, completedTopicIds);
        const currentTopicId = progress.currentTopicId || suggestedTopic?.id || null;
        const currentTopic = (currentTopicId && (0, learning_curricula_1.getTopicById)(learningTrack, currentTopicId)) || suggestedTopic;
        const topicsWithStatus = curriculumTopics.map((topic) => ({
            ...topic,
            label: (0, learning_curricula_1.formatTopicLabel)(topic),
            isCompleted: completedTopicIds.includes(topic.id),
            isCurrent: topic.id === currentTopicId,
            isSuggested: topic.id === suggestedTopic?.id,
        }));
        const progressSummary = this.buildProgressSummary(learningTrack, completedTopicIds);
        return {
            learningTrack,
            learningTrackLabel: (0, learning_curricula_1.getTrackLabel)(learningTrack),
            studentLevel: student.level,
            topics: topicsWithStatus,
            surahs: learningTrack === 'quran_reading' || learningTrack === 'hifz' ? quran_surahs_1.QURAN_SURAHS : [],
            completedTopicIds,
            currentTopic: currentTopic
                ? { ...currentTopic, label: (0, learning_curricula_1.formatTopicLabel)(currentTopic) }
                : null,
            suggestedTopic: suggestedTopic
                ? { ...suggestedTopic, label: (0, learning_curricula_1.formatTopicLabel)(suggestedTopic) }
                : null,
            progressSummary,
            promotionStatus: progress.promotionStatus || 'none',
            progressionPaused: student.progressionPaused,
            lastPosition: {
                surahNumber: progress.surahNumber,
                lastStudiedSurah: progress.lastStudiedSurah,
                lastStudiedPage: progress.lastStudiedPage,
                lastStudiedAyah: progress.lastStudiedAyah,
                currentTopicId: progress.currentTopicId,
            },
            progress: {
                progressPercentage: progress.progressPercentage,
                rank: progress.rank,
                surahsCount: progress.surahsCount,
                ayahsCount: progress.ayahsCount,
            },
        };
    }
    validateTopicLog(track, dto, completedIds) {
        if (!dto.topicId) {
            throw new common_1.BadRequestException('Topic is required');
        }
        const topic = (0, learning_curricula_1.getTopicById)(track, dto.topicId);
        if (!topic) {
            throw new common_1.BadRequestException('Invalid topic for this learning track');
        }
        const isCompleted = completedIds.includes(dto.topicId);
        if (isCompleted && !dto.isReview) {
            throw new common_1.BadRequestException('This topic is already completed. Enable review mode to log it again.');
        }
        return topic;
    }
    validateSurahLog(dto, requirePage) {
        if (dto.surahNumber == null) {
            throw new common_1.BadRequestException('Surah is required');
        }
        const surah = (0, quran_surahs_1.getSurahByNumber)(dto.surahNumber);
        if (!surah) {
            throw new common_1.BadRequestException('Invalid surah number');
        }
        const startAyah = dto.startAyah ?? dto.lastStudiedAyah;
        const endAyah = dto.endAyah ?? dto.lastStudiedAyah ?? startAyah;
        if (startAyah == null || endAyah == null) {
            throw new common_1.BadRequestException('Starting and ending ayah are required');
        }
        if (startAyah < 1 || endAyah < startAyah || endAyah > surah.totalAyahs) {
            throw new common_1.BadRequestException(`Ayah range must be between 1 and ${surah.totalAyahs} for ${surah.englishName}`);
        }
        if (requirePage) {
            if (dto.lastStudiedPage == null) {
                throw new common_1.BadRequestException('Mushaf page is required (1-604)');
            }
            if (dto.lastStudiedPage < 1 || dto.lastStudiedPage > quran_surahs_1.TOTAL_MUSHAF_PAGES) {
                throw new common_1.BadRequestException(`Page must be between 1 and ${quran_surahs_1.TOTAL_MUSHAF_PAGES}`);
            }
        }
        return {
            surahNumber: surah.number,
            surahName: (0, quran_surahs_1.formatSurahName)(surah),
            startAyah,
            endAyah,
            lastStudiedPage: dto.lastStudiedPage ?? null,
        };
    }
    async applyTopicCompletion(progress, track, topicId, isReview) {
        const completedIds = normalizeCompletedIds(progress.completedTopicIds);
        if (!isReview && !completedIds.includes(topicId)) {
            completedIds.push(topicId);
            progress.completedTopicIds = completedIds;
        }
        const summary = this.buildProgressSummary(track, completedIds);
        progress.progressPercentage = summary.percentage;
        progress.rank = calculateRank(summary.percentage);
        const next = (0, learning_curricula_1.getNextTopic)(track, completedIds);
        progress.currentTopicId = next?.id || topicId;
        return completedIds;
    }
    async applySurahCompletion(progress, track, surahNumber, endAyah, isReview) {
        const surahKey = `surah-${surahNumber}`;
        const completedIds = normalizeCompletedIds(progress.completedTopicIds);
        if (!isReview && !completedIds.includes(surahKey)) {
            completedIds.push(surahKey);
            progress.completedTopicIds = completedIds;
        }
        progress.surahNumber = surahNumber;
        progress.lastStudiedAyah = endAyah;
        progress.surahsCount = completedIds.filter((id) => id.startsWith('surah-')).length;
        progress.ayahsCount += endAyah;
        const summary = this.buildProgressSummary(track, completedIds);
        progress.progressPercentage = summary.percentage;
        progress.rank = calculateRank(summary.percentage);
        progress.currentTopicId = surahKey;
        return completedIds;
    }
    async logProgress(studentId, dto, teacherId) {
        const student = await this.studentRepository.findOne({
            where: { id: studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const learningTrack = (0, learning_curricula_1.resolveLearningTrack)(student.level);
        const progress = await this.getOrCreateProgress(studentId, learningTrack);
        const completedIds = normalizeCompletedIds(progress.completedTopicIds);
        const completionStatus = dto.completionStatus || (dto.isReview ? 'review' : 'completed');
        let logData = {
            studentId,
            teacherId: teacherId || null,
            learningTrack,
            notes: dto.notes || null,
            completionStatus,
            isReview: dto.isReview || false,
        };
        if (learningTrack === 'qaidah' || learningTrack === 'tajweed') {
            const topic = this.validateTopicLog(learningTrack, dto, completedIds);
            logData = {
                ...logData,
                topicId: topic.id,
                topicName: topic.nameEn,
                topicNameAr: topic.nameAr,
            };
            await this.applyTopicCompletion(progress, learningTrack, topic.id, dto.isReview || false);
            progress.lastStudiedSurah = topic.nameEn;
        }
        else if (learningTrack === 'quran_reading') {
            const validated = this.validateSurahLog(dto, true);
            logData = {
                ...logData,
                surahNumber: validated.surahNumber,
                surahName: validated.surahName,
                lastStudiedPage: validated.lastStudiedPage,
                startAyah: validated.startAyah,
                lastStudiedAyah: validated.endAyah,
                endAyah: validated.endAyah,
            };
            await this.applySurahCompletion(progress, learningTrack, validated.surahNumber, validated.endAyah, dto.isReview || false);
            progress.lastStudiedSurah = validated.surahName;
            progress.lastStudiedPage = validated.lastStudiedPage;
        }
        else if (learningTrack === 'hifz') {
            const validated = this.validateSurahLog(dto, false);
            if (!dto.memorizationStatus) {
                throw new common_1.BadRequestException('Memorization status is required for Hifz students');
            }
            logData = {
                ...logData,
                surahNumber: validated.surahNumber,
                surahName: validated.surahName,
                startAyah: validated.startAyah,
                lastStudiedAyah: validated.endAyah,
                endAyah: validated.endAyah,
                memorizationStatus: dto.memorizationStatus,
                revisionStatus: dto.revisionStatus || null,
            };
            await this.applySurahCompletion(progress, learningTrack, validated.surahNumber, validated.endAyah, dto.isReview || false);
            progress.lastStudiedSurah = validated.surahName;
        }
        const log = this.progressLogRepository.create(logData);
        await this.progressLogRepository.save(log);
        const saved = await this.progressRepository.save(progress);
        await this.levelProgressionService.checkAndPromote(student, saved);
        return saved;
    }
    async getStudentLogs(studentId, limit = 50) {
        return this.progressLogRepository.find({
            where: { studentId },
            relations: ['teacher'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async addFeedback(teacherId, studentId, content) {
        const teacher = await this.teacherRepository.findOne({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const student = await this.studentRepository.findOne({
            where: { id: studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const feedback = this.feedbackRepository.create({
            content,
            teacherId,
            studentId,
        });
        return this.feedbackRepository.save(feedback);
    }
    async getStudentFeedback(studentId) {
        return this.feedbackRepository.find({
            where: { studentId },
            relations: ['teacher', 'student'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.ProgressService = ProgressService;
exports.ProgressService = ProgressService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(1, (0, typeorm_1.InjectRepository)(progress_log_entity_1.ProgressLog)),
    __param(2, (0, typeorm_1.InjectRepository)(feedback_entity_1.Feedback)),
    __param(3, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(4, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(5, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        level_progression_service_1.LevelProgressionService])
], ProgressService);
//# sourceMappingURL=progress.service.js.map
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
exports.LevelProgressionService = exports.LEVEL_PATH = void 0;
exports.getNextLevel = getNextLevel;
exports.getPreviousLevel = getPreviousLevel;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const progress_entity_1 = require("./entities/progress.entity");
const level_history_entity_1 = require("./entities/level-history.entity");
const progression_settings_entity_1 = require("./entities/progression-settings.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const parent_entity_1 = require("../parents/entities/parent.entity");
const user_entity_1 = require("../users/entities/user.entity");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const notifications_service_1 = require("../notifications/notifications.service");
const learning_curricula_1 = require("../common/constants/learning-curricula");
const TOTAL_SURAHS = 114;
exports.LEVEL_PATH = [
    student_entity_1.QuranLevel.QAIDA_NOORANIYA,
    student_entity_1.QuranLevel.QURAN_READING,
    student_entity_1.QuranLevel.TAJWEED_PROGRAM,
    student_entity_1.QuranLevel.HIFZ_PROGRAM,
];
function levelIndex(level) {
    if (level === student_entity_1.QuranLevel.HIFZ_MURAJAA) {
        return exports.LEVEL_PATH.indexOf(student_entity_1.QuranLevel.HIFZ_PROGRAM);
    }
    return exports.LEVEL_PATH.indexOf(level);
}
function getNextLevel(level) {
    const idx = levelIndex(level);
    if (idx < 0 || idx >= exports.LEVEL_PATH.length - 1)
        return null;
    return exports.LEVEL_PATH[idx + 1];
}
function getPreviousLevel(level) {
    const idx = levelIndex(level);
    if (idx <= 0)
        return null;
    return exports.LEVEL_PATH[idx - 1];
}
let LevelProgressionService = class LevelProgressionService {
    constructor(progressRepository, levelHistoryRepository, settingsRepository, studentRepository, teacherRepository, parentRepository, userRepository, notificationsService) {
        this.progressRepository = progressRepository;
        this.levelHistoryRepository = levelHistoryRepository;
        this.settingsRepository = settingsRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.parentRepository = parentRepository;
        this.userRepository = userRepository;
        this.notificationsService = notificationsService;
    }
    async getSettings() {
        const existing = await this.settingsRepository.find({ take: 1 });
        if (existing.length)
            return existing[0];
        const settings = this.settingsRepository.create({});
        return this.settingsRepository.save(settings);
    }
    async updateSettings(dto) {
        const settings = await this.getSettings();
        if (dto.quranReadingCompletionMode !== undefined) {
            if (!['full_quran', 'teacher_recommendation'].includes(dto.quranReadingCompletionMode)) {
                throw new common_1.BadRequestException('Invalid quranReadingCompletionMode');
            }
            settings.quranReadingCompletionMode = dto.quranReadingCompletionMode;
        }
        if (dto.tajweedRequiresEvaluation !== undefined) {
            settings.tajweedRequiresEvaluation = !!dto.tajweedRequiresEvaluation;
        }
        return this.settingsRepository.save(settings);
    }
    async ensureCurrentHistoryRow(student) {
        const open = await this.levelHistoryRepository.findOne({
            where: { studentId: student.id, status: 'in_progress' },
            order: { createdAt: 'DESC' },
        });
        if (open)
            return open;
        const row = this.levelHistoryRepository.create({
            studentId: student.id,
            level: student.level,
            learningTrack: (0, learning_curricula_1.resolveLearningTrack)(student.level),
            startedAt: student.createdAt || new Date(),
            status: 'in_progress',
            changeType: 'initial',
            teacherId: student.teacherId || null,
            changedByUserId: null,
        });
        return this.levelHistoryRepository.save(row);
    }
    async getLevelHistory(studentId) {
        return this.levelHistoryRepository.find({
            where: { studentId },
            relations: ['teacher'],
            order: { createdAt: 'ASC' },
        });
    }
    async getLearningPath(studentId) {
        const student = await this.studentRepository.findOne({ where: { id: studentId } });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        await this.ensureCurrentHistoryRow(student);
        const history = await this.getLevelHistory(studentId);
        const currentIdx = levelIndex(student.level);
        const activeProgress = await this.progressRepository.findOne({
            where: { studentId, learningTrack: (0, learning_curricula_1.resolveLearningTrack)(student.level) },
            order: { createdAt: 'DESC' },
        });
        const stages = exports.LEVEL_PATH.map((level, idx) => {
            const track = (0, learning_curricula_1.resolveLearningTrack)(level);
            const completedRow = [...history]
                .reverse()
                .find((h) => h.level === level && h.status === 'completed');
            const openRow = [...history]
                .reverse()
                .find((h) => h.level === level && h.status === 'in_progress');
            let status;
            if (idx === currentIdx) {
                status = 'current';
            }
            else if (completedRow && idx < currentIdx) {
                status = 'completed';
            }
            else if (idx < currentIdx) {
                status = 'completed';
            }
            else {
                status = 'upcoming';
            }
            return {
                level,
                learningTrack: track,
                label: (0, learning_curricula_1.getTrackLabel)(track),
                status,
                startedAt: (status === 'current' ? openRow?.startedAt : completedRow?.startedAt) ||
                    completedRow?.startedAt ||
                    null,
                completedAt: completedRow?.completedAt || null,
                progressPercentage: status === 'current'
                    ? (activeProgress?.progressPercentage ?? 0)
                    : status === 'completed'
                        ? 100
                        : 0,
            };
        });
        return {
            currentLevel: student.level,
            currentTrack: (0, learning_curricula_1.resolveLearningTrack)(student.level),
            progressionPaused: student.progressionPaused,
            promotionStatus: activeProgress?.promotionStatus || 'none',
            stages,
        };
    }
    isTrackCurriculumComplete(track, completedIds) {
        if (track === 'qaidah' || track === 'tajweed') {
            const topics = (0, learning_curricula_1.getTopicsForTrack)(track);
            return topics.length > 0 && topics.every((t) => completedIds.includes(t.id));
        }
        if (track === 'quran_reading') {
            const surahCount = completedIds.filter((id) => id.startsWith('surah-')).length;
            return surahCount >= TOTAL_SURAHS;
        }
        return false;
    }
    async checkAndPromote(student, progress) {
        if (student.progressionPaused)
            return;
        const track = (0, learning_curricula_1.resolveLearningTrack)(student.level);
        if (track === 'hifz')
            return;
        const nextLevel = getNextLevel(student.level);
        if (!nextLevel)
            return;
        const completedIds = Array.isArray(progress.completedTopicIds)
            ? progress.completedTopicIds
            : [];
        const settings = await this.getSettings();
        if (track === 'qaidah') {
            if (this.isTrackCurriculumComplete('qaidah', completedIds)) {
                await this.promote(student, nextLevel, 'auto_promotion', null, 'All Qaidah Nooraniyah lessons completed');
            }
            return;
        }
        if (track === 'quran_reading') {
            if (settings.quranReadingCompletionMode === 'full_quran') {
                if (this.isTrackCurriculumComplete('quran_reading', completedIds)) {
                    await this.promote(student, nextLevel, 'auto_promotion', null, 'Completed reading of the entire Quran');
                }
            }
            return;
        }
        if (track === 'tajweed') {
            if (!this.isTrackCurriculumComplete('tajweed', completedIds))
                return;
            if (!settings.tajweedRequiresEvaluation) {
                await this.promote(student, nextLevel, 'auto_promotion', null, 'All Tajweed topics completed');
                return;
            }
            if (progress.promotionStatus === 'none') {
                progress.promotionStatus = 'ready';
                await this.progressRepository.save(progress);
                await this.notifyReadyForEvaluation(student, 'Tajweed');
            }
        }
    }
    async recommendPromotion(studentId, teacherUserId, reason) {
        const student = await this.studentRepository.findOne({ where: { id: studentId } });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        const track = (0, learning_curricula_1.resolveLearningTrack)(student.level);
        const nextLevel = getNextLevel(student.level);
        if (!nextLevel) {
            throw new common_1.BadRequestException('Student is already at the final level');
        }
        const progress = await this.getActiveProgress(studentId, track);
        const settings = await this.getSettings();
        if (track === 'tajweed') {
            const completedIds = Array.isArray(progress?.completedTopicIds)
                ? progress.completedTopicIds
                : [];
            if (!this.isTrackCurriculumComplete('tajweed', completedIds)) {
                throw new common_1.BadRequestException('All Tajweed topics must be completed before the evaluation');
            }
            await this.promote(student, nextLevel, 'auto_promotion', teacherUserId, reason || 'Teacher evaluation passed');
            return this.getActiveProgress(studentId, (0, learning_curricula_1.resolveLearningTrack)(nextLevel));
        }
        if (track === 'quran_reading' &&
            settings.quranReadingCompletionMode === 'teacher_recommendation') {
            await this.promote(student, nextLevel, 'auto_promotion', teacherUserId, reason || 'Teacher recommendation + evaluation pass');
            return this.getActiveProgress(studentId, (0, learning_curricula_1.resolveLearningTrack)(nextLevel));
        }
        throw new common_1.BadRequestException('This level does not accept teacher promotion recommendations');
    }
    async getActiveProgress(studentId, track) {
        return this.progressRepository.findOne({
            where: { studentId, learningTrack: track },
            order: { createdAt: 'DESC' },
        });
    }
    async promote(student, toLevel, changeType, changedByUserId, reason, closeStatus = 'completed') {
        const fromLevel = student.level;
        const fromTrack = (0, learning_curricula_1.resolveLearningTrack)(fromLevel);
        const toTrack = (0, learning_curricula_1.resolveLearningTrack)(toLevel);
        const now = new Date();
        const currentProgress = await this.getActiveProgress(student.id, fromTrack);
        const openRow = await this.ensureCurrentHistoryRow(student);
        openRow.completedAt = now;
        openRow.status = closeStatus;
        openRow.completedTopicIdsSnapshot = currentProgress?.completedTopicIds || null;
        openRow.progressPercentageSnapshot = currentProgress?.progressPercentage ?? null;
        await this.levelHistoryRepository.save(openRow);
        student.level = toLevel;
        await this.studentRepository.save(student);
        await this.levelHistoryRepository.save(this.levelHistoryRepository.create({
            studentId: student.id,
            level: toLevel,
            learningTrack: toTrack,
            startedAt: now,
            status: 'in_progress',
            changeType,
            teacherId: student.teacherId || null,
            changedByUserId,
            reason: reason || null,
        }));
        if (currentProgress && currentProgress.promotionStatus !== 'none') {
            currentProgress.promotionStatus = 'none';
            await this.progressRepository.save(currentProgress);
        }
        const existingNext = await this.getActiveProgress(student.id, toTrack);
        if (!existingNext) {
            await this.progressRepository.save(this.progressRepository.create({
                studentId: student.id,
                surahsCount: 0,
                ayahsCount: 0,
                weeksActive: 0,
                progressPercentage: 0,
                rank: 'Beginner',
                learningTrack: toTrack,
                completedTopicIds: [],
                promotionStatus: 'none',
            }));
        }
        const isUpgrade = levelIndex(toLevel) > levelIndex(fromLevel);
        const title = isUpgrade ? 'Level Completed - Mubarak!' : 'Learning Level Updated';
        const message = isUpgrade
            ? `${student.fullName} has completed ${(0, learning_curricula_1.getTrackLabel)(fromTrack)} and moved to ${(0, learning_curricula_1.getTrackLabel)(toTrack)}.`
            : `${student.fullName}'s learning level changed from ${(0, learning_curricula_1.getTrackLabel)(fromTrack)} to ${(0, learning_curricula_1.getTrackLabel)(toTrack)}.`;
        await this.notifyAllParties(student, title, message, {
            studentId: student.id,
            fromLevel,
            toLevel,
            changeType,
            reason: reason || null,
        });
    }
    async applyManualAction(studentId, dto, adminUserId) {
        const student = await this.studentRepository.findOne({ where: { id: studentId } });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        const reason = dto.reason || null;
        switch (dto.action) {
            case 'promote': {
                const target = dto.targetLevel || getNextLevel(student.level);
                if (!target)
                    throw new common_1.BadRequestException('Student is already at the final level');
                this.assertValidLevel(target);
                await this.promote(student, target, 'manual_promotion', adminUserId, reason || 'Manual promotion by admin');
                return { student, message: `Student promoted to ${target}` };
            }
            case 'demote': {
                const target = dto.targetLevel || getPreviousLevel(student.level);
                if (!target)
                    throw new common_1.BadRequestException('Student is already at the first level');
                this.assertValidLevel(target);
                await this.promote(student, target, 'manual_demotion', adminUserId, reason || 'Manual demotion by admin', 'demoted');
                return { student, message: `Student moved back to ${target}` };
            }
            case 'repeat': {
                const track = (0, learning_curricula_1.resolveLearningTrack)(student.level);
                const now = new Date();
                const currentProgress = await this.getActiveProgress(studentId, track);
                const openRow = await this.ensureCurrentHistoryRow(student);
                openRow.completedAt = now;
                openRow.status = 'repeated';
                openRow.completedTopicIdsSnapshot = currentProgress?.completedTopicIds || null;
                openRow.progressPercentageSnapshot = currentProgress?.progressPercentage ?? null;
                await this.levelHistoryRepository.save(openRow);
                await this.levelHistoryRepository.save(this.levelHistoryRepository.create({
                    studentId,
                    level: student.level,
                    learningTrack: track,
                    startedAt: now,
                    status: 'in_progress',
                    changeType: 'repeat',
                    teacherId: student.teacherId || null,
                    changedByUserId: adminUserId,
                    reason: reason || 'Level repeated by admin',
                }));
                await this.progressRepository.save(this.progressRepository.create({
                    studentId,
                    surahsCount: 0,
                    ayahsCount: 0,
                    weeksActive: 0,
                    progressPercentage: 0,
                    rank: 'Beginner',
                    learningTrack: track,
                    completedTopicIds: [],
                    promotionStatus: 'none',
                }));
                await this.notifyAllParties(student, 'Learning Level Restarted', `${student.fullName} will repeat the ${(0, learning_curricula_1.getTrackLabel)(track)} level.`, { studentId, level: student.level, changeType: 'repeat', reason });
                return { student, message: 'Level restarted' };
            }
            case 'pause':
            case 'resume': {
                const pausing = dto.action === 'pause';
                student.progressionPaused = pausing;
                await this.studentRepository.save(student);
                await this.levelHistoryRepository.save(this.levelHistoryRepository.create({
                    studentId,
                    level: student.level,
                    learningTrack: (0, learning_curricula_1.resolveLearningTrack)(student.level),
                    startedAt: new Date(),
                    completedAt: new Date(),
                    status: 'paused',
                    changeType: pausing ? 'pause' : 'resume',
                    teacherId: student.teacherId || null,
                    changedByUserId: adminUserId,
                    reason: reason || null,
                }));
                return {
                    student,
                    message: pausing ? 'Automatic progression paused' : 'Automatic progression resumed',
                };
            }
            default:
                throw new common_1.BadRequestException('Invalid action');
        }
    }
    assertValidLevel(level) {
        if (!Object.values(student_entity_1.QuranLevel).includes(level)) {
            throw new common_1.BadRequestException('Invalid target level');
        }
    }
    async collectRecipientUserIds(student) {
        const recipientIds = [];
        if (student.userId)
            recipientIds.push(student.userId);
        if (student.parentId) {
            const parent = await this.parentRepository.findOne({
                where: { id: student.parentId },
                relations: ['user'],
            });
            if (parent?.user?.id)
                recipientIds.push(parent.user.id);
        }
        if (student.teacherId) {
            const teacher = await this.teacherRepository.findOne({ where: { id: student.teacherId } });
            if (teacher?.userId)
                recipientIds.push(teacher.userId);
        }
        const admins = await this.userRepository.find({
            where: { role: (0, typeorm_2.In)([user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN]) },
        });
        recipientIds.push(...admins.map((a) => a.id));
        return recipientIds;
    }
    async notifyAllParties(student, title, message, data) {
        const recipientIds = await this.collectRecipientUserIds(student);
        await this.notificationsService.sendCustomNotifications(recipientIds, title, message, data);
    }
    async notifyReadyForEvaluation(student, levelLabel) {
        const recipientIds = [];
        if (student.teacherId) {
            const teacher = await this.teacherRepository.findOne({ where: { id: student.teacherId } });
            if (teacher?.userId)
                recipientIds.push(teacher.userId);
        }
        const admins = await this.userRepository.find({
            where: { role: (0, typeorm_2.In)([user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN]) },
        });
        recipientIds.push(...admins.map((a) => a.id));
        await this.notificationsService.sendCustomNotifications(recipientIds, 'Student Ready for Evaluation', `${student.fullName} completed all ${levelLabel} topics and is ready for the promotion evaluation.`, { studentId: student.id, level: student.level });
    }
};
exports.LevelProgressionService = LevelProgressionService;
exports.LevelProgressionService = LevelProgressionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(1, (0, typeorm_1.InjectRepository)(level_history_entity_1.StudentLevelHistory)),
    __param(2, (0, typeorm_1.InjectRepository)(progression_settings_entity_1.ProgressionSettings)),
    __param(3, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(4, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(5, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], LevelProgressionService);
//# sourceMappingURL=level-progression.service.js.map
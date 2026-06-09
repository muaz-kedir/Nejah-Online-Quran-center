import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import {
  StudentLevelHistory,
  LevelChangeType,
  LevelHistoryStatus,
} from './entities/level-history.entity';
import { ProgressionSettings } from './entities/progression-settings.entity';
import { Student, QuranLevel } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Parent } from '../parents/entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import {
  LearningTrack,
  resolveLearningTrack,
  getTopicsForTrack,
  getTrackLabel,
} from '../common/constants/learning-curricula';

const TOTAL_SURAHS = 114;

export const LEVEL_PATH: QuranLevel[] = [
  QuranLevel.QAIDA_NOORANIYA,
  QuranLevel.QURAN_READING,
  QuranLevel.TAJWEED_PROGRAM,
  QuranLevel.HIFZ_PROGRAM,
];

function levelIndex(level: QuranLevel): number {
  // Hifz Muraja'a is a hifz-stage variant, outside the auto path.
  if (level === QuranLevel.HIFZ_MURAJAA) {
    return LEVEL_PATH.indexOf(QuranLevel.HIFZ_PROGRAM);
  }
  return LEVEL_PATH.indexOf(level);
}

export function getNextLevel(level: QuranLevel): QuranLevel | null {
  const idx = levelIndex(level);
  if (idx < 0 || idx >= LEVEL_PATH.length - 1) return null;
  return LEVEL_PATH[idx + 1];
}

export function getPreviousLevel(level: QuranLevel): QuranLevel | null {
  const idx = levelIndex(level);
  if (idx <= 0) return null;
  return LEVEL_PATH[idx - 1];
}

export interface ManualLevelActionDto {
  action: 'promote' | 'demote' | 'repeat' | 'pause' | 'resume';
  targetLevel?: QuranLevel;
  reason?: string;
}

@Injectable()
export class LevelProgressionService {
  constructor(
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(StudentLevelHistory)
    private levelHistoryRepository: Repository<StudentLevelHistory>,
    @InjectRepository(ProgressionSettings)
    private settingsRepository: Repository<ProgressionSettings>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  // ---------------------------------------------------------------- settings

  async getSettings(): Promise<ProgressionSettings> {
    const existing = await this.settingsRepository.find({ take: 1 });
    if (existing.length) return existing[0];
    const settings = this.settingsRepository.create({});
    return this.settingsRepository.save(settings);
  }

  async updateSettings(
    dto: Partial<Pick<ProgressionSettings, 'quranReadingCompletionMode' | 'tajweedRequiresEvaluation'>>,
  ): Promise<ProgressionSettings> {
    const settings = await this.getSettings();
    if (dto.quranReadingCompletionMode !== undefined) {
      if (!['full_quran', 'teacher_recommendation'].includes(dto.quranReadingCompletionMode)) {
        throw new BadRequestException('Invalid quranReadingCompletionMode');
      }
      settings.quranReadingCompletionMode = dto.quranReadingCompletionMode;
    }
    if (dto.tajweedRequiresEvaluation !== undefined) {
      settings.tajweedRequiresEvaluation = !!dto.tajweedRequiresEvaluation;
    }
    return this.settingsRepository.save(settings);
  }

  // ----------------------------------------------------------------- history

  /** Latest open ("in_progress") history row, creating an initial one if missing. */
  async ensureCurrentHistoryRow(student: Student): Promise<StudentLevelHistory> {
    const open = await this.levelHistoryRepository.findOne({
      where: { studentId: student.id, status: 'in_progress' },
      order: { createdAt: 'DESC' },
    });
    if (open) return open;

    const row = this.levelHistoryRepository.create({
      studentId: student.id,
      level: student.level,
      learningTrack: resolveLearningTrack(student.level),
      startedAt: student.createdAt || new Date(),
      status: 'in_progress',
      changeType: 'initial',
      teacherId: student.teacherId || null,
      changedByUserId: null,
    });
    return this.levelHistoryRepository.save(row);
  }

  async getLevelHistory(studentId: string): Promise<StudentLevelHistory[]> {
    return this.levelHistoryRepository.find({
      where: { studentId },
      relations: ['teacher'],
      order: { createdAt: 'ASC' },
    });
  }

  // ----------------------------------------------------------- learning path

  async getLearningPath(studentId: string) {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.ensureCurrentHistoryRow(student);
    const history = await this.getLevelHistory(studentId);
    const currentIdx = levelIndex(student.level);

    const activeProgress = await this.progressRepository.findOne({
      where: { studentId, learningTrack: resolveLearningTrack(student.level) },
      order: { createdAt: 'DESC' },
    });

    const stages = LEVEL_PATH.map((level, idx) => {
      const track = resolveLearningTrack(level);
      const completedRow = [...history]
        .reverse()
        .find((h) => h.level === level && h.status === 'completed');
      const openRow = [...history]
        .reverse()
        .find((h) => h.level === level && h.status === 'in_progress');

      let status: 'completed' | 'current' | 'upcoming';
      if (idx === currentIdx) {
        status = 'current';
      } else if (completedRow && idx < currentIdx) {
        status = 'completed';
      } else if (idx < currentIdx) {
        status = 'completed';
      } else {
        status = 'upcoming';
      }

      return {
        level,
        learningTrack: track,
        label: getTrackLabel(track),
        status,
        startedAt: (status === 'current' ? openRow?.startedAt : completedRow?.startedAt) || completedRow?.startedAt || null,
        completedAt: completedRow?.completedAt || null,
        progressPercentage:
          status === 'current' ? activeProgress?.progressPercentage ?? 0 : status === 'completed' ? 100 : 0,
      };
    });

    return {
      currentLevel: student.level,
      currentTrack: resolveLearningTrack(student.level),
      progressionPaused: student.progressionPaused,
      promotionStatus: activeProgress?.promotionStatus || 'none',
      stages,
    };
  }

  // ------------------------------------------------------------- auto checks

  private isTrackCurriculumComplete(track: LearningTrack, completedIds: string[]): boolean {
    if (track === 'qaidah' || track === 'tajweed') {
      const topics = getTopicsForTrack(track);
      return topics.length > 0 && topics.every((t) => completedIds.includes(t.id));
    }
    if (track === 'quran_reading') {
      const surahCount = completedIds.filter((id) => id.startsWith('surah-')).length;
      return surahCount >= TOTAL_SURAHS;
    }
    return false;
  }

  /**
   * Called after every daily progress log. Auto-promotes the student or marks
   * them ready for evaluation/approval, depending on level and settings.
   */
  async checkAndPromote(student: Student, progress: Progress): Promise<void> {
    if (student.progressionPaused) return;

    const track = resolveLearningTrack(student.level);
    if (track === 'hifz') return; // terminal level

    const nextLevel = getNextLevel(student.level);
    if (!nextLevel) return;

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
      // teacher_recommendation mode: promotion happens via recommendPromotion()
      return;
    }

    if (track === 'tajweed') {
      if (!this.isTrackCurriculumComplete('tajweed', completedIds)) return;

      if (!settings.tajweedRequiresEvaluation) {
        await this.promote(student, nextLevel, 'auto_promotion', null, 'All Tajweed topics completed');
        return;
      }

      // Requires evaluation: flag once and notify teacher + admins.
      if (progress.promotionStatus === 'none') {
        progress.promotionStatus = 'ready';
        await this.progressRepository.save(progress);
        await this.notifyReadyForEvaluation(student, 'Tajweed');
      }
    }
  }

  /** Teacher confirms evaluation pass / recommends promotion. */
  async recommendPromotion(studentId: string, teacherUserId: string | null, reason?: string): Promise<Progress> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const track = resolveLearningTrack(student.level);
    const nextLevel = getNextLevel(student.level);
    if (!nextLevel) {
      throw new BadRequestException('Student is already at the final level');
    }

    const progress = await this.getActiveProgress(studentId, track);
    const settings = await this.getSettings();

    if (track === 'tajweed') {
      const completedIds = Array.isArray(progress?.completedTopicIds) ? progress.completedTopicIds : [];
      if (!this.isTrackCurriculumComplete('tajweed', completedIds)) {
        throw new BadRequestException('All Tajweed topics must be completed before the evaluation');
      }
      // Teacher evaluation pass promotes directly per the progression rules.
      await this.promote(student, nextLevel, 'auto_promotion', teacherUserId, reason || 'Teacher evaluation passed');
      return this.getActiveProgress(studentId, resolveLearningTrack(nextLevel));
    }

    if (track === 'quran_reading' && settings.quranReadingCompletionMode === 'teacher_recommendation') {
      await this.promote(student, nextLevel, 'auto_promotion', teacherUserId, reason || 'Teacher recommendation + evaluation pass');
      return this.getActiveProgress(studentId, resolveLearningTrack(nextLevel));
    }

    throw new BadRequestException('This level does not accept teacher promotion recommendations');
  }

  // -------------------------------------------------------------- promotion

  private async getActiveProgress(studentId: string, track: LearningTrack): Promise<Progress | null> {
    return this.progressRepository.findOne({
      where: { studentId, learningTrack: track },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Moves the student to the given level: closes the current history row,
   * opens a new one, creates a fresh Progress record for the new track and
   * notifies student, parent, teacher and admins.
   */
  async promote(
    student: Student,
    toLevel: QuranLevel,
    changeType: LevelChangeType,
    changedByUserId: string | null,
    reason?: string,
    closeStatus: LevelHistoryStatus = 'completed',
  ): Promise<void> {
    const fromLevel = student.level;
    const fromTrack = resolveLearningTrack(fromLevel);
    const toTrack = resolveLearningTrack(toLevel);
    const now = new Date();

    const currentProgress = await this.getActiveProgress(student.id, fromTrack);

    // 1. Close the current history row with snapshots.
    const openRow = await this.ensureCurrentHistoryRow(student);
    openRow.completedAt = now;
    openRow.status = closeStatus;
    openRow.completedTopicIdsSnapshot = currentProgress?.completedTopicIds || null;
    openRow.progressPercentageSnapshot = currentProgress?.progressPercentage ?? null;
    await this.levelHistoryRepository.save(openRow);

    // 2. Update the student's level.
    student.level = toLevel;
    await this.studentRepository.save(student);

    // 3. Open the new history row.
    await this.levelHistoryRepository.save(
      this.levelHistoryRepository.create({
        studentId: student.id,
        level: toLevel,
        learningTrack: toTrack,
        startedAt: now,
        status: 'in_progress',
        changeType,
        teacherId: student.teacherId || null,
        changedByUserId,
        reason: reason || null,
      }),
    );

    // 4. Clear the flag on the old progress row and create a record for the new track.
    if (currentProgress && currentProgress.promotionStatus !== 'none') {
      currentProgress.promotionStatus = 'none';
      await this.progressRepository.save(currentProgress);
    }
    const existingNext = await this.getActiveProgress(student.id, toTrack);
    if (!existingNext) {
      await this.progressRepository.save(
        this.progressRepository.create({
          studentId: student.id,
          surahsCount: 0,
          ayahsCount: 0,
          weeksActive: 0,
          progressPercentage: 0,
          rank: 'Beginner',
          learningTrack: toTrack,
          completedTopicIds: [],
          promotionStatus: 'none',
        }),
      );
    }

    // 5. Notifications.
    const isUpgrade = levelIndex(toLevel) > levelIndex(fromLevel);
    const title = isUpgrade ? 'Level Completed - Mubarak!' : 'Learning Level Updated';
    const message = isUpgrade
      ? `${student.fullName} has completed ${getTrackLabel(fromTrack)} and moved to ${getTrackLabel(toTrack)}.`
      : `${student.fullName}'s learning level changed from ${getTrackLabel(fromTrack)} to ${getTrackLabel(toTrack)}.`;
    await this.notifyAllParties(student, title, message, {
      studentId: student.id,
      fromLevel,
      toLevel,
      changeType,
      reason: reason || null,
    });
  }

  // --------------------------------------------------------- admin overrides

  async applyManualAction(
    studentId: string,
    dto: ManualLevelActionDto,
    adminUserId: string,
  ): Promise<{ student: Student; message: string }> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const reason = dto.reason || null;

    switch (dto.action) {
      case 'promote': {
        const target = dto.targetLevel || getNextLevel(student.level);
        if (!target) throw new BadRequestException('Student is already at the final level');
        this.assertValidLevel(target);
        await this.promote(student, target, 'manual_promotion', adminUserId, reason || 'Manual promotion by admin');
        return { student, message: `Student promoted to ${target}` };
      }
      case 'demote': {
        const target = dto.targetLevel || getPreviousLevel(student.level);
        if (!target) throw new BadRequestException('Student is already at the first level');
        this.assertValidLevel(target);
        await this.promote(student, target, 'manual_demotion', adminUserId, reason || 'Manual demotion by admin', 'demoted');
        return { student, message: `Student moved back to ${target}` };
      }
      case 'repeat': {
        const track = resolveLearningTrack(student.level);
        const now = new Date();
        const currentProgress = await this.getActiveProgress(studentId, track);

        const openRow = await this.ensureCurrentHistoryRow(student);
        openRow.completedAt = now;
        openRow.status = 'repeated';
        openRow.completedTopicIdsSnapshot = currentProgress?.completedTopicIds || null;
        openRow.progressPercentageSnapshot = currentProgress?.progressPercentage ?? null;
        await this.levelHistoryRepository.save(openRow);

        await this.levelHistoryRepository.save(
          this.levelHistoryRepository.create({
            studentId,
            level: student.level,
            learningTrack: track,
            startedAt: now,
            status: 'in_progress',
            changeType: 'repeat',
            teacherId: student.teacherId || null,
            changedByUserId: adminUserId,
            reason: reason || 'Level repeated by admin',
          }),
        );

        // Fresh progress record; the old one is preserved as history.
        await this.progressRepository.save(
          this.progressRepository.create({
            studentId,
            surahsCount: 0,
            ayahsCount: 0,
            weeksActive: 0,
            progressPercentage: 0,
            rank: 'Beginner',
            learningTrack: track,
            completedTopicIds: [],
            promotionStatus: 'none',
          }),
        );

        await this.notifyAllParties(
          student,
          'Learning Level Restarted',
          `${student.fullName} will repeat the ${getTrackLabel(track)} level.`,
          { studentId, level: student.level, changeType: 'repeat', reason },
        );
        return { student, message: 'Level restarted' };
      }
      case 'pause':
      case 'resume': {
        const pausing = dto.action === 'pause';
        student.progressionPaused = pausing;
        await this.studentRepository.save(student);

        // Point-in-time audit marker; the open in_progress row is untouched.
        await this.levelHistoryRepository.save(
          this.levelHistoryRepository.create({
            studentId,
            level: student.level,
            learningTrack: resolveLearningTrack(student.level),
            startedAt: new Date(),
            completedAt: new Date(),
            status: 'paused',
            changeType: pausing ? 'pause' : 'resume',
            teacherId: student.teacherId || null,
            changedByUserId: adminUserId,
            reason: reason || null,
          }),
        );
        return {
          student,
          message: pausing ? 'Automatic progression paused' : 'Automatic progression resumed',
        };
      }
      default:
        throw new BadRequestException('Invalid action');
    }
  }

  private assertValidLevel(level: QuranLevel) {
    if (!Object.values(QuranLevel).includes(level)) {
      throw new BadRequestException('Invalid target level');
    }
  }

  // ----------------------------------------------------------- notifications

  private async collectRecipientUserIds(student: Student): Promise<string[]> {
    const recipientIds: string[] = [];

    if (student.userId) recipientIds.push(student.userId);

    if (student.parentId) {
      const parent = await this.parentRepository.findOne({
        where: { id: student.parentId },
        relations: ['user'],
      });
      if (parent?.user?.id) recipientIds.push(parent.user.id);
    }

    if (student.teacherId) {
      const teacher = await this.teacherRepository.findOne({ where: { id: student.teacherId } });
      if (teacher?.userId) recipientIds.push(teacher.userId);
    }

    const admins = await this.userRepository.find({
      where: { role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]) },
    });
    recipientIds.push(...admins.map((a) => a.id));

    return recipientIds;
  }

  private async notifyAllParties(
    student: Student,
    title: string,
    message: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const recipientIds = await this.collectRecipientUserIds(student);
    await this.notificationsService.sendCustomNotifications(recipientIds, title, message, data);
  }

  private async notifyReadyForEvaluation(student: Student, levelLabel: string): Promise<void> {
    const recipientIds: string[] = [];

    if (student.teacherId) {
      const teacher = await this.teacherRepository.findOne({ where: { id: student.teacherId } });
      if (teacher?.userId) recipientIds.push(teacher.userId);
    }
    const admins = await this.userRepository.find({
      where: { role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]) },
    });
    recipientIds.push(...admins.map((a) => a.id));

    await this.notificationsService.sendCustomNotifications(
      recipientIds,
      'Student Ready for Evaluation',
      `${student.fullName} completed all ${levelLabel} topics and is ready for the promotion evaluation.`,
      { studentId: student.id, level: student.level },
    );
  }
}

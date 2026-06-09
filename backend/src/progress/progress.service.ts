import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { ProgressLog } from './entities/progress-log.entity';
import { Feedback } from './entities/feedback.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Parent } from '../parents/entities/parent.entity';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { LevelProgressionService } from './level-progression.service';
import {
  QURAN_SURAHS,
  TOTAL_MUSHAF_PAGES,
  getSurahByNumber,
  formatSurahName,
} from '../common/constants/quran-surahs';
import {
  LearningTrack,
  resolveLearningTrack,
  getTopicsForTrack,
  getTopicById,
  getNextTopic,
  formatTopicLabel,
  getTrackLabel,
} from '../common/constants/learning-curricula';

const TOTAL_SURAHS = 114;

function calculateRank(percentage: number): string {
  if (percentage >= 90) return 'Expert';
  if (percentage >= 70) return 'Advanced';
  if (percentage >= 40) return 'Intermediate';
  return 'Beginner';
}

function normalizeCompletedIds(ids: string[] | null | undefined): string[] {
  return Array.isArray(ids) ? ids : [];
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(ProgressLog)
    private progressLogRepository: Repository<ProgressLog>,
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    private levelProgressionService: LevelProgressionService,
  ) {}

  getSurahList() {
    return QURAN_SURAHS;
  }

  async assertUserCanViewStudentProgress(
    userId: string,
    role: string,
    studentId: string,
  ): Promise<void> {
    if (role === 'student') {
      const student = await this.studentRepository.findOne({
        where: { id: studentId, userId },
      });
      if (!student) {
        throw new ForbiddenException('You can only view your own progress');
      }
      return;
    }

    if (role === 'parent') {
      const parent = await this.parentRepository.findOne({
        where: { user: { id: userId } },
        relations: ['students'],
      });
      if (!parent?.students?.some((s) => s.id === studentId)) {
        throw new ForbiddenException('You can only view your children\'s progress');
      }
    }
  }

  /**
   * Progress records are kept per (student, learning track). When a student is
   * promoted, the old track's record is preserved and a fresh one is created,
   * so no historical learning data is ever lost.
   */
  async getOrCreateProgress(studentId: string, track?: LearningTrack): Promise<Progress> {
    let learningTrack = track;
    if (!learningTrack) {
      const student = await this.studentRepository.findOne({ where: { id: studentId } });
      learningTrack = resolveLearningTrack(student?.level);
    }

    const existing = await this.progressRepository.findOne({
      where: { studentId, learningTrack },
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
    if (existing) {
      return existing;
    }

    // Adopt a legacy untracked row instead of creating a duplicate.
    const legacy = await this.progressRepository.findOne({
      where: { studentId, learningTrack: IsNull() },
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

  private buildProgressSummary(track: LearningTrack, completedIds: string[]) {
    if (track === 'qaidah' || track === 'tajweed') {
      const total = getTopicsForTrack(track).length;
      const completed = completedIds.length;
      const percentage = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
      return { completed, total, remaining: Math.max(total - completed, 0), percentage };
    }

    if (track === 'quran_reading' || track === 'hifz') {
      // Ticked surahs are the single source of truth for the completed count.
      const completed = completedIds.filter((id) => id.startsWith('surah-')).length;
      const percentage = Math.min(Math.round((completed / TOTAL_SURAHS) * 1000) / 10, 100);
      return { completed, total: TOTAL_SURAHS, remaining: Math.max(TOTAL_SURAHS - completed, 0), percentage };
    }

    return { completed: 0, total: 0, remaining: 0, percentage: 0 };
  }

  async getLearningContext(studentId: string) {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const learningTrack = resolveLearningTrack(student.level);
    const progress = await this.getOrCreateProgress(studentId, learningTrack);

    const completedTopicIds = normalizeCompletedIds(progress.completedTopicIds);
    const curriculumTopics = getTopicsForTrack(learningTrack);
    const suggestedTopic = getNextTopic(learningTrack, completedTopicIds);
    const currentTopicId = progress.currentTopicId || suggestedTopic?.id || null;
    const currentTopic =
      (currentTopicId && getTopicById(learningTrack, currentTopicId)) || suggestedTopic;

    const topicsWithStatus = curriculumTopics.map((topic) => ({
      ...topic,
      label: formatTopicLabel(topic),
      isCompleted: completedTopicIds.includes(topic.id),
      isCurrent: topic.id === currentTopicId,
      isSuggested: topic.id === suggestedTopic?.id,
    }));

    const progressSummary = this.buildProgressSummary(learningTrack, completedTopicIds);

    return {
      learningTrack,
      learningTrackLabel: getTrackLabel(learningTrack),
      studentLevel: student.level,
      topics: topicsWithStatus,
      surahs: learningTrack === 'quran_reading' || learningTrack === 'hifz' ? QURAN_SURAHS : [],
      completedTopicIds,
      currentTopic: currentTopic
        ? { ...currentTopic, label: formatTopicLabel(currentTopic) }
        : null,
      suggestedTopic: suggestedTopic
        ? { ...suggestedTopic, label: formatTopicLabel(suggestedTopic) }
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

  private validateTopicLog(
    track: LearningTrack,
    dto: UpdateProgressDto,
    completedIds: string[],
  ) {
    if (!dto.topicId) {
      throw new BadRequestException('Topic is required');
    }

    const topic = getTopicById(track, dto.topicId);
    if (!topic) {
      throw new BadRequestException('Invalid topic for this learning track');
    }

    const isCompleted = completedIds.includes(dto.topicId);
    if (isCompleted && !dto.isReview) {
      throw new BadRequestException(
        'This topic is already completed. Enable review mode to log it again.',
      );
    }

    return topic;
  }

  private validateSurahLog(dto: UpdateProgressDto, requirePage: boolean) {
    if (dto.surahNumber == null) {
      throw new BadRequestException('Surah is required');
    }

    const surah = getSurahByNumber(dto.surahNumber);
    if (!surah) {
      throw new BadRequestException('Invalid surah number');
    }

    const startAyah = dto.startAyah ?? dto.lastStudiedAyah;
    const endAyah = dto.endAyah ?? dto.lastStudiedAyah ?? startAyah;

    if (startAyah == null || endAyah == null) {
      throw new BadRequestException('Starting and ending ayah are required');
    }

    if (startAyah < 1 || endAyah < startAyah || endAyah > surah.totalAyahs) {
      throw new BadRequestException(
        `Ayah range must be between 1 and ${surah.totalAyahs} for ${surah.englishName}`,
      );
    }

    if (requirePage) {
      if (dto.lastStudiedPage == null) {
        throw new BadRequestException('Mushaf page is required (1-604)');
      }
      if (dto.lastStudiedPage < 1 || dto.lastStudiedPage > TOTAL_MUSHAF_PAGES) {
        throw new BadRequestException(`Page must be between 1 and ${TOTAL_MUSHAF_PAGES}`);
      }
    }

    return {
      surahNumber: surah.number,
      surahName: formatSurahName(surah),
      startAyah,
      endAyah,
      lastStudiedPage: dto.lastStudiedPage ?? null,
    };
  }

  private async applyTopicCompletion(
    progress: Progress,
    track: LearningTrack,
    topicId: string,
    isReview: boolean,
  ) {
    const completedIds = normalizeCompletedIds(progress.completedTopicIds);

    if (!isReview && !completedIds.includes(topicId)) {
      completedIds.push(topicId);
      progress.completedTopicIds = completedIds;
    }

    const summary = this.buildProgressSummary(track, completedIds);
    progress.progressPercentage = summary.percentage;
    progress.rank = calculateRank(summary.percentage);

    const next = getNextTopic(track, completedIds);
    progress.currentTopicId = next?.id || topicId;

    return completedIds;
  }

  private async applySurahCompletion(
    progress: Progress,
    track: LearningTrack,
    surahNumber: number,
    endAyah: number,
    isReview: boolean,
  ) {
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

  async logProgress(
    studentId: string,
    dto: UpdateProgressDto,
    teacherId?: string,
  ): Promise<Progress> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const learningTrack = resolveLearningTrack(student.level);
    const progress = await this.getOrCreateProgress(studentId, learningTrack);

    const completedIds = normalizeCompletedIds(progress.completedTopicIds);
    const completionStatus = dto.completionStatus || (dto.isReview ? 'review' : 'completed');

    let logData: Partial<ProgressLog> = {
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
    } else if (learningTrack === 'quran_reading') {
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

      // Tick the surah as passed/finished: persists in completedTopicIds
      // so it stays checked in the teacher's form and counts only once.
      await this.applySurahCompletion(
        progress,
        learningTrack,
        validated.surahNumber,
        validated.endAyah,
        dto.isReview || false,
      );
      progress.lastStudiedSurah = validated.surahName;
      progress.lastStudiedPage = validated.lastStudiedPage!;
    } else if (learningTrack === 'hifz') {
      const validated = this.validateSurahLog(dto, false);

      if (!dto.memorizationStatus) {
        throw new BadRequestException('Memorization status is required for Hifz students');
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

      await this.applySurahCompletion(
        progress,
        learningTrack,
        validated.surahNumber,
        validated.endAyah,
        dto.isReview || false,
      );
      progress.lastStudiedSurah = validated.surahName;
    }

    const log = this.progressLogRepository.create(logData);
    await this.progressLogRepository.save(log);

    const saved = await this.progressRepository.save(progress);

    // Automatic level progression: promotes the student (or flags them as
    // ready for evaluation) when the level's completion criteria are met.
    await this.levelProgressionService.checkAndPromote(student, saved);

    return saved;
  }

  async getStudentLogs(studentId: string, limit = 50): Promise<ProgressLog[]> {
    return this.progressLogRepository.find({
      where: { studentId },
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async addFeedback(
    teacherId: string,
    studentId: string,
    content: string,
  ): Promise<Feedback> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const feedback = this.feedbackRepository.create({
      content,
      teacherId,
      studentId,
    });

    return this.feedbackRepository.save(feedback);
  }

  async getStudentFeedback(studentId: string): Promise<Feedback[]> {
    return this.feedbackRepository.find({
      where: { studentId },
      relations: ['teacher', 'student'],
      order: { createdAt: 'DESC' },
    });
  }
}

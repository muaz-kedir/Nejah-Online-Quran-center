import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { ProgressLog } from './entities/progress-log.entity';
import { Feedback } from './entities/feedback.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Parent } from '../parents/entities/parent.entity';
import { UpdateProgressDto } from './dto/update-progress.dto';
import {
  QURAN_SURAHS,
  TOTAL_MUSHAF_PAGES,
  getSurahByNumber,
  formatSurahName,
} from '../common/constants/quran-surahs';

const TOTAL_SURAHS = 114;

function calculateRank(percentage: number): string {
  if (percentage >= 90) return 'Expert';
  if (percentage >= 70) return 'Advanced';
  if (percentage >= 40) return 'Intermediate';
  return 'Beginner';
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

  async getOrCreateProgress(studentId: string): Promise<Progress> {
    const existing = await this.progressRepository.findOne({
      where: { studentId },
      relations: ['student'],
    });

    if (existing) {
      return existing;
    }

    const progress = this.progressRepository.create({
      studentId,
      surahsCount: 0,
      ayahsCount: 0,
      weeksActive: 0,
      progressPercentage: 0,
      rank: 'Beginner',
    });

    return this.progressRepository.save(progress);
  }

  private validateLogDto(dto: UpdateProgressDto): {
    surahNumber: number;
    surahName: string;
    lastStudiedPage: number;
    lastStudiedAyah: number;
  } {
    if (dto.surahNumber == null) {
      throw new BadRequestException('Surah is required');
    }
    if (dto.lastStudiedPage == null) {
      throw new BadRequestException('Mushaf page is required (1-604)');
    }
    if (dto.lastStudiedAyah == null) {
      throw new BadRequestException('Ayah is required');
    }

    const surah = getSurahByNumber(dto.surahNumber);
    if (!surah) {
      throw new BadRequestException('Invalid surah number');
    }

    if (dto.lastStudiedPage < 1 || dto.lastStudiedPage > TOTAL_MUSHAF_PAGES) {
      throw new BadRequestException(`Page must be between 1 and ${TOTAL_MUSHAF_PAGES}`);
    }

    if (dto.lastStudiedAyah < 1 || dto.lastStudiedAyah > surah.totalAyahs) {
      throw new BadRequestException(
        `Ayah must be between 1 and ${surah.totalAyahs} for ${surah.englishName}`,
      );
    }

    return {
      surahNumber: surah.number,
      surahName: formatSurahName(surah),
      lastStudiedPage: dto.lastStudiedPage,
      lastStudiedAyah: dto.lastStudiedAyah,
    };
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

    const validated = this.validateLogDto(dto);
    const progress = await this.getOrCreateProgress(studentId);

    const log = this.progressLogRepository.create({
      studentId,
      teacherId: teacherId || null,
      surahNumber: validated.surahNumber,
      surahName: validated.surahName,
      lastStudiedPage: validated.lastStudiedPage,
      lastStudiedAyah: validated.lastStudiedAyah,
    });
    await this.progressLogRepository.save(log);

    progress.surahNumber = validated.surahNumber;
    progress.lastStudiedSurah = validated.surahName;
    progress.lastStudiedPage = validated.lastStudiedPage;
    progress.lastStudiedAyah = validated.lastStudiedAyah;

    if (dto.surahsCount !== undefined) {
      progress.surahsCount = dto.surahsCount;
    } else {
      progress.surahsCount = Math.max(progress.surahsCount, validated.surahNumber);
    }

    if (dto.ayahsCount !== undefined) {
      progress.ayahsCount = dto.ayahsCount;
    } else {
      progress.ayahsCount += validated.lastStudiedAyah;
    }

    progress.progressPercentage = Math.min(
      Math.round((progress.surahsCount / TOTAL_SURAHS) * 100),
      100,
    );

    progress.rank = calculateRank(progress.progressPercentage);

    return this.progressRepository.save(progress);
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

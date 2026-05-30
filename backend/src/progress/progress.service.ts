import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { Feedback } from './entities/feedback.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { UpdateProgressDto } from './dto/update-progress.dto';

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
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
  ) {}

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

  async logProgress(
    studentId: string,
    dto: UpdateProgressDto,
  ): Promise<Progress> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const progress = await this.getOrCreateProgress(studentId);

    if (dto.lastStudiedSurah !== undefined) {
      progress.lastStudiedSurah = dto.lastStudiedSurah;
    }

    if (dto.lastStudiedAyah !== undefined) {
      progress.lastStudiedAyah = dto.lastStudiedAyah;
    }

    if (dto.surahsCount !== undefined) {
      progress.surahsCount = dto.surahsCount;
    } else if (dto.lastStudiedSurah && progress.surahsCount < TOTAL_SURAHS) {
      progress.surahsCount += 1;
    }

    if (dto.ayahsCount !== undefined) {
      progress.ayahsCount = dto.ayahsCount;
    } else if (dto.lastStudiedAyah) {
      progress.ayahsCount += dto.lastStudiedAyah;
    }

    progress.progressPercentage = Math.min(
      Math.round((progress.surahsCount / TOTAL_SURAHS) * 100),
      100,
    );

    progress.rank = calculateRank(progress.progressPercentage);

    return this.progressRepository.save(progress);
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

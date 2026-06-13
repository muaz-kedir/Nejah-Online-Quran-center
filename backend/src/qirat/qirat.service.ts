import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ReportsService } from '../reports/reports.service';
import { Student, QuranLevel } from '../students/entities/student.entity';
import { ClassSession, SessionStatus } from '../attendance/entities/class-session.entity';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';
import { ReplacementStatus } from '../common/enums/replacement-status.enum';

@Injectable()
export class QiratService {
  constructor(
    private readonly reportsService: ReportsService,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(ClassSession) private sessionRepo: Repository<ClassSession>,
    @InjectRepository(TeacherReplacement) private replacementRepo: Repository<TeacherReplacement>,
  ) {}

  async getDashboard() {
    const summary = await this.reportsService.getSummaryStatistics();
    const today = new Date().toISOString().slice(0, 10);

    const todaysClasses = await this.sessionRepo.count({
      where: { sessionDate: today as any },
    });

    const [qaidah, quranReading, tajweed, hifz] = await Promise.all([
      this.studentRepo.count({
        where: { level: QuranLevel.QAIDA_NOORANIYA, status: 'active' as any },
      }),
      this.studentRepo.count({
        where: { level: QuranLevel.QURAN_READING, status: 'active' as any },
      }),
      this.studentRepo.count({
        where: { level: QuranLevel.TAJWEED_PROGRAM, status: 'active' as any },
      }),
      this.studentRepo.count({
        where: [
          { level: QuranLevel.HIFZ_PROGRAM, status: 'active' as any },
          { level: QuranLevel.HIFZ_MURAJAA, status: 'active' as any },
        ],
      }),
    ]);

    const activeReplacements = await this.replacementRepo.count({
      where: { status: ReplacementStatus.ACTIVE },
    });

    const upcomingReplacements = await this.replacementRepo.count({
      where: { status: ReplacementStatus.UPCOMING },
    });

    const completedToday = await this.sessionRepo.count({
      where: { sessionDate: today as any, status: SessionStatus.COMPLETED },
    });

    return {
      totalStudents: summary.totalStudents,
      activeStudents: summary.activeStudents,
      inactiveStudents: summary.inactiveStudents,
      totalTeachers: summary.totalTeachers,
      activeTeachers: summary.activeTeachers,
      activeClasses: summary.activeClasses,
      todaysClasses,
      completedClassesToday: completedToday,
      attendanceRate: summary.attendanceRate,
      homeworkCompletionRate: summary.homeworkCompletionRate,
      studentsInQaidah: qaidah,
      studentsInQuranReading: quranReading,
      studentsInTajweed: tajweed,
      studentsInHifz: hifz,
      activeReplacements,
      upcomingReplacements,
      totalReplacements: activeReplacements + upcomingReplacements,
      newStudentRegistrations: summary.newStudentsThisMonth,
      averageAcademicProgress: summary.averageAcademicProgress,
    };
  }
}

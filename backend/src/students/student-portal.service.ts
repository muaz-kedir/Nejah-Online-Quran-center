import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ProgressLog } from '../progress/entities/progress-log.entity';
import { Feedback } from '../progress/entities/feedback.entity';
import { Homework, HomeworkStatus } from '../homework/entities/homework.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { StudentAttendance } from '../attendance/entities/student-attendance.entity';
import { ClassSession, SessionStatus } from '../attendance/entities/class-session.entity';
import { ResourcesService } from '../resources/resources.service';
import { AttendanceService } from '../attendance/attendance.service';
import { TeacherReplacementsService } from '../teacher-replacements/teacher-replacements.service';
import { resolveLearningTrack } from '../common/constants/learning-curricula';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable()
export class StudentPortalService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(ProgressLog)
    private progressLogRepository: Repository<ProgressLog>,
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(StudentAttendance)
    private studentAttendanceRepository: Repository<StudentAttendance>,
    @InjectRepository(ClassSession)
    private classSessionRepository: Repository<ClassSession>,
    private resourcesService: ResourcesService,
    private attendanceService: AttendanceService,
    private replacementsService: TeacherReplacementsService,
  ) {}

  async resolveStudent(userId: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { userId },
      relations: ['teacher', 'teacher.user'],
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    return student;
  }

  private avatarUrl(path?: string | null): string | null {
    if (!path) return null;
    return path.startsWith('http') ? path : `http://localhost:3000${path}`;
  }

  /** Progress row for the student's current learning track, falling back to the latest record. */
  private async findCurrentProgress(student: Student): Promise<Progress | null> {
    const track = resolveLearningTrack(student.level);
    const current = await this.progressRepository.findOne({
      where: { studentId: student.id, learningTrack: track },
      order: { createdAt: 'DESC' },
    });
    if (current) return current;
    return this.progressRepository.findOne({
      where: { studentId: student.id },
      order: { updatedAt: 'DESC' },
    });
  }

  private todayWeekday(): string {
    return DAYS[new Date().getDay()];
  }

  async getDashboard(userId: string) {
    const student = await this.resolveStudent(userId);
    const studentId = student.id;

    const progressRecord = await this.findCurrentProgress(student);
    const attendances = await this.attendanceRepository.find({ where: { studentId } });
    const sessionStats = await this.attendanceService.getAttendanceStats(studentId);

    const effectiveTeacher = await this.replacementsService.getEffectiveTeacher(studentId);
    const schedules = await this.replacementsService.getEffectiveSchedulesForStudent(studentId);
    const activeReplacement = effectiveTeacher.replacement;

    const today = this.todayWeekday();
    const todaySchedules = schedules.filter((s) => s.dayOfWeek === today);

    const homeworkAssignments = await this.homeworkRepository.find({
      where: { studentId },
      order: { dueDate: 'ASC' },
    });

    const now = new Date();
    const homeworkOverdue = homeworkAssignments.filter(
      (h) => h.status === HomeworkStatus.PENDING && h.dueDate && new Date(h.dueDate) < now,
    ).length;
    const homeworkCompleted = homeworkAssignments.filter(
      (h) => h.status === HomeworkStatus.COMPLETED,
    ).length;
    const homeworkPendingCount = homeworkAssignments.filter(
      (h) => h.status === HomeworkStatus.PENDING,
    ).length;
    const homeworkTotal = homeworkAssignments.length;
    const homeworkCompletionRate =
      homeworkTotal > 0 ? Math.round((homeworkCompleted / homeworkTotal) * 100) : 0;

    const feedbackRecords = await this.feedbackRepository.find({
      where: { studentId },
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const pendingHomework = homeworkAssignments.find((h) => h.status === HomeworkStatus.PENDING);
    const latestFeedback = feedbackRecords[0];

    const notifications = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const unreadNotifications = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    const liveClass = await this.attendanceService.getStudentLiveClass(studentId);

    const nextTodaySchedule = todaySchedules[0] || schedules[0];
    const effectiveTeacherEntity = activeReplacement?.replacementTeacher || student.teacher;

    let upcomingClass = nextTodaySchedule
      ? {
          id: nextTodaySchedule.id,
          name: nextTodaySchedule.className || 'Quran Class',
          teacher:
            (nextTodaySchedule as any).teacher?.fullName ||
            effectiveTeacherEntity?.fullName ||
            'Assigned Teacher',
          teacherId: (nextTodaySchedule as any).teacherId || effectiveTeacher.effectiveTeacherId,
          dayOfWeek: nextTodaySchedule.dayOfWeek,
          startTime: nextTodaySchedule.startTimeString,
          endTime: nextTodaySchedule.endTimeString,
          time:
            nextTodaySchedule.startTimeString && nextTodaySchedule.endTimeString
              ? `${nextTodaySchedule.startTimeString} - ${nextTodaySchedule.endTimeString}`
              : 'Scheduled',
          meetingLink: liveClass?.meetingLink || nextTodaySchedule.meetingLink,
          status: liveClass ? 'live' : 'scheduled',
          sessionId: liveClass?.id || null,
        }
      : null;

    if (!upcomingClass && activeReplacement?.startTimeString) {
      upcomingClass = {
        id: activeReplacement.id,
        name: 'Quran Class (Temporary)',
        teacher: effectiveTeacherEntity?.fullName || 'Temporary Teacher',
        teacherId: effectiveTeacher.effectiveTeacherId,
        dayOfWeek: this.todayWeekday(),
        startTime: activeReplacement.startTimeString,
        endTime: activeReplacement.endTimeString,
        time: `${activeReplacement.startTimeString} - ${activeReplacement.endTimeString}`,
        meetingLink: liveClass?.meetingLink || activeReplacement.meetingLink,
        status: liveClass ? 'live' : 'scheduled',
        sessionId: liveClass?.id || activeReplacement.classSessionId || null,
      };
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const weeklyAttendance = last7Days.map((day) => {
      const record = attendances.find((a) => new Date(a.date).toISOString().split('T')[0] === day);
      return {
        date: day,
        present: record ? record.isPresent : false,
        session: record ? 'Quran Class' : null,
      };
    });

    const attendanceRate =
      attendances.length > 0
        ? Math.round((attendances.filter((a) => a.isPresent).length / attendances.length) * 100)
        : sessionStats.attendancePercentage
          ? Math.round(sessionStats.attendancePercentage)
          : 0;

    const pendingTasks = homeworkAssignments
      .filter((h) => h.status === HomeworkStatus.PENDING)
      .slice(0, 4)
      .map((h, i) => ({
        id: h.id,
        title: h.title,
        description:
          h.description || `Due ${h.dueDate ? new Date(h.dueDate).toLocaleDateString() : 'soon'}`,
        dueDate: h.dueDate
          ? new Date(h.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Soon',
        icon: i % 2 === 0 ? 'book' : 'brain',
        difficulty: h.difficulty || 'Medium',
      }));

    const surahsCount = progressRecord?.surahsCount || 0;
    const percentage = progressRecord?.progressPercentage || Number(student.progressRate) || 0;

    return {
      student: {
        id: student.id,
        name: student.fullName,
        fullName: student.fullName,
        initials: student.fullName
          .split(' ')
          .map((n) => n[0])
          .join(''),
        email: student.email,
        phone: student.phone,
        country: student.country,
        city: student.city,
        level: student.level || 'Beginner',
        enrollmentDate: student.createdAt,
        assignedTeacher: student.teacher?.fullName || null,
        assignedTeacherId: student.teacherId,
        effectiveTeacher: effectiveTeacherEntity?.fullName || student.teacher?.fullName || null,
        effectiveTeacherId: effectiveTeacher.effectiveTeacherId,
        isTemporaryTeacher: effectiveTeacher.isTemporary,
        temporaryTeacher: effectiveTeacher.isTemporary
          ? {
              name: activeReplacement?.replacementTeacher?.fullName,
              startDate: activeReplacement?.startDate,
              endDate: activeReplacement?.endDate,
              originalTeacher:
                activeReplacement?.originalTeacher?.fullName || student.teacher?.fullName,
            }
          : null,
        attendanceRate,
        progressRate: percentage,
        avatarUrl: this.avatarUrl(student.avatarUrl),
      },
      welcome: {
        studentName: student.fullName,
        quranLevel: student.level || 'Quran Reading',
        assignedTeacher: effectiveTeacherEntity?.fullName
          ? effectiveTeacher.isTemporary
            ? `${effectiveTeacherEntity.fullName} (Temporary)`
            : effectiveTeacherEntity.fullName
          : 'Not assigned yet',
        enrollmentDate: student.createdAt,
      },
      progress: {
        surahsCompleted: surahsCount,
        surahs: surahsCount,
        totalSurahs: 114,
        currentSurah: progressRecord?.lastStudiedSurah || 'Not started',
        currentAyah: progressRecord?.lastStudiedAyah || 0,
        currentPage: progressRecord?.lastStudiedPage || 0,
        memorizedSurahs: surahsCount,
        memorizedAyahs: progressRecord?.ayahsCount || 0,
        completedJuz: Math.floor(surahsCount / 4),
        percentage,
        rank: progressRecord?.rank || 'Beginner',
        lastStudiedSurah: progressRecord?.lastStudiedSurah || 'Not started',
        ayahs: progressRecord?.ayahsCount || 0,
        weeksActive: progressRecord?.weeksActive || 0,
        juzCompleted: Math.floor(surahsCount / 4),
        currentJuz: progressRecord?.lastStudiedSurah
          ? `Juz ${Math.ceil(surahsCount / 4) || 1}`
          : '-',
      },
      attendance: {
        totalClasses: sessionStats.total || attendances.length,
        attendedClasses: sessionStats.present || attendances.filter((a) => a.isPresent).length,
        presentDays: sessionStats.present || 0,
        absentDays: sessionStats.absent || 0,
        lateDays: sessionStats.late || 0,
        rate: attendanceRate,
        weekly: weeklyAttendance,
      },
      upcomingClass,
      liveClass: liveClass
        ? {
            id: liveClass.id,
            classTitle: liveClass.classTitle,
            meetingLink: liveClass.meetingLink,
            teacher: liveClass.teacher ? { fullName: liveClass.teacher.fullName } : null,
          }
        : null,
      todaysLesson: {
        surah: progressRecord?.lastStudiedSurah || pendingHomework?.title || '—',
        ayahRange: progressRecord?.lastStudiedAyah ? `Ayah ${progressRecord.lastStudiedAyah}` : '—',
        revision: latestFeedback?.content?.slice(0, 120) || 'Complete your daily revision.',
        homework: pendingHomework
          ? { title: pendingHomework.title, dueDate: pendingHomework.dueDate }
          : null,
      },
      homework: {
        overdue: homeworkOverdue,
        completed: homeworkCompleted,
        pending: homeworkPendingCount,
        completionRate: homeworkCompletionRate,
        recent: homeworkAssignments.slice(0, 3).map((h) => ({
          id: h.id,
          title: h.title,
          subject: 'Quran',
          dueDate: h.dueDate ? new Date(h.dueDate).toLocaleDateString() : '',
          status: h.status,
          description: h.description,
        })),
      },
      feedback: latestFeedback
        ? {
            teacher: latestFeedback.teacher?.fullName || 'Teacher',
            date: latestFeedback.createdAt
              ? new Date(latestFeedback.createdAt).toLocaleDateString()
              : '',
            content: latestFeedback.content,
          }
        : null,
      recentFeedback: feedbackRecords.map((f) => ({
        id: f.id,
        teacherName: f.teacher?.fullName || 'Teacher',
        date: f.createdAt,
        summary: f.content.length > 120 ? `${f.content.slice(0, 120)}…` : f.content,
        content: f.content,
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        type: n.channel,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadNotifications,
      pendingTasks,
      schedule: schedules.map((s) => ({
        id: s.id,
        day: s.dayOfWeek || '',
        time:
          s.startTimeString && s.endTimeString ? `${s.startTimeString} - ${s.endTimeString}` : '',
        subject: s.className || 'Quran Class',
        teacher: student.teacher?.fullName || 'Assigned Teacher',
        meetingLink: s.meetingLink,
      })),
    };
  }

  async getClasses(userId: string) {
    const student = await this.resolveStudent(userId);
    const today = this.todayWeekday();

    const schedules = await this.replacementsService.getEffectiveSchedulesForStudent(student.id);

    const history = await this.studentAttendanceRepository.find({
      where: { studentId: student.id },
      relations: ['classSession', 'classSession.teacher'],
      order: { createdAt: 'DESC' },
      take: 30,
    });

    const liveClass = await this.attendanceService.getStudentLiveClass(student.id);

    const current = schedules
      .filter((s) => s.status === 'active' && s.dayOfWeek === today)
      .map((s) =>
        this.mapSchedule(s, student, liveClass?.scheduleId === s.id ? 'live' : 'scheduled'),
      );

    const upcoming = schedules
      .filter((s) => s.status === 'active')
      .map((s) => this.mapSchedule(s, student, 'scheduled'));

    const previous = history
      .filter((h) => h.classSession?.status === SessionStatus.COMPLETED)
      .map((h) => ({
        id: h.id,
        sessionId: h.classSessionId,
        classDate: h.classSession?.sessionDate,
        duration: h.durationMinutes,
        lessonCovered: h.classSession?.subject || h.classSession?.classTitle,
        teacherNotes: h.notes || h.classSession?.notes,
        teacherName: h.classSession?.teacher?.fullName,
        attendanceStatus: h.attendanceStatus,
      }));

    return { current, upcoming, previous, liveClass };
  }

  private mapSchedule(s: Schedule, student: Student, status: string) {
    return {
      id: s.id,
      name: s.className || 'Quran Class',
      dayOfWeek: s.dayOfWeek,
      day: s.dayOfWeek,
      startTime: s.startTimeString,
      endTime: s.endTimeString,
      time: s.startTimeString && s.endTimeString ? `${s.startTimeString} - ${s.endTimeString}` : '',
      className: s.className || 'Quran Class',
      classType: s.classType || '1:1 Session',
      teacherName: student.teacher?.fullName || 'Assigned Teacher',
      teacher: student.teacher?.fullName,
      meetingLink: s.meetingLink,
      status,
    };
  }

  async getProgressDetail(userId: string) {
    const student = await this.resolveStudent(userId);
    const progressRecord = await this.findCurrentProgress(student);

    const progressLogs = await this.progressLogRepository.find({
      where: { studentId: student.id },
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const feedbackRecords = await this.feedbackRepository.find({
      where: { studentId: student.id },
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
    });

    const surahsCount = progressRecord?.surahsCount || 0;
    const percentage = progressRecord?.progressPercentage || Number(student.progressRate) || 0;

    const describeLog = (log: ProgressLog): { title: string; description: string } => {
      if (log.topicName) {
        const parts = [
          log.topicNameAr ? `${log.topicName} (${log.topicNameAr})` : log.topicName,
          log.isReview ? 'Review session' : null,
          log.notes || null,
        ].filter(Boolean);
        return {
          title: log.isReview ? 'Lesson reviewed' : 'Lesson completed',
          description: parts.join(' · '),
        };
      }

      const ayahRange =
        log.startAyah && log.endAyah && log.startAyah !== log.endAyah
          ? `Ayah ${log.startAyah}–${log.endAyah}`
          : log.lastStudiedAyah
            ? `Ayah ${log.lastStudiedAyah}`
            : null;
      const parts = [
        log.surahName,
        log.lastStudiedPage ? `Page ${log.lastStudiedPage}` : null,
        ayahRange,
        log.memorizationStatus
          ? `Memorization: ${log.memorizationStatus.replace(/_/g, ' ')}`
          : null,
        log.revisionStatus ? `Revision: ${log.revisionStatus.replace(/_/g, ' ')}` : null,
        log.notes || null,
      ].filter(Boolean);
      return {
        title: 'Daily progress logged',
        description: parts.join(' · '),
      };
    };

    const timeline = [
      ...progressLogs.map((log) => {
        const entry = describeLog(log);
        return {
          type: 'daily_log',
          title: entry.title,
          description: entry.description,
          date: log.createdAt,
          teacherName: log.teacher?.fullName,
        };
      }),
      ...feedbackRecords.map((f) => ({
        type: 'teacher_note',
        title: `Feedback from ${f.teacher?.fullName || 'Teacher'}`,
        description: f.content,
        date: f.createdAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      overview: {
        quranLevel: student.level,
        currentSurah: progressRecord?.lastStudiedSurah || 'Not started',
        currentAyah: progressRecord?.lastStudiedAyah || 0,
        currentPage: progressRecord?.lastStudiedPage || 0,
        memorizationPercentage: percentage,
        completedJuz: Math.floor(surahsCount / 4),
        surahsCompleted: surahsCount,
        ayahsMemorized: progressRecord?.ayahsCount || 0,
        weeksActive: progressRecord?.weeksActive || 0,
        rank: progressRecord?.rank || 'Beginner',
      },
      percentage,
      surahs: surahsCount,
      ayahs: progressRecord?.ayahsCount || 0,
      weeksActive: progressRecord?.weeksActive || 0,
      juzCompleted: Math.floor(surahsCount / 4),
      currentJuz: progressRecord?.lastStudiedSurah ? `Juz ${Math.ceil(surahsCount / 4) || 1}` : '-',
      rank: progressRecord?.rank || 'Beginner',
      lastStudiedSurah: progressRecord?.lastStudiedSurah || 'N/A',
      lastStudiedPage: progressRecord?.lastStudiedPage || 0,
      dailyLogs: progressLogs.map((log) => ({
        id: log.id,
        surahName: log.surahName,
        surahNumber: log.surahNumber,
        topicName: log.topicName,
        topicNameAr: log.topicNameAr,
        lastStudiedPage: log.lastStudiedPage,
        startAyah: log.startAyah,
        endAyah: log.endAyah,
        lastStudiedAyah: log.lastStudiedAyah,
        memorizationStatus: log.memorizationStatus,
        revisionStatus: log.revisionStatus,
        notes: log.notes,
        isReview: log.isReview,
        completionStatus: log.completionStatus,
        teacherName: log.teacher?.fullName || 'Teacher',
        date: log.createdAt,
      })),
      timeline,
      tajweed: feedbackRecords.slice(0, 5).map((f) => ({
        id: f.id,
        notes: f.content,
        teacherName: f.teacher?.fullName,
        date: f.createdAt,
        recommendations: f.content,
      })),
      teacherFeedback: feedbackRecords.map((f) => ({
        id: f.id,
        teacherName: f.teacher?.fullName || 'Teacher',
        content: f.content,
        date: f.createdAt,
      })),
    };
  }

  async getHomeworkList(userId: string) {
    const student = await this.resolveStudent(userId);
    const items = await this.homeworkRepository.find({
      where: { studentId: student.id },
      order: { dueDate: 'ASC' },
    });

    const now = new Date();
    return items.map((h) => {
      let displayStatus: string = h.status;
      if (h.status === HomeworkStatus.PENDING && h.dueDate && new Date(h.dueDate) < now) {
        displayStatus = 'Late';
      }
      return {
        id: h.id,
        title: h.title,
        description: h.description,
        assignedDate: h.createdAt,
        dueDate: h.dueDate,
        status: displayStatus,
        difficulty: h.difficulty,
        teacher: student.teacher?.fullName || 'Teacher',
        subject: 'Quran',
      };
    });
  }

  async submitHomework(userId: string, homeworkId: string, submissionNotes?: string) {
    const student = await this.resolveStudent(userId);
    const homework = await this.homeworkRepository.findOne({
      where: { id: homeworkId, studentId: student.id },
    });
    if (!homework) {
      throw new ForbiddenException('Homework not found or access denied');
    }
    homework.status = HomeworkStatus.COMPLETED;
    if (submissionNotes) {
      homework.description = `${homework.description}\n\n--- Submission ---\n${submissionNotes}`;
    }
    await this.homeworkRepository.save(homework);
    return { success: true, id: homework.id, status: homework.status };
  }

  async getProfile(userId: string) {
    const student = await this.resolveStudent(userId);
    const effectiveTeacher = await this.replacementsService.getEffectiveTeacher(student.id);
    const effectiveTeacherEntity =
      effectiveTeacher.replacement?.replacementTeacher || student.teacher;
    const progressRecord = await this.findCurrentProgress(student);
    const sessionStats = await this.attendanceService.getAttendanceStats(student.id);

    const homeworkItems = await this.homeworkRepository.find({ where: { studentId: student.id } });
    const completed = homeworkItems.filter((h) => h.status === HomeworkStatus.COMPLETED).length;
    const homeworkCompletionRate =
      homeworkItems.length > 0 ? Math.round((completed / homeworkItems.length) * 100) : 0;

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        country: student.country,
        city: student.city,
        level: student.level || 'Quran Reading',
        enrollmentDate: student.createdAt,
        assignedTeacher: effectiveTeacherEntity?.fullName
          ? effectiveTeacher.isTemporary
            ? `${effectiveTeacherEntity.fullName} (Temporary)`
            : effectiveTeacherEntity.fullName
          : null,
        assignedTeacherId: effectiveTeacher.effectiveTeacherId || student.teacherId,
        avatarUrl: this.avatarUrl(student.avatarUrl),
      },
      statistics: {
        attendancePercentage: Math.round(sessionStats.attendancePercentage || 0),
        progressPercentage: progressRecord?.progressPercentage || Number(student.progressRate) || 0,
        homeworkCompletionRate,
      },
      messaging: {
        teacherId: student.teacherId,
        teacherUserId: student.teacher?.userId,
        teacherName: student.teacher?.fullName,
      },
    };
  }

  async getResources(search?: string, category?: string) {
    return this.resourcesService.findAll(undefined, search, category as any);
  }

  async getNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const n = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });
    if (!n) throw new NotFoundException('Notification not found');
    n.isRead = true;
    return this.notificationRepository.save(n);
  }

  async markAllNotificationsRead(userId: string) {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  async getFeedback(userId: string) {
    const student = await this.resolveStudent(userId);
    const records = await this.feedbackRepository.find({
      where: { studentId: student.id },
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
    });
    return records.map((f) => ({
      id: f.id,
      teacherName: f.teacher?.fullName || 'Teacher',
      content: f.content,
      date: f.createdAt,
      summary: f.content.length > 160 ? `${f.content.slice(0, 160)}…` : f.content,
    }));
  }

  async getAttendanceDetail(userId: string) {
    const student = await this.resolveStudent(userId);
    const stats = await this.attendanceService.getAttendanceStats(student.id);
    const history = await this.attendanceService.getStudentAttendanceHistory(student.id);
    return { stats, history };
  }
}

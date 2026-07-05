import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Student, QuranLevel } from './entities/student.entity';
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
import { LiveSessionService } from '../zoom/live-session.service';
import { SessionAttendanceService } from '../zoom/session-attendance.service';
import { LiveSessionStatus } from '../zoom/enums/live-session-status.enum';
import { LiveSession } from '../zoom/entities/live-session.entity';
import { resolveLearningTrack, getTopicsForTrack, getNextTopic, QAIDAH_LESSONS, TAJWEED_TOPICS } from '../common/constants/learning-curricula';
import { ProgressService } from '../progress/progress.service';
import { ExamEvaluation } from '../exams/entities/exam-evaluation.entity';

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
    @InjectRepository(ExamEvaluation)
    private examEvaluationRepository: Repository<ExamEvaluation>,
    private resourcesService: ResourcesService,
    private attendanceService: AttendanceService,
    private replacementsService: TeacherReplacementsService,
    private liveSessionService: LiveSessionService,
    private sessionAttendanceService: SessionAttendanceService,
    private progressService: ProgressService,
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

  private extractFirstName(fullName: string): string {
    if (!fullName) return 'Student';
    const parts = fullName.trim().split(/\s+/);
    const titles = ['dr', 'mr', 'mrs', 'ms', 'prof', 'sheikh', 'ustadh', 'ustadha', 'shaykh'];
    if (parts.length > 1 && titles.includes(parts[0].toLowerCase().replace(/\.$/, ''))) {
      return parts[1];
    }
    return parts[0];
  }

  private buildTodaysLesson(
    student: Student,
    progressRecord: Progress | null,
    todayProgressLog: ProgressLog | null,
    learningContext: any,
    latestFeedback: Feedback | null,
    pendingHomework: Homework | null,
  ) {
    const level = student.level;
    const teacherNotes = latestFeedback?.content || null;
    const log = todayProgressLog;
    const homework = pendingHomework
      ? { title: pendingHomework.title, description: pendingHomework.description, dueDate: pendingHomework.dueDate }
      : null;

    switch (level) {
      case QuranLevel.QAIDA_NOORANIYA: {
        const topic = learningContext?.currentTopic;
        const lessonNumber = topic ? QAIDAH_LESSONS.findIndex(t => t.id === topic.id) + 1 : null;
        const lines = log?.startAyah && log?.endAyah
          ? `${log.startAyah}–${log.endAyah}`
          : log?.notes?.match(/lines?\s*(\d+)\s*[-–]\s*(\d+)/i)?.[0]
            || null;
        return {
          level,
          lessonNumber: lessonNumber || null,
          topicName: topic?.nameEn || progressRecord?.lastStudiedSurah || null,
          topicNameAr: topic?.nameAr || null,
          lines,
          page: progressRecord?.lastStudiedPage || log?.lastStudiedPage || null,
          teacherNotes,
          homework,
        };
      }

      case QuranLevel.QURAN_READING: {
        return {
          level,
          surahName: progressRecord?.lastStudiedSurah || log?.surahName || null,
          startAyah: log?.startAyah || progressRecord?.lastStudiedAyah || null,
          endAyah: log?.endAyah || null,
          teacherNotes,
          homework,
        };
      }

      case QuranLevel.TAJWEED_PROGRAM: {
        const topic = learningContext?.currentTopic;
        return {
          level,
          rule: topic?.nameEn || progressRecord?.lastStudiedSurah || null,
          ruleAr: topic?.nameAr || null,
          lessonTitle: topic?.nameEn || null,
          practice: log?.notes || null,
          teacherNotes,
          homework,
        };
      }

      case QuranLevel.HIFZ_PROGRAM:
      case QuranLevel.HIFZ_MURAJAA: {
        const revisionPortion = log?.revisionStatus || null;
        const memRange = log?.startAyah && log?.endAyah
          ? `${log.startAyah}–${log.endAyah}`
          : log?.lastStudiedAyah
            ? `Ayah ${log.lastStudiedAyah}`
            : null;
        return {
          level,
          surahName: progressRecord?.lastStudiedSurah || log?.surahName || null,
          memorizationRange: memRange || null,
          revisionPortion,
          dailyTarget: log?.notes || null,
          teacherNotes,
          homework,
        };
      }

      default: {
        // Fallback for any unrecognized level
        return {
          level,
          surahName: progressRecord?.lastStudiedSurah || null,
          ayahRange: progressRecord?.lastStudiedAyah ? `Ayah ${progressRecord.lastStudiedAyah}` : null,
          teacherNotes,
          homework,
        };
      }
    }
  }

  async getDashboard(userId: string) {
    const student = await this.resolveStudent(userId);
    const studentId = student.id;

    const progressRecord = await this.findCurrentProgress(student);
    const attendances = await this.attendanceRepository.find({ where: { studentId } });
    const sessionStats = await this.sessionAttendanceService.getAttendanceStats(studentId);

    // Level-aware learning context for the dynamic progress card
    let learningContext: any = null;
    try {
      learningContext = await this.progressService.getLearningContext(studentId);
    } catch {
      // Graceful fallback: proceed without learning context
    }

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

    // Today's progress log (teacher's submitted lesson for today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayProgressLog = await this.progressLogRepository.findOne({
      where: {
        studentId,
        createdAt: Between(todayStart, todayEnd),
      },
      order: { createdAt: 'DESC' },
    });

    const notifications = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const unreadNotifications = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    const liveSession = await this.liveSessionService.getStudentActiveLiveSession(studentId);
    const upcomingSession = await this.liveSessionService.getStudentUpcomingTodaySession(studentId);

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
          meetingLink: liveSession?.zoomJoinUrl || nextTodaySchedule.meetingLink,
          status: liveSession ? 'live' : upcomingSession ? 'scheduled' : 'scheduled',
          sessionId: liveSession?.id || upcomingSession?.id || null,
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
        meetingLink: liveSession?.zoomJoinUrl || activeReplacement.meetingLink,
        status: liveSession ? 'live' : 'scheduled',
        sessionId: liveSession?.id || activeReplacement.classSessionId || null,
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
        firstName: this.extractFirstName(student.fullName),
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
        firstName: this.extractFirstName(student.fullName),
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
      levelProgress: learningContext
        ? {
            learningTrack: learningContext.learningTrack,
            learningTrackLabel: learningContext.learningTrackLabel,
            studentLevel: learningContext.studentLevel,
            progressSummary: learningContext.progressSummary,
            currentTopic: learningContext.currentTopic,
            lastPosition: learningContext.lastPosition,
            progress: learningContext.progress,
          }
        : null,
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
      liveClass: liveSession
        ? {
            id: liveSession.id,
            classTitle:
              liveSession.metadata?.className ||
              liveSession.schedule?.className ||
              'Quran Class',
            meetingLink: liveSession.zoomJoinUrl,
            status: liveSession.status,
            scheduledStart: liveSession.scheduledStart,
            teacher: liveSession.teacher ? { fullName: liveSession.teacher.fullName } : null,
          }
        : upcomingSession?.status === LiveSessionStatus.LIVE
          ? {
              id: upcomingSession.id,
              classTitle:
                upcomingSession.metadata?.className ||
                upcomingSession.schedule?.className ||
                'Quran Class',
              meetingLink: upcomingSession.zoomJoinUrl,
              status: upcomingSession.status,
              scheduledStart: upcomingSession.scheduledStart,
              teacher: upcomingSession.teacher
                ? { fullName: upcomingSession.teacher.fullName }
                : null,
            }
          : null,
      todaysLesson: this.buildTodaysLesson(student, progressRecord, todayProgressLog, learningContext, latestFeedback, pendingHomework),
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
        channel: n.channel,
        isRead: n.isRead,
        createdAt: n.createdAt,
        dataJson: n.dataJson,
        actionUrl: n.actionUrl,
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

    const liveSession = await this.liveSessionService.getStudentActiveLiveSession(student.id);

    const current = schedules
      .filter((s) => s.status === 'active' && s.dayOfWeek === today)
      .map((s) =>
        this.mapSchedule(
          s,
          student,
          liveSession?.scheduleId === s.id ? 'live' : 'scheduled',
        ),
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

    return { current, upcoming, previous, liveClass: liveSession ? this.mapLiveSessionForStudent(liveSession) : null };
  }

  private mapLiveSessionForStudent(session: LiveSession) {
    return {
      id: session.id,
      classTitle:
        session.metadata?.className ||
        session.schedule?.className ||
        'Quran Class',
      meetingLink: session.zoomJoinUrl,
      status: session.status,
      scheduledStart: session.scheduledStart,
      teacher: session.teacher ? { fullName: session.teacher.fullName } : null,
    };
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

    // Fetch all evaluations, not just Tajweed
    const examEvaluations = await this.examEvaluationRepository.find({
      where: { studentId: student.id },
      relations: ['teacher'],
      order: { evaluationDate: 'DESC' },
    });

    const attendanceHistory = await this.attendanceService.getStudentAttendanceHistory(student.id);
    const attendanceStats = await this.attendanceService.getAttendanceStats(student.id);
    
    let learningContext = null;
    try {
      learningContext = await this.progressService.getLearningContext(student.id);
    } catch (e) {
      console.warn('Could not get learning context', e);
    }

    const describeLog = (log: ProgressLog): { title: string; description: string; courseLevel: string } => {
      let courseLevel = log.learningTrack ? log.learningTrack.replace('_', ' ') : student.level;
      courseLevel = courseLevel.charAt(0).toUpperCase() + courseLevel.slice(1);

      if (log.topicName) {
        const parts = [
          log.topicNameAr ? `${log.topicName} (${log.topicNameAr})` : log.topicName,
          log.isReview ? 'Review session' : null,
          log.notes || null,
        ].filter(Boolean);
        return {
          title: log.isReview ? 'Lesson reviewed' : 'Lesson completed',
          description: parts.join(' · '),
          courseLevel,
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
        courseLevel,
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
          courseLevel: entry.courseLevel,
          status: log.completionStatus || (log.isReview ? 'review' : 'completed'),
          notes: log.notes,
        };
      }),
      ...feedbackRecords.map((f) => ({
        type: 'teacher_note',
        title: `Feedback from ${f.teacher?.fullName || 'Teacher'}`,
        description: f.content,
        date: f.createdAt,
        teacherName: f.teacher?.fullName,
        courseLevel: student.level,
        status: 'feedback',
        notes: f.content,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Generate Dynamic Achievements based on student level
    const achievements = [];
    const firstLogDate = progressLogs.length > 0 ? progressLogs[progressLogs.length - 1].createdAt : new Date();

    switch (student.level) {
      case QuranLevel.QAIDA_NOORANIYA:
        if (progressLogs.length > 0) {
          achievements.push({
            name: 'First Letter Mastered',
            description: 'You mastered your first Arabic letter!',
            date: firstLogDate,
            icon: 'star',
          });
        }
        if (progressRecord?.progressPercentage >= 100) {
          achievements.push({
            name: 'Completed Qaida Book',
            description: 'MashaAllah! You completed the entire Qaida Nooraniya book!',
            date: new Date(),
            icon: 'book',
          });
        }
        break;

      case QuranLevel.QURAN_READING:
        if (progressLogs.length > 0) {
          achievements.push({
            name: 'First Page Read',
            description: 'You read your first page of the Quran!',
            date: firstLogDate,
            icon: 'star',
          });
        }
        if (progressRecord?.surahsCount >= 1) {
          achievements.push({
            name: 'Completed a Surah',
            description: 'You successfully completed reading a full Surah.',
            date: new Date(),
            icon: 'book',
          });
        }
        break;

      case QuranLevel.HIFZ_PROGRAM:
        if (progressLogs.length > 0) {
          achievements.push({
            name: 'First Surah Memorized',
            description: 'You memorized your first Surah!',
            date: firstLogDate,
            icon: 'star',
          });
        }
        if (progressRecord?.surahsCount >= 4) {
          achievements.push({
            name: 'First Juz Memorized',
            description: 'MashaAllah, you completed memorizing your first Juz!',
            date: new Date(),
            icon: 'award',
          });
        }
        break;

      case QuranLevel.TAJWEED_PROGRAM:
        if (progressLogs.length > 0) {
          achievements.push({
            name: 'First Rule Mastered',
            description: 'You mastered your first Tajweed rule!',
            date: firstLogDate,
            icon: 'star',
          });
        }
        if (progressRecord?.progressPercentage >= 100) {
          achievements.push({
            name: 'Completed Tajweed Rules',
            description: 'MashaAllah! You completed all Tajweed rules!',
            date: new Date(),
            icon: 'book',
          });
        }
        break;

      case QuranLevel.HIFZ_MURAJAA:
        if (progressLogs.length > 0) {
          achievements.push({
            name: 'First Surah Reviewed',
            description: 'You completed your first Muraja\'a session!',
            date: firstLogDate,
            icon: 'star',
          });
        }
        if (progressRecord?.surahsCount >= 4) {
          achievements.push({
            name: 'Completed Juz Revision',
            description: 'MashaAllah! You completed the revision of one full Juz!',
            date: new Date(),
            icon: 'award',
          });
        }
        break;

      default:
        if (progressLogs.length > 0) {
          achievements.push({
            name: 'First Lesson Completed',
            description: 'You completed your very first lesson!',
            date: firstLogDate,
            icon: 'star',
          });
        }
        if (progressRecord?.surahsCount >= 1) {
          achievements.push({
            name: 'First Surah Completed',
            description: 'You successfully completed a full Surah.',
            date: new Date(),
            icon: 'book',
          });
        }
        if (progressRecord?.surahsCount >= 4) {
          achievements.push({
            name: 'First Juz Completed',
            description: 'MashaAllah, you completed your first Juz!',
            date: new Date(),
            icon: 'award',
          });
        }
        break;
    }

    // Universal achievements: Progress milestones (all levels)
    const pct = progressRecord?.progressPercentage ?? 0;
    if (pct >= 25) {
      achievements.push({
        name: '25% Complete',
        description: 'You are a quarter of the way through your current level!',
        date: new Date(),
        icon: 'star',
      });
    }
    if (pct >= 50) {
      achievements.push({
        name: '50% Complete',
        description: 'Halfway through! Keep up the great effort!',
        date: new Date(),
        icon: 'star',
      });
    }
    if (pct >= 75) {
      achievements.push({
        name: '75% Complete',
        description: 'Almost there! You are three-quarters of the way through!',
        date: new Date(),
        icon: 'star',
      });
    }

    // Universal achievement: Perfect Attendance (all levels)
    if (attendanceStats.total >= 10 && attendanceStats.attendancePercentage === 100) {
      achievements.push({
        name: 'Perfect Attendance',
        description: '100% Attendance for 10+ classes. Keep it up!',
        date: new Date(),
        icon: 'calendar',
      });
    }

    return {
      overview: learningContext ? { ...learningContext } : {
        quranLevel: student.level,
        memorizationPercentage: progressRecord?.progressPercentage || Number(student.progressRate) || 0,
        rank: progressRecord?.rank || 'Beginner',
      },
      percentage: progressRecord?.progressPercentage || Number(student.progressRate) || 0,
      dailyLogs: progressLogs,
      timeline,
      evaluations: examEvaluations.map((ev) => ({
        id: ev.id,
        programType: ev.programType,
        evaluationType: ev.evaluationType,
        score: ev.score,
        notes: ev.teacherComments,
        teacherName: ev.teacher?.fullName || 'Teacher',
        date: ev.evaluationDate || ev.createdAt,
        recommendations: ev.recommendations || '',
        criteriaRatings: ev.criteriaRatings || {},
      })),
      teacherFeedback: feedbackRecords.map((f) => ({
        id: f.id,
        teacherName: f.teacher?.fullName || 'Teacher',
        content: f.content,
        date: f.createdAt,
      })),
      attendanceHistory: attendanceHistory.map((ah) => ({
        id: ah.id,
        date: ah.classSession?.sessionDate,
        teacherName: ah.classSession?.teacher?.fullName || 'Unknown Teacher',
        course: ah.classSession?.subject || ah.classSession?.classTitle || 'Quran Class',
        scheduledTime: ah.classSession?.scheduledStartTime && ah.classSession?.scheduledEndTime ? `${ah.classSession.scheduledStartTime} - ${ah.classSession.scheduledEndTime}` : '—',
        joinTime: ah.joinTime,
        exitTime: ah.leaveTime,
        status: ah.attendanceStatus,
      })),
      attendanceStats,
      achievements,
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
        firstName: this.extractFirstName(student.fullName),
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
    n.readAt = new Date();
    return this.notificationRepository.save(n);
  }

  async markAllNotificationsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { success: true };
  }

  async getNotificationsSummary(userId: string) {
    const [total, unread, read] = await Promise.all([
      this.notificationRepository.count({ where: { userId } }),
      this.notificationRepository.count({ where: { userId, isRead: false } }),
      this.notificationRepository.count({ where: { userId, isRead: true } }),
    ]);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const today = await this.notificationRepository.count({
      where: { userId, createdAt: Between(todayStart, todayEnd) },
    });
    return { total, unread, read, today };
  }

  async getFilteredNotifications(
    userId: string,
    filter?: string,
    search?: string,
    page = 1,
    limit = 20,
  ) {
    const query = this.notificationRepository
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId });
    if (filter === 'unread') query.andWhere('n.isRead = :isRead', { isRead: false });
    else if (filter === 'read') query.andWhere('n.isRead = :isRead', { isRead: true });
    if (search) {
      query.andWhere('(n.title ILIKE :search OR n.content ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    query.orderBy('n.createdAt', 'DESC');
    const total = await query.getCount();
    const items = await query.skip((page - 1) * limit).take(limit).getMany();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const n = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });
    if (!n) throw new NotFoundException('Notification not found');
    await this.notificationRepository.remove(n);
    return { success: true };
  }

  async deleteMultipleNotifications(userId: string, ids: string[]) {
    const notifications = await this.notificationRepository.find({
      where: { id: In(ids), userId },
    });
    if (notifications.length === 0) throw new NotFoundException('No notifications found');
    await this.notificationRepository.remove(notifications);
    return { success: true, deleted: notifications.length };
  }

  async clearReadNotifications(userId: string) {
    const result = await this.notificationRepository.delete({ userId, isRead: true });
    return { success: true, deleted: result.affected || 0 };
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

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionMeeting, SessionStatus, TeacherAttendanceStatus } from './entities/session-meeting.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionMeeting)
    private sessionRepository: Repository<SessionMeeting>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    private notificationService: NotificationService,
  ) {}

  async startMeeting(scheduleId: string, teacherId: string, meetingLink: string) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId, teacherId },
      relations: ['student', 'teacher'],
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found or not assigned to this teacher');
    }

    if (!meetingLink || (!meetingLink.includes('zoom') && !meetingLink.includes('meet'))) {
      throw new BadRequestException('Invalid meeting link. Must be Zoom or Google Meet link.');
    }

    const existingSession = await this.sessionRepository.findOne({
      where: {
        scheduleId,
        status: SessionStatus.LIVE,
      },
    });

    if (existingSession) {
      throw new BadRequestException('A meeting is already live for this class');
    }

    const now = new Date();
    const session = this.sessionRepository.create({
      scheduleId,
      teacherId,
      meetingLink,
      status: SessionStatus.LIVE,
      actualStartTime: now,
      teacherJoinTime: now,
      attendanceStatus: TeacherAttendanceStatus.PRESENT,
    });

    const savedSession = await this.sessionRepository.save(session);

    const [students, parents, admins] = await Promise.all([
      this.getScheduleStudents(scheduleId),
      this.getStudentParents(scheduleId),
      this.getAdmins(),
    ]);

    const recipients = [
      ...students.map(s => s.userId),
      ...parents.map(p => p.userId),
      ...admins.map(a => a.id),
    ];

    await this.notificationService.sendMeetingNotification(
      savedSession.id,
      recipients,
      {
        teacherName: schedule.teacher.fullName,
        className: schedule.className,
        meetingLink,
        scheduledTime: schedule.startTime,
      },
    );

    return savedSession;
  }

  async endMeeting(sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatus.LIVE) {
      throw new BadRequestException('Session is not live');
    }

    const now = new Date();
    session.status = SessionStatus.ENDED;
    session.teacherLeaveTime = now;
    session.actualEndTime = now;

    if (session.teacherJoinTime) {
      const durationMs = now.getTime() - session.teacherJoinTime.getTime();
      session.totalDuration = Math.floor(durationMs / 60000);
    }

    return this.sessionRepository.save(session);
  }

  async getActiveSession(teacherId: string) {
    return this.sessionRepository.findOne({
      where: {
        teacherId,
        status: SessionStatus.LIVE,
      },
      relations: ['schedule', 'studentAttendances', 'studentAttendances.student'],
    });
  }

  async getScheduleSession(scheduleId: string) {
    const today = new Date().toDateString();
    return this.sessionRepository.findOne({
      where: {
        scheduleId,
      },
      order: { createdAt: 'DESC' },
      relations: ['schedule', 'teacher', 'studentAttendances', 'studentAttendances.student'],
    });
  }

  async recordTeacherJoin(sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['schedule'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const now = new Date();
    session.teacherJoinTime = now;
    session.actualStartTime = now;

    const scheduledStart = new Date(session.schedule.startTime);
    if (now > scheduledStart) {
      session.attendanceStatus = TeacherAttendanceStatus.LATE;
    } else {
      session.attendanceStatus = TeacherAttendanceStatus.PRESENT;
    }

    return this.sessionRepository.save(session);
  }

  async recordTeacherLeave(sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const now = new Date();
    session.teacherLeaveTime = now;

    if (session.teacherJoinTime) {
      const durationMs = now.getTime() - session.teacherJoinTime.getTime();
      session.totalDuration = Math.floor(durationMs / 60000);
    }

    return this.sessionRepository.save(session);
  }

  async getSessionDetails(sessionId: string) {
    return this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['schedule', 'teacher', 'studentAttendances', 'studentAttendances.student'],
    });
  }

  async getLiveSessionsForAdmin() {
    return this.sessionRepository.find({
      where: { status: SessionStatus.LIVE },
      relations: ['schedule', 'teacher', 'studentAttendances', 'studentAttendances.student'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSessionsForSchedule(scheduleId: string) {
    return this.sessionRepository.find({
      where: { scheduleId },
      relations: ['schedule', 'teacher', 'studentAttendances', 'studentAttendances.student'],
      order: { createdAt: 'DESC' },
    });
  }

  private async getScheduleStudents(scheduleId: string) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['student', 'student.user'],
    });
    return schedule?.student ? [schedule.student.user] : [];
  }

  private async getStudentParents(scheduleId: string) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['student', 'student.parent', 'student.parent.user'],
    });
    return schedule?.student?.parent?.user ? [schedule.student.parent.user] : [];
  }

  private async getAdmins() {
    return [];
  }
}

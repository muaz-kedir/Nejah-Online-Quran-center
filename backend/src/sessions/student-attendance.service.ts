import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StudentSessionAttendance, StudentAttendanceStatus } from './entities/student-session-attendance.entity';
import { SessionMeeting } from './entities/session-meeting.entity';
import { Schedule } from '../schedules/entities/schedule.entity';

@Injectable()
export class StudentAttendanceService {
  constructor(
    @InjectRepository(StudentSessionAttendance)
    private attendanceRepository: Repository<StudentSessionAttendance>,
    @InjectRepository(SessionMeeting)
    private sessionRepository: Repository<SessionMeeting>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
  ) {}

  async recordStudentJoin(sessionId: string, studentId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['schedule'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    let attendance = await this.attendanceRepository.findOne({
      where: { sessionMeetingId: sessionId, studentId },
    });

    if (attendance) {
      throw new BadRequestException('Student already joined this session');
    }

    const now = new Date();
    const scheduledStart = new Date(session.schedule.startTime);

    let status = StudentAttendanceStatus.PRESENT;
    if (now > scheduledStart) {
      status = StudentAttendanceStatus.LATE;
    }

    attendance = this.attendanceRepository.create({
      sessionMeetingId: sessionId,
      studentId,
      joinTime: now,
      attendanceStatus: status,
    });

    return this.attendanceRepository.save(attendance);
  }

  async recordStudentLeave(sessionId: string, studentId: string) {
    const attendance = await this.attendanceRepository.findOne({
      where: { sessionMeetingId: sessionId, studentId },
      relations: ['session', 'session.schedule'],
    });

    if (!attendance) {
      throw new NotFoundException('Student attendance record not found');
    }

    const now = new Date();
    attendance.leaveTime = now;

    const scheduledEnd = new Date(attendance.session.schedule.endTime);
    if (now < scheduledEnd && attendance.attendanceStatus === StudentAttendanceStatus.PRESENT) {
      attendance.attendanceStatus = StudentAttendanceStatus.LEFT_EARLY;
    }

    if (attendance.joinTime) {
      const durationMs = now.getTime() - attendance.joinTime.getTime();
      attendance.totalDuration = Math.floor(durationMs / 60000);
    }

    return this.attendanceRepository.save(attendance);
  }

  async calculateAttendanceStatus(studentId: string, sessionId: string) {
    const attendance = await this.attendanceRepository.findOne({
      where: { sessionMeetingId: sessionId, studentId },
      relations: ['session', 'session.schedule'],
    });

    if (!attendance) {
      return StudentAttendanceStatus.ABSENT;
    }

    if (!attendance.joinTime) {
      return StudentAttendanceStatus.ABSENT;
    }

    return attendance.attendanceStatus;
  }

  async getStudentAttendanceBySchedule(studentId: string, scheduleId: string) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return this.attendanceRepository.find({
      where: {
        studentId,
        session: { scheduleId },
      },
      relations: ['session', 'session.schedule', 'session.teacher'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStudentAttendancePercentage(studentId: string, fromDate: Date, toDate: Date) {
    const [totalClasses, presentClasses] = await Promise.all([
      this.attendanceRepository.count({
        where: {
          studentId,
          createdAt: Between(fromDate, toDate),
        },
      }),
      this.attendanceRepository.count({
        where: {
          studentId,
          attendanceStatus: StudentAttendanceStatus.PRESENT,
          createdAt: Between(fromDate, toDate),
        },
      }),
    ]);

    if (totalClasses === 0) return 0;
    return (presentClasses / totalClasses) * 100;
  }

  async getStudentAttendanceHistory(studentId: string, limit = 50, offset = 0) {
    return this.attendanceRepository.find({
      where: { studentId },
      relations: ['session', 'session.schedule', 'session.teacher'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async markAbsent(sessionId: string, studentId: string) {
    let attendance = await this.attendanceRepository.findOne({
      where: { sessionMeetingId: sessionId, studentId },
    });

    if (!attendance) {
      attendance = this.attendanceRepository.create({
        sessionMeetingId: sessionId,
        studentId,
        attendanceStatus: StudentAttendanceStatus.ABSENT,
      });
    } else {
      attendance.attendanceStatus = StudentAttendanceStatus.ABSENT;
    }

    return this.attendanceRepository.save(attendance);
  }

  async getSessionAttendance(sessionId: string) {
    return this.attendanceRepository.find({
      where: { sessionMeetingId: sessionId },
      relations: ['student', 'student.user', 'session'],
      order: { createdAt: 'DESC' },
    });
  }
}

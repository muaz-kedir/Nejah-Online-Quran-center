import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionAttendance } from './entities/session-attendance.entity';
import { LiveSession } from './entities/live-session.entity';
import { AttendanceStatus } from './enums/live-session-status.enum';

@Injectable()
export class SessionAttendanceService {
  private readonly logger = new Logger(SessionAttendanceService.name);

  constructor(
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
  ) {}

  async recordJoin(sessionId: string, studentId: string): Promise<SessionAttendance> {
    const session = await this.liveSessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    let attendance = await this.attendanceRepository.findOne({
      where: { sessionId, studentId },
    });

    const now = new Date();
    const isLate = now > session.scheduledStart;

    if (!attendance) {
      attendance = this.attendanceRepository.create({
        sessionId,
        studentId,
        joinTime: now,
        attendanceStatus: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
      });
    } else {
      attendance.joinTime = now;
      if (attendance.attendanceStatus === AttendanceStatus.ABSENT) {
        attendance.attendanceStatus = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
      }
    }

    return this.attendanceRepository.save(attendance);
  }

  async recordLeave(sessionId: string, studentId: string): Promise<SessionAttendance> {
    const session = await this.liveSessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    let attendance = await this.attendanceRepository.findOne({
      where: { sessionId, studentId },
    });

    if (!attendance) {
      attendance = this.attendanceRepository.create({
        sessionId,
        studentId,
        attendanceStatus: AttendanceStatus.ABSENT,
      });
    }

    const now = new Date();
    attendance.leaveTime = now;

    if (attendance.joinTime) {
      attendance.duration = Math.floor((now.getTime() - attendance.joinTime.getTime()) / 60000);
    }

    if (attendance.joinTime && now < session.scheduledEnd) {
      attendance.attendanceStatus = AttendanceStatus.LEFT_EARLY;
    }

    return this.attendanceRepository.save(attendance);
  }

  async markAbsent(sessionId: string, studentId: string): Promise<SessionAttendance> {
    let attendance = await this.attendanceRepository.findOne({
      where: { sessionId, studentId },
    });

    if (!attendance) {
      attendance = this.attendanceRepository.create({
        sessionId,
        studentId,
        attendanceStatus: AttendanceStatus.ABSENT,
      });
    } else if (!attendance.joinTime) {
      attendance.attendanceStatus = AttendanceStatus.ABSENT;
    }

    return this.attendanceRepository.save(attendance);
  }

  async getAttendanceForSession(sessionId: string): Promise<SessionAttendance[]> {
    return this.attendanceRepository.find({
      where: { sessionId },
      relations: ['student'],
      order: { joinTime: 'ASC' },
    });
  }

  async getAttendanceForStudent(
    studentId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: SessionAttendance[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const [data, total] = await this.attendanceRepository.findAndCount({
      where: { studentId },
      relations: ['session', 'session.teacher', 'session.schedule'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAttendanceStats(studentId: string): Promise<{
    total: number;
    present: number;
    late: number;
    absent: number;
    leftEarly: number;
    attendancePercentage: number;
  }> {
    const attendances = await this.attendanceRepository.find({
      where: { studentId },
    });

    const total = attendances.length;
    const present = attendances.filter(
      (a) => a.attendanceStatus === AttendanceStatus.PRESENT,
    ).length;
    const late = attendances.filter((a) => a.attendanceStatus === AttendanceStatus.LATE).length;
    const absent = attendances.filter((a) => a.attendanceStatus === AttendanceStatus.ABSENT).length;
    const leftEarly = attendances.filter(
      (a) => a.attendanceStatus === AttendanceStatus.LEFT_EARLY,
    ).length;
    const attendancePercentage = total > 0 ? ((present + late) / total) * 100 : 0;

    return { total, present, late, absent, leftEarly, attendancePercentage };
  }

  async bulkCreateAttendance(sessionId: string, studentIds: string[]): Promise<void> {
    const existing = await this.attendanceRepository.find({
      where: { sessionId },
    });
    const existingStudentIds = new Set(existing.map((a) => a.studentId));

    const newRecords = studentIds
      .filter((sid) => !existingStudentIds.has(sid))
      .map((studentId) =>
        this.attendanceRepository.create({
          sessionId,
          studentId,
          attendanceStatus: AttendanceStatus.ABSENT,
        }),
      );

    if (newRecords.length > 0) {
      await this.attendanceRepository.save(newRecords);
    }
  }
}

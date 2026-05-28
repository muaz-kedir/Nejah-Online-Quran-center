import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassSession, SessionStatus, TeacherAttendanceStatus } from './entities/class-session.entity';
import { StudentAttendance, StudentAttendanceStatus } from './entities/student-attendance.entity';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { StartMeetingDto } from './dto/start-meeting.dto';
import { RecordStudentAttendanceDto } from './dto/record-student-attendance.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(ClassSession)
    private classSessionRepository: Repository<ClassSession>,
    @InjectRepository(StudentAttendance)
    private studentAttendanceRepository: Repository<StudentAttendance>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    private notificationsService: NotificationsService,
  ) {}

  async createClassSession(dto: CreateClassSessionDto): Promise<ClassSession> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const session = this.classSessionRepository.create({
      classTitle: dto.classTitle,
      subject: dto.subject,
      quranLevel: dto.quranLevel,
      sessionDate: dto.sessionDate,
      scheduledStartTime: dto.scheduledStartTime,
      scheduledEndTime: dto.scheduledEndTime,
      teacherId: dto.teacherId,
      scheduleId: dto.scheduleId,
      notes: dto.notes,
    });

    const savedSession = await this.classSessionRepository.save(session);

    // Create student attendance records
    if (dto.assignedStudentIds && dto.assignedStudentIds.length > 0) {
      const students = await this.studentRepository.findByIds(dto.assignedStudentIds);
      const attendanceRecords = students.map((student) =>
        this.studentAttendanceRepository.create({
          studentId: student.id,
          classSessionId: savedSession.id,
          attendanceStatus: StudentAttendanceStatus.ABSENT,
        }),
      );
      await this.studentAttendanceRepository.save(attendanceRecords);
      savedSession.totalStudentsAssigned = students.length;
      await this.classSessionRepository.save(savedSession);
    }

    return this.getClassSessionWithAttendance(savedSession.id);
  }

  async getLiveClassSessionByScheduleToday(scheduleId: string): Promise<ClassSession> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let session = await this.classSessionRepository.findOne({
      where: {
        scheduleId,
        sessionDate: todayStr as any,
      },
      relations: ['teacher', 'studentAttendances', 'studentAttendances.student'],
    });

    if (!session) {
      const schedule = await this.scheduleRepository.findOne({
        where: { id: scheduleId },
        relations: ['student', 'teacher', 'teacher.user'],
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      session = this.classSessionRepository.create({
        classTitle: schedule.className || 'Quran Class',
        subject: 'Quran & Islamic Studies',
        quranLevel: schedule.student?.level || 'Beginner',
        sessionDate: todayStr as any,
        scheduledStartTime: schedule.startTimeString || '12:00',
        scheduledEndTime: schedule.endTimeString || '13:00',
        teacherId: schedule.teacherId,
        scheduleId: schedule.id,
        status: SessionStatus.SCHEDULED,
        totalStudentsAssigned: 1,
      });

      const savedSession = await this.classSessionRepository.save(session);

      if (schedule.studentId) {
        const attendance = this.studentAttendanceRepository.create({
          studentId: schedule.studentId,
          classSessionId: savedSession.id,
          attendanceStatus: StudentAttendanceStatus.ABSENT,
        });
        await this.studentAttendanceRepository.save(attendance);
      }

      session = await this.getClassSessionWithAttendance(savedSession.id);
    }

    return session;
  }

  async startMeeting(dto: StartMeetingDto): Promise<ClassSession> {
    const session = await this.classSessionRepository.findOne({
      where: { id: dto.classSessionId },
      relations: ['teacher'],
    });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Cannot start a completed session');
    }

    session.meetingLink = dto.meetingLink;
    session.status = SessionStatus.LIVE;
    const now = new Date();
    session.actualStartTime = now;

    // Determine teacher attendance status (LATE or PRESENT)
    const todayStr = now.toISOString().split('T')[0];
    const scheduledStart = new Date(`${todayStr}T${session.scheduledStartTime}:00`);

    if (now > scheduledStart) {
      session.teacherAttendanceStatus = TeacherAttendanceStatus.LATE;
    } else {
      session.teacherAttendanceStatus = TeacherAttendanceStatus.PRESENT;
    }
    session.teacherJoinTime = now;

    const updatedSession = await this.classSessionRepository.save(session);

    // Retrieve assigned student IDs for notification
    const attendances = await this.studentAttendanceRepository.find({
      where: { classSessionId: session.id },
    });
    const studentIds = attendances.map((a) => a.studentId);

    const sessionWithTeacher = await this.getClassSessionWithAttendance(updatedSession.id);

    try {
      await this.notificationsService.notifyMeetingStarted(sessionWithTeacher, studentIds);
    } catch (err) {
      console.error('Failed to trigger meeting started notifications', err);
    }

    return sessionWithTeacher;
  }

  async recordStudentAttendance(dto: RecordStudentAttendanceDto): Promise<StudentAttendance> {
    const session = await this.classSessionRepository.findOne({
      where: { id: dto.classSessionId },
    });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    let attendance = await this.studentAttendanceRepository.findOne({
      where: {
        studentId: dto.studentId,
        classSessionId: dto.classSessionId,
      },
    });

    if (!attendance) {
      attendance = this.studentAttendanceRepository.create({
        studentId: dto.studentId,
        classSessionId: dto.classSessionId,
        attendanceStatus: StudentAttendanceStatus.ABSENT,
      });
    }

    const now = new Date();
    if (dto.action === 'join') {
      const todayStr = now.toISOString().split('T')[0];
      const scheduledStart = new Date(`${todayStr}T${session.scheduledStartTime}:00`);

      if (now > scheduledStart) {
        attendance.attendanceStatus = StudentAttendanceStatus.LATE;
      } else {
        attendance.attendanceStatus = StudentAttendanceStatus.PRESENT;
      }

      attendance.joinTime = now;
      attendance.notificationSent = true;
    } else if (dto.action === 'leave') {
      attendance.leaveTime = now;

      if (attendance.joinTime) {
        const durationMs = attendance.leaveTime.getTime() - attendance.joinTime.getTime();
        attendance.durationMinutes = Math.floor(durationMs / 60000);

        const todayStr = now.toISOString().split('T')[0];
        const scheduledEnd = new Date(`${todayStr}T${session.scheduledEndTime}:00`);
        if (attendance.leaveTime < scheduledEnd) {
          attendance.attendanceStatus = StudentAttendanceStatus.LEFT_EARLY;
        }
      }
    }

    const savedAttendance = await this.studentAttendanceRepository.save(attendance);
    await this.updateSessionStatistics(dto.classSessionId);

    try {
      await this.notificationsService.notifyAttendanceRecorded(
        dto.studentId,
        dto.classSessionId,
        savedAttendance.attendanceStatus,
      );
    } catch (err) {
      console.error('Failed to notify parent about attendance', err);
    }

    return savedAttendance;
  }

  async endSession(dto: EndSessionDto): Promise<ClassSession> {
    const session = await this.classSessionRepository.findOne({
      where: { id: dto.classSessionId },
      relations: ['teacher', 'studentAttendances'],
    });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    session.status = SessionStatus.COMPLETED;
    const now = new Date();
    session.actualEndTime = now;
    session.teacherLeaveTime = now;
    session.notes = dto.notes;

    if (session.teacherJoinTime) {
      const durationMs = now.getTime() - session.teacherJoinTime.getTime();
      session.teacherDuration = Math.floor(durationMs / 60000);
    }

    const attendances = await this.studentAttendanceRepository.find({
      where: { classSessionId: dto.classSessionId },
    });

    for (const attendance of attendances) {
      if (!attendance.joinTime) {
        attendance.attendanceStatus = StudentAttendanceStatus.ABSENT;
        await this.studentAttendanceRepository.save(attendance);
      } else if (!attendance.leaveTime) {
        attendance.leaveTime = now;
        const durationMs = now.getTime() - attendance.joinTime.getTime();
        attendance.durationMinutes = Math.floor(durationMs / 60000);

        const todayStr = now.toISOString().split('T')[0];
        const scheduledEnd = new Date(`${todayStr}T${session.scheduledEndTime}:00`);
        if (now < scheduledEnd) {
          attendance.attendanceStatus = StudentAttendanceStatus.LEFT_EARLY;
        }
        await this.studentAttendanceRepository.save(attendance);
      }
    }

    const updatedSession = await this.classSessionRepository.save(session);
    await this.updateSessionStatistics(dto.classSessionId);

    try {
      const sessionWithTeacher = await this.getClassSessionWithAttendance(updatedSession.id);
      await this.notificationsService.notifyMeetingEnded(sessionWithTeacher);
    } catch (err) {
      console.error('Failed to notify meeting ended', err);
    }

    return this.getClassSessionWithAttendance(updatedSession.id);
  }

  private async updateSessionStatistics(classSessionId: string): Promise<void> {
    const session = await this.classSessionRepository.findOne({
      where: { id: classSessionId },
    });

    if (!session) return;

    const attendances = await this.studentAttendanceRepository.find({
      where: { classSessionId },
    });

    session.totalStudentsPresent = attendances.filter(
      (a) => a.attendanceStatus === StudentAttendanceStatus.PRESENT,
    ).length;

    session.totalStudentsLate = attendances.filter(
      (a) => a.attendanceStatus === StudentAttendanceStatus.LATE,
    ).length;

    session.totalStudentsAbsent = attendances.filter(
      (a) => a.attendanceStatus === StudentAttendanceStatus.ABSENT,
    ).length;

    session.totalStudentsLeftEarly = attendances.filter(
      (a) => a.attendanceStatus === StudentAttendanceStatus.LEFT_EARLY,
    ).length;

    await this.classSessionRepository.save(session);
  }

  async getClassSessionWithAttendance(classSessionId: string): Promise<ClassSession> {
    return this.classSessionRepository.findOne({
      where: { id: classSessionId },
      relations: ['teacher', 'studentAttendances', 'studentAttendances.student'],
    });
  }

  async getTeacherSessions(teacherId: string, date?: Date): Promise<ClassSession[]> {
    const query = this.classSessionRepository
      .createQueryBuilder('session')
      .where('session.teacherId = :teacherId', { teacherId })
      .leftJoinAndSelect('session.studentAttendances', 'attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoinAndSelect('session.teacher', 'teacher');

    if (date) {
      query.andWhere('session.sessionDate = :date', { date });
    }

    return query.orderBy('session.sessionDate', 'DESC').addOrderBy('session.scheduledStartTime', 'DESC').getMany();
  }

  async getStudentAttendanceHistory(studentId: string): Promise<StudentAttendance[]> {
    return this.studentAttendanceRepository.find({
      where: { studentId },
      relations: ['classSession', 'classSession.teacher'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAttendanceStats(studentId: string): Promise<any> {
    const attendances = await this.studentAttendanceRepository.find({
      where: { studentId },
    });

    const total = attendances.length;
    const present = attendances.filter(
      (a) => a.attendanceStatus === StudentAttendanceStatus.PRESENT,
    ).length;
    const late = attendances.filter(
      (a) => a.attendanceStatus === StudentAttendanceStatus.LATE,
    ).length;
    const absent = attendances.filter(
      (a) => a.attendanceStatus === StudentAttendanceStatus.ABSENT,
    ).length;

    return {
      total,
      present,
      late,
      absent,
      attendancePercentage: total > 0 ? ((present + late) / total) * 100 : 0,
    };
  }

  async getLiveClasses(): Promise<ClassSession[]> {
    return this.classSessionRepository.find({
      where: { status: SessionStatus.LIVE },
      relations: ['teacher', 'studentAttendances'],
      order: { actualStartTime: 'DESC' },
    });
  }

  async getTodaysSessions(teacherId?: string): Promise<ClassSession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = this.classSessionRepository
      .createQueryBuilder('session')
      .where('session.sessionDate = :date', { date: today })
      .leftJoinAndSelect('session.teacher', 'teacher')
      .leftJoinAndSelect('session.studentAttendances', 'attendance')
      .leftJoinAndSelect('attendance.student', 'student');

    if (teacherId) {
      query.andWhere('session.teacherId = :teacherId', { teacherId });
    }

    return query.orderBy('session.scheduledStartTime', 'ASC').getMany();
  }

  async getStudentLiveClass(studentId: string): Promise<ClassSession> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const liveSessions = await this.classSessionRepository.find({
      where: {
        status: SessionStatus.LIVE,
        sessionDate: todayStr as any,
      },
      relations: ['teacher', 'studentAttendances', 'studentAttendances.student'],
    });

    for (const session of liveSessions) {
      const isAssigned = session.studentAttendances.some(
        (a) => a.studentId === studentId,
      );
      if (isAssigned) {
        return session;
      }
    }
    return null;
  }
}

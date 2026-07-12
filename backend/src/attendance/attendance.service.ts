import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// dkaskd ask
import { Repository } from 'typeorm';
import { ClassSession, SessionStatus, TeacherAttendanceStatus } from './entities/class-session.entity';
import { StudentAttendance, StudentAttendanceStatus } from './entities/student-attendance.entity';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { StartMeetingDto } from './dto/start-meeting.dto';
import { RecordStudentAttendanceDto } from './dto/record-student-attendance.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';

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

  async startMeeting(dto: StartMeetingDto): Promise<ClassSession> {
    const session = await this.classSessionRepository.findOne({
      where: { id: dto.classSessionId },
    });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Cannot start a completed session');
    }

    let meetingLink = dto.meetingLink;

    // If no meeting link provided, try to auto-create Zoom meeting
    if (!meetingLink || meetingLink.trim() === '') {
      const integration = await this.zoomIntegrationRepository.findOne({
        where: { teacherId: session.teacherId, connectionStatus: 'connected' },
      });

      if (integration?.zoomUserId && this.zoomService.isPlatformConfigured()) {
        try {
          // Auto-create Zoom meeting
          const now = new Date();
          const durationMinutes = 90; // 90 minutes default

          const accessToken = await this.zoomService.requireTeacherAccessToken(session.teacherId);
          const meeting = await this.zoomService.createMeeting(
            session.classTitle || 'Quran Class',
            now,
            durationMinutes,
            accessToken,
          );

          meetingLink = meeting.joinUrl;
          session.meetingLink = meetingLink;
          session.zoomMeetingId = meeting.meetingId;
          session.zoomPassword = meeting.password;
        } catch (error) {
          throw new BadRequestException(
            'Failed to auto-create Zoom meeting. Please provide a meeting link manually or check your Zoom connection.',
          );
        }
      } else {
        throw new BadRequestException(
          'No meeting link provided and Zoom is not connected. Please provide a meeting link or connect your Zoom account in Settings.',
        );
      }
    } else {
      session.meetingLink = meetingLink;
    }

    session.status = SessionStatus.LIVE;
    session.actualStartTime = new Date();

    // Record teacher attendance as PRESENT
    session.teacherAttendanceStatus = TeacherAttendanceStatus.PRESENT;
    session.teacherJoinTime = new Date();

    const updatedSession = await this.classSessionRepository.save(session);

    // Trigger notifications (will be handled by notification service)
    // This is where we'd emit events for notifications

    return this.getClassSessionWithAttendance(updatedSession.id);
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
      // Create new attendance record if it doesn't exist
      attendance = this.studentAttendanceRepository.create({
        studentId: dto.studentId,
        classSessionId: dto.classSessionId,
      });
    }

    if (dto.action === 'join') {
      const now = new Date();
      const scheduledStart = new Date(
        `${session.sessionDate}T${session.scheduledStartTime}`,
      );

      // Check if student is late
      if (now > scheduledStart) {
        attendance.attendanceStatus = StudentAttendanceStatus.LATE;
      } else {
        attendance.attendanceStatus = StudentAttendanceStatus.PRESENT;
      }

      attendance.joinTime = now;
      attendance.notificationSent = true;
    } else if (dto.action === 'leave') {
      attendance.leaveTime = new Date();

      // Calculate duration
      if (attendance.joinTime) {
        const durationMs = attendance.leaveTime.getTime() - attendance.joinTime.getTime();
        attendance.durationMinutes = Math.floor(durationMs / 60000);

        // Mark as LEFT_EARLY if left before scheduled end time
        const scheduledEnd = new Date(
          `${session.sessionDate}T${session.scheduledEndTime}`,
        );
        if (attendance.leaveTime < scheduledEnd) {
          attendance.attendanceStatus = StudentAttendanceStatus.LEFT_EARLY;
        }
      }
    }

    const savedAttendance = await this.studentAttendanceRepository.save(attendance);

    // Update session statistics
    await this.updateSessionStatistics(dto.classSessionId);

    return savedAttendance;
  }

  async endSession(dto: EndSessionDto): Promise<ClassSession> {
    const session = await this.classSessionRepository.findOne({
      where: { id: dto.classSessionId },
      relations: ['studentAttendances'],
    });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    session.status = SessionStatus.COMPLETED;
    session.actualEndTime = new Date();
    session.teacherLeaveTime = new Date();
    session.notes = dto.notes;

    // Mark students who never joined as ABSENT
    const attendances = await this.studentAttendanceRepository.find({
      where: { classSessionId: dto.classSessionId },
    });

    for (const attendance of attendances) {
      if (!attendance.joinTime) {
        attendance.attendanceStatus = StudentAttendanceStatus.ABSENT;
        await this.studentAttendanceRepository.save(attendance);
      }
    }

    const updatedSession = await this.classSessionRepository.save(session);
    await this.updateSessionStatistics(dto.classSessionId);

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

  async getLiveClassSessionByScheduleToday(
    scheduleId: string,
    requestingTeacherId?: string,
  ): Promise<ClassSession | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const query = this.classSessionRepository
      .createQueryBuilder('session')
      .where('session.scheduleId = :scheduleId', { scheduleId })
      .andWhere('session.sessionDate = :date', { date: today })
      .leftJoinAndSelect('session.teacher', 'teacher')
      .leftJoinAndSelect('session.studentAttendances', 'attendance')
      .leftJoinAndSelect('attendance.student', 'student');

    if (requestingTeacherId) {
      query.andWhere('session.teacherId = :teacherId', { teacherId: requestingTeacherId });
    }

    return query.getOne() || null;
  }

  async getStudentLiveClass(studentId: string): Promise<ClassSession | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.classSessionRepository
      .createQueryBuilder('session')
      .innerJoin('session.studentAttendances', 'attendance')
      .where('attendance.studentId = :studentId', { studentId })
      .andWhere('session.sessionDate = :date', { date: today })
      .andWhere('session.status = :status', { status: SessionStatus.LIVE })
      .leftJoinAndSelect('session.teacher', 'teacher')
      .leftJoinAndSelect('session.studentAttendances', 'attendances')
      .leftJoinAndSelect('attendances.student', 'student')
      .getOne() || null;
  }

  async getAllSessions(limitNum: number, status?: string): Promise<ClassSession[]> {
    const query = this.classSessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.teacher', 'teacher')
      .leftJoinAndSelect('session.studentAttendances', 'attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .orderBy('session.scheduledStartTime', 'DESC')
      .take(limitNum);

    if (status) {
      query.andWhere('session.status = :status', { status });
    }

    return query.getMany();
  }
}

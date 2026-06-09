import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TeacherReplacement } from './entities/teacher-replacement.entity';
import { ReplacementScheduleOverride } from './entities/replacement-schedule-override.entity';
import { TeacherReplacementAudit } from './entities/teacher-replacement-audit.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { User } from '../users/entities/user.entity';
import { ReplacementStatus } from '../common/enums/replacement-status.enum';
import { ReplacementReason } from '../common/enums/replacement-reason.enum';
import { CreateTeacherReplacementDto } from './dto/create-teacher-replacement.dto';
import { UpdateTeacherReplacementDto } from './dto/update-teacher-replacement.dto';
import { QueryTeacherReplacementDto } from './dto/query-teacher-replacement.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../common/enums/user-role.enum';
import {
  ClassSession,
  SessionStatus,
  TeacherAttendanceStatus,
} from '../attendance/entities/class-session.entity';
import {
  StudentAttendance,
  StudentAttendanceStatus,
} from '../attendance/entities/student-attendance.entity';

export interface EffectiveTeacherInfo {
  originalTeacherId: string;
  effectiveTeacherId: string;
  isTemporary: boolean;
  replacement?: TeacherReplacement;
}

@Injectable()
export class TeacherReplacementsService {
  constructor(
    @InjectRepository(TeacherReplacement)
    private replacementsRepository: Repository<TeacherReplacement>,
    @InjectRepository(ReplacementScheduleOverride)
    private overridesRepository: Repository<ReplacementScheduleOverride>,
    @InjectRepository(TeacherReplacementAudit)
    private auditRepository: Repository<TeacherReplacementAudit>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ClassSession)
    private classSessionRepository: Repository<ClassSession>,
    @InjectRepository(StudentAttendance)
    private studentAttendanceRepository: Repository<StudentAttendance>,
    private notificationsService: NotificationsService,
  ) {}

  private todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private deriveStatus(startDate: string, endDate: string, currentStatus: ReplacementStatus): ReplacementStatus {
    if (currentStatus === ReplacementStatus.CANCELLED || currentStatus === ReplacementStatus.COMPLETED) {
      return currentStatus;
    }
    const today = this.todayDateString();
    if (today < startDate) return ReplacementStatus.UPCOMING;
    if (today > endDate) return ReplacementStatus.COMPLETED;
    return ReplacementStatus.ACTIVE;
  }

  async getActiveReplacement(studentId: string, date?: string): Promise<TeacherReplacement | null> {
    const refDate = date || this.todayDateString();
    const replacement = await this.replacementsRepository.findOne({
      where: {
        studentId,
        status: In([ReplacementStatus.UPCOMING, ReplacementStatus.ACTIVE]),
      },
      relations: ['originalTeacher', 'replacementTeacher', 'student'],
      order: { startDate: 'DESC' },
    });

    if (!replacement) return null;
    if (refDate < replacement.startDate || refDate > replacement.endDate) return null;
    if (replacement.status === ReplacementStatus.CANCELLED || replacement.status === ReplacementStatus.COMPLETED) {
      return null;
    }
    return replacement;
  }

  async getEffectiveTeacher(studentId: string): Promise<EffectiveTeacherInfo> {
    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student?.teacherId) {
      throw new NotFoundException('Student or original teacher not found');
    }

    const replacement = await this.getActiveReplacement(studentId);
    return {
      originalTeacherId: student.teacherId,
      effectiveTeacherId: replacement ? replacement.replacementTeacherId : student.teacherId,
      isTemporary: !!replacement,
      replacement: replacement || undefined,
    };
  }

  async canTeacherTeachStudent(teacherId: string, studentId: string): Promise<boolean> {
    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student) return false;

    const activeReplacement = await this.getActiveReplacement(studentId);
    if (activeReplacement) {
      return activeReplacement.replacementTeacherId === teacherId;
    }

    if (student.teacherId === teacherId) {
      return true;
    }

    return this.schedulesRepository.exist({
      where: { studentId, teacherId, status: 'active' },
    });
  }

  /**
   * Teachers who may log progress, assign homework, and add feedback.
   * Includes the permanent assigned teacher even during an active temporary replacement,
   * plus the effective/replacement teacher and schedule-based access.
   */
  async canTeacherManageStudent(teacherId: string, studentId: string): Promise<boolean> {
    if (await this.canTeacherTeachStudent(teacherId, studentId)) {
      return true;
    }

    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student) return false;

    if (student.teacherId === teacherId) {
      return true;
    }

    const tempAssignment = await this.replacementsRepository.findOne({
      where: {
        studentId,
        replacementTeacherId: teacherId,
        status: In([ReplacementStatus.ACTIVE, ReplacementStatus.UPCOMING]),
      },
    });
    if (tempAssignment && this.todayDateString() <= tempAssignment.endDate) {
      return true;
    }

    return this.schedulesRepository.exist({
      where: { studentId, teacherId, status: 'active' },
    });
  }

  async canTeacherViewStudent(teacherId: string, studentId: string): Promise<boolean> {
    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student?.teacherId) return false;
    if (student.teacherId === teacherId) return true;

    const replacement = await this.getActiveReplacement(studentId);
    if (replacement?.replacementTeacherId === teacherId) return true;

    const wasReplacement = await this.replacementsRepository.findOne({
      where: {
        studentId,
        replacementTeacherId: teacherId,
        status: In([ReplacementStatus.COMPLETED, ReplacementStatus.CANCELLED, ReplacementStatus.ACTIVE, ReplacementStatus.UPCOMING]),
      },
    });
    return !!wasReplacement;
  }

  async assertTeacherCanTeachStudent(teacherId: string, studentId: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    const allowed = await this.canTeacherTeachStudent(teacherId, studentId);
    if (!allowed) {
      throw new ForbiddenException('You do not have teaching access to this student');
    }
    return student;
  }

  async assertTeacherCanManageStudent(teacherId: string, studentId: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    const allowed = await this.canTeacherManageStudent(teacherId, studentId);
    if (!allowed) {
      throw new ForbiddenException('You do not have teaching access to this student');
    }
    return student;
  }

  async assertTeacherCanViewStudent(teacherId: string, studentId: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    const allowed = await this.canTeacherViewStudent(teacherId, studentId);
    if (!allowed) {
      throw new ForbiddenException('You do not have access to this student');
    }
    return student;
  }

  private async logAudit(
    replacementId: string,
    action: string,
    performedBy: string,
    payload?: Record<string, unknown>,
  ) {
    await this.auditRepository.save(
      this.auditRepository.create({
        replacementId,
        action,
        performedBy,
        payloadJson: payload,
      }),
    );
  }

  private async validateReplacementTeachers(originalTeacherId: string, replacementTeacherId: string) {
    if (originalTeacherId === replacementTeacherId) {
      throw new BadRequestException('Replacement teacher cannot be the same as the original teacher');
    }

    const replacementTeacher = await this.teachersRepository.findOne({
      where: { id: replacementTeacherId },
    });
    if (!replacementTeacher) throw new NotFoundException('Replacement teacher not found');
    const status = replacementTeacher.status?.toLowerCase() ?? '';
    if (status !== 'active') {
      throw new BadRequestException('Replacement teacher must be active');
    }
  }

  private async assertNoOverlap(studentId: string, startDate: string, endDate: string, excludeId?: string) {
    const qb = this.replacementsRepository
      .createQueryBuilder('r')
      .where('r.studentId = :studentId', { studentId })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [ReplacementStatus.UPCOMING, ReplacementStatus.ACTIVE],
      })
      .andWhere('r.startDate <= :endDate AND r.endDate >= :startDate', { startDate, endDate });

    if (excludeId) {
      qb.andWhere('r.id != :excludeId', { excludeId });
    }

    const overlap = await qb.getOne();
    if (overlap) {
      throw new ConflictException('Student already has a temporary assignment during this period');
    }
  }

  private async resolveStudentIds(dto: CreateTeacherReplacementDto): Promise<string[]> {
    if (dto.selectAllStudents) {
      const students = await this.studentsRepository.find({
        where: { teacherId: dto.originalTeacherId },
      });
      if (students.length === 0) {
        throw new BadRequestException('No students found for the original teacher');
      }
      return students.map((s) => s.id);
    }

    if (!dto.studentIds?.length) {
      throw new BadRequestException('Select at least one student or choose all students');
    }
    return dto.studentIds;
  }

  async create(dto: CreateTeacherReplacementDto, userId: string) {
    if (dto.startDate >= dto.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }
    if (dto.reason === ReplacementReason.OTHER && !dto.customReason?.trim()) {
      throw new BadRequestException('Custom reason is required when reason is Other');
    }

    await this.validateReplacementTeachers(dto.originalTeacherId, dto.replacementTeacherId);
    const studentIds = await this.resolveStudentIds(dto);
    const created: TeacherReplacement[] = [];

    for (const studentId of studentIds) {
      const student = await this.studentsRepository.findOne({ where: { id: studentId } });
      if (!student) throw new NotFoundException(`Student ${studentId} not found`);
      if (student.teacherId !== dto.originalTeacherId) {
        throw new BadRequestException(`Student ${student.fullName} is not assigned to the original teacher`);
      }

      await this.assertNoOverlap(studentId, dto.startDate, dto.endDate);

      const status = this.deriveStatus(dto.startDate, dto.endDate, ReplacementStatus.UPCOMING);
      const replacement = await this.replacementsRepository.save(
        this.replacementsRepository.create({
          studentId,
          originalTeacherId: dto.originalTeacherId,
          replacementTeacherId: dto.replacementTeacherId,
          startDate: dto.startDate,
          endDate: dto.endDate,
          startTimeString: dto.startTime,
          endTimeString: dto.endTime,
          reason: dto.reason,
          customReason: dto.reason === ReplacementReason.OTHER ? dto.customReason : null,
          notes: dto.notes,
          status,
          createdBy: userId,
        }),
      );

      await this.logAudit(replacement.id, 'created', userId, { dto });
      if (status === ReplacementStatus.ACTIVE) {
        await this.activateReplacement(replacement.id, userId, false);
      }
      try {
        await this.notifyReplacementEvent(replacement, 'assigned');
      } catch (err) {
        console.error('Failed to send replacement notification:', err);
      }
      created.push(replacement);
    }

    return {
      message: `Created ${created.length} temporary assignment(s)`,
      data: created,
    };
  }

  async findAll(query: QueryTeacherReplacementDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.replacementsRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.student', 'student')
      .leftJoinAndSelect('r.originalTeacher', 'originalTeacher')
      .leftJoinAndSelect('r.replacementTeacher', 'replacementTeacher')
      .orderBy('r.createdAt', 'DESC');

    if (query.status) qb.andWhere('r.status = :status', { status: query.status });
    if (query.studentId) qb.andWhere('r.studentId = :studentId', { studentId: query.studentId });
    if (query.originalTeacherId) {
      qb.andWhere('r.originalTeacherId = :originalTeacherId', { originalTeacherId: query.originalTeacherId });
    }
    if (query.replacementTeacherId) {
      qb.andWhere('r.replacementTeacherId = :replacementTeacherId', {
        replacementTeacherId: query.replacementTeacherId,
      });
    }
    if (query.search) {
      qb.andWhere(
        '(LOWER(student.fullName) LIKE LOWER(:search) OR LOWER(originalTeacher.fullName) LIKE LOWER(:search) OR LOWER(replacementTeacher.fullName) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const replacement = await this.replacementsRepository.findOne({
      where: { id },
      relations: ['student', 'originalTeacher', 'replacementTeacher', 'creator'],
    });
    if (!replacement) throw new NotFoundException('Temporary assignment not found');

    const audits = await this.auditRepository.find({
      where: { replacementId: id },
      order: { performedAt: 'DESC' },
    });

    return { ...replacement, audits };
  }

  async update(id: string, dto: UpdateTeacherReplacementDto, userId: string) {
    const replacement = await this.replacementsRepository.findOne({ where: { id } });
    if (!replacement) throw new NotFoundException('Temporary assignment not found');
    if ([ReplacementStatus.COMPLETED, ReplacementStatus.CANCELLED].includes(replacement.status)) {
      throw new BadRequestException('Cannot update a completed or cancelled assignment');
    }

    const startDate = dto.startDate || replacement.startDate;
    const endDate = dto.endDate || replacement.endDate;
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const replacementTeacherId = dto.replacementTeacherId || replacement.replacementTeacherId;
    await this.validateReplacementTeachers(replacement.originalTeacherId, replacementTeacherId);
    await this.assertNoOverlap(replacement.studentId, startDate, endDate, id);

    Object.assign(replacement, {
      ...dto,
      replacementTeacherId,
      startDate,
      endDate,
      startTimeString: dto.startTime ?? replacement.startTimeString,
      endTimeString: dto.endTime ?? replacement.endTimeString,
      updatedBy: userId,
      status: this.deriveStatus(startDate, endDate, replacement.status),
    });

    const saved = await this.replacementsRepository.save(replacement);
    await this.logAudit(id, 'updated', userId, { dto });

    if (saved.status === ReplacementStatus.ACTIVE) {
      await this.activateReplacement(id, userId, false);
    }
    await this.notifyReplacementEvent(saved, 'updated');
    return saved;
  }

  async cancel(id: string, userId: string) {
    const replacement = await this.replacementsRepository.findOne({ where: { id } });
    if (!replacement) throw new NotFoundException('Temporary assignment not found');
    if (replacement.status === ReplacementStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed assignment');
    }
    if (replacement.status === ReplacementStatus.CANCELLED) {
      return replacement;
    }

    replacement.status = ReplacementStatus.CANCELLED;
    replacement.cancelledBy = userId;
    replacement.cancelledAt = new Date();
    replacement.updatedBy = userId;

    await this.deactivateOverrides(id);
    const saved = await this.replacementsRepository.save(replacement);
    await this.logAudit(id, 'cancelled', userId);
    await this.notifyReplacementEvent(saved, 'cancelled');
    return saved;
  }

  private async ensureReplacementSchedules(replacement: TeacherReplacement) {
    const existing = await this.schedulesRepository.find({
      where: {
        studentId: replacement.studentId,
        teacherId: replacement.originalTeacherId,
        status: 'active',
      },
    });

    if (existing.length === 0) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      for (const dayOfWeek of days) {
        await this.schedulesRepository.save(
          this.schedulesRepository.create({
            studentId: replacement.studentId,
            teacherId: replacement.originalTeacherId,
            className: 'Quran Class (Temporary Cover)',
            dayOfWeek,
            startTimeString: replacement.startTimeString,
            endTimeString: replacement.endTimeString,
            classType: '1:1 Session',
            status: 'active',
          }),
        );
      }
    }
  }

  private async createScheduleOverrides(replacement: TeacherReplacement) {
    await this.ensureReplacementSchedules(replacement);

    const schedules = await this.schedulesRepository.find({
      where: { studentId: replacement.studentId, teacherId: replacement.originalTeacherId, status: 'active' },
    });

    for (const schedule of schedules) {
      const existing = await this.overridesRepository.findOne({
        where: { replacementId: replacement.id, originalScheduleId: schedule.id },
      });
      if (existing) {
        existing.status = 'active';
        existing.replacementTeacherId = replacement.replacementTeacherId;
        existing.meetingLink = replacement.meetingLink || schedule.meetingLink || existing.meetingLink;
        existing.startTimeString = replacement.startTimeString || schedule.startTimeString;
        existing.endTimeString = replacement.endTimeString || schedule.endTimeString;
        await this.overridesRepository.save(existing);
        continue;
      }

      await this.overridesRepository.save(
        this.overridesRepository.create({
          replacementId: replacement.id,
          originalScheduleId: schedule.id,
          replacementTeacherId: replacement.replacementTeacherId,
          meetingLink: replacement.meetingLink || schedule.meetingLink || null,
          startTimeString: replacement.startTimeString || schedule.startTimeString,
          endTimeString: replacement.endTimeString || schedule.endTimeString,
          status: 'active',
        }),
      );
    }
  }

  private async deactivateOverrides(replacementId: string) {
    await this.overridesRepository.update({ replacementId }, { status: 'inactive' });
  }

  async activateReplacement(id: string, userId: string, sendNotification = true) {
    const replacement = await this.replacementsRepository.findOne({
      where: { id },
      relations: ['student', 'originalTeacher', 'replacementTeacher'],
    });
    if (!replacement) return;

    replacement.status = ReplacementStatus.ACTIVE;
    await this.replacementsRepository.save(replacement);
    await this.createScheduleOverrides(replacement);
    await this.logAudit(id, 'activated', userId || replacement.createdBy);
    if (sendNotification) {
      await this.notifyReplacementEvent(replacement, 'assigned');
    }
  }

  async completeReplacement(id: string, userId?: string) {
    const replacement = await this.replacementsRepository.findOne({
      where: { id },
      relations: ['student', 'originalTeacher', 'replacementTeacher'],
    });
    if (!replacement || replacement.status === ReplacementStatus.COMPLETED) return;

    replacement.status = ReplacementStatus.COMPLETED;
    replacement.completedAt = new Date();
    if (userId) replacement.updatedBy = userId;

    await this.deactivateOverrides(id);
    await this.replacementsRepository.save(replacement);
    await this.logAudit(id, 'completed', userId || 'system');
    await this.notifyReplacementEvent(replacement, 'ended');
  }

  async processLifecycle() {
    const today = this.todayDateString();

    const toActivate = await this.replacementsRepository
      .createQueryBuilder('r')
      .where('r.status = :status', { status: ReplacementStatus.UPCOMING })
      .andWhere('r.startDate <= :today', { today })
      .andWhere('r.endDate >= :today', { today })
      .getMany();

    for (const r of toActivate) {
      await this.activateReplacement(r.id, r.createdBy);
    }

    const toComplete = await this.replacementsRepository
      .createQueryBuilder('r')
      .where('r.status IN (:...statuses)', {
        statuses: [ReplacementStatus.UPCOMING, ReplacementStatus.ACTIVE],
      })
      .andWhere('r.endDate < :today', { today })
      .getMany();

    for (const r of toComplete) {
      await this.completeReplacement(r.id);
    }
  }

  async getTemporaryStudentsForTeacher(teacherId: string) {
    return this.replacementsRepository.find({
      where: {
        replacementTeacherId: teacherId,
        status: In([ReplacementStatus.UPCOMING, ReplacementStatus.ACTIVE]),
      },
      relations: ['student', 'originalTeacher', 'replacementTeacher'],
      order: { startDate: 'ASC' },
    });
  }

  async getReassignedAwayForTeacher(teacherId: string) {
    return this.replacementsRepository.find({
      where: {
        originalTeacherId: teacherId,
        status: In([ReplacementStatus.UPCOMING, ReplacementStatus.ACTIVE]),
      },
      relations: ['student', 'originalTeacher', 'replacementTeacher'],
      order: { startDate: 'ASC' },
    });
  }

  async getEffectiveSchedulesForStudent(studentId: string) {
    const schedules = await this.schedulesRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.teacher', 'teacher')
      .leftJoinAndSelect('schedule.scheduleStudents', 'scheduleStudents')
      .leftJoinAndSelect('scheduleStudents.student', 'groupStudent')
      .where('schedule.status = :status', { status: 'active' })
      .andWhere(
        '(schedule.studentId = :studentId OR scheduleStudents.studentId = :studentId)',
        { studentId },
      )
      .orderBy('schedule.startTimeString', 'ASC')
      .getMany();

    const replacement = await this.getActiveReplacement(studentId);
    if (!replacement) return schedules;

    const overrides = await this.overridesRepository.find({
      where: { replacementId: replacement.id, status: 'active' },
      relations: ['replacementTeacher'],
    });
    const overrideMap = new Map(overrides.map((o) => [o.originalScheduleId, o]));

    return schedules.map((schedule) => {
      const override = overrideMap.get(schedule.id);
      if (override) {
        return {
          ...schedule,
          teacherId: override.replacementTeacherId,
          teacher: override.replacementTeacher,
          meetingLink: override.meetingLink || replacement.meetingLink || schedule.meetingLink,
          startTimeString: override.startTimeString || replacement.startTimeString || schedule.startTimeString,
          endTimeString: override.endTimeString || replacement.endTimeString || schedule.endTimeString,
          isTemporaryOverride: true,
          temporaryReplacementId: replacement.id,
        };
      }

      return {
        ...schedule,
        meetingLink: replacement.meetingLink || schedule.meetingLink,
        startTimeString: replacement.startTimeString || schedule.startTimeString,
        endTimeString: replacement.endTimeString || schedule.endTimeString,
      };
    });
  }

  async startReplacementClass(
    replacementId: string,
    user: { id: string; role: string },
    meetingLink: string,
  ) {
    const replacement = await this.replacementsRepository.findOne({
      where: { id: replacementId },
      relations: ['student', 'replacementTeacher', 'originalTeacher'],
    });
    if (!replacement) {
      throw new NotFoundException('Temporary assignment not found');
    }

    if (user.role === UserRole.TEACHER) {
      const teacher = await this.teachersRepository.findOne({ where: { userId: user.id } });
      if (!teacher || teacher.id !== replacement.replacementTeacherId) {
        throw new ForbiddenException('Only the assigned replacement teacher can start this class');
      }
    }

    const today = this.todayDateString();
    if (today < replacement.startDate || today > replacement.endDate) {
      throw new BadRequestException('This temporary assignment is not active today');
    }

    if (!replacement.startTimeString || !replacement.endTimeString) {
      throw new BadRequestException('Class start and end times are required on this assignment');
    }

    if (
      replacement.status === ReplacementStatus.UPCOMING &&
      today >= replacement.startDate &&
      today <= replacement.endDate
    ) {
      await this.activateReplacement(replacement.id, user.id, false);
      replacement.status = ReplacementStatus.ACTIVE;
    }

    if ([ReplacementStatus.CANCELLED, ReplacementStatus.COMPLETED].includes(replacement.status)) {
      throw new BadRequestException('Cannot start class for a cancelled or completed assignment');
    }

    const trimmedLink = meetingLink.trim();
    replacement.meetingLink = trimmedLink;
    await this.replacementsRepository.save(replacement);

    await this.overridesRepository.update(
      { replacementId: replacement.id, status: 'active' },
      {
        meetingLink: trimmedLink,
        startTimeString: replacement.startTimeString,
        endTimeString: replacement.endTimeString,
      },
    );

    const student = replacement.student ||
      (await this.studentsRepository.findOne({ where: { id: replacement.studentId } }));

    let session: ClassSession | null = null;
    if (replacement.classSessionId) {
      session = await this.classSessionRepository.findOne({
        where: { id: replacement.classSessionId },
        relations: ['teacher', 'studentAttendances', 'studentAttendances.student'],
      });
      if (session && String(session.sessionDate).slice(0, 10) !== today) {
        session = null;
      }
    }

    if (!session) {
      session = await this.classSessionRepository.findOne({
        where: {
          teacherId: replacement.replacementTeacherId,
          sessionDate: today as any,
          status: In([SessionStatus.SCHEDULED, SessionStatus.LIVE]),
        },
        relations: ['teacher', 'studentAttendances', 'studentAttendances.student'],
      });

      const hasStudent = session?.studentAttendances?.some((a) => a.studentId === replacement.studentId);
      if (session && !hasStudent) {
        session = null;
      }
    }

    if (!session) {
      session = await this.createReplacementClassSession({
        classTitle: `${student?.fullName || 'Student'} — Temporary Class`,
        subject: 'Quran & Islamic Studies',
        quranLevel: student?.level || 'Beginner',
        sessionDate: today,
        scheduledStartTime: replacement.startTimeString,
        scheduledEndTime: replacement.endTimeString,
        teacherId: replacement.replacementTeacherId,
        studentIds: [replacement.studentId],
        notes: `Temporary replacement assignment ${replacement.id}`,
      });
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Today\'s class session is already completed');
    }

    if (session.status !== SessionStatus.LIVE || session.meetingLink !== trimmedLink) {
      session = await this.startReplacementMeeting(session.id, trimmedLink);
    }

    replacement.classSessionId = session.id;
    await this.replacementsRepository.save(replacement);
    await this.logAudit(replacement.id, 'class_started', user.id, { meetingLink: trimmedLink, sessionId: session.id });

    return {
      message: 'Class created and meeting link sent to student',
      session,
      replacement,
    };
  }

  private async loadClassSession(sessionId: string): Promise<ClassSession> {
    return this.classSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['teacher', 'studentAttendances', 'studentAttendances.student'],
    });
  }

  private async createReplacementClassSession(params: {
    classTitle: string;
    subject: string;
    quranLevel: string;
    sessionDate: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    teacherId: string;
    studentIds: string[];
    notes?: string;
  }): Promise<ClassSession> {
    const session = this.classSessionRepository.create({
      classTitle: params.classTitle,
      subject: params.subject,
      quranLevel: params.quranLevel,
      sessionDate: params.sessionDate as any,
      scheduledStartTime: params.scheduledStartTime,
      scheduledEndTime: params.scheduledEndTime,
      teacherId: params.teacherId,
      notes: params.notes,
      status: SessionStatus.SCHEDULED,
    });

    const saved = await this.classSessionRepository.save(session);

    if (params.studentIds.length > 0) {
      const records = params.studentIds.map((studentId) =>
        this.studentAttendanceRepository.create({
          studentId,
          classSessionId: saved.id,
          attendanceStatus: StudentAttendanceStatus.ABSENT,
        }),
      );
      await this.studentAttendanceRepository.save(records);
      saved.totalStudentsAssigned = params.studentIds.length;
      await this.classSessionRepository.save(saved);
    }

    return this.loadClassSession(saved.id);
  }

  private async startReplacementMeeting(sessionId: string, meetingLink: string): Promise<ClassSession> {
    const session = await this.classSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['teacher'],
    });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Cannot start a completed session');
    }

    session.meetingLink = meetingLink;
    session.status = SessionStatus.LIVE;
    const now = new Date();
    session.actualStartTime = now;

    const todayStr = now.toISOString().split('T')[0];
    const scheduledStart = new Date(`${todayStr}T${session.scheduledStartTime}:00`);
    session.teacherAttendanceStatus =
      now > scheduledStart ? TeacherAttendanceStatus.LATE : TeacherAttendanceStatus.PRESENT;
    session.teacherJoinTime = now;

    const updated = await this.classSessionRepository.save(session);

    const attendances = await this.studentAttendanceRepository.find({
      where: { classSessionId: session.id },
    });
    const studentIds = attendances.map((a) => a.studentId);

    const sessionWithTeacher = await this.loadClassSession(updated.id);

    try {
      await this.notificationsService.notifyMeetingStarted(sessionWithTeacher, studentIds);
    } catch (err) {
      console.error('Failed to trigger meeting started notifications', err);
    }

    return sessionWithTeacher;
  }

  private async notifyReplacementEvent(
    replacement: TeacherReplacement,
    event: 'assigned' | 'updated' | 'cancelled' | 'ended',
  ) {
    const student = replacement.student ||
      (await this.studentsRepository.findOne({
        where: { id: replacement.studentId },
        relations: ['parent', 'parent.user'],
      }));
    const originalTeacher = replacement.originalTeacher ||
      (await this.teachersRepository.findOne({ where: { id: replacement.originalTeacherId } }));
    const replacementTeacher = replacement.replacementTeacher ||
      (await this.teachersRepository.findOne({ where: { id: replacement.replacementTeacherId } }));

    const titles: Record<string, string> = {
      assigned: 'Temporary Teacher Assignment',
      updated: 'Temporary Assignment Updated',
      cancelled: 'Temporary Assignment Cancelled',
      ended: 'Temporary Assignment Ended',
    };

    const studentName = student?.fullName || 'Student';
    const messages: Record<string, string> = {
      assigned: `${studentName} is temporarily assigned to ${replacementTeacher?.fullName} from ${replacement.startDate} to ${replacement.endDate}.`,
      updated: `Temporary assignment for ${studentName} has been updated.`,
      cancelled: `Temporary assignment for ${studentName} has been cancelled.`,
      ended: `Temporary assignment for ${studentName} has ended. The student returns to ${originalTeacher?.fullName}.`,
    };

    const recipientUserIds = new Set<string>();

    if (originalTeacher?.userId) recipientUserIds.add(originalTeacher.userId);
    if (replacementTeacher?.userId) recipientUserIds.add(replacementTeacher.userId);
    if (student?.userId) recipientUserIds.add(student.userId);
    if (student?.parent?.user?.id) recipientUserIds.add(student.parent.user.id);

    const admins = await this.usersRepository.find({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }],
    });
    admins.forEach((a) => recipientUserIds.add(a.id));

    await this.notificationsService.sendCustomNotifications(
      Array.from(recipientUserIds),
      titles[event],
      messages[event],
      {
        replacementId: replacement.id,
        studentId: replacement.studentId,
        event,
      },
    );
  }
}

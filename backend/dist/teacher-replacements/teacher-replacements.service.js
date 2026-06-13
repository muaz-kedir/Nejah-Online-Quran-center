"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherReplacementsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const teacher_replacement_entity_1 = require("./entities/teacher-replacement.entity");
const replacement_schedule_override_entity_1 = require("./entities/replacement-schedule-override.entity");
const teacher_replacement_audit_entity_1 = require("./entities/teacher-replacement-audit.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const user_entity_1 = require("../users/entities/user.entity");
const replacement_status_enum_1 = require("../common/enums/replacement-status.enum");
const replacement_reason_enum_1 = require("../common/enums/replacement-reason.enum");
const notifications_service_1 = require("../notifications/notifications.service");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const class_session_entity_1 = require("../attendance/entities/class-session.entity");
const student_attendance_entity_1 = require("../attendance/entities/student-attendance.entity");
let TeacherReplacementsService = class TeacherReplacementsService {
    constructor(replacementsRepository, overridesRepository, auditRepository, studentsRepository, teachersRepository, schedulesRepository, usersRepository, classSessionRepository, studentAttendanceRepository, notificationsService) {
        this.replacementsRepository = replacementsRepository;
        this.overridesRepository = overridesRepository;
        this.auditRepository = auditRepository;
        this.studentsRepository = studentsRepository;
        this.teachersRepository = teachersRepository;
        this.schedulesRepository = schedulesRepository;
        this.usersRepository = usersRepository;
        this.classSessionRepository = classSessionRepository;
        this.studentAttendanceRepository = studentAttendanceRepository;
        this.notificationsService = notificationsService;
    }
    todayDateString() {
        return new Date().toISOString().slice(0, 10);
    }
    deriveStatus(startDate, endDate, currentStatus) {
        if (currentStatus === replacement_status_enum_1.ReplacementStatus.CANCELLED ||
            currentStatus === replacement_status_enum_1.ReplacementStatus.COMPLETED) {
            return currentStatus;
        }
        const today = this.todayDateString();
        if (today < startDate)
            return replacement_status_enum_1.ReplacementStatus.UPCOMING;
        if (today > endDate)
            return replacement_status_enum_1.ReplacementStatus.COMPLETED;
        return replacement_status_enum_1.ReplacementStatus.ACTIVE;
    }
    async getActiveReplacement(studentId, date) {
        const refDate = date || this.todayDateString();
        const replacement = await this.replacementsRepository.findOne({
            where: {
                studentId,
                status: (0, typeorm_2.In)([replacement_status_enum_1.ReplacementStatus.UPCOMING, replacement_status_enum_1.ReplacementStatus.ACTIVE]),
            },
            relations: ['originalTeacher', 'replacementTeacher', 'student'],
            order: { startDate: 'DESC' },
        });
        if (!replacement)
            return null;
        if (refDate < replacement.startDate || refDate > replacement.endDate)
            return null;
        if (replacement.status === replacement_status_enum_1.ReplacementStatus.CANCELLED ||
            replacement.status === replacement_status_enum_1.ReplacementStatus.COMPLETED) {
            return null;
        }
        return replacement;
    }
    async getEffectiveTeacher(studentId) {
        const student = await this.studentsRepository.findOne({ where: { id: studentId } });
        if (!student?.teacherId) {
            throw new common_1.NotFoundException('Student or original teacher not found');
        }
        const replacement = await this.getActiveReplacement(studentId);
        return {
            originalTeacherId: student.teacherId,
            effectiveTeacherId: replacement ? replacement.replacementTeacherId : student.teacherId,
            isTemporary: !!replacement,
            replacement: replacement || undefined,
        };
    }
    async canTeacherTeachStudent(teacherId, studentId) {
        const student = await this.studentsRepository.findOne({ where: { id: studentId } });
        if (!student)
            return false;
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
    async canTeacherManageStudent(teacherId, studentId) {
        if (await this.canTeacherTeachStudent(teacherId, studentId)) {
            return true;
        }
        const student = await this.studentsRepository.findOne({ where: { id: studentId } });
        if (!student)
            return false;
        if (student.teacherId === teacherId) {
            return true;
        }
        const tempAssignment = await this.replacementsRepository.findOne({
            where: {
                studentId,
                replacementTeacherId: teacherId,
                status: (0, typeorm_2.In)([replacement_status_enum_1.ReplacementStatus.ACTIVE, replacement_status_enum_1.ReplacementStatus.UPCOMING]),
            },
        });
        if (tempAssignment && this.todayDateString() <= tempAssignment.endDate) {
            return true;
        }
        return this.schedulesRepository.exist({
            where: { studentId, teacherId, status: 'active' },
        });
    }
    async canTeacherViewStudent(teacherId, studentId) {
        const student = await this.studentsRepository.findOne({ where: { id: studentId } });
        if (!student?.teacherId)
            return false;
        if (student.teacherId === teacherId)
            return true;
        const replacement = await this.getActiveReplacement(studentId);
        if (replacement?.replacementTeacherId === teacherId)
            return true;
        const wasReplacement = await this.replacementsRepository.findOne({
            where: {
                studentId,
                replacementTeacherId: teacherId,
                status: (0, typeorm_2.In)([
                    replacement_status_enum_1.ReplacementStatus.COMPLETED,
                    replacement_status_enum_1.ReplacementStatus.CANCELLED,
                    replacement_status_enum_1.ReplacementStatus.ACTIVE,
                    replacement_status_enum_1.ReplacementStatus.UPCOMING,
                ]),
            },
        });
        return !!wasReplacement;
    }
    async assertTeacherCanTeachStudent(teacherId, studentId) {
        const student = await this.studentsRepository.findOne({ where: { id: studentId } });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        const allowed = await this.canTeacherTeachStudent(teacherId, studentId);
        if (!allowed) {
            throw new common_1.ForbiddenException('You do not have teaching access to this student');
        }
        return student;
    }
    async assertTeacherCanManageStudent(teacherId, studentId) {
        const student = await this.studentsRepository.findOne({ where: { id: studentId } });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        const allowed = await this.canTeacherManageStudent(teacherId, studentId);
        if (!allowed) {
            throw new common_1.ForbiddenException('You do not have teaching access to this student');
        }
        return student;
    }
    async assertTeacherCanViewStudent(teacherId, studentId) {
        const student = await this.studentsRepository.findOne({ where: { id: studentId } });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        const allowed = await this.canTeacherViewStudent(teacherId, studentId);
        if (!allowed) {
            throw new common_1.ForbiddenException('You do not have access to this student');
        }
        return student;
    }
    async logAudit(replacementId, action, performedBy, payload) {
        await this.auditRepository.save(this.auditRepository.create({
            replacementId,
            action,
            performedBy,
            payloadJson: payload,
        }));
    }
    async validateReplacementTeachers(originalTeacherId, replacementTeacherId) {
        if (originalTeacherId === replacementTeacherId) {
            throw new common_1.BadRequestException('Replacement teacher cannot be the same as the original teacher');
        }
        const replacementTeacher = await this.teachersRepository.findOne({
            where: { id: replacementTeacherId },
        });
        if (!replacementTeacher)
            throw new common_1.NotFoundException('Replacement teacher not found');
        const status = replacementTeacher.status?.toLowerCase() ?? '';
        if (status !== 'active') {
            throw new common_1.BadRequestException('Replacement teacher must be active');
        }
    }
    async assertNoOverlap(studentId, startDate, endDate, excludeId) {
        const qb = this.replacementsRepository
            .createQueryBuilder('r')
            .where('r.studentId = :studentId', { studentId })
            .andWhere('r.status IN (:...statuses)', {
            statuses: [replacement_status_enum_1.ReplacementStatus.UPCOMING, replacement_status_enum_1.ReplacementStatus.ACTIVE],
        })
            .andWhere('r.startDate <= :endDate AND r.endDate >= :startDate', { startDate, endDate });
        if (excludeId) {
            qb.andWhere('r.id != :excludeId', { excludeId });
        }
        const overlap = await qb.getOne();
        if (overlap) {
            throw new common_1.ConflictException('Student already has a temporary assignment during this period');
        }
    }
    async resolveStudentIds(dto) {
        if (dto.selectAllStudents) {
            const students = await this.studentsRepository.find({
                where: { teacherId: dto.originalTeacherId },
            });
            if (students.length === 0) {
                throw new common_1.BadRequestException('No students found for the original teacher');
            }
            return students.map((s) => s.id);
        }
        if (!dto.studentIds?.length) {
            throw new common_1.BadRequestException('Select at least one student or choose all students');
        }
        return dto.studentIds;
    }
    async create(dto, userId) {
        if (dto.startDate >= dto.endDate) {
            throw new common_1.BadRequestException('Start date must be before end date');
        }
        if (dto.startTime >= dto.endTime) {
            throw new common_1.BadRequestException('Start time must be before end time');
        }
        if (dto.reason === replacement_reason_enum_1.ReplacementReason.OTHER && !dto.customReason?.trim()) {
            throw new common_1.BadRequestException('Custom reason is required when reason is Other');
        }
        await this.validateReplacementTeachers(dto.originalTeacherId, dto.replacementTeacherId);
        const studentIds = await this.resolveStudentIds(dto);
        const created = [];
        for (const studentId of studentIds) {
            const student = await this.studentsRepository.findOne({ where: { id: studentId } });
            if (!student)
                throw new common_1.NotFoundException(`Student ${studentId} not found`);
            if (student.teacherId !== dto.originalTeacherId) {
                throw new common_1.BadRequestException(`Student ${student.fullName} is not assigned to the original teacher`);
            }
            await this.assertNoOverlap(studentId, dto.startDate, dto.endDate);
            const status = this.deriveStatus(dto.startDate, dto.endDate, replacement_status_enum_1.ReplacementStatus.UPCOMING);
            const replacement = await this.replacementsRepository.save(this.replacementsRepository.create({
                studentId,
                originalTeacherId: dto.originalTeacherId,
                replacementTeacherId: dto.replacementTeacherId,
                startDate: dto.startDate,
                endDate: dto.endDate,
                startTimeString: dto.startTime,
                endTimeString: dto.endTime,
                reason: dto.reason,
                customReason: dto.reason === replacement_reason_enum_1.ReplacementReason.OTHER ? dto.customReason : null,
                notes: dto.notes,
                status,
                createdBy: userId,
            }));
            await this.logAudit(replacement.id, 'created', userId, { dto });
            if (status === replacement_status_enum_1.ReplacementStatus.ACTIVE) {
                await this.activateReplacement(replacement.id, userId, false);
            }
            try {
                await this.notifyReplacementEvent(replacement, 'assigned');
            }
            catch (err) {
                console.error('Failed to send replacement notification:', err);
            }
            created.push(replacement);
        }
        return {
            message: `Created ${created.length} temporary assignment(s)`,
            data: created,
        };
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const qb = this.replacementsRepository
            .createQueryBuilder('r')
            .leftJoinAndSelect('r.student', 'student')
            .leftJoinAndSelect('r.originalTeacher', 'originalTeacher')
            .leftJoinAndSelect('r.replacementTeacher', 'replacementTeacher')
            .orderBy('r.createdAt', 'DESC');
        if (query.status)
            qb.andWhere('r.status = :status', { status: query.status });
        if (query.studentId)
            qb.andWhere('r.studentId = :studentId', { studentId: query.studentId });
        if (query.originalTeacherId) {
            qb.andWhere('r.originalTeacherId = :originalTeacherId', {
                originalTeacherId: query.originalTeacherId,
            });
        }
        if (query.replacementTeacherId) {
            qb.andWhere('r.replacementTeacherId = :replacementTeacherId', {
                replacementTeacherId: query.replacementTeacherId,
            });
        }
        if (query.search) {
            qb.andWhere('(LOWER(student.fullName) LIKE LOWER(:search) OR LOWER(originalTeacher.fullName) LIKE LOWER(:search) OR LOWER(replacementTeacher.fullName) LIKE LOWER(:search))', { search: `%${query.search}%` });
        }
        qb.skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const replacement = await this.replacementsRepository.findOne({
            where: { id },
            relations: ['student', 'originalTeacher', 'replacementTeacher', 'creator'],
        });
        if (!replacement)
            throw new common_1.NotFoundException('Temporary assignment not found');
        const audits = await this.auditRepository.find({
            where: { replacementId: id },
            order: { performedAt: 'DESC' },
        });
        return { ...replacement, audits };
    }
    async update(id, dto, userId) {
        const replacement = await this.replacementsRepository.findOne({ where: { id } });
        if (!replacement)
            throw new common_1.NotFoundException('Temporary assignment not found');
        if ([replacement_status_enum_1.ReplacementStatus.COMPLETED, replacement_status_enum_1.ReplacementStatus.CANCELLED].includes(replacement.status)) {
            throw new common_1.BadRequestException('Cannot update a completed or cancelled assignment');
        }
        const startDate = dto.startDate || replacement.startDate;
        const endDate = dto.endDate || replacement.endDate;
        if (startDate >= endDate) {
            throw new common_1.BadRequestException('Start date must be before end date');
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
        if (saved.status === replacement_status_enum_1.ReplacementStatus.ACTIVE) {
            await this.activateReplacement(id, userId, false);
        }
        await this.notifyReplacementEvent(saved, 'updated');
        return saved;
    }
    async cancel(id, userId) {
        const replacement = await this.replacementsRepository.findOne({ where: { id } });
        if (!replacement)
            throw new common_1.NotFoundException('Temporary assignment not found');
        if (replacement.status === replacement_status_enum_1.ReplacementStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot cancel a completed assignment');
        }
        if (replacement.status === replacement_status_enum_1.ReplacementStatus.CANCELLED) {
            return replacement;
        }
        replacement.status = replacement_status_enum_1.ReplacementStatus.CANCELLED;
        replacement.cancelledBy = userId;
        replacement.cancelledAt = new Date();
        replacement.updatedBy = userId;
        await this.deactivateOverrides(id);
        const saved = await this.replacementsRepository.save(replacement);
        await this.logAudit(id, 'cancelled', userId);
        await this.notifyReplacementEvent(saved, 'cancelled');
        return saved;
    }
    async ensureReplacementSchedules(replacement) {
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
                await this.schedulesRepository.save(this.schedulesRepository.create({
                    studentId: replacement.studentId,
                    teacherId: replacement.originalTeacherId,
                    className: 'Quran Class (Temporary Cover)',
                    dayOfWeek,
                    startTimeString: replacement.startTimeString,
                    endTimeString: replacement.endTimeString,
                    classType: '1:1 Session',
                    status: 'active',
                }));
            }
        }
    }
    async createScheduleOverrides(replacement) {
        await this.ensureReplacementSchedules(replacement);
        const schedules = await this.schedulesRepository.find({
            where: {
                studentId: replacement.studentId,
                teacherId: replacement.originalTeacherId,
                status: 'active',
            },
        });
        for (const schedule of schedules) {
            const existing = await this.overridesRepository.findOne({
                where: { replacementId: replacement.id, originalScheduleId: schedule.id },
            });
            if (existing) {
                existing.status = 'active';
                existing.replacementTeacherId = replacement.replacementTeacherId;
                existing.meetingLink =
                    replacement.meetingLink || schedule.meetingLink || existing.meetingLink;
                existing.startTimeString = replacement.startTimeString || schedule.startTimeString;
                existing.endTimeString = replacement.endTimeString || schedule.endTimeString;
                await this.overridesRepository.save(existing);
                continue;
            }
            await this.overridesRepository.save(this.overridesRepository.create({
                replacementId: replacement.id,
                originalScheduleId: schedule.id,
                replacementTeacherId: replacement.replacementTeacherId,
                meetingLink: replacement.meetingLink || schedule.meetingLink || null,
                startTimeString: replacement.startTimeString || schedule.startTimeString,
                endTimeString: replacement.endTimeString || schedule.endTimeString,
                status: 'active',
            }));
        }
    }
    async deactivateOverrides(replacementId) {
        await this.overridesRepository.update({ replacementId }, { status: 'inactive' });
    }
    async activateReplacement(id, userId, sendNotification = true) {
        const replacement = await this.replacementsRepository.findOne({
            where: { id },
            relations: ['student', 'originalTeacher', 'replacementTeacher'],
        });
        if (!replacement)
            return;
        replacement.status = replacement_status_enum_1.ReplacementStatus.ACTIVE;
        await this.replacementsRepository.save(replacement);
        await this.createScheduleOverrides(replacement);
        await this.logAudit(id, 'activated', userId || replacement.createdBy);
        if (sendNotification) {
            await this.notifyReplacementEvent(replacement, 'assigned');
        }
    }
    async completeReplacement(id, userId) {
        const replacement = await this.replacementsRepository.findOne({
            where: { id },
            relations: ['student', 'originalTeacher', 'replacementTeacher'],
        });
        if (!replacement || replacement.status === replacement_status_enum_1.ReplacementStatus.COMPLETED)
            return;
        replacement.status = replacement_status_enum_1.ReplacementStatus.COMPLETED;
        replacement.completedAt = new Date();
        if (userId)
            replacement.updatedBy = userId;
        await this.deactivateOverrides(id);
        await this.replacementsRepository.save(replacement);
        await this.logAudit(id, 'completed', userId || 'system');
        await this.notifyReplacementEvent(replacement, 'ended');
    }
    async processLifecycle() {
        const today = this.todayDateString();
        const toActivate = await this.replacementsRepository
            .createQueryBuilder('r')
            .where('r.status = :status', { status: replacement_status_enum_1.ReplacementStatus.UPCOMING })
            .andWhere('r.startDate <= :today', { today })
            .andWhere('r.endDate >= :today', { today })
            .getMany();
        for (const r of toActivate) {
            await this.activateReplacement(r.id, r.createdBy);
        }
        const toComplete = await this.replacementsRepository
            .createQueryBuilder('r')
            .where('r.status IN (:...statuses)', {
            statuses: [replacement_status_enum_1.ReplacementStatus.UPCOMING, replacement_status_enum_1.ReplacementStatus.ACTIVE],
        })
            .andWhere('r.endDate < :today', { today })
            .getMany();
        for (const r of toComplete) {
            await this.completeReplacement(r.id);
        }
    }
    async getTemporaryStudentsForTeacher(teacherId) {
        return this.replacementsRepository.find({
            where: {
                replacementTeacherId: teacherId,
                status: (0, typeorm_2.In)([replacement_status_enum_1.ReplacementStatus.UPCOMING, replacement_status_enum_1.ReplacementStatus.ACTIVE]),
            },
            relations: ['student', 'originalTeacher', 'replacementTeacher'],
            order: { startDate: 'ASC' },
        });
    }
    async getReassignedAwayForTeacher(teacherId) {
        return this.replacementsRepository.find({
            where: {
                originalTeacherId: teacherId,
                status: (0, typeorm_2.In)([replacement_status_enum_1.ReplacementStatus.UPCOMING, replacement_status_enum_1.ReplacementStatus.ACTIVE]),
            },
            relations: ['student', 'originalTeacher', 'replacementTeacher'],
            order: { startDate: 'ASC' },
        });
    }
    async getEffectiveSchedulesForStudent(studentId) {
        const schedules = await this.schedulesRepository
            .createQueryBuilder('schedule')
            .leftJoinAndSelect('schedule.teacher', 'teacher')
            .leftJoinAndSelect('schedule.scheduleStudents', 'scheduleStudents')
            .leftJoinAndSelect('scheduleStudents.student', 'groupStudent')
            .where('schedule.status = :status', { status: 'active' })
            .andWhere('(schedule.studentId = :studentId OR scheduleStudents.studentId = :studentId)', {
            studentId,
        })
            .orderBy('schedule.startTimeString', 'ASC')
            .getMany();
        const replacement = await this.getActiveReplacement(studentId);
        if (!replacement)
            return schedules;
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
    async startReplacementClass(replacementId, user, meetingLink) {
        const replacement = await this.replacementsRepository.findOne({
            where: { id: replacementId },
            relations: ['student', 'replacementTeacher', 'originalTeacher'],
        });
        if (!replacement) {
            throw new common_1.NotFoundException('Temporary assignment not found');
        }
        if (user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersRepository.findOne({ where: { userId: user.id } });
            if (!teacher || teacher.id !== replacement.replacementTeacherId) {
                throw new common_1.ForbiddenException('Only the assigned replacement teacher can start this class');
            }
        }
        const today = this.todayDateString();
        if (today < replacement.startDate || today > replacement.endDate) {
            throw new common_1.BadRequestException('This temporary assignment is not active today');
        }
        if (!replacement.startTimeString || !replacement.endTimeString) {
            throw new common_1.BadRequestException('Class start and end times are required on this assignment');
        }
        if (replacement.status === replacement_status_enum_1.ReplacementStatus.UPCOMING &&
            today >= replacement.startDate &&
            today <= replacement.endDate) {
            await this.activateReplacement(replacement.id, user.id, false);
            replacement.status = replacement_status_enum_1.ReplacementStatus.ACTIVE;
        }
        if ([replacement_status_enum_1.ReplacementStatus.CANCELLED, replacement_status_enum_1.ReplacementStatus.COMPLETED].includes(replacement.status)) {
            throw new common_1.BadRequestException('Cannot start class for a cancelled or completed assignment');
        }
        const trimmedLink = meetingLink.trim();
        replacement.meetingLink = trimmedLink;
        await this.replacementsRepository.save(replacement);
        await this.overridesRepository.update({ replacementId: replacement.id, status: 'active' }, {
            meetingLink: trimmedLink,
            startTimeString: replacement.startTimeString,
            endTimeString: replacement.endTimeString,
        });
        const student = replacement.student ||
            (await this.studentsRepository.findOne({ where: { id: replacement.studentId } }));
        let session = null;
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
                    sessionDate: today,
                    status: (0, typeorm_2.In)([class_session_entity_1.SessionStatus.SCHEDULED, class_session_entity_1.SessionStatus.LIVE]),
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
        if (session.status === class_session_entity_1.SessionStatus.COMPLETED) {
            throw new common_1.BadRequestException("Today's class session is already completed");
        }
        if (session.status !== class_session_entity_1.SessionStatus.LIVE || session.meetingLink !== trimmedLink) {
            session = await this.startReplacementMeeting(session.id, trimmedLink);
        }
        replacement.classSessionId = session.id;
        await this.replacementsRepository.save(replacement);
        await this.logAudit(replacement.id, 'class_started', user.id, {
            meetingLink: trimmedLink,
            sessionId: session.id,
        });
        return {
            message: 'Class created and meeting link sent to student',
            session,
            replacement,
        };
    }
    async loadClassSession(sessionId) {
        return this.classSessionRepository.findOne({
            where: { id: sessionId },
            relations: ['teacher', 'studentAttendances', 'studentAttendances.student'],
        });
    }
    async createReplacementClassSession(params) {
        const session = this.classSessionRepository.create({
            classTitle: params.classTitle,
            subject: params.subject,
            quranLevel: params.quranLevel,
            sessionDate: params.sessionDate,
            scheduledStartTime: params.scheduledStartTime,
            scheduledEndTime: params.scheduledEndTime,
            teacherId: params.teacherId,
            notes: params.notes,
            status: class_session_entity_1.SessionStatus.SCHEDULED,
        });
        const saved = await this.classSessionRepository.save(session);
        if (params.studentIds.length > 0) {
            const records = params.studentIds.map((studentId) => this.studentAttendanceRepository.create({
                studentId,
                classSessionId: saved.id,
                attendanceStatus: student_attendance_entity_1.StudentAttendanceStatus.ABSENT,
            }));
            await this.studentAttendanceRepository.save(records);
            saved.totalStudentsAssigned = params.studentIds.length;
            await this.classSessionRepository.save(saved);
        }
        return this.loadClassSession(saved.id);
    }
    async startReplacementMeeting(sessionId, meetingLink) {
        const session = await this.classSessionRepository.findOne({
            where: { id: sessionId },
            relations: ['teacher'],
        });
        if (!session) {
            throw new common_1.NotFoundException('Class session not found');
        }
        if (session.status === class_session_entity_1.SessionStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot start a completed session');
        }
        session.meetingLink = meetingLink;
        session.status = class_session_entity_1.SessionStatus.LIVE;
        const now = new Date();
        session.actualStartTime = now;
        const todayStr = now.toISOString().split('T')[0];
        const scheduledStart = new Date(`${todayStr}T${session.scheduledStartTime}:00`);
        session.teacherAttendanceStatus =
            now > scheduledStart ? class_session_entity_1.TeacherAttendanceStatus.LATE : class_session_entity_1.TeacherAttendanceStatus.PRESENT;
        session.teacherJoinTime = now;
        const updated = await this.classSessionRepository.save(session);
        const attendances = await this.studentAttendanceRepository.find({
            where: { classSessionId: session.id },
        });
        const studentIds = attendances.map((a) => a.studentId);
        const sessionWithTeacher = await this.loadClassSession(updated.id);
        try {
            await this.notificationsService.notifyMeetingStarted(sessionWithTeacher, studentIds);
        }
        catch (err) {
            console.error('Failed to trigger meeting started notifications', err);
        }
        return sessionWithTeacher;
    }
    async notifyReplacementEvent(replacement, event) {
        const student = replacement.student ||
            (await this.studentsRepository.findOne({
                where: { id: replacement.studentId },
                relations: ['parent', 'parent.user'],
            }));
        const originalTeacher = replacement.originalTeacher ||
            (await this.teachersRepository.findOne({ where: { id: replacement.originalTeacherId } }));
        const replacementTeacher = replacement.replacementTeacher ||
            (await this.teachersRepository.findOne({ where: { id: replacement.replacementTeacherId } }));
        const titles = {
            assigned: 'Temporary Teacher Assignment',
            updated: 'Temporary Assignment Updated',
            cancelled: 'Temporary Assignment Cancelled',
            ended: 'Temporary Assignment Ended',
        };
        const studentName = student?.fullName || 'Student';
        const messages = {
            assigned: `${studentName} is temporarily assigned to ${replacementTeacher?.fullName} from ${replacement.startDate} to ${replacement.endDate}.`,
            updated: `Temporary assignment for ${studentName} has been updated.`,
            cancelled: `Temporary assignment for ${studentName} has been cancelled.`,
            ended: `Temporary assignment for ${studentName} has ended. The student returns to ${originalTeacher?.fullName}.`,
        };
        const recipientUserIds = new Set();
        if (originalTeacher?.userId)
            recipientUserIds.add(originalTeacher.userId);
        if (replacementTeacher?.userId)
            recipientUserIds.add(replacementTeacher.userId);
        if (student?.userId)
            recipientUserIds.add(student.userId);
        if (student?.parent?.user?.id)
            recipientUserIds.add(student.parent.user.id);
        const admins = await this.usersRepository.find({
            where: [{ role: user_role_enum_1.UserRole.ADMIN }, { role: user_role_enum_1.UserRole.SUPER_ADMIN }],
        });
        admins.forEach((a) => recipientUserIds.add(a.id));
        await this.notificationsService.sendCustomNotifications(Array.from(recipientUserIds), titles[event], messages[event], {
            replacementId: replacement.id,
            studentId: replacement.studentId,
            event,
        });
    }
};
exports.TeacherReplacementsService = TeacherReplacementsService;
exports.TeacherReplacementsService = TeacherReplacementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(teacher_replacement_entity_1.TeacherReplacement)),
    __param(1, (0, typeorm_1.InjectRepository)(replacement_schedule_override_entity_1.ReplacementScheduleOverride)),
    __param(2, (0, typeorm_1.InjectRepository)(teacher_replacement_audit_entity_1.TeacherReplacementAudit)),
    __param(3, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(4, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(5, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(7, (0, typeorm_1.InjectRepository)(class_session_entity_1.ClassSession)),
    __param(8, (0, typeorm_1.InjectRepository)(student_attendance_entity_1.StudentAttendance)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], TeacherReplacementsService);
//# sourceMappingURL=teacher-replacements.service.js.map
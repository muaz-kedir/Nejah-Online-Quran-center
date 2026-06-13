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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const class_session_entity_1 = require("./entities/class-session.entity");
const student_attendance_entity_1 = require("./entities/student-attendance.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let AttendanceService = class AttendanceService {
    constructor(classSessionRepository, studentAttendanceRepository, studentRepository, teacherRepository, scheduleRepository, notificationsService) {
        this.classSessionRepository = classSessionRepository;
        this.studentAttendanceRepository = studentAttendanceRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.scheduleRepository = scheduleRepository;
        this.notificationsService = notificationsService;
    }
    async createClassSession(dto) {
        const teacher = await this.teacherRepository.findOne({
            where: { id: dto.teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
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
        if (dto.assignedStudentIds && dto.assignedStudentIds.length > 0) {
            const students = await this.studentRepository.findByIds(dto.assignedStudentIds);
            const attendanceRecords = students.map((student) => this.studentAttendanceRepository.create({
                studentId: student.id,
                classSessionId: savedSession.id,
                attendanceStatus: student_attendance_entity_1.StudentAttendanceStatus.ABSENT,
            }));
            await this.studentAttendanceRepository.save(attendanceRecords);
            savedSession.totalStudentsAssigned = students.length;
            await this.classSessionRepository.save(savedSession);
        }
        return this.getClassSessionWithAttendance(savedSession.id);
    }
    async getLiveClassSessionByScheduleToday(scheduleId, requestingTeacherId) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        let session = await this.classSessionRepository.findOne({
            where: {
                scheduleId,
                sessionDate: todayStr,
            },
            relations: ['teacher', 'studentAttendances', 'studentAttendances.student'],
        });
        if (!session) {
            const schedule = await this.scheduleRepository.findOne({
                where: { id: scheduleId },
                relations: [
                    'student',
                    'teacher',
                    'teacher.user',
                    'scheduleStudents',
                    'scheduleStudents.student',
                ],
            });
            if (!schedule) {
                throw new common_1.NotFoundException('Schedule not found');
            }
            if (requestingTeacherId && schedule.teacherId !== requestingTeacherId) {
                throw new common_1.ForbiddenException('You do not have access to this schedule');
            }
            const assignedStudentIds = schedule.isGroupSession
                ? (schedule.scheduleStudents || []).map((ss) => ss.studentId)
                : schedule.studentId
                    ? [schedule.studentId]
                    : [];
            const quranLevel = schedule.isGroupSession
                ? schedule.scheduleStudents?.[0]?.student?.level || 'Beginner'
                : schedule.student?.level || 'Beginner';
            session = this.classSessionRepository.create({
                classTitle: schedule.className || 'Quran Class',
                subject: 'Quran & Islamic Studies',
                quranLevel,
                sessionDate: todayStr,
                scheduledStartTime: schedule.startTimeString || '12:00',
                scheduledEndTime: schedule.endTimeString || '13:00',
                teacherId: schedule.teacherId,
                scheduleId: schedule.id,
                status: class_session_entity_1.SessionStatus.SCHEDULED,
                totalStudentsAssigned: assignedStudentIds.length,
            });
            const savedSession = await this.classSessionRepository.save(session);
            for (const sid of assignedStudentIds) {
                const attendance = this.studentAttendanceRepository.create({
                    studentId: sid,
                    classSessionId: savedSession.id,
                    attendanceStatus: student_attendance_entity_1.StudentAttendanceStatus.ABSENT,
                });
                await this.studentAttendanceRepository.save(attendance);
            }
            session = await this.getClassSessionWithAttendance(savedSession.id);
        }
        if (requestingTeacherId && session.teacherId !== requestingTeacherId) {
            throw new common_1.ForbiddenException('You do not have access to this class session');
        }
        return session;
    }
    async startMeeting(dto) {
        const session = await this.classSessionRepository.findOne({
            where: { id: dto.classSessionId },
            relations: ['teacher'],
        });
        if (!session) {
            throw new common_1.NotFoundException('Class session not found');
        }
        if (session.status === class_session_entity_1.SessionStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot start a completed session');
        }
        session.meetingLink = dto.meetingLink;
        session.status = class_session_entity_1.SessionStatus.LIVE;
        const now = new Date();
        session.actualStartTime = now;
        const todayStr = now.toISOString().split('T')[0];
        const scheduledStart = new Date(`${todayStr}T${session.scheduledStartTime}:00`);
        if (now > scheduledStart) {
            session.teacherAttendanceStatus = class_session_entity_1.TeacherAttendanceStatus.LATE;
        }
        else {
            session.teacherAttendanceStatus = class_session_entity_1.TeacherAttendanceStatus.PRESENT;
        }
        session.teacherJoinTime = now;
        const updatedSession = await this.classSessionRepository.save(session);
        const attendances = await this.studentAttendanceRepository.find({
            where: { classSessionId: session.id },
        });
        const studentIds = attendances.map((a) => a.studentId);
        const sessionWithTeacher = await this.getClassSessionWithAttendance(updatedSession.id);
        try {
            await this.notificationsService.notifyMeetingStarted(sessionWithTeacher, studentIds);
        }
        catch (err) {
            console.error('Failed to trigger meeting started notifications', err);
        }
        return sessionWithTeacher;
    }
    async recordStudentAttendance(dto) {
        const session = await this.classSessionRepository.findOne({
            where: { id: dto.classSessionId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Class session not found');
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
                attendanceStatus: student_attendance_entity_1.StudentAttendanceStatus.ABSENT,
            });
        }
        const now = new Date();
        if (dto.action === 'join') {
            const todayStr = now.toISOString().split('T')[0];
            const scheduledStart = new Date(`${todayStr}T${session.scheduledStartTime}:00`);
            if (now > scheduledStart) {
                attendance.attendanceStatus = student_attendance_entity_1.StudentAttendanceStatus.LATE;
            }
            else {
                attendance.attendanceStatus = student_attendance_entity_1.StudentAttendanceStatus.PRESENT;
            }
            attendance.joinTime = now;
            attendance.notificationSent = true;
        }
        else if (dto.action === 'leave') {
            attendance.leaveTime = now;
            if (attendance.joinTime) {
                const durationMs = attendance.leaveTime.getTime() - attendance.joinTime.getTime();
                attendance.durationMinutes = Math.floor(durationMs / 60000);
                const todayStr = now.toISOString().split('T')[0];
                const scheduledEnd = new Date(`${todayStr}T${session.scheduledEndTime}:00`);
                if (attendance.leaveTime < scheduledEnd) {
                    attendance.attendanceStatus = student_attendance_entity_1.StudentAttendanceStatus.LEFT_EARLY;
                }
            }
        }
        const savedAttendance = await this.studentAttendanceRepository.save(attendance);
        await this.updateSessionStatistics(dto.classSessionId);
        try {
            await this.notificationsService.notifyAttendanceRecorded(dto.studentId, dto.classSessionId, savedAttendance.attendanceStatus);
        }
        catch (err) {
            console.error('Failed to notify parent about attendance', err);
        }
        return savedAttendance;
    }
    async endSession(dto) {
        const session = await this.classSessionRepository.findOne({
            where: { id: dto.classSessionId },
            relations: ['teacher', 'studentAttendances'],
        });
        if (!session) {
            throw new common_1.NotFoundException('Class session not found');
        }
        session.status = class_session_entity_1.SessionStatus.COMPLETED;
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
                attendance.attendanceStatus = student_attendance_entity_1.StudentAttendanceStatus.ABSENT;
                await this.studentAttendanceRepository.save(attendance);
            }
            else if (!attendance.leaveTime) {
                attendance.leaveTime = now;
                const durationMs = now.getTime() - attendance.joinTime.getTime();
                attendance.durationMinutes = Math.floor(durationMs / 60000);
                const todayStr = now.toISOString().split('T')[0];
                const scheduledEnd = new Date(`${todayStr}T${session.scheduledEndTime}:00`);
                if (now < scheduledEnd) {
                    attendance.attendanceStatus = student_attendance_entity_1.StudentAttendanceStatus.LEFT_EARLY;
                }
                await this.studentAttendanceRepository.save(attendance);
            }
        }
        const updatedSession = await this.classSessionRepository.save(session);
        await this.updateSessionStatistics(dto.classSessionId);
        try {
            const sessionWithTeacher = await this.getClassSessionWithAttendance(updatedSession.id);
            await this.notificationsService.notifyMeetingEnded(sessionWithTeacher);
        }
        catch (err) {
            console.error('Failed to notify meeting ended', err);
        }
        return this.getClassSessionWithAttendance(updatedSession.id);
    }
    async updateSessionStatistics(classSessionId) {
        const session = await this.classSessionRepository.findOne({
            where: { id: classSessionId },
        });
        if (!session)
            return;
        const attendances = await this.studentAttendanceRepository.find({
            where: { classSessionId },
        });
        session.totalStudentsPresent = attendances.filter((a) => a.attendanceStatus === student_attendance_entity_1.StudentAttendanceStatus.PRESENT).length;
        session.totalStudentsLate = attendances.filter((a) => a.attendanceStatus === student_attendance_entity_1.StudentAttendanceStatus.LATE).length;
        session.totalStudentsAbsent = attendances.filter((a) => a.attendanceStatus === student_attendance_entity_1.StudentAttendanceStatus.ABSENT).length;
        session.totalStudentsLeftEarly = attendances.filter((a) => a.attendanceStatus === student_attendance_entity_1.StudentAttendanceStatus.LEFT_EARLY).length;
        await this.classSessionRepository.save(session);
    }
    async getClassSessionWithAttendance(classSessionId) {
        return this.classSessionRepository.findOne({
            where: { id: classSessionId },
            relations: ['teacher', 'studentAttendances', 'studentAttendances.student'],
        });
    }
    async getTeacherSessions(teacherId, date) {
        const query = this.classSessionRepository
            .createQueryBuilder('session')
            .where('session.teacherId = :teacherId', { teacherId })
            .leftJoinAndSelect('session.studentAttendances', 'attendance')
            .leftJoinAndSelect('attendance.student', 'student')
            .leftJoinAndSelect('session.teacher', 'teacher');
        if (date) {
            query.andWhere('session.sessionDate = :date', { date });
        }
        return query
            .orderBy('session.sessionDate', 'DESC')
            .addOrderBy('session.scheduledStartTime', 'DESC')
            .getMany();
    }
    async getStudentAttendanceHistory(studentId) {
        return this.studentAttendanceRepository.find({
            where: { studentId },
            relations: ['classSession', 'classSession.teacher'],
            order: { createdAt: 'DESC' },
        });
    }
    async getAttendanceStats(studentId) {
        const attendances = await this.studentAttendanceRepository.find({
            where: { studentId },
        });
        const total = attendances.length;
        const present = attendances.filter((a) => a.attendanceStatus === student_attendance_entity_1.StudentAttendanceStatus.PRESENT).length;
        const late = attendances.filter((a) => a.attendanceStatus === student_attendance_entity_1.StudentAttendanceStatus.LATE).length;
        const absent = attendances.filter((a) => a.attendanceStatus === student_attendance_entity_1.StudentAttendanceStatus.ABSENT).length;
        return {
            total,
            present,
            late,
            absent,
            attendancePercentage: total > 0 ? ((present + late) / total) * 100 : 0,
        };
    }
    async getLiveClasses() {
        return this.classSessionRepository.find({
            where: { status: class_session_entity_1.SessionStatus.LIVE },
            relations: ['teacher', 'studentAttendances'],
            order: { actualStartTime: 'DESC' },
        });
    }
    async getTodaysSessions(teacherId) {
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
    async getStudentLiveClass(studentId) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const liveSessions = await this.classSessionRepository.find({
            where: {
                status: class_session_entity_1.SessionStatus.LIVE,
                sessionDate: todayStr,
            },
            relations: ['teacher', 'studentAttendances', 'studentAttendances.student'],
        });
        for (const session of liveSessions) {
            const isAssigned = session.studentAttendances.some((a) => a.studentId === studentId);
            if (isAssigned) {
                return session;
            }
        }
        return null;
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(class_session_entity_1.ClassSession)),
    __param(1, (0, typeorm_1.InjectRepository)(student_attendance_entity_1.StudentAttendance)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(4, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map
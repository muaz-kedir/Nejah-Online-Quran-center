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
var SchedulesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_entity_1 = require("./entities/schedule.entity");
const schedule_student_entity_1 = require("./entities/schedule-student.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const day_of_week_util_1 = require("../common/utils/day-of-week.util");
const live_session_service_1 = require("../zoom/live-session.service");
let SchedulesService = SchedulesService_1 = class SchedulesService {
    constructor(schedulesRepository, scheduleStudentsRepository, studentsRepository, teachersRepository, liveSessionService) {
        this.schedulesRepository = schedulesRepository;
        this.scheduleStudentsRepository = scheduleStudentsRepository;
        this.studentsRepository = studentsRepository;
        this.teachersRepository = teachersRepository;
        this.liveSessionService = liveSessionService;
        this.logger = new common_1.Logger(SchedulesService_1.name);
    }
    isOverlap(existingStart, existingEnd, newStart, newEnd) {
        return existingStart < newEnd && newStart < existingEnd;
    }
    async validateNoOverlap(teacherId, dayOfWeek, startTimeString, endTimeString, excludeId) {
        const existingSchedules = await this.schedulesRepository.find({
            where: { teacherId, dayOfWeek, status: 'active' },
        });
        for (const existing of existingSchedules) {
            if (excludeId && existing.id === excludeId)
                continue;
            if (this.isOverlap(existing.startTimeString, existing.endTimeString, startTimeString, endTimeString)) {
                throw new common_1.BadRequestException(`Teacher already has a class on ${dayOfWeek} from ${existing.startTimeString} to ${existing.endTimeString}`);
            }
        }
    }
    async validateGroupStudents(teacherId, studentIds) {
        const students = await this.studentsRepository.find({
            where: { id: (0, typeorm_2.In)(studentIds) },
        });
        if (students.length !== studentIds.length) {
            throw new common_1.BadRequestException('One or more students were not found');
        }
        const notAssigned = students.filter((s) => s.teacherId !== teacherId);
        if (notAssigned.length > 0) {
            throw new common_1.BadRequestException(`Students must be assigned to this teacher: ${notAssigned.map((s) => s.fullName).join(', ')}`);
        }
    }
    async createSchedule(data) {
        const { startTimeString, endTimeString, dayOfWeek, teacherId } = data;
        const isGroupSession = !!data.isGroupSession;
        if (!startTimeString || !endTimeString) {
            throw new common_1.BadRequestException('Schedule must include both start and end times');
        }
        if (startTimeString >= endTimeString) {
            throw new common_1.BadRequestException('Schedule start time must be before end time');
        }
        if (isGroupSession) {
            if (!data.studentIds || data.studentIds.length < 2) {
                throw new common_1.BadRequestException('Group sessions require at least 2 students');
            }
            if (data.studentId) {
                throw new common_1.BadRequestException('Group sessions must not include a single studentId');
            }
            await this.validateGroupStudents(teacherId, data.studentIds);
        }
        else {
            if (!data.studentId) {
                throw new common_1.BadRequestException('Individual sessions require a studentId');
            }
        }
        await this.validateNoOverlap(teacherId, dayOfWeek, startTimeString, endTimeString);
        const schedule = this.schedulesRepository.create({
            teacherId,
            dayOfWeek,
            startTimeString,
            endTimeString,
            meetingLink: data.meetingLink,
            classType: data.classType,
            className: data.className || 'Quran Class',
            notes: data.notes,
            status: 'active',
            isGroupSession,
            studentId: isGroupSession ? null : data.studentId,
        });
        const saved = await this.schedulesRepository.save(schedule);
        if (isGroupSession && data.studentIds) {
            const rows = data.studentIds.map((studentId) => this.scheduleStudentsRepository.create({ scheduleId: saved.id, studentId }));
            await this.scheduleStudentsRepository.save(rows);
        }
        try {
            const nextDate = this.getNextDayOfWeekDate(dayOfWeek);
            const [startHour, startMin] = startTimeString.split(':').map(Number);
            const [endHour, endMin] = endTimeString.split(':').map(Number);
            const scheduledStart = new Date(nextDate);
            scheduledStart.setHours(startHour, startMin, 0, 0);
            const scheduledEnd = new Date(nextDate);
            scheduledEnd.setHours(endHour, endMin, 0, 0);
            await this.liveSessionService.createWithZoom({
                teacherId,
                studentId: isGroupSession ? null : data.studentId,
                scheduleId: saved.id,
                scheduledStart,
                scheduledEnd,
                metadata: { className: data.className || 'Quran Class', dayOfWeek },
            });
        }
        catch (error) {
            this.logger.warn(`Zoom meeting auto-creation failed for schedule ${saved.id}: ${error.message}`);
        }
        return this.findOne(saved.id);
    }
    async findAll(studentId, teacherId) {
        const qb = this.schedulesRepository
            .createQueryBuilder('schedule')
            .leftJoinAndSelect('schedule.student', 'student')
            .leftJoinAndSelect('schedule.scheduleStudents', 'scheduleStudents')
            .leftJoinAndSelect('scheduleStudents.student', 'groupStudent')
            .leftJoinAndSelect('schedule.teacher', 'teacher')
            .leftJoinAndSelect('teacher.user', 'user')
            .where('schedule.status = :status', { status: 'active' });
        if (studentId) {
            qb.andWhere('(schedule.studentId = :studentId OR scheduleStudents.studentId = :studentId)', {
                studentId,
            });
        }
        if (teacherId) {
            qb.andWhere('schedule.teacherId = :teacherId', { teacherId });
        }
        return qb.orderBy('schedule.startTime', 'ASC').getMany();
    }
    async findOne(id) {
        const schedule = await this.schedulesRepository.findOne({
            where: { id },
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
        return schedule;
    }
    async getStudentSchedules(studentId) {
        return this.findAll(studentId);
    }
    async getTeacherSchedules(teacherId) {
        return this.findAll(undefined, teacherId);
    }
    async getTeacherSchedulesByDay(teacherId, day) {
        const schedules = await this.schedulesRepository.find({
            where: { teacherId, status: 'active' },
            relations: [
                'student',
                'teacher',
                'teacher.user',
                'scheduleStudents',
                'scheduleStudents.student',
            ],
            order: { startTimeString: 'ASC' },
        });
        return schedules.filter((schedule) => (0, day_of_week_util_1.matchesDayOfWeek)(schedule.dayOfWeek, day));
    }
    async updateSchedule(id, updateData) {
        const schedule = await this.findOne(id);
        if (updateData.startTimeString || updateData.endTimeString || updateData.dayOfWeek) {
            const startTimeString = updateData.startTimeString || schedule.startTimeString;
            const endTimeString = updateData.endTimeString || schedule.endTimeString;
            const dayOfWeek = updateData.dayOfWeek || schedule.dayOfWeek;
            if (startTimeString >= endTimeString) {
                throw new common_1.BadRequestException('Schedule start time must be before end time');
            }
            await this.validateNoOverlap(schedule.teacherId, dayOfWeek, startTimeString, endTimeString, id);
        }
        const { studentIds, isGroupSession, studentId, ...rest } = updateData;
        Object.assign(schedule, rest);
        const updated = await this.schedulesRepository.save(schedule);
        try {
            const startString = updateData.startTimeString || schedule.startTimeString;
            const endString = updateData.endTimeString || schedule.endTimeString;
            const day = updateData.dayOfWeek || schedule.dayOfWeek;
            if (startString && endString) {
                const nextDate = this.getNextDayOfWeekDate(day);
                const [startHour, startMin] = startString.split(':').map(Number);
                const [endHour, endMin] = endString.split(':').map(Number);
                const newStart = new Date(nextDate);
                newStart.setHours(startHour, startMin, 0, 0);
                const newEnd = new Date(nextDate);
                newEnd.setHours(endHour, endMin, 0, 0);
                await this.liveSessionService.updateZoomMeeting(schedule.id, newStart, newEnd, rest.className);
            }
        }
        catch (error) {
            this.logger.warn(`Zoom meeting update failed for schedule ${schedule.id}: ${error.message}`);
        }
        return this.findOne(schedule.id);
    }
    async clearStudentSchedules(studentId) {
        await this.schedulesRepository.delete({ studentId });
        const groupMemberships = await this.scheduleStudentsRepository.find({
            where: { studentId },
        });
        for (const membership of groupMemberships) {
            await this.scheduleStudentsRepository.delete({ id: membership.id });
            const remaining = await this.scheduleStudentsRepository.count({
                where: { scheduleId: membership.scheduleId },
            });
            if (remaining === 0) {
                await this.schedulesRepository.delete({ id: membership.scheduleId });
            }
        }
    }
    async deleteSchedule(id) {
        const schedule = await this.schedulesRepository.findOne({ where: { id } });
        if (!schedule)
            throw new common_1.NotFoundException('Schedule not found');
        try {
            await this.liveSessionService.deleteZoomMeeting(id);
        }
        catch (error) {
            this.logger.warn(`Zoom meeting deletion failed for schedule ${id}: ${error.message}`);
        }
        return this.schedulesRepository.remove(schedule);
    }
    getNextDayOfWeekDate(dayOfWeek) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetIndex = days.indexOf(dayOfWeek.toLowerCase());
        if (targetIndex === -1)
            return new Date();
        const today = new Date();
        const todayIndex = today.getDay();
        let daysUntil = targetIndex - todayIndex;
        if (daysUntil <= 0)
            daysUntil += 7;
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntil);
        return nextDate;
    }
};
exports.SchedulesService = SchedulesService;
exports.SchedulesService = SchedulesService = SchedulesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(1, (0, typeorm_1.InjectRepository)(schedule_student_entity_1.ScheduleStudent)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => live_session_service_1.LiveSessionService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        live_session_service_1.LiveSessionService])
], SchedulesService);
//# sourceMappingURL=schedules.service.js.map
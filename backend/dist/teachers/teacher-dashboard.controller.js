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
exports.TeacherDashboardController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("../students/entities/student.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const homework_entity_1 = require("../homework/entities/homework.entity");
const teacher_note_entity_1 = require("./entities/teacher-note.entity");
const progress_entity_1 = require("../progress/entities/progress.entity");
const teachers_service_1 = require("./teachers.service");
const teacher_replacements_service_1 = require("../teacher-replacements/teacher-replacements.service");
let TeacherDashboardController = class TeacherDashboardController {
    constructor(studentsRepository, schedulesRepository, homeworkRepository, notesRepository, progressRepository, teachersService, replacementsService) {
        this.studentsRepository = studentsRepository;
        this.schedulesRepository = schedulesRepository;
        this.homeworkRepository = homeworkRepository;
        this.notesRepository = notesRepository;
        this.progressRepository = progressRepository;
        this.teachersService = teachersService;
        this.replacementsService = replacementsService;
    }
    async requireTeacher(req) {
        return this.teachersService.resolveAuthenticatedTeacher(req.user.id);
    }
    async getDashboardData(req) {
        const teacher = await this.requireTeacher(req);
        const teacherId = teacher.id;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[new Date().getDay()];
        const totalStudents = await this.studentsRepository.count({ where: { teacherId } });
        const todayClassesCount = await this.schedulesRepository.count({
            where: { teacherId, dayOfWeek: currentDay, status: 'active' },
        });
        const studentsRes = await this.studentsRepository.find({ where: { teacherId } });
        const avgAttendance = studentsRes.length > 0
            ? studentsRes.reduce((acc, s) => acc + Number(s.attendanceRate || 0), 0) /
                studentsRes.length
            : 0;
        const homeworkPending = await this.homeworkRepository.count({
            where: { student: { teacherId }, status: 'Pending' },
        });
        const studentIds = studentsRes.map((s) => s.id);
        const progressRecords = studentIds.length > 0
            ? await this.progressRepository.find({
                where: { studentId: (0, typeorm_2.In)(studentIds) },
                order: { updatedAt: 'ASC' },
            })
            : [];
        const progressMap = new Map(progressRecords.map((p) => [p.studentId, p]));
        const studentProgress = studentsRes.map((s) => {
            const prog = progressMap.get(s.id);
            const rate = prog?.progressPercentage ?? s.progressRate ?? 0;
            return {
                id: s.id,
                name: s.fullName,
                initials: s.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join(''),
                currentSurah: prog?.lastStudiedSurah ||
                    (s.level === student_entity_1.QuranLevel.HIFZ_PROGRAM ? 'Surah Al-Kahf (Juz 15)' : 'Juz Amma (Revision)'),
                status: rate >= 80 ? 'EXCEEDING' : rate >= 50 ? 'ON TRACK' : 'NEEDS REVIEW',
                progress: rate,
            };
        });
        const notes = await this.notesRepository.find({
            where: { teacherId },
            order: { createdAt: 'DESC' },
            take: 3,
        });
        const sessions = await this.schedulesRepository.find({
            where: { teacherId, dayOfWeek: currentDay, status: 'active' },
            order: { startTimeString: 'ASC' },
            relations: ['student'],
            take: 5,
        });
        const formattedSessions = sessions.map((s) => ({
            id: s.id,
            time: s.startTimeString && s.endTimeString ? `${s.startTimeString} - ${s.endTimeString}` : '',
            title: s.className,
            type: s.classType || (s.student ? 'Private Hifz • 1:1 Session' : 'Group Session'),
            students: s.student ? [s.student.fullName] : [],
            status: s.status === 'active' ? 'READY TO START' : null,
        }));
        return {
            teacher: {
                id: teacher.id,
                name: teacher.fullName,
                title: teacher.specialization || 'Teacher',
                avatar: teacher.avatarUrl ? `http://localhost:3000${teacher.avatarUrl}` : null,
            },
            stats: {
                totalStudents,
                todayClasses: todayClassesCount,
                overallAttendance: Number(avgAttendance.toFixed(1)),
                homeworkPending,
            },
            temporaryStudents: await this.replacementsService.getTemporaryStudentsForTeacher(teacherId),
            reassignedAwayStudents: await this.replacementsService.getReassignedAwayForTeacher(teacherId),
            studentProgress,
            notes: notes.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                content: n.content,
                createdAt: n.createdAt ? n.createdAt.toISOString() : null,
            })),
            sessions: formattedSessions,
        };
    }
    async getTodaySessions(req) {
        const teacher = await this.requireTeacher(req);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[new Date().getDay()];
        const sessions = await this.schedulesRepository.find({
            where: { teacherId: teacher.id, dayOfWeek: currentDay, status: 'active' },
            order: { startTimeString: 'ASC' },
            relations: ['student', 'scheduleStudents', 'scheduleStudents.student'],
        });
        return sessions.map((s) => {
            const groupStudents = (s.scheduleStudents || [])
                .map((ss) => ss.student)
                .filter(Boolean)
                .map((student) => ({
                id: student.id,
                fullName: student.fullName,
                level: student.level,
            }));
            const isGroupSession = !!s.isGroupSession;
            const studentCount = isGroupSession ? groupStudents.length : 1;
            return {
                scheduleId: s.id,
                title: s.className || 'Quran Class',
                isGroupSession,
                studentCount,
                students: isGroupSession
                    ? groupStudents
                    : s.student
                        ? [{ id: s.student.id, fullName: s.student.fullName, level: s.student.level }]
                        : [],
                studentName: isGroupSession
                    ? `Group · ${studentCount} students`
                    : s.student?.fullName || 'Unknown Student',
                studentAvatar: isGroupSession
                    ? 'G'
                    : s.student?.fullName
                        ? s.student.fullName.charAt(0)
                        : 'U',
                sessionType: isGroupSession ? 'Group Session' : s.classType || '1:1 Session',
                startTime: s.startTimeString,
                endTime: s.endTimeString,
                meetingLink: s.meetingLink,
                status: s.status,
                level: isGroupSession
                    ? groupStudents[0]?.level || 'Beginner'
                    : s.student?.level || 'Beginner',
            };
        });
    }
    async getNotes(req) {
        const teacher = await this.requireTeacher(req);
        return this.notesRepository.find({
            where: { teacherId: teacher.id },
            order: { createdAt: 'DESC' },
        });
    }
    async createNote(req, body) {
        const teacher = await this.requireTeacher(req);
        const note = this.notesRepository.create({
            teacherId: teacher.id,
            title: body.title,
            content: body.content,
            type: body.type,
        });
        return this.notesRepository.save(note);
    }
    async updateNote(req, id, body) {
        const teacher = await this.requireTeacher(req);
        const note = await this.notesRepository.findOne({
            where: { id, teacherId: teacher.id },
        });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
        }
        Object.assign(note, body);
        return this.notesRepository.save(note);
    }
    async deleteNote(req, id) {
        const teacher = await this.requireTeacher(req);
        const note = await this.notesRepository.findOne({
            where: { id, teacherId: teacher.id },
        });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
        }
        await this.notesRepository.remove(note);
        return { success: true };
    }
};
exports.TeacherDashboardController = TeacherDashboardController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeacherDashboardController.prototype, "getDashboardData", null);
__decorate([
    (0, common_1.Get)('today-sessions'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeacherDashboardController.prototype, "getTodaySessions", null);
__decorate([
    (0, common_1.Get)('notes'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeacherDashboardController.prototype, "getNotes", null);
__decorate([
    (0, common_1.Post)('notes'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeacherDashboardController.prototype, "createNote", null);
__decorate([
    (0, common_1.Patch)('notes/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TeacherDashboardController.prototype, "updateNote", null);
__decorate([
    (0, common_1.Delete)('notes/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeacherDashboardController.prototype, "deleteNote", null);
exports.TeacherDashboardController = TeacherDashboardController = __decorate([
    (0, common_1.Controller)('teacher/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(2, (0, typeorm_1.InjectRepository)(homework_entity_1.Homework)),
    __param(3, (0, typeorm_1.InjectRepository)(teacher_note_entity_1.TeacherNote)),
    __param(4, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        teachers_service_1.TeachersService,
        teacher_replacements_service_1.TeacherReplacementsService])
], TeacherDashboardController);
//# sourceMappingURL=teacher-dashboard.controller.js.map
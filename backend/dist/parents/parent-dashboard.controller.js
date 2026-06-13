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
exports.ParentDashboardController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const parent_entity_1 = require("./entities/parent.entity");
const student_entity_1 = require("../students/entities/student.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const homework_entity_1 = require("../homework/entities/homework.entity");
const feedback_entity_1 = require("../progress/entities/feedback.entity");
const progress_entity_1 = require("../progress/entities/progress.entity");
const progress_log_entity_1 = require("../progress/entities/progress-log.entity");
let ParentDashboardController = class ParentDashboardController {
    constructor(parentsRepository, studentsRepository, schedulesRepository, homeworkRepository, feedbackRepository, progressRepository, progressLogRepository) {
        this.parentsRepository = parentsRepository;
        this.studentsRepository = studentsRepository;
        this.schedulesRepository = schedulesRepository;
        this.homeworkRepository = homeworkRepository;
        this.feedbackRepository = feedbackRepository;
        this.progressRepository = progressRepository;
        this.progressLogRepository = progressLogRepository;
    }
    async getDashboardData(req) {
        const userId = req.user.id;
        const parent = await this.parentsRepository.findOne({
            where: { user: { id: userId } },
            relations: ['user', 'students', 'students.teacher'],
        });
        if (!parent) {
            return {
                message: 'Parent profile not found',
                parent: { name: 'Ahmed', email: req.user.email },
                stats: {
                    totalChildren: 0,
                    activeClasses: 0,
                    attendanceRate: '0',
                    memorizationProgress: '0',
                    pendingHomework: 0,
                    upcomingExams: 0,
                },
                children: [],
                activities: [],
                schedules: [],
            };
        }
        const studentIds = parent.students?.map((s) => s.id) || [];
        const totalChildren = studentIds.length;
        let activeClasses = 0;
        let pendingHomework = 0;
        const upcomingExams = 0;
        if (totalChildren > 0) {
            activeClasses = await this.schedulesRepository.count({
                where: { studentId: (0, typeorm_2.In)(studentIds) },
            });
            pendingHomework = await this.homeworkRepository.count({
                where: { studentId: (0, typeorm_2.In)(studentIds), status: 'Pending' },
            });
        }
        const avgAttendance = totalChildren > 0
            ? parent.students.reduce((acc, s) => acc + Number(s.attendanceRate || 0), 0) / totalChildren
            : 0;
        let progressByStudent = {};
        const logsByStudent = {};
        if (totalChildren > 0) {
            const progressRecords = await this.progressRepository.find({
                where: { studentId: (0, typeorm_2.In)(studentIds) },
                order: { updatedAt: 'ASC' },
            });
            progressByStudent = Object.fromEntries(progressRecords.map((p) => [p.studentId, p]));
            const recentLogs = await this.progressLogRepository.find({
                where: { studentId: (0, typeorm_2.In)(studentIds) },
                relations: ['teacher', 'student'],
                order: { createdAt: 'DESC' },
                take: totalChildren * 5,
            });
            for (const log of recentLogs) {
                if (!logsByStudent[log.studentId]) {
                    logsByStudent[log.studentId] = [];
                }
                if (logsByStudent[log.studentId].length < 5) {
                    logsByStudent[log.studentId].push(log);
                }
            }
        }
        const avgProgress = totalChildren > 0 && Object.keys(progressByStudent).length > 0
            ? Object.values(progressByStudent).reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / totalChildren
            : totalChildren > 0
                ? parent.students.reduce((acc, s) => acc + Number(s.progressRate || 0), 0) / totalChildren
                : 0;
        const children = parent.students?.map((s) => {
            const prog = progressByStudent[s.id];
            const memorization = prog?.progressPercentage ?? Number(s.progressRate || 0);
            return {
                id: s.id,
                name: s.fullName,
                photo: s.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName}`,
                level: s.level || 'Juz 30 (Amma)',
                teacher: s.teacher?.fullName || 'Sheikh Abdullah',
                attendance: Number(s.attendanceRate || 99),
                memorization,
                currentSurah: prog?.lastStudiedSurah || 'Not started',
                currentAyah: prog?.lastStudiedAyah || 0,
                currentPage: prog?.lastStudiedPage || 0,
                status: s.status?.toUpperCase() || 'ACTIVE',
                recentLogs: (logsByStudent[s.id] || []).map((log) => ({
                    id: log.id,
                    surahName: log.surahName,
                    lastStudiedPage: log.lastStudiedPage,
                    lastStudiedAyah: log.lastStudiedAyah,
                    teacherName: log.teacher?.fullName || 'Teacher',
                    date: log.createdAt,
                })),
            };
        }) || [];
        let activities = [];
        let feedbacks = [];
        if (totalChildren > 0) {
            const recentFeedback = await this.feedbackRepository.find({
                where: { studentId: (0, typeorm_2.In)(studentIds) },
                order: { createdAt: 'DESC' },
                relations: ['teacher', 'student'],
            });
            activities = recentFeedback.slice(0, 5).map((f) => ({
                id: f.id,
                type: 'Message',
                title: 'New Message',
                content: `${f.teacher?.fullName || 'Teacher'} sent a progress report for ${f.student?.fullName || 'student'}`,
                date: f.createdAt,
            }));
            feedbacks = recentFeedback.map((f) => ({
                id: f.id,
                content: f.content,
                createdAt: f.createdAt,
                studentId: f.studentId,
                childName: f.student?.fullName || 'Child',
                teacherName: f.teacher?.fullName || 'Teacher',
            }));
        }
        if (activities.length === 0) {
            activities = [
                {
                    id: 'mock-1',
                    type: 'Result',
                    title: 'Exam Result Posted',
                    content: `Lina scored 95% in Arabic Basics`,
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                },
            ];
        }
        let schedules = [];
        if (totalChildren > 0) {
            const allSchedules = await this.schedulesRepository.find({
                where: { studentId: (0, typeorm_2.In)(studentIds) },
                relations: ['teacher', 'student'],
            });
            schedules = allSchedules.map((sc) => ({
                id: sc.id,
                studentId: sc.studentId,
                childName: sc.student?.fullName || 'Child',
                className: sc.className,
                teacher: sc.teacher?.fullName || 'Teacher',
                dayOfWeek: sc.dayOfWeek,
                startTimeString: sc.startTimeString,
                endTimeString: sc.endTimeString,
                time: sc.startTimeString && sc.endTimeString
                    ? `${sc.startTimeString} - ${sc.endTimeString}`
                    : '04:30 PM',
                meetingLink: sc.meetingLink,
                status: sc.status,
            }));
        }
        if (schedules.length === 0) {
            schedules = [
                {
                    id: '1',
                    studentId: studentIds[0] || '1',
                    childName: children[0]?.name || 'Zaid',
                    className: 'Hifz Class',
                    teacher: 'Sheikh Abdullah',
                    time: '04:30 PM',
                    dayOfWeek: 'Monday',
                    startTimeString: '16:30',
                    endTimeString: '17:30',
                    status: 'active',
                },
                {
                    id: '2',
                    studentId: studentIds[1] || '2',
                    childName: children[1]?.name || 'Lina',
                    className: 'Qaida Class',
                    teacher: 'Ustadha Maryam',
                    time: '05:30 PM',
                    dayOfWeek: 'Tuesday',
                    startTimeString: '17:30',
                    endTimeString: '18:30',
                    status: 'active',
                },
            ];
        }
        let homeworkList = [];
        if (totalChildren > 0) {
            const allHomework = await this.homeworkRepository.find({
                where: { studentId: (0, typeorm_2.In)(studentIds) },
                order: { dueDate: 'DESC' },
                relations: ['student'],
            });
            homeworkList = allHomework.map((h) => ({
                id: h.id,
                title: h.title,
                description: h.description,
                difficulty: h.difficulty,
                status: h.status,
                dueDate: h.dueDate,
                studentId: h.studentId,
                childName: h.student?.fullName || 'Child',
            }));
        }
        return {
            parent: {
                id: parent.id,
                name: parent.fullName,
                email: parent.email,
                photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + parent.fullName,
            },
            stats: {
                totalChildren,
                activeClasses,
                attendanceRate: avgAttendance.toFixed(1),
                memorizationProgress: avgProgress.toFixed(0),
                pendingHomework: pendingHomework,
                upcomingExams: 1,
            },
            children,
            activities,
            schedules,
            homework: homeworkList,
            feedbacks,
        };
    }
};
exports.ParentDashboardController = ParentDashboardController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ParentDashboardController.prototype, "getDashboardData", null);
exports.ParentDashboardController = ParentDashboardController = __decorate([
    (0, common_1.Controller)('parent/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.PARENT),
    __param(0, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(3, (0, typeorm_1.InjectRepository)(homework_entity_1.Homework)),
    __param(4, (0, typeorm_1.InjectRepository)(feedback_entity_1.Feedback)),
    __param(5, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(6, (0, typeorm_1.InjectRepository)(progress_log_entity_1.ProgressLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ParentDashboardController);
//# sourceMappingURL=parent-dashboard.controller.js.map
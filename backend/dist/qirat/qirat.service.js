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
exports.QiratService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reports_service_1 = require("../reports/reports.service");
const student_entity_1 = require("../students/entities/student.entity");
const class_session_entity_1 = require("../attendance/entities/class-session.entity");
const teacher_replacement_entity_1 = require("../teacher-replacements/entities/teacher-replacement.entity");
const replacement_status_enum_1 = require("../common/enums/replacement-status.enum");
let QiratService = class QiratService {
    constructor(reportsService, studentRepo, sessionRepo, replacementRepo) {
        this.reportsService = reportsService;
        this.studentRepo = studentRepo;
        this.sessionRepo = sessionRepo;
        this.replacementRepo = replacementRepo;
    }
    async getDashboard() {
        const summary = await this.reportsService.getSummaryStatistics();
        const today = new Date().toISOString().slice(0, 10);
        const todaysClasses = await this.sessionRepo.count({
            where: { sessionDate: today },
        });
        const [qaidah, quranReading, tajweed, hifz] = await Promise.all([
            this.studentRepo.count({
                where: { level: student_entity_1.QuranLevel.QAIDA_NOORANIYA, status: 'active' },
            }),
            this.studentRepo.count({
                where: { level: student_entity_1.QuranLevel.QURAN_READING, status: 'active' },
            }),
            this.studentRepo.count({
                where: { level: student_entity_1.QuranLevel.TAJWEED_PROGRAM, status: 'active' },
            }),
            this.studentRepo.count({
                where: [
                    { level: student_entity_1.QuranLevel.HIFZ_PROGRAM, status: 'active' },
                    { level: student_entity_1.QuranLevel.HIFZ_MURAJAA, status: 'active' },
                ],
            }),
        ]);
        const activeReplacements = await this.replacementRepo.count({
            where: { status: replacement_status_enum_1.ReplacementStatus.ACTIVE },
        });
        const upcomingReplacements = await this.replacementRepo.count({
            where: { status: replacement_status_enum_1.ReplacementStatus.UPCOMING },
        });
        const completedToday = await this.sessionRepo.count({
            where: { sessionDate: today, status: class_session_entity_1.SessionStatus.COMPLETED },
        });
        return {
            totalStudents: summary.totalStudents,
            activeStudents: summary.activeStudents,
            inactiveStudents: summary.inactiveStudents,
            totalTeachers: summary.totalTeachers,
            activeTeachers: summary.activeTeachers,
            activeClasses: summary.activeClasses,
            todaysClasses,
            completedClassesToday: completedToday,
            attendanceRate: summary.attendanceRate,
            homeworkCompletionRate: summary.homeworkCompletionRate,
            studentsInQaidah: qaidah,
            studentsInQuranReading: quranReading,
            studentsInTajweed: tajweed,
            studentsInHifz: hifz,
            activeReplacements,
            upcomingReplacements,
            totalReplacements: activeReplacements + upcomingReplacements,
            newStudentRegistrations: summary.newStudentsThisMonth,
            averageAcademicProgress: summary.averageAcademicProgress,
        };
    }
};
exports.QiratService = QiratService;
exports.QiratService = QiratService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(class_session_entity_1.ClassSession)),
    __param(3, (0, typeorm_1.InjectRepository)(teacher_replacement_entity_1.TeacherReplacement)),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], QiratService);
//# sourceMappingURL=qirat.service.js.map
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
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("../students/entities/student.entity");
const parent_entity_1 = require("../parents/entities/parent.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const attendance_entity_1 = require("../attendance/entities/attendance.entity");
const class_session_entity_1 = require("../attendance/entities/class-session.entity");
const student_attendance_entity_1 = require("../attendance/entities/student-attendance.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const progress_entity_1 = require("../progress/entities/progress.entity");
const progress_log_entity_1 = require("../progress/entities/progress-log.entity");
const homework_entity_1 = require("../homework/entities/homework.entity");
const exam_entity_1 = require("../exams/entities/exam.entity");
const teacher_replacement_entity_1 = require("../teacher-replacements/entities/teacher-replacement.entity");
const replacement_status_enum_1 = require("../common/enums/replacement-status.enum");
const notification_entity_1 = require("../notifications/entities/notification.entity");
let ReportsService = ReportsService_1 = class ReportsService {
    constructor(studentsRepository, parentsRepository, teachersRepository, attendanceRepository, classSessionRepository, studentAttendanceRepository, schedulesRepository, progressRepository, progressLogRepository, homeworkRepository, examsRepository, replacementsRepository, notificationRepository) {
        this.studentsRepository = studentsRepository;
        this.parentsRepository = parentsRepository;
        this.teachersRepository = teachersRepository;
        this.attendanceRepository = attendanceRepository;
        this.classSessionRepository = classSessionRepository;
        this.studentAttendanceRepository = studentAttendanceRepository;
        this.schedulesRepository = schedulesRepository;
        this.progressRepository = progressRepository;
        this.progressLogRepository = progressLogRepository;
        this.homeworkRepository = homeworkRepository;
        this.examsRepository = examsRepository;
        this.replacementsRepository = replacementsRepository;
        this.notificationRepository = notificationRepository;
    }
    async getSummaryStatistics(dateRange) {
        const where = {};
        if (dateRange?.startDate && dateRange?.endDate) {
            where.createdAt = (0, typeorm_2.Between)(new Date(dateRange.startDate), new Date(dateRange.endDate));
        }
        else if (dateRange?.startDate) {
            where.createdAt = (0, typeorm_2.MoreThan)(new Date(dateRange.startDate));
        }
        else if (dateRange?.endDate) {
            where.createdAt = (0, typeorm_2.LessThan)(new Date(dateRange.endDate));
        }
        const [totalStudents, activeStudents, inactiveStudents] = await Promise.all([
            this.studentsRepository.count({ where }),
            this.studentsRepository.count({ where: { ...where, status: 'active' } }),
            this.studentsRepository.count({ where: { ...where, status: 'inactive' } }),
        ]);
        const totalParents = await this.parentsRepository.count();
        const totalTeachers = await this.teachersRepository.count();
        const activeTeachers = await this.teachersRepository.count({ where: { status: 'active' } });
        const activeClasses = await this.schedulesRepository.count({ where: { status: 'active' } });
        let attendanceRate = 0;
        const attendanceAgg = await this.studentAttendanceRepository
            .createQueryBuilder('sa')
            .select('COUNT(*)', 'total')
            .addSelect(`SUM(CASE WHEN sa."attendanceStatus" IN ('${student_attendance_entity_1.StudentAttendanceStatus.PRESENT}', '${student_attendance_entity_1.StudentAttendanceStatus.LATE}') THEN 1 ELSE 0 END)`, 'attended')
            .getRawOne();
        const totalAttendanceRecords = parseInt(attendanceAgg?.total, 10) || 0;
        if (totalAttendanceRecords > 0) {
            attendanceRate = (parseInt(attendanceAgg.attended, 10) / totalAttendanceRecords) * 100;
        }
        const progressAgg = await this.progressRepository
            .createQueryBuilder('p')
            .select('AVG(p."progressPercentage")', 'avg')
            .getRawOne();
        const averageAcademicProgress = parseFloat(progressAgg?.avg) || 0;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newStudentsThisMonth = await this.studentsRepository.count({
            where: { createdAt: (0, typeorm_2.MoreThan)(firstDayOfMonth) },
        });
        const totalHomework = await this.homeworkRepository.count();
        const completedHomework = await this.homeworkRepository.count({
            where: { status: homework_entity_1.HomeworkStatus.COMPLETED },
        });
        const homeworkCompletionRate = totalHomework > 0 ? (completedHomework / totalHomework) * 100 : 0;
        const totalExams = await this.examsRepository.count();
        const completedExams = await this.examsRepository.count({
            where: { status: exam_entity_1.ExamStatus.COMPLETED },
        });
        return {
            totalStudents,
            activeStudents,
            inactiveStudents,
            totalParents,
            totalTeachers,
            activeTeachers,
            activeClasses,
            attendanceRate: parseFloat(attendanceRate.toFixed(2)),
            homeworkCompletionRate: parseFloat(homeworkCompletionRate.toFixed(2)),
            averageAcademicProgress: parseFloat(averageAcademicProgress.toFixed(2)),
            newStudentsThisMonth,
            totalHomework,
            completedHomework,
            totalExams,
            completedExams,
            dateRange,
        };
    }
    async getStudentPerformance(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const where = {};
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.teacherId) {
            where.teacherId = filters.teacherId;
        }
        if (filters.country) {
            where.country = (0, typeorm_2.ILike)(`%${filters.country}%`);
        }
        if (filters.learningProgram) {
            const levels = ReportsService_1.TRACK_TO_LEVELS[filters.learningProgram] || [
                filters.learningProgram,
            ];
            where.level = (0, typeorm_2.In)(levels);
        }
        const whereClause = filters.search?.trim()
            ? [
                { ...where, fullName: (0, typeorm_2.ILike)(`%${filters.search.trim()}%`) },
                { ...where, email: (0, typeorm_2.ILike)(`%${filters.search.trim()}%`) },
            ]
            : where;
        const [students, total] = await this.studentsRepository.findAndCount({
            where: whereClause,
            relations: ['teacher'],
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        const performanceReports = [];
        for (const student of students) {
            const attendanceStats = await this.getStudentAttendanceStats(student.id);
            const progressStats = await this.getStudentProgressStats(student.id);
            const lastExam = await this.examsRepository.findOne({
                where: { studentId: student.id },
                order: { createdAt: 'DESC' },
            });
            const [totalHomework, completedHomework] = await Promise.all([
                this.homeworkRepository.count({ where: { studentId: student.id } }),
                this.homeworkRepository.count({
                    where: { studentId: student.id, status: homework_entity_1.HomeworkStatus.COMPLETED },
                }),
            ]);
            const homeworkCompletionRate = totalHomework > 0 ? ((completedHomework / totalHomework) * 100).toFixed(2) : '0';
            performanceReports.push({
                studentId: student.id,
                studentName: student.fullName,
                email: student.email,
                country: student.country || '—',
                level: student.level,
                teacherName: student.teacher?.fullName || 'Unassigned',
                status: student.status,
                currentTopic: progressStats.currentTopic,
                totalClasses: attendanceStats.total,
                presentCount: attendanceStats.present,
                lateCount: attendanceStats.late,
                absentCount: attendanceStats.absent,
                leftEarlyCount: attendanceStats.leftEarly,
                attendanceRate: attendanceStats.rate,
                averageProgress: progressStats.avgProgress,
                lastExamScore: lastExam?.score,
                homeworkCompletionRate,
            });
        }
        return {
            data: performanceReports,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getStudentAttendanceStats(studentId) {
        const attendances = await this.studentAttendanceRepository.find({
            where: { studentId },
            relations: ['classSession'],
        });
        const total = attendances.length;
        const present = attendances.filter((a) => a.attendanceStatus === student_attendance_entity_1.StudentAttendanceStatus.PRESENT).length;
        const late = attendances.filter((a) => a.attendanceStatus === student_attendance_entity_1.StudentAttendanceStatus.LATE).length;
        const absent = attendances.filter((a) => a.attendanceStatus === student_attendance_entity_1.StudentAttendanceStatus.ABSENT).length;
        const leftEarly = attendances.filter((a) => a.attendanceStatus === student_attendance_entity_1.StudentAttendanceStatus.LEFT_EARLY).length;
        const rate = total > 0 ? ((present + late) / total) * 100 : 0;
        return {
            total,
            present,
            late,
            absent,
            leftEarly,
            rate: parseFloat(rate.toFixed(2)),
        };
    }
    async getStudentProgressStats(studentId) {
        const progresses = await this.progressRepository.find({
            where: { studentId },
            order: { updatedAt: 'DESC' },
        });
        if (progresses.length === 0) {
            return { avgProgress: 0, tracks: [], currentTopic: '—' };
        }
        const avgProgress = progresses.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / progresses.length;
        const tracks = [...new Set(progresses.map((p) => p.learningTrack).filter(Boolean))];
        const latest = progresses[0];
        const currentTopic = latest.currentTopicId || latest.lastStudiedSurah || '—';
        return {
            avgProgress: parseFloat(avgProgress.toFixed(2)),
            tracks,
            currentTopic,
        };
    }
    async getTeacherActivity(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const where = {};
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.country) {
            where.country = filters.country;
        }
        const [teachers, total] = await this.teachersRepository.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        const activityReports = [];
        for (const teacher of teachers) {
            const classes = await this.classSessionRepository.find({
                where: { teacherId: teacher.id },
                relations: ['studentAttendances'],
            });
            const totalClasses = classes.length;
            const totalStudentsAssigned = classes.reduce((sum, c) => sum + (c.totalStudentsAssigned || 0), 0);
            let presentCount = 0;
            let lateCount = 0;
            let absentCount = 0;
            for (const session of classes) {
                if (session.teacherAttendanceStatus === 'PRESENT') {
                    presentCount++;
                }
                else if (session.teacherAttendanceStatus === 'LATE') {
                    lateCount++;
                }
                else {
                    absentCount++;
                }
            }
            let totalHours = 0;
            for (const session of classes) {
                if (session.actualStartTime && session.actualEndTime) {
                    const durationMs = session.actualEndTime.getTime() - session.actualStartTime.getTime();
                    totalHours += durationMs / (1000 * 60 * 60);
                }
                else if (session.scheduledStartTime && session.scheduledEndTime) {
                    const start = new Date(`2000-01-01T${session.scheduledStartTime}`);
                    const end = new Date(`2000-01-01T${session.scheduledEndTime}`);
                    totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                }
            }
            activityReports.push({
                teacherId: teacher.id,
                teacherName: teacher.fullName,
                email: teacher.email,
                totalStudents: totalStudentsAssigned,
                totalClasses,
                totalHoursTaught: parseFloat(totalHours.toFixed(2)),
                presentCount,
                lateCount,
                absentCount,
                completionRate: totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : '0',
            });
        }
        return {
            data: activityReports,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getAttendanceAnalytics(filters) {
        const where = {};
        if (filters.startDate && filters.endDate) {
            where.sessionDate = (0, typeorm_2.Between)(filters.startDate, filters.endDate);
        }
        else if (filters.startDate) {
            where.sessionDate = (0, typeorm_2.MoreThan)(filters.startDate);
        }
        else if (filters.endDate) {
            where.sessionDate = (0, typeorm_2.LessThan)(filters.endDate);
        }
        if (filters.teacherId) {
            where.teacherId = filters.teacherId;
        }
        const sessions = await this.classSessionRepository.find({
            where,
            relations: ['studentAttendances'],
        });
        const totalSessions = sessions.length;
        const totalStudentsAssigned = sessions.reduce((sum, s) => sum + (s.totalStudentsAssigned || 0), 0);
        let presentCount = 0;
        let lateCount = 0;
        let absentCount = 0;
        let leftEarlyCount = 0;
        const sessionsByDay = {};
        const attendanceByStatus = {
            present: 0,
            late: 0,
            absent: 0,
            leftEarly: 0,
        };
        for (const session of sessions) {
            const day = new Date(session.sessionDate).toLocaleDateString('en-US', { weekday: 'long' });
            sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
            for (const attendance of session.studentAttendances || []) {
                switch (attendance.attendanceStatus) {
                    case student_attendance_entity_1.StudentAttendanceStatus.PRESENT:
                        presentCount++;
                        attendanceByStatus.present++;
                        break;
                    case student_attendance_entity_1.StudentAttendanceStatus.LATE:
                        lateCount++;
                        attendanceByStatus.late++;
                        break;
                    case student_attendance_entity_1.StudentAttendanceStatus.ABSENT:
                        absentCount++;
                        attendanceByStatus.absent++;
                        break;
                    case student_attendance_entity_1.StudentAttendanceStatus.LEFT_EARLY:
                        leftEarlyCount++;
                        attendanceByStatus.leftEarly++;
                        break;
                }
            }
        }
        const totalAttended = presentCount + lateCount + absentCount + leftEarlyCount;
        const overallAttendanceRate = totalStudentsAssigned > 0 ? ((totalAttended / totalStudentsAssigned) * 100).toFixed(2) : '0';
        return {
            totalSessions,
            totalStudentsAssigned,
            totalPresent: presentCount,
            totalLate: lateCount,
            totalAbsent: absentCount,
            totalLeftEarly: leftEarlyCount,
            overallAttendanceRate: parseFloat(overallAttendanceRate),
            sessionsByDay,
            attendanceByStatus,
        };
    }
    async getProgressAnalytics(filters) {
        const where = {};
        if (filters.learningProgram) {
            where.learningTrack = filters.learningProgram;
        }
        const progresses = await this.progressRepository.find({
            where,
            relations: ['student'],
        });
        const trackStats = {};
        for (const progress of progresses) {
            const track = progress.learningTrack || 'unknown';
            if (!trackStats[track]) {
                trackStats[track] = {
                    totalStudents: 0,
                    progressSum: 0,
                    completedTopics: 0,
                    totalTopics: 0,
                    progressDistribution: {
                        beginner: 0,
                        intermediate: 0,
                        advanced: 0,
                        expert: 0,
                    },
                };
            }
            trackStats[track].totalStudents++;
            trackStats[track].progressSum += progress.progressPercentage || 0;
            const completedTopicIds = progress.completedTopicIds || [];
            trackStats[track].completedTopics += completedTopicIds.length;
            const totalTopics = this.getTotalTopicsForTrack(track);
            trackStats[track].totalTopics += totalTopics;
            const rank = progress.rank?.toLowerCase() || 'beginner';
            trackStats[track].progressDistribution[rank] =
                (trackStats[track].progressDistribution[rank] || 0) + 1;
        }
        return Object.entries(trackStats).map(([track, stats]) => ({
            learningTrack: track,
            totalStudents: stats.totalStudents,
            avgProgressPercentage: stats.totalStudents > 0
                ? parseFloat((stats.progressSum / stats.totalStudents).toFixed(2))
                : 0,
            completedTopics: stats.completedTopics,
            totalTopics: stats.totalTopics || 1,
            progressDistribution: stats.progressDistribution,
        }));
    }
    getTotalTopicsForTrack(track) {
        switch (track) {
            case 'qaidah':
                return 25;
            case 'tajweed':
                return 15;
            case 'quran_reading':
                return 114;
            case 'hifz':
                return 114;
            default:
                return 100;
        }
    }
    async getRegistrationReports(filters) {
        const where = {};
        if (filters.startDate && filters.endDate) {
            where.createdAt = (0, typeorm_2.Between)(filters.startDate, filters.endDate);
        }
        else if (filters.startDate) {
            where.createdAt = (0, typeorm_2.MoreThan)(filters.startDate);
        }
        else if (filters.endDate) {
            where.createdAt = (0, typeorm_2.LessThan)(filters.endDate);
        }
        if (filters.level) {
            where.level = filters.level;
        }
        const students = await this.studentsRepository.find({
            where,
        });
        const dailyStats = {};
        for (const student of students) {
            const date = student.createdAt.toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    date,
                    totalRegistrations: 0,
                    byGender: {},
                    byLevel: {},
                    byCountry: {},
                };
            }
            dailyStats[date].totalRegistrations++;
            const gender = student.gender || 'unknown';
            dailyStats[date].byGender[gender] = (dailyStats[date].byGender[gender] || 0) + 1;
            const level = student.level || 'unknown';
            dailyStats[date].byLevel[level] = (dailyStats[date].byLevel[level] || 0) + 1;
            const country = student.country || 'unknown';
            dailyStats[date].byCountry[country] = (dailyStats[date].byCountry[country] || 0) + 1;
        }
        return Object.values(dailyStats).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    async getParentActivityReports(filters) {
        const where = {};
        if (filters.startDate && filters.endDate) {
            where.createdAt = (0, typeorm_2.Between)(filters.startDate, filters.endDate);
        }
        else if (filters.startDate) {
            where.createdAt = (0, typeorm_2.MoreThan)(filters.startDate);
        }
        else if (filters.endDate) {
            where.createdAt = (0, typeorm_2.LessThan)(filters.endDate);
        }
        if (filters.country) {
            where.country = filters.country;
        }
        const parents = await this.parentsRepository.find({
            where,
            relations: ['students', 'user'],
        });
        const reports = [];
        for (const parent of parents) {
            const notifications = await this.notificationRepository.find({
                where: { userId: parent.user?.id },
                order: { createdAt: 'DESC' },
            });
            reports.push({
                parentId: parent.id,
                parentName: parent.fullName,
                email: parent.email,
                totalStudents: parent.students?.length || 0,
                notificationsReceived: notifications.length,
                lastActive: parent.updatedAt || parent.createdAt,
            });
        }
        return reports;
    }
    async getHomeworkReports(filters) {
        const where = {};
        if (filters.startDate && filters.endDate) {
            where.createdAt = (0, typeorm_2.Between)(filters.startDate, filters.endDate);
        }
        else if (filters.startDate) {
            where.createdAt = (0, typeorm_2.MoreThan)(filters.startDate);
        }
        else if (filters.endDate) {
            where.createdAt = (0, typeorm_2.LessThan)(filters.endDate);
        }
        if (filters.difficulty) {
            where.difficulty = filters.difficulty;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        const homeworkList = await this.homeworkRepository.find({
            where,
        });
        const totalHomework = homeworkList.length;
        const completed = homeworkList.filter((h) => h.status === homework_entity_1.HomeworkStatus.COMPLETED).length;
        const pending = homeworkList.filter((h) => h.status === homework_entity_1.HomeworkStatus.PENDING).length;
        const byDifficulty = {};
        for (const homework of homeworkList) {
            const diff = homework.difficulty || 'unknown';
            byDifficulty[diff] = (byDifficulty[diff] || 0) + 1;
        }
        const byStudent = {};
        for (const homework of homeworkList) {
            const studentName = homework.student?.fullName || 'Unknown';
            byStudent[studentName] = (byStudent[studentName] || 0) + 1;
        }
        let totalCompletionTime = 0;
        let completedCount = 0;
        for (const homework of homeworkList) {
            if (homework.status === homework_entity_1.HomeworkStatus.COMPLETED &&
                homework.updatedAt &&
                homework.createdAt) {
                const diffTime = homework.updatedAt.getTime() - homework.createdAt.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                totalCompletionTime += diffDays;
                completedCount++;
            }
        }
        const averageCompletionTime = completedCount > 0 ? parseFloat((totalCompletionTime / completedCount).toFixed(2)) : 0;
        return {
            totalHomework,
            pending,
            completed,
            byDifficulty,
            byStudent,
            averageCompletionTime,
        };
    }
    async getExamReports(filters) {
        const where = {};
        if (filters.startDate && filters.endDate) {
            where.createdAt = (0, typeorm_2.Between)(filters.startDate, filters.endDate);
        }
        else if (filters.startDate) {
            where.createdAt = (0, typeorm_2.MoreThan)(filters.startDate);
        }
        else if (filters.endDate) {
            where.createdAt = (0, typeorm_2.LessThan)(filters.endDate);
        }
        if (filters.status) {
            where.status = filters.status;
        }
        const exams = await this.examsRepository.find({
            where,
            relations: ['student', 'progress'],
        });
        const totalExams = exams.length;
        const totalStudentsTaken = [...new Set(exams.map((e) => e.studentId))].length;
        const scores = exams.map((e) => e.score || 0);
        const averageScore = totalExams > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / totalExams).toFixed(2)) : 0;
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
        const passedExams = scores.filter((s) => s >= 50).length;
        const passRate = totalExams > 0 ? ((passedExams / totalExams) * 100).toFixed(2) : '0';
        const byLearningTrack = {};
        for (const exam of exams) {
            const track = exam.progress?.learningTrack || exam.student?.level || 'unknown';
            byLearningTrack[track] = (byLearningTrack[track] || 0) + 1;
        }
        const byDifficulty = {};
        for (const exam of exams) {
            const difficulty = exam.difficulty || 'unknown';
            byDifficulty[difficulty] = (byDifficulty[difficulty] || 0) + 1;
        }
        return {
            totalExams,
            totalStudentsTaken,
            averageScore,
            highestScore,
            lowestScore,
            passRate: parseFloat(passRate),
            byLearningTrack,
            byDifficulty,
        };
    }
    async getTeacherReplacementReports(filters) {
        const where = {};
        if (filters.startDate && filters.endDate) {
            where.createdAt = (0, typeorm_2.Between)(filters.startDate, filters.endDate);
        }
        else if (filters.startDate) {
            where.createdAt = (0, typeorm_2.MoreThan)(filters.startDate);
        }
        else if (filters.endDate) {
            where.createdAt = (0, typeorm_2.LessThan)(filters.endDate);
        }
        if (filters.status) {
            where.status = filters.status;
        }
        const replacements = await this.replacementsRepository.find({
            where,
            relations: ['student', 'originalTeacher', 'replacementTeacher'],
            order: { startDate: 'DESC' },
        });
        const totalReplacements = replacements.length;
        const byStatus = {};
        for (const replacement of replacements) {
            const status = replacement.status || 'unknown';
            byStatus[status] = (byStatus[status] || 0) + 1;
        }
        const byReason = {};
        for (const replacement of replacements) {
            const reason = replacement.reason || 'unknown';
            byReason[reason] = (byReason[reason] || 0) + 1;
        }
        const details = replacements.map((r) => ({
            id: r.id,
            studentName: r.student?.fullName || 'Unknown',
            originalTeacher: r.originalTeacher?.fullName || 'Unknown',
            replacementTeacher: r.replacementTeacher?.fullName || 'Unknown',
            startDate: r.startDate,
            endDate: r.endDate,
            reason: r.customReason || r.reason || 'unknown',
            status: r.status,
        }));
        return {
            totalReplacements,
            upcoming: byStatus[replacement_status_enum_1.ReplacementStatus.UPCOMING] || 0,
            active: byStatus[replacement_status_enum_1.ReplacementStatus.ACTIVE] || 0,
            completed: byStatus[replacement_status_enum_1.ReplacementStatus.COMPLETED] || 0,
            cancelled: byStatus[replacement_status_enum_1.ReplacementStatus.CANCELLED] || 0,
            byReason,
            byStatus,
            details,
        };
    }
};
exports.ReportsService = ReportsService;
ReportsService.TRACK_TO_LEVELS = {
    qaidah: ['Qaida Nooraniya'],
    quran_reading: ['Quran Reading'],
    tajweed: ['Tajweed Program'],
    hifz: ['Hifz Program', "Hifz Muraja'a"],
};
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(2, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(3, (0, typeorm_1.InjectRepository)(attendance_entity_1.Attendance)),
    __param(4, (0, typeorm_1.InjectRepository)(class_session_entity_1.ClassSession)),
    __param(5, (0, typeorm_1.InjectRepository)(student_attendance_entity_1.StudentAttendance)),
    __param(6, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(7, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(8, (0, typeorm_1.InjectRepository)(progress_log_entity_1.ProgressLog)),
    __param(9, (0, typeorm_1.InjectRepository)(homework_entity_1.Homework)),
    __param(10, (0, typeorm_1.InjectRepository)(exam_entity_1.Exam)),
    __param(11, (0, typeorm_1.InjectRepository)(teacher_replacement_entity_1.TeacherReplacement)),
    __param(12, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map
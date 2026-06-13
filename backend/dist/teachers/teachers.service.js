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
exports.TeachersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const teacher_entity_1 = require("./entities/teacher.entity");
const student_entity_1 = require("../students/entities/student.entity");
const progress_entity_1 = require("../progress/entities/progress.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const users_service_1 = require("../users/users.service");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const notifications_service_1 = require("../notifications/notifications.service");
const homework_entity_1 = require("../homework/entities/homework.entity");
const teacher_replacements_service_1 = require("../teacher-replacements/teacher-replacements.service");
let TeachersService = class TeachersService {
    constructor(teachersRepository, studentsRepository, progressRepository, schedulesRepository, homeworkRepository, usersService, notificationsService, replacementsService) {
        this.teachersRepository = teachersRepository;
        this.studentsRepository = studentsRepository;
        this.progressRepository = progressRepository;
        this.schedulesRepository = schedulesRepository;
        this.homeworkRepository = homeworkRepository;
        this.usersService = usersService;
        this.notificationsService = notificationsService;
        this.replacementsService = replacementsService;
    }
    async create(createTeacherDto) {
        const existingTeacher = await this.teachersRepository.findOne({
            where: { email: createTeacherDto.email },
        });
        if (existingTeacher) {
            throw new common_1.ConflictException('A teacher with this email already exists');
        }
        const existingUser = await this.usersService.findByEmail(createTeacherDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('A user account with this email already exists');
        }
        const user = await this.usersService.create({
            email: createTeacherDto.email,
            password: createTeacherDto.password,
            name: createTeacherDto.fullName,
            role: user_role_enum_1.UserRole.TEACHER,
            phone: createTeacherDto.phoneNumber || '',
            avatar: createTeacherDto.avatarUrl || '',
            isActive: true,
        });
        const { password: _password, ...teacherFields } = createTeacherDto;
        const teacher = this.teachersRepository.create({
            ...teacherFields,
            userId: user.id,
        });
        return this.teachersRepository.save(teacher);
    }
    async findAll(queryDto) {
        const { search, status, page = 1, limit = 10 } = queryDto;
        const qb = this.teachersRepository
            .createQueryBuilder('teacher')
            .leftJoinAndSelect('teacher.user', 'user')
            .leftJoinAndSelect('teacher.students', 'students')
            .leftJoinAndSelect('teacher.schedules', 'schedules');
        if (search) {
            qb.andWhere('(LOWER(teacher.fullName) LIKE LOWER(:search) OR LOWER(teacher.email) LIKE LOWER(:search) OR LOWER(teacher.specialization) LIKE LOWER(:search))', { search: `%${search}%` });
        }
        if (status && status !== 'all') {
            qb.andWhere('teacher.status = :status', { status });
        }
        qb.skip((page - 1) * limit).take(limit);
        qb.orderBy('teacher.createdAt', 'DESC');
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const teacher = await this.teachersRepository.findOne({
            where: { id },
            relations: ['user', 'students', 'schedules', 'schedules.student'],
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        return teacher;
    }
    async findByUserId(userId) {
        const teacher = await this.teachersRepository.findOne({
            where: { userId },
            relations: ['user', 'students', 'schedules', 'schedules.student'],
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found for this user account');
        }
        return teacher;
    }
    async resolveAuthenticatedTeacher(userId) {
        if (!userId) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        return this.findByUserId(userId);
    }
    async assertStudentBelongsToTeacher(teacherId, studentId) {
        return this.assertTeacherCanTeachStudent(teacherId, studentId);
    }
    async assertTeacherCanTeachStudent(teacherId, studentId) {
        return this.replacementsService.assertTeacherCanTeachStudent(teacherId, studentId);
    }
    async assertTeacherCanManageStudent(teacherId, studentId) {
        return this.replacementsService.assertTeacherCanManageStudent(teacherId, studentId);
    }
    async assertTeacherCanViewStudent(teacherId, studentId) {
        return this.replacementsService.assertTeacherCanViewStudent(teacherId, studentId);
    }
    async assertScheduleBelongsToTeacher(teacherId, scheduleId) {
        const schedule = await this.schedulesRepository.findOne({ where: { id: scheduleId } });
        if (!schedule) {
            throw new common_1.NotFoundException('Schedule not found');
        }
        if (schedule.teacherId === teacherId) {
            return schedule;
        }
        const canTeach = await this.replacementsService.canTeacherTeachStudent(teacherId, schedule.studentId);
        if (!canTeach) {
            throw new common_1.ForbiddenException('You do not have access to this schedule');
        }
        return schedule;
    }
    async update(id, updateTeacherDto) {
        const teacher = await this.findOne(id);
        if (updateTeacherDto.email && updateTeacherDto.email !== teacher.email) {
            const existingTeacher = await this.teachersRepository.findOne({
                where: { email: updateTeacherDto.email },
            });
            if (existingTeacher) {
                throw new common_1.ConflictException('A teacher with this email already exists');
            }
            const existingUser = await this.usersService.findByEmail(updateTeacherDto.email);
            if (existingUser && existingUser.id !== teacher.userId) {
                throw new common_1.ConflictException('A user account with this email already exists');
            }
        }
        if (teacher.userId) {
            const user = await this.usersService.findOne(teacher.userId);
            const userUpdate = {};
            if (updateTeacherDto.fullName)
                userUpdate.name = updateTeacherDto.fullName;
            if (updateTeacherDto.email)
                userUpdate.email = updateTeacherDto.email;
            if (updateTeacherDto.phoneNumber)
                userUpdate.phone = updateTeacherDto.phoneNumber;
            if (updateTeacherDto.avatarUrl)
                userUpdate.avatar = updateTeacherDto.avatarUrl;
            await this.usersService.updateProfile(user.id, userUpdate);
        }
        Object.assign(teacher, updateTeacherDto);
        return this.teachersRepository.save(teacher);
    }
    async remove(id) {
        const teacher = await this.findOne(id);
        await this.teachersRepository.remove(teacher);
        if (teacher.userId) {
            try {
                const user = await this.usersService.findOne(teacher.userId);
                const bypassAdmin = { role: user_role_enum_1.UserRole.SUPER_ADMIN };
                await this.usersService.remove(user.id, bypassAdmin);
            }
            catch (err) {
                console.error('Failed to delete companion user account:', err.message);
            }
        }
    }
    async assignStudents(teacherId, studentIds) {
        const teacher = await this.findOne(teacherId);
        if (studentIds && studentIds.length > 0) {
            await this.studentsRepository
                .createQueryBuilder()
                .update(student_entity_1.Student)
                .set({ teacherId: teacher.id })
                .whereInIds(studentIds)
                .execute();
        }
        return this.findOne(teacherId);
    }
    async getTeacherDashboardStats(teacherId) {
        const totalStudents = await this.studentsRepository.count({
            where: { teacherId },
        });
        const students = await this.studentsRepository.find({
            where: { teacherId },
        });
        const totalAttendance = students.reduce((acc, s) => acc + Number(s.attendanceRate || 0), 0);
        const avgAttendance = students.length > 0 ? totalAttendance / students.length : 95.0;
        return {
            totalStudents,
            todayClassesCount: students.length > 0 ? Math.ceil(students.length * 0.4) : 0,
            attendanceRate: Number(avgAttendance.toFixed(1)),
            homeworkPending: students.length > 0 ? Math.ceil(students.length * 0.6) : 0,
        };
    }
    async getOverallStats() {
        const total = await this.teachersRepository.count();
        const active = await this.teachersRepository.count({ where: { status: 'active' } });
        const onLeave = await this.teachersRepository.count({ where: { status: 'on leave' } });
        const pending = await this.teachersRepository.count({ where: { status: 'pending' } });
        return { total, active, onLeave, pending };
    }
    async getTeacherAnalytics(id) {
        const teacher = await this.findOne(id);
        const studentIds = teacher.students?.map((s) => s.id) || [];
        const progressRecords = studentIds.length > 0
            ? await this.progressRepository
                .createQueryBuilder('p')
                .leftJoinAndSelect('p.student', 'student')
                .where('p.studentId IN (:...studentIds)', { studentIds })
                .orderBy('p.updatedAt', 'DESC')
                .getMany()
            : [];
        const schedules = teacher.schedules || [];
        let totalWeeklyHours = 0;
        for (const schedule of schedules) {
            if (schedule.startTimeString && schedule.endTimeString) {
                const [sh, sm] = schedule.startTimeString.split(':').map(Number);
                const [eh, em] = schedule.endTimeString.split(':').map(Number);
                const diffMinutes = eh * 60 + em - (sh * 60 + sm);
                if (diffMinutes > 0)
                    totalWeeklyHours += diffMinutes / 60;
            }
        }
        const topics = teacher.teachingTopics
            ? teacher.teachingTopics
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : [];
        return {
            studentCount: studentIds.length,
            studentDetails: progressRecords.map((p) => ({
                studentId: p.studentId,
                studentName: p.student?.fullName || 'Unknown',
                progressPercentage: p.progressPercentage,
                rank: p.rank,
                lastStudiedSurah: p.lastStudiedSurah,
                surahsCount: p.surahsCount,
            })),
            totalWeeklyHours: Math.round(totalWeeklyHours * 100) / 100,
            topics,
            monthlySalary: teacher.monthlySalary,
            islamicEducationLevel: teacher.islamicEducationLevel,
        };
    }
    async getTeacherDashboardData(teacherId) {
        const teacher = await this.teachersRepository.findOne({
            where: { id: teacherId },
            relations: ['user'],
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const students = await this.studentsRepository.find({
            where: { teacherId },
            relations: ['user', 'parent'],
        });
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todaySchedules = await this.schedulesRepository.find({
            where: {
                teacherId,
                status: 'active',
                dayOfWeek: today,
            },
            relations: ['student'],
        });
        const todayClassesCount = todaySchedules.length;
        const upcomingDays = ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const tomorrowIndex = upcomingDays.indexOf(today) + 1;
        const upcomingSchedules = await this.schedulesRepository.find({
            where: {
                teacherId,
                status: 'active',
                dayOfWeek: (0, typeorm_1.In)(upcomingDays),
            },
        });
        const totalAttendanceRate = students.length > 0
            ? students.reduce((sum, s) => sum + (Number(s.attendanceRate) || 0), 0) / students.length
            : 0;
        const homeworkPending = await this.homeworkRepository.count({
            where: { student: { teacherId }, status: 'Pending' },
        });
        const totalProgressRate = students.length > 0
            ? students.reduce((sum, s) => sum + (Number(s.progressRate) || 0), 0) / students.length
            : 0;
        const notificationCount = students.length * 2;
        return {
            teacher: {
                id: teacher.id,
                fullName: teacher.fullName,
                email: teacher.email,
                phoneNumber: teacher.phoneNumber,
                qualification: teacher.qualification,
                specialization: teacher.specialization,
                experience: teacher.experience,
                availability: teacher.teachingTimeAvailability || [],
                avatarUrl: teacher.avatarUrl,
            },
            stats: {
                totalStudents: students.length,
                todayClassesCount,
                upcomingClassesCount: upcomingSchedules.length,
                pendingHomeworkReviews: homeworkPending,
                averageAttendanceRate: Number(totalAttendanceRate.toFixed(1)),
                averageProgressRate: Number(totalProgressRate.toFixed(1)),
                notificationCount,
            },
            temporaryStudents: await this.replacementsService.getTemporaryStudentsForTeacher(teacherId),
            reassignedAwayStudents: await this.replacementsService.getReassignedAwayForTeacher(teacherId),
            todaySchedules: todaySchedules.map((s) => ({
                id: s.id,
                studentName: s.student?.fullName || 'Unknown',
                quranLevel: s.student?.level || 'N/A',
                startTime: s.startTimeString || 'N/A',
                endTime: s.endTimeString || 'N/A',
                status: s.status || 'active',
                meetingLink: s.meetingLink,
            })),
            upcomingSchedules: upcomingSchedules.slice(0, 5).map((s) => ({
                id: s.id,
                studentName: s.student?.fullName || 'Unknown',
                quranLevel: s.student?.level || 'N/A',
                dayOfWeek: s.dayOfWeek || 'N/A',
                startTime: s.startTimeString || 'N/A',
                endTime: s.endTimeString || 'N/A',
                status: s.status || 'active',
            })),
            students: students.map((s) => ({
                id: s.id,
                fullName: s.fullName,
                gender: s.gender,
                level: s.level,
                status: s.status,
                attendanceRate: Number(s.attendanceRate) || 0,
                progressRate: Number(s.progressRate) || 0,
                nextClassTime: null,
            })),
        };
    }
    async getTeacherStudents(teacherId, page = 1, limit = 10) {
        const temporaryAssignments = await this.replacementsService.getTemporaryStudentsForTeacher(teacherId);
        const tempStudentIds = temporaryAssignments.map((r) => r.studentId);
        const qb = this.studentsRepository
            .createQueryBuilder('student')
            .leftJoinAndSelect('student.user', 'user')
            .where('(student.teacherId = :teacherId OR student.id IN (:...tempStudentIds))', {
            teacherId,
            tempStudentIds: tempStudentIds.length
                ? tempStudentIds
                : ['00000000-0000-0000-0000-000000000000'],
        })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('student.createdAt', 'DESC');
        const [students, total] = await qb.getManyAndCount();
        const tempMap = new Map(temporaryAssignments.map((r) => [r.studentId, r]));
        return {
            data: students.map((s) => ({
                ...s,
                isTemporaryAssignment: s.teacherId !== teacherId && tempMap.has(s.id),
                temporaryReplacement: tempMap.get(s.id) || null,
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
            temporaryAssignments,
            reassignedAway: await this.replacementsService.getReassignedAwayForTeacher(teacherId),
        };
    }
    async getTeacherSchedule(teacherId) {
        const schedules = await this.schedulesRepository.find({
            where: { teacherId, status: 'active' },
            relations: ['student'],
        });
        return schedules.map((s) => ({
            id: s.id,
            studentName: s.student?.fullName || 'Unknown',
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTimeString,
            endTime: s.endTimeString,
            status: s.status,
            meetingLink: s.meetingLink,
            notes: s.notes,
        }));
    }
    async getTeacherNotifications(teacherId, page = 1, limit = 20) {
        const teacher = await this.findOne(teacherId);
        if (!teacher.userId) {
            return {
                notifications: [],
                meta: { total: 0, page, limit, totalPages: 0 },
            };
        }
        const all = await this.notificationsService.getNotifications(teacher.userId);
        const total = all.length;
        const start = (page - 1) * limit;
        const notifications = all.slice(start, start + limit);
        return {
            notifications,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    }
};
exports.TeachersService = TeachersService;
exports.TeachersService = TeachersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(teacher_entity_1.Teacher)),
    __param(1, (0, typeorm_2.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_2.InjectRepository)(progress_entity_1.Progress)),
    __param(3, (0, typeorm_2.InjectRepository)(schedule_entity_1.Schedule)),
    __param(4, (0, typeorm_2.InjectRepository)(homework_entity_1.Homework)),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => teacher_replacements_service_1.TeacherReplacementsService))),
    __metadata("design:paramtypes", [typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository,
        users_service_1.UsersService,
        notifications_service_1.NotificationsService,
        teacher_replacements_service_1.TeacherReplacementsService])
], TeachersService);
//# sourceMappingURL=teachers.service.js.map
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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("./entities/student.entity");
const parent_entity_1 = require("../parents/entities/parent.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const users_service_1 = require("../users/users.service");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let StudentsService = class StudentsService {
    constructor(studentsRepository, parentsRepository, schedulesRepository, usersService) {
        this.studentsRepository = studentsRepository;
        this.parentsRepository = parentsRepository;
        this.schedulesRepository = schedulesRepository;
        this.usersService = usersService;
    }
    async generateStudentCode() {
        const year = new Date().getFullYear();
        const prefix = `NJ-${year}-`;
        const latest = await this.studentsRepository
            .createQueryBuilder('student')
            .where('student.studentCode LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('student.studentCode', 'DESC')
            .getOne();
        let nextNum = 1;
        if (latest?.studentCode) {
            const match = latest.studentCode.match(/NJ-\d{4}-(\d+)/);
            if (match) {
                nextNum = parseInt(match[1], 10) + 1;
            }
        }
        return `${prefix}${String(nextNum).padStart(3, '0')}`;
    }
    async create(createStudentDto) {
        const existing = await this.studentsRepository.findOne({
            where: { email: createStudentDto.email },
        });
        if (existing) {
            throw new common_1.ConflictException('A student with this email already exists');
        }
        let userId;
        if (createStudentDto.password) {
            const existingUser = await this.usersService.findByEmail(createStudentDto.email);
            if (existingUser) {
                throw new common_1.ConflictException('A user account with this email already exists');
            }
            const user = await this.usersService.create({
                email: createStudentDto.email,
                password: createStudentDto.password,
                name: createStudentDto.fullName,
                role: user_role_enum_1.UserRole.STUDENT,
                phone: createStudentDto.familyPhone || '',
                avatar: createStudentDto.avatarUrl || '',
                isActive: true,
            });
            userId = user.id;
        }
        const { password, parentId, ...rest } = createStudentDto;
        const studentCode = await this.generateStudentCode();
        const resolvedUserId = userId ?? createStudentDto.userId;
        const student = this.studentsRepository.create({
            ...rest,
            studentCode,
            userId: resolvedUserId,
            parentId: parentId || null,
        });
        const savedStudent = await this.studentsRepository.save(student);
        if (parentId) {
            const parent = await this.parentsRepository.findOne({ where: { id: parentId } });
            if (parent) {
                const parentWithStudents = await this.parentsRepository.findOne({
                    where: { id: parentId },
                    relations: ['students'],
                });
                if (parentWithStudents &&
                    !parentWithStudents.students.some((s) => s.id === savedStudent.id)) {
                    parentWithStudents.students = [...(parentWithStudents.students || []), savedStudent];
                    await this.parentsRepository.save(parentWithStudents);
                }
            }
        }
        return savedStudent;
    }
    async findAll(queryDto) {
        const { search, level, teacherId, status, country, city, startDate, endDate, page = 1, limit = 10, isAssigned, } = queryDto;
        const qb = this.studentsRepository
            .createQueryBuilder('student')
            .leftJoinAndSelect('student.user', 'user')
            .leftJoinAndSelect('student.parent', 'parent')
            .leftJoinAndSelect('student.teacher', 'teacher')
            .leftJoinAndSelect('teacher.user', 'teacherUser')
            .leftJoinAndSelect('student.schedules', 'schedules');
        if (search) {
            qb.andWhere('(LOWER(student.fullName) LIKE LOWER(:search) ' +
                'OR LOWER(student.email) LIKE LOWER(:search) ' +
                'OR LOWER(student.studentCode) LIKE LOWER(:search) ' +
                'OR LOWER(student.phone) LIKE LOWER(:search) ' +
                'OR LOWER(student.familyName) LIKE LOWER(:search) ' +
                'OR LOWER(student.familyPhone) LIKE LOWER(:search) ' +
                'OR LOWER(parent.name) LIKE LOWER(:search) ' +
                'OR LOWER(parent.phone) LIKE LOWER(:search))', { search: `%${search}%` });
        }
        if (level) {
            qb.andWhere('student.level = :level', { level });
        }
        if (teacherId) {
            qb.andWhere('student.teacherId = :teacherId', { teacherId });
        }
        if (status) {
            qb.andWhere('student.status = :status', { status });
        }
        if (isAssigned !== undefined) {
            qb.andWhere('student.isAssigned = :isAssigned', { isAssigned });
        }
        if (country) {
            qb.andWhere('student.country = :country', { country });
        }
        if (city) {
            qb.andWhere('student.city = :city', { city });
        }
        if (startDate) {
            qb.andWhere('student.createdAt >= :startDate', { startDate: new Date(startDate) });
        }
        if (endDate) {
            qb.andWhere('student.createdAt <= :endDate', { endDate: new Date(endDate) });
        }
        qb.skip((page - 1) * limit).take(limit);
        qb.orderBy('student.createdAt', 'DESC');
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
    async findAllUnassigned() {
        return this.studentsRepository.find({
            where: [{ isAssigned: false }, { teacherId: (0, typeorm_2.IsNull)() }],
            relations: ['parent'],
            order: { fullName: 'ASC' },
        });
    }
    async findOne(id) {
        const student = await this.studentsRepository.findOne({
            where: { id },
            relations: ['parent', 'teacher', 'teacher.user'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return student;
    }
    async findByEmail(email) {
        return this.studentsRepository.findOne({
            where: { email },
            relations: ['parent', 'teacher'],
        });
    }
    async update(id, updateStudentDto) {
        const student = await this.findOne(id);
        if (updateStudentDto.email && updateStudentDto.email !== student.email) {
            const existing = await this.findByEmail(updateStudentDto.email);
            if (existing) {
                throw new common_1.ConflictException('A student with this email already exists');
            }
        }
        Object.assign(student, updateStudentDto);
        return this.studentsRepository.save(student);
    }
    async unassignFromTeacher(id) {
        await this.studentsRepository.update(id, {
            teacherId: null,
            isAssigned: false,
        });
    }
    async remove(id) {
        const student = await this.findOne(id);
        await this.studentsRepository.remove(student);
    }
    async getStats() {
        const total = await this.studentsRepository.count();
        const active = await this.studentsRepository.count({ where: { status: 'active' } });
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newStudentsThisMonth = await this.studentsRepository
            .createQueryBuilder('student')
            .where('student.createdAt >= :firstDay', { firstDay: firstDayOfMonth })
            .getCount();
        const avgAttendance = await this.studentsRepository
            .createQueryBuilder('student')
            .select('AVG(student.attendanceRate)', 'avg')
            .getRawOne();
        return {
            total,
            active,
            inactive: total - active,
            newStudentsThisMonth,
            averageAttendance: parseFloat(avgAttendance?.avg || '0'),
        };
    }
    async changeStatus(id, status, reason, notes, adminId) {
        const student = await this.findOne(id);
        student.status = status;
        student.statusChangeReason = reason;
        student.statusNotes = notes;
        student.statusChangedAt = new Date();
        const admin = await this.usersService.findOne(adminId).catch(() => null);
        student.statusChangedBy = admin ? admin.name : 'System Admin';
        return this.studentsRepository.save(student);
    }
    async delegateStudentToTeacher(delegateDto) {
        const { studentId, teacherId, startTime, endTime, className, meetingLink } = delegateDto;
        const student = await this.findOne(studentId);
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        student.teacherId = teacherId;
        await this.studentsRepository.save(student);
        const schedule = this.schedulesRepository.create({
            studentId,
            teacherId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            className: className || 'Quran Class',
            meetingLink,
        });
        const savedSchedule = await this.schedulesRepository.save(schedule);
        return {
            message: 'Student successfully delegated to teacher',
            student,
            schedule: savedSchedule,
        };
    }
    async resetPassword(studentId, newPassword) {
        const student = await this.findOne(studentId);
        if (!student.userId) {
            const user = await this.usersService.create({
                email: student.email,
                password: newPassword,
                name: student.fullName,
                role: user_role_enum_1.UserRole.STUDENT,
                isActive: true,
            });
            await this.studentsRepository.update(studentId, { userId: user.id });
            return;
        }
        await this.usersService.update(student.userId, { password: newPassword }, {
            role: user_role_enum_1.UserRole.SUPER_ADMIN,
        });
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(2, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService])
], StudentsService);
//# sourceMappingURL=students.service.js.map
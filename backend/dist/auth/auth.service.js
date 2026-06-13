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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const users_service_1 = require("../users/users.service");
const parents_service_1 = require("../parents/parents.service");
const students_service_1 = require("../students/students.service");
const student_entity_1 = require("../students/entities/student.entity");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const gender_enum_1 = require("../common/enums/gender.enum");
const student_entity_2 = require("../students/entities/student.entity");
let AuthService = class AuthService {
    constructor(usersService, parentsService, studentsService, jwtService, studentsRepository) {
        this.usersService = usersService;
        this.parentsService = parentsService;
        this.studentsService = studentsService;
        this.jwtService = jwtService;
        this.studentsRepository = studentsRepository;
    }
    async register(registerDto) {
        try {
            console.log('[AuthService] Starting registration process...');
            const { student, parent, parentId } = registerDto;
            if (student.password !== student.confirmPassword) {
                throw new common_1.BadRequestException('Student passwords do not match');
            }
            if (student.ageRange === student_entity_2.AgeRange.UNDER_18 && parent) {
                if (parent.password !== parent.confirmPassword) {
                    throw new common_1.BadRequestException('Parent passwords do not match');
                }
            }
            console.log('[AuthService] Checking if student email exists:', student.email);
            const existingStudentUser = await this.usersService.findByEmail(student.email);
            if (existingStudentUser) {
                const existingProfile = await this.studentsRepository.findOne({
                    where: { userId: existingStudentUser.id },
                });
                if (existingProfile) {
                    throw new common_1.ConflictException('A student with this email is already registered. Please log in instead.');
                }
                if (existingStudentUser.role !== user_role_enum_1.UserRole.STUDENT) {
                    throw new common_1.ConflictException(`The student email "${student.email}" is already used by a ${this.roleLabel(existingStudentUser.role)} account. Please use a different email for the student.`);
                }
            }
            let parentEntity = null;
            let parentMessage = 'Adult student, no parent linked.';
            if (student.ageRange === student_entity_2.AgeRange.UNDER_18) {
                if (parentId) {
                    console.log('[AuthService] Linking to existing parent:', parentId);
                    parentEntity = await this.parentsService.findOne(parentId);
                    parentMessage = 'Student linked to the existing parent account.';
                }
                else {
                    if (!parent) {
                        throw new common_1.BadRequestException('Parent information is required for students under 18.');
                    }
                    console.log('[AuthService] Resolving parent for registration:', parent.email, parent.phoneNumber);
                    const parentResult = await this.parentsService.findOrCreateForRegistration({
                        fullName: parent.fullName,
                        email: parent.email,
                        phoneNumber: parent.phoneNumber,
                        residency: parent.residency || parent.country || 'Not specified',
                        country: parent.country,
                        city: parent.city,
                        relationshipWithStudent: parent.relationshipWithStudent,
                        password: parent.password,
                    });
                    parentEntity = parentResult.parent;
                    parentMessage = parentResult.message;
                }
                console.log('[AuthService] Parent resolved:', parentEntity.id, parentMessage);
            }
            let studentUser = existingStudentUser;
            if (!studentUser) {
                console.log('[AuthService] Creating student user...');
                studentUser = await this.usersService.create({
                    email: student.email,
                    password: student.password,
                    name: student.fullName,
                    role: user_role_enum_1.UserRole.STUDENT,
                });
                console.log('[AuthService] Student user created:', studentUser.id);
            }
            else {
                console.log('[AuthService] Reusing existing student user from prior attempt:', studentUser.id);
            }
            console.log('[AuthService] Creating student profile...');
            const createdStudent = await this.studentsService.create({
                fullName: student.fullName,
                gender: student.gender.toLowerCase() === 'male' ? gender_enum_1.Gender.MALE : gender_enum_1.Gender.FEMALE,
                ageRange: student.ageRange,
                currentResidency: student.residency,
                country: student.country,
                city: student.city,
                phone: student.phone,
                level: student.levelOfQuran,
                kitabRequested: student.kitabRequested,
                kitabName: student.kitabName,
                previousTraining: student.previousTraining,
                trainingDetails: student.trainingDetails,
                referralSource: student.referralSource,
                email: student.email,
                userId: studentUser.id,
                parentId: parentEntity ? parentEntity.id : null,
                status: student_entity_2.StudentStatus.ACTIVE,
                attendanceRate: 0,
                progressRate: 0,
            });
            console.log('[AuthService] Student profile created successfully');
            const payload = { sub: studentUser.id, email: studentUser.email, role: studentUser.role };
            console.log('[AuthService] Registration completed successfully');
            return {
                message: 'Registration successful!',
                parentStatus: parentMessage,
                access_token: this.jwtService.sign(payload),
                user: {
                    id: studentUser.id,
                    email: studentUser.email,
                    name: studentUser.name,
                    role: studentUser.role,
                    studentId: createdStudent.id,
                },
            };
        }
        catch (error) {
            console.error('[AuthService] Registration error:', error.message);
            console.error('[AuthService] Error stack:', error.stack);
            throw error;
        }
    }
    async login(loginDto) {
        const { email: identifier, password } = loginDto;
        console.log(`[AuthService] Attempting login for: ${identifier}`);
        let user = await this.usersService.findByEmail(identifier);
        if (!user) {
            const student = await this.studentsRepository.findOne({
                where: [{ email: identifier }, { familyPhone: identifier }],
                relations: ['user'],
            });
            if (student?.userId) {
                try {
                    user = await this.usersService.findOne(student.userId);
                }
                catch {
                    throw new common_1.UnauthorizedException('Invalid credentials');
                }
            }
        }
        if (!user) {
            console.log(`[AuthService] User not found: ${identifier}`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        console.log(`[AuthService] User found. ID: ${user.id}, Role: ${user.role}, IsActive: ${user.isActive}`);
        if (!user.password) {
            console.error(`[AuthService] CRITICAL: Password field is missing on user object from database!`);
        }
        console.log(`[AuthService] Stored Hash: ${user.password}`);
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`[AuthService] Password valid: ${isPasswordValid}`);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is inactive');
        }
        const payload = { sub: user.id, email: user.email, role: user.role };
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
        if (user.role === user_role_enum_1.UserRole.STUDENT) {
            const student = await this.studentsRepository.findOne({
                where: { userId: user.id },
            });
            if (student) {
                userResponse.studentId = student.id;
            }
        }
        return {
            access_token: this.jwtService.sign(payload),
            user: userResponse,
        };
    }
    roleLabel(role) {
        const labels = {
            [user_role_enum_1.UserRole.ADMIN]: 'Admin',
            [user_role_enum_1.UserRole.SUPER_ADMIN]: 'Admin',
            [user_role_enum_1.UserRole.TEACHER]: 'Teacher',
            [user_role_enum_1.UserRole.STUDENT]: 'Student',
            [user_role_enum_1.UserRole.PARENT]: 'Parent',
            [user_role_enum_1.UserRole.FINANCE_MANAGER]: 'Finance Manager',
            [user_role_enum_1.UserRole.QIRAT_MANAGER]: 'Qirat Manager',
        };
        return labels[role] || role;
    }
    async checkStudentEmail(email) {
        const normalized = (email || '').trim();
        if (!normalized) {
            return { available: false, message: 'Email is required.' };
        }
        const existingUser = await this.usersService.findByEmail(normalized);
        if (!existingUser) {
            return { available: true, message: null };
        }
        if (existingUser.role !== user_role_enum_1.UserRole.STUDENT) {
            return {
                available: false,
                message: `This email is already used by a ${this.roleLabel(existingUser.role)} account. Please use a different email for the student.`,
            };
        }
        const existingProfile = await this.studentsRepository.findOne({
            where: { userId: existingUser.id },
        });
        if (existingProfile) {
            return {
                available: false,
                message: 'A student with this email is already registered. Please log in instead.',
            };
        }
        return { available: true, message: null };
    }
    toParentSearchResult(parent) {
        return {
            id: parent.id,
            fullName: parent.fullName,
            email: parent.email,
            phoneNumber: parent.phoneNumber || null,
            childrenCount: parent.students?.length || 0,
        };
    }
    async lookupParentsForRegistration(query) {
        const trimmed = (query || '').trim();
        if (trimmed.length < 3) {
            return [];
        }
        const results = new Map();
        const byEmail = await this.parentsService.findByEmail(trimmed.toLowerCase());
        if (byEmail)
            results.set(byEmail.id, byEmail);
        const byPhone = await this.parentsService.findByPhone(trimmed);
        if (byPhone)
            results.set(byPhone.id, byPhone);
        const matches = await this.parentsService.search(trimmed);
        for (const match of matches) {
            results.set(match.id, match);
        }
        return Array.from(results.values()).map((p) => this.toParentSearchResult(p));
    }
    async checkParentDuplicate(email, phoneNumber) {
        let match = null;
        if (email?.trim()) {
            match = await this.parentsService.findByEmail(email.trim().toLowerCase());
        }
        if (!match && phoneNumber?.trim()) {
            match = await this.parentsService.findByPhone(phoneNumber.trim());
        }
        if (match) {
            return {
                exists: true,
                parent: this.toParentSearchResult(match),
                conflict: false,
                message: null,
            };
        }
        if (email?.trim()) {
            const existingUser = await this.usersService.findByEmail(email.trim());
            if (existingUser && existingUser.role !== user_role_enum_1.UserRole.PARENT) {
                return {
                    exists: false,
                    parent: null,
                    conflict: true,
                    message: `This email is already used by a ${this.roleLabel(existingUser.role)} account. Please use a different email for the parent.`,
                };
            }
        }
        return { exists: false, parent: null, conflict: false, message: null };
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.BadRequestException('User with this email does not exist');
        }
        console.log(`Sending password reset link to ${email}`);
        return {
            message: 'Password recovery instructions have been sent to your email.',
        };
    }
    async validateUser(userId) {
        return this.usersService.findOne(userId);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        parents_service_1.ParentsService,
        students_service_1.StudentsService,
        jwt_1.JwtService,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map
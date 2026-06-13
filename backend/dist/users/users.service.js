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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const user_entity_1 = require("./entities/user.entity");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async onModuleInit() {
        await this.seedSuperAdmin();
        await this.seedDemoAccounts();
    }
    async seedDemoAccounts() {
        const demoAccounts = [
            { email: 'admin@nejah.com', password: 'Admin123', name: 'Admin User', role: user_role_enum_1.UserRole.ADMIN },
            {
                email: 'teacher@nejah.com',
                password: 'Teacher123',
                name: 'Demo Teacher',
                role: user_role_enum_1.UserRole.TEACHER,
            },
            {
                email: 'student@nejah.com',
                password: 'Student123',
                name: 'Demo Student',
                role: user_role_enum_1.UserRole.STUDENT,
            },
            {
                email: 'parent@nejah.com',
                password: 'Parent123',
                name: 'Demo Parent',
                role: user_role_enum_1.UserRole.PARENT,
            },
        ];
        for (const account of demoAccounts) {
            const existing = await this.findByEmail(account.email);
            if (!existing) {
                const hashedPassword = await bcrypt.hash(account.password, 10);
                await this.usersRepository.save(this.usersRepository.create({
                    ...account,
                    password: hashedPassword,
                    isActive: true,
                }));
            }
        }
    }
    async seedSuperAdmin() {
        const logFile = path.resolve(process.cwd(), 'seed-log.txt');
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] Checking super admin...\n`);
        const superAdminEmail = 'nejahsuperadmin@gmail.com';
        const existingAdmin = await this.findByEmail(superAdminEmail);
        if (!existingAdmin) {
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] Seeding Super Admin...\n`);
            try {
                const hashedPassword = await bcrypt.hash('SuperAdmin123', 10);
                const superAdmin = this.usersRepository.create({
                    email: superAdminEmail,
                    password: hashedPassword,
                    name: 'Super Administrator',
                    role: user_role_enum_1.UserRole.SUPER_ADMIN,
                    isActive: true,
                });
                await this.usersRepository.save(superAdmin);
                fs.appendFileSync(logFile, `[${new Date().toISOString()}] ✅ Super Admin seeded successfully!\n`);
            }
            catch (error) {
                fs.appendFileSync(logFile, `[${new Date().toISOString()}] ❌ Error seeding Super Admin: ${error.message}\n`);
            }
        }
        else {
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] Super Admin already exists. Forcing password update...\n`);
            const hashedPassword = await bcrypt.hash('SuperAdmin123', 10);
            existingAdmin.password = hashedPassword;
            existingAdmin.isActive = true;
            existingAdmin.role = user_role_enum_1.UserRole.SUPER_ADMIN;
            await this.usersRepository.save(existingAdmin);
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] ✅ Super Admin password updated successfully!\n`);
        }
    }
    async create(createUserDto) {
        const existingUser = await this.findByEmail(createUserDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return this.usersRepository.save(user);
    }
    async findAll(queryDto) {
        const { search, role, isActive, page = 1, limit = 10 } = queryDto;
        const where = {};
        if (search) {
            where['name'] = (0, typeorm_2.Like)(`%${search}%`);
        }
        if (role) {
            where['role'] = role;
        }
        if (isActive !== undefined) {
            where['isActive'] = isActive;
        }
        const [users, total] = await this.usersRepository.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
            select: [
                'id',
                'email',
                'name',
                'role',
                'phone',
                'avatar',
                'isActive',
                'createdAt',
                'updatedAt',
            ],
        });
        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const user = await this.usersRepository.findOne({
            where: { id },
            select: [
                'id',
                'email',
                'name',
                'role',
                'phone',
                'avatar',
                'isActive',
                'createdAt',
                'updatedAt',
            ],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async update(id, updateUserDto, currentUser) {
        const user = await this.findOne(id);
        if (user.role === user_role_enum_1.UserRole.SUPER_ADMIN && currentUser.role !== user_role_enum_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('You cannot modify a SUPER_ADMIN user');
        }
        if (updateUserDto.role === user_role_enum_1.UserRole.SUPER_ADMIN && currentUser.role !== user_role_enum_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN role');
        }
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.findByEmail(updateUserDto.email);
            if (existingUser) {
                throw new common_1.ConflictException('Email already exists');
            }
        }
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        Object.assign(user, updateUserDto);
        return this.usersRepository.save(user);
    }
    async remove(id, currentUser) {
        const user = await this.findOne(id);
        if (user.role === user_role_enum_1.UserRole.SUPER_ADMIN && currentUser.role !== user_role_enum_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('You cannot delete a SUPER_ADMIN user');
        }
        if (user.id === currentUser.id) {
            throw new common_1.BadRequestException('You cannot delete your own account');
        }
        await this.usersRepository.remove(user);
    }
    async toggleStatus(id, currentUser) {
        const user = await this.findOne(id);
        if (user.role === user_role_enum_1.UserRole.SUPER_ADMIN && currentUser.role !== user_role_enum_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('You cannot deactivate a SUPER_ADMIN user');
        }
        user.isActive = !user.isActive;
        return this.usersRepository.save(user);
    }
    async changePassword(userId, changePasswordDto) {
        const { currentPassword, newPassword, confirmPassword } = changePasswordDto;
        if (newPassword !== confirmPassword) {
            throw new common_1.BadRequestException('New passwords do not match');
        }
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await this.usersRepository.save(user);
    }
    async getProfile(userId) {
        return this.findOne(userId);
    }
    async updateProfile(userId, updateDto) {
        const user = await this.findOne(userId);
        if (updateDto.role) {
            delete updateDto.role;
        }
        if (updateDto.email && updateDto.email !== user.email) {
            const existingUser = await this.findByEmail(updateDto.email);
            if (existingUser) {
                throw new common_1.ConflictException('Email already exists');
            }
        }
        Object.assign(user, updateDto);
        return this.usersRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map
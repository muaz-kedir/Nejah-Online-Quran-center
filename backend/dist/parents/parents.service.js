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
exports.ParentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const parent_entity_1 = require("./entities/parent.entity");
const users_service_1 = require("../users/users.service");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let ParentsService = class ParentsService {
    constructor(parentsRepository, usersService) {
        this.parentsRepository = parentsRepository;
        this.usersService = usersService;
    }
    resolveResidency(dto) {
        return dto.residency?.trim() || dto.country?.trim() || 'Not specified';
    }
    async findByPhone(phoneNumber) {
        return this.parentsRepository.findOne({
            where: { phoneNumber },
            relations: ['user', 'students'],
        });
    }
    async createProfileForExistingUser(user, dto) {
        const linked = await this.parentsRepository.findOne({
            where: { user: { id: user.id } },
            relations: ['user', 'students'],
        });
        if (linked) {
            return linked;
        }
        const { password, ...parentData } = dto;
        const parent = this.parentsRepository.create({
            ...parentData,
            residency: this.resolveResidency(dto),
            user: { id: user.id },
        });
        return this.parentsRepository.save(parent);
    }
    async findOrCreateForRegistration(dto) {
        const existingByEmail = await this.findByEmail(dto.email);
        if (existingByEmail) {
            return {
                parent: existingByEmail,
                message: 'Existing parent found. Student will be connected to the existing parent account.',
            };
        }
        if (dto.phoneNumber) {
            const existingByPhone = await this.findByPhone(dto.phoneNumber);
            if (existingByPhone) {
                return {
                    parent: existingByPhone,
                    message: 'Existing parent found. Student will be connected to the existing parent account.',
                };
            }
        }
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            if (existingUser.role !== user_role_enum_1.UserRole.PARENT) {
                throw new common_1.ConflictException(`The parent email "${dto.email}" is already used by a ${existingUser.role} account. Please use a different email for the parent.`);
            }
            const parent = await this.createProfileForExistingUser(existingUser, dto);
            return {
                parent,
                message: 'Existing parent account linked. Student will be connected to the existing parent account.',
            };
        }
        const parent = await this.create(dto);
        return { parent, message: 'New parent account created.' };
    }
    async search(searchQuery) {
        if (!searchQuery || searchQuery.trim() === '') {
            return [];
        }
        const query = this.parentsRepository
            .createQueryBuilder('parent')
            .leftJoinAndSelect('parent.user', 'user')
            .leftJoinAndSelect('parent.students', 'students')
            .where('(LOWER(parent.fullName) LIKE LOWER(:search) OR LOWER(parent.email) LIKE LOWER(:search) OR LOWER(parent.phoneNumber) LIKE LOWER(:search))', { search: `%${searchQuery}%` })
            .orderBy('parent.fullName', 'ASC')
            .take(10);
        return query.getMany();
    }
    async create(createParentDto) {
        const existing = await this.findByEmail(createParentDto.email);
        if (existing) {
            throw new common_1.ConflictException('A parent with this email already exists');
        }
        const existingUser = await this.usersService.findByEmail(createParentDto.email);
        if (existingUser) {
            if (existingUser.role === user_role_enum_1.UserRole.PARENT) {
                return this.createProfileForExistingUser(existingUser, createParentDto);
            }
            throw new common_1.ConflictException('Email already exists');
        }
        const { password, ...parentData } = createParentDto;
        const user = await this.usersService.create({
            email: createParentDto.email,
            password: password || 'TemporaryPassword123!',
            name: createParentDto.fullName,
            role: user_role_enum_1.UserRole.PARENT,
            phone: createParentDto.phoneNumber,
        });
        const parent = this.parentsRepository.create({
            ...parentData,
            residency: this.resolveResidency(createParentDto),
            user,
        });
        return this.parentsRepository.save(parent);
    }
    async findByEmail(email) {
        return this.parentsRepository.findOne({
            where: { email },
            relations: ['user', 'students'],
        });
    }
    async findAll(queryDto) {
        const { search, status, page = 1, limit = 5 } = queryDto;
        const where = {};
        if (status) {
            where.status = status;
        }
        const [data, total] = await this.parentsRepository.findAndCount({
            where,
            relations: ['user', 'students'],
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });
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
        const parent = await this.parentsRepository.findOne({
            where: { id },
            relations: ['user', 'students', 'students.user'],
        });
        if (!parent) {
            throw new common_1.NotFoundException('Parent not found');
        }
        return parent;
    }
    async update(id, updateParentDto) {
        const parent = await this.findOne(id);
        if (updateParentDto.email && updateParentDto.email !== parent.email) {
            const existing = await this.findByEmail(updateParentDto.email);
            if (existing) {
                throw new common_1.ConflictException('A parent with this email already exists');
            }
        }
        if (parent.user && (updateParentDto.email || updateParentDto.fullName)) {
            await this.usersService.update(parent.user.id, {
                email: updateParentDto.email,
                name: updateParentDto.fullName,
                phone: updateParentDto.phoneNumber,
            }, parent.user);
        }
        Object.assign(parent, updateParentDto);
        return this.parentsRepository.save(parent);
    }
    async remove(id) {
        const parent = await this.findOne(id);
        if (parent.students && parent.students.length > 0) {
            throw new common_1.BadRequestException('Cannot delete parent with linked students. Please reassign or remove students first.');
        }
        await this.parentsRepository.remove(parent);
    }
    async getParentStudents(id) {
        const parent = await this.findOne(id);
        return parent.students;
    }
    async assignStudentToParent(parentId, studentId) {
        const parent = await this.findOne(parentId);
        return parent;
    }
    async getStats() {
        const total = await this.parentsRepository.count();
        const active = await this.parentsRepository.count({ where: { status: 'active' } });
        return {
            total,
            active,
            inactive: total - active,
        };
    }
};
exports.ParentsService = ParentsService;
exports.ParentsService = ParentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], ParentsService);
//# sourceMappingURL=parents.service.js.map
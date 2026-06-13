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
exports.ResourcesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const resources_entity_1 = require("./resources.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const user_entity_1 = require("../users/entities/user.entity");
let ResourcesService = class ResourcesService {
    constructor(resourcesRepository, studentRepository, teacherRepository, userRepository) {
        this.resourcesRepository = resourcesRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
    }
    async findAll(studentId, search, category) {
        const qb = this.resourcesRepository.createQueryBuilder('resource');
        if (studentId) {
            qb.andWhere('resource.status = :status', { status: resources_entity_1.ResourceStatus.ACTIVE });
        }
        if (search) {
            qb.andWhere('LOWER(resource.title) LIKE LOWER(:search) OR LOWER(resource.description) LIKE LOWER(:search) OR LOWER(resource.tags) LIKE LOWER(:search)', { search: `%${search}%` });
        }
        if (category) {
            qb.andWhere('resource.category = :category', { category });
        }
        return qb.orderBy('resource.createdAt', 'DESC').getMany();
    }
    async findOne(id) {
        const resource = await this.resourcesRepository.findOne({ where: { id } });
        if (!resource) {
            throw new common_1.NotFoundException('Resource not found');
        }
        return resource;
    }
    async incrementDownloadCount(id) {
        const resource = await this.findOne(id);
        resource.downloadCount += 1;
        resource.lastDownloadedAt = new Date();
        return this.resourcesRepository.save(resource);
    }
    async create(dto) {
        const resource = this.resourcesRepository.create(dto);
        return this.resourcesRepository.save(resource);
    }
    async update(id, dto) {
        const resource = await this.findOne(id);
        Object.assign(resource, dto);
        return this.resourcesRepository.save(resource);
    }
    async remove(id) {
        const resource = await this.findOne(id);
        await this.resourcesRepository.remove(resource);
    }
    async getCategories() {
        return Object.values(resources_entity_1.ResourceCategory);
    }
};
exports.ResourcesService = ResourcesService;
exports.ResourcesService = ResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(resources_entity_1.Resource)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ResourcesService);
//# sourceMappingURL=resources.service.js.map
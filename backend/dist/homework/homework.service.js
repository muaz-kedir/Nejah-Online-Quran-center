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
exports.HomeworkService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const homework_entity_1 = require("./entities/homework.entity");
const student_entity_1 = require("../students/entities/student.entity");
let HomeworkService = class HomeworkService {
    constructor(homeworkRepository, studentRepository) {
        this.homeworkRepository = homeworkRepository;
        this.studentRepository = studentRepository;
    }
    async create(dto, assignedByTeacherId, replacementAssignmentId) {
        const student = await this.studentRepository.findOne({
            where: { id: dto.studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const homework = this.homeworkRepository.create({
            title: dto.title,
            description: dto.description,
            difficulty: dto.difficulty,
            dueDate: new Date(dto.dueDate),
            studentId: dto.studentId,
            status: homework_entity_1.HomeworkStatus.PENDING,
            assignedByTeacherId,
            replacementAssignmentId,
        });
        return this.homeworkRepository.save(homework);
    }
    async findByStudent(studentId) {
        return this.homeworkRepository.find({
            where: { studentId },
            relations: ['student'],
            order: { dueDate: 'ASC' },
        });
    }
    async findOne(id) {
        const homework = await this.homeworkRepository.findOne({ where: { id } });
        if (!homework) {
            throw new common_1.NotFoundException('Homework not found');
        }
        return homework;
    }
    async updateStatus(id, status) {
        const homework = await this.findOne(id);
        homework.status = status;
        return this.homeworkRepository.save(homework);
    }
    async remove(id) {
        const homework = await this.findOne(id);
        await this.homeworkRepository.remove(homework);
    }
};
exports.HomeworkService = HomeworkService;
exports.HomeworkService = HomeworkService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(homework_entity_1.Homework)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], HomeworkService);
//# sourceMappingURL=homework.service.js.map
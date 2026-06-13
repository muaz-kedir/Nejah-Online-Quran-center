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
exports.ExamsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const exam_entity_1 = require("./entities/exam.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const progress_entity_1 = require("../progress/entities/progress.entity");
let ExamsService = class ExamsService {
    constructor(examsRepository, studentsRepository, teachersRepository, progressRepository) {
        this.examsRepository = examsRepository;
        this.studentsRepository = studentsRepository;
        this.teachersRepository = teachersRepository;
        this.progressRepository = progressRepository;
    }
    async create(createExamDto) {
        const student = await this.studentsRepository.findOne({
            where: { id: createExamDto.studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const teacher = createExamDto.teacherId
            ? await this.teachersRepository.findOne({ where: { id: createExamDto.teacherId } })
            : null;
        const progress = createExamDto.progressId
            ? await this.progressRepository.findOne({ where: { id: createExamDto.progressId } })
            : null;
        const exam = this.examsRepository.create({
            title: createExamDto.title,
            description: createExamDto.description,
            scheduledDate: createExamDto.scheduledDate,
            durationMinutes: createExamDto.durationMinutes,
            difficulty: createExamDto.difficulty,
            status: createExamDto.status,
            studentId: createExamDto.studentId,
            teacherId: createExamDto.teacherId || null,
            progressId: createExamDto.progressId || null,
            correctAnswers: createExamDto.correctAnswers ? createExamDto.correctAnswers.split(',') : null,
            studentAnswers: createExamDto.studentAnswers ? createExamDto.studentAnswers.split(',') : null,
        });
        return this.examsRepository.save(exam);
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const where = {};
        if (query.studentId) {
            where.studentId = query.studentId;
        }
        if (query.teacherId) {
            where.teacherId = query.teacherId;
        }
        if (query.status) {
            where.status = query.status;
        }
        const [exams, total] = await this.examsRepository.findAndCount({
            where,
            relations: ['student', 'teacher', 'progress'],
            skip: (page - 1) * limit,
            take: limit,
            order: { scheduledDate: 'DESC' },
        });
        return {
            data: exams,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const exam = await this.examsRepository.findOne({
            where: { id },
            relations: ['student', 'teacher', 'progress'],
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        return exam;
    }
    async update(id, updateExamDto) {
        const exam = await this.findOne(id);
        if (updateExamDto.score !== undefined && updateExamDto.score !== null) {
            exam.status = exam_entity_1.ExamStatus.COMPLETED;
            exam.isGraded = true;
        }
        Object.assign(exam, updateExamDto);
        return this.examsRepository.save(exam);
    }
    async remove(id) {
        const exam = await this.findOne(id);
        await this.examsRepository.remove(exam);
    }
    async gradeExam(id, score, maxScore, feedback) {
        const exam = await this.findOne(id);
        if (exam.status !== exam_entity_1.ExamStatus.IN_PROGRESS && exam.status !== exam_entity_1.ExamStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Exam must be in progress or scheduled to be graded');
        }
        exam.score = score;
        exam.maxScore = maxScore;
        exam.feedback = feedback;
        exam.isGraded = true;
        exam.status = exam_entity_1.ExamStatus.COMPLETED;
        return this.examsRepository.save(exam);
    }
};
exports.ExamsService = ExamsService;
exports.ExamsService = ExamsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(exam_entity_1.Exam)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(3, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ExamsService);
//# sourceMappingURL=exams.service.js.map
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
exports.TeacherApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const teacher_application_entity_1 = require("./entities/teacher-application.entity");
const teacher_application_settings_entity_1 = require("./entities/teacher-application-settings.entity");
const review_teacher_application_dto_1 = require("./dto/review-teacher-application.dto");
const teachers_service_1 = require("../teachers/teachers.service");
const email_service_1 = require("../email/email.service");
const crypto_1 = require("crypto");
let TeacherApplicationsService = class TeacherApplicationsService {
    constructor(applicationRepository, settingsRepository, teachersService, emailService) {
        this.applicationRepository = applicationRepository;
        this.settingsRepository = settingsRepository;
        this.teachersService = teachersService;
        this.emailService = emailService;
    }
    async getSettings() {
        let settings = await this.settingsRepository.findOne({ where: { id: 1 } });
        if (!settings) {
            settings = this.settingsRepository.create({ id: 1, isApplicationsOpen: false });
            await this.settingsRepository.save(settings);
        }
        return settings;
    }
    async toggleApplicationsOpen(isOpen) {
        const settings = await this.getSettings();
        settings.isApplicationsOpen = isOpen;
        return this.settingsRepository.save(settings);
    }
    async submit(dto) {
        const settings = await this.getSettings();
        if (!settings.isApplicationsOpen) {
            throw new common_1.BadRequestException('Teacher applications are currently closed.');
        }
        const existing = await this.applicationRepository.findOne({
            where: { email: dto.email, status: teacher_application_entity_1.ApplicationStatus.PENDING_REVIEW },
        });
        if (existing) {
            throw new common_1.ConflictException('An application with this email is already pending review');
        }
        const applicationNumber = this.generateApplicationNumber();
        const application = this.applicationRepository.create({
            ...dto,
            applicationNumber,
            status: teacher_application_entity_1.ApplicationStatus.PENDING_REVIEW,
        });
        const saved = await this.applicationRepository.save(application);
        await this.emailService.sendApplicationReceived(saved.email, saved.fullName, saved.applicationNumber);
        return saved;
    }
    async trackApplication(email, applicationNumber) {
        const application = await this.applicationRepository.findOne({
            where: { email, applicationNumber },
        });
        if (!application) {
            throw new common_1.NotFoundException('No application found with the provided email and application number');
        }
        return {
            status: application.status,
            applicationNumber: application.applicationNumber,
            appliedAt: application.createdAt,
        };
    }
    async findAll(queryDto) {
        const { search, status, page = 1, limit = 10 } = queryDto;
        const qb = this.applicationRepository
            .createQueryBuilder('app')
            .orderBy('app.createdAt', 'DESC');
        if (search) {
            qb.andWhere('(LOWER(app.fullName) LIKE LOWER(:search) OR LOWER(app.email) LIKE LOWER(:search) OR app.applicationNumber LIKE :search)', { search: `%${search}%` });
        }
        if (status && status !== 'all') {
            qb.andWhere('app.status = :status', { status });
        }
        qb.skip((page - 1) * limit).take(limit);
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
        const application = await this.applicationRepository.findOne({
            where: { id },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        return application;
    }
    async getStats() {
        const total = await this.applicationRepository.count();
        const pending = await this.applicationRepository.count({
            where: { status: teacher_application_entity_1.ApplicationStatus.PENDING_REVIEW },
        });
        const approved = await this.applicationRepository.count({
            where: { status: teacher_application_entity_1.ApplicationStatus.APPROVED },
        });
        const rejected = await this.applicationRepository.count({
            where: { status: teacher_application_entity_1.ApplicationStatus.REJECTED },
        });
        const moreInfo = await this.applicationRepository.count({
            where: { status: teacher_application_entity_1.ApplicationStatus.MORE_INFO_REQUIRED },
        });
        return { total, pending, approved, rejected, moreInfo };
    }
    async review(id, dto, reviewerId) {
        const application = await this.findOne(id);
        if (application.status === teacher_application_entity_1.ApplicationStatus.APPROVED) {
            throw new common_1.BadRequestException('This application has already been approved');
        }
        application.reviewedBy = reviewerId;
        application.reviewedAt = new Date();
        if (dto.adminNotes) {
            application.adminNotes = dto.adminNotes;
        }
        switch (dto.action) {
            case review_teacher_application_dto_1.ReviewAction.APPROVE:
                return this.approveApplication(application);
            case review_teacher_application_dto_1.ReviewAction.REJECT:
                application.status = teacher_application_entity_1.ApplicationStatus.REJECTED;
                application.rejectionReason = dto.rejectionReason || '';
                const rejected = await this.applicationRepository.save(application);
                await this.emailService.sendApplicationRejected(application.email, application.fullName, application.rejectionReason);
                return rejected;
            case review_teacher_application_dto_1.ReviewAction.REQUEST_INFO:
                application.status = teacher_application_entity_1.ApplicationStatus.MORE_INFO_REQUIRED;
                application.infoRequestMessage = dto.infoRequestMessage || '';
                const updated = await this.applicationRepository.save(application);
                await this.emailService.sendMoreInfoRequired(application.email, application.fullName, application.infoRequestMessage);
                return updated;
            default:
                throw new common_1.BadRequestException('Invalid review action');
        }
    }
    async approveApplication(application) {
        const userPassword = application.password || this.generateTempPassword();
        try {
            const teacher = await this.teachersService.create({
                fullName: application.fullName,
                email: application.email,
                password: userPassword,
                gender: application.gender,
                phoneNumber: application.phoneNumber,
                country: application.country,
                city: application.city,
                streetAddress: application.streetAddress,
                dateOfBirth: application.dateOfBirth,
                languages: application.languages,
                internetConnectionType: application.internetConnectionType,
                qiratEducationLevel: application.qiratEducationLevel,
                islamicEducationLevel: application.islamicEducationLevel,
                teachingTimeAvailability: application.teachingTimeAvailability,
                marketingSource: application.marketingSource,
                additionalComments: application.additionalComments,
                status: 'active',
            });
            application.status = teacher_application_entity_1.ApplicationStatus.APPROVED;
            application.createdTeacherId = teacher.id;
            const saved = await this.applicationRepository.save(application);
            await this.emailService.sendApplicationApproved(application.email, application.fullName, application.email, application.password ? '(The password you created during application)' : userPassword);
            return saved;
        }
        catch (err) {
            throw new common_1.BadRequestException(`Failed to create teacher account: ${err.message}`);
        }
    }
    generateApplicationNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = (0, crypto_1.randomBytes)(3).toString('hex').toUpperCase();
        return `NJH-${timestamp}-${random}`;
    }
    generateTempPassword() {
        return (0, crypto_1.randomBytes)(4).toString('hex') + '!A1';
    }
};
exports.TeacherApplicationsService = TeacherApplicationsService;
exports.TeacherApplicationsService = TeacherApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(teacher_application_entity_1.TeacherApplication)),
    __param(1, (0, typeorm_1.InjectRepository)(teacher_application_settings_entity_1.TeacherApplicationSettings)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        teachers_service_1.TeachersService,
        email_service_1.EmailService])
], TeacherApplicationsService);
//# sourceMappingURL=teacher-applications.service.js.map
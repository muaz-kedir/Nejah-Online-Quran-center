import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherApplication, ApplicationStatus } from './entities/teacher-application.entity';
import { TeacherApplicationSettings } from './entities/teacher-application-settings.entity';
import { CreateTeacherApplicationDto } from './dto/create-teacher-application.dto';
import { ReviewTeacherApplicationDto, ReviewAction } from './dto/review-teacher-application.dto';
import { QueryTeacherApplicationDto } from './dto/query-teacher-application.dto';
import { TeachersService } from '../teachers/teachers.service';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class TeacherApplicationsService {
  constructor(
    @InjectRepository(TeacherApplication)
    private applicationRepository: Repository<TeacherApplication>,
    @InjectRepository(TeacherApplicationSettings)
    private settingsRepository: Repository<TeacherApplicationSettings>,
    private teachersService: TeachersService,
    private emailService: EmailService,
  ) {}

  // ── Settings ──────────────────────────────────────────────────────

  async getSettings(): Promise<TeacherApplicationSettings> {
    try {
      let settings = await this.settingsRepository.findOne({ where: { id: 1 } });
      if (!settings) {
        settings = this.settingsRepository.create({ id: 1, isApplicationsOpen: false });
        await this.settingsRepository.save(settings);
      }
      return settings;
    } catch (error) {
      console.error('[TeacherApplicationsService] getSettings failed:', error);
      return { id: 1, isApplicationsOpen: false } as TeacherApplicationSettings;
    }
  }

  async toggleApplicationsOpen(isOpen: boolean): Promise<TeacherApplicationSettings> {
    const settings = await this.getSettings();
    settings.isApplicationsOpen = isOpen;
    return this.settingsRepository.save(settings);
  }

  // ── Public ────────────────────────────────────────────────────────

  async submit(dto: CreateTeacherApplicationDto): Promise<TeacherApplication> {
    const settings = await this.getSettings();
    if (!settings.isApplicationsOpen) {
      throw new BadRequestException('Teacher applications are currently closed.');
    }

    // Check duplicate email
    const existing = await this.applicationRepository.findOne({
      where: { email: dto.email, status: ApplicationStatus.PENDING_REVIEW },
    });
    if (existing) {
      throw new ConflictException('An application with this email is already pending review');
    }

    const applicationNumber = this.generateApplicationNumber();

    const application = this.applicationRepository.create({
      ...dto,
      applicationNumber,
      status: ApplicationStatus.PENDING_REVIEW,
    });

    const saved = await this.applicationRepository.save(application);

    // Send confirmation email
    await this.emailService.sendApplicationReceived(
      saved.email,
      saved.fullName,
      saved.applicationNumber,
    );

    return saved;
  }

  async trackApplication(
    email: string,
    applicationNumber: string,
  ): Promise<{ status: string; applicationNumber: string; appliedAt: Date }> {
    const application = await this.applicationRepository.findOne({
      where: { email, applicationNumber },
    });
    if (!application) {
      throw new NotFoundException(
        'No application found with the provided email and application number',
      );
    }
    return {
      status: application.status,
      applicationNumber: application.applicationNumber,
      appliedAt: application.createdAt,
    };
  }

  // ── Admin ─────────────────────────────────────────────────────────

  async findAll(queryDto: QueryTeacherApplicationDto) {
    const { search, status, page = 1, limit = 10 } = queryDto;

    const qb = this.applicationRepository
      .createQueryBuilder('app')
      .orderBy('app.createdAt', 'DESC');

    if (search) {
      qb.andWhere(
        '(LOWER(app.fullName) LIKE LOWER(:search) OR LOWER(app.email) LIKE LOWER(:search) OR app.applicationNumber LIKE :search)',
        { search: `%${search}%` },
      );
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

  async findOne(id: string): Promise<TeacherApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async getStats() {
    const total = await this.applicationRepository.count();
    const pending = await this.applicationRepository.count({
      where: { status: ApplicationStatus.PENDING_REVIEW },
    });
    const approved = await this.applicationRepository.count({
      where: { status: ApplicationStatus.APPROVED },
    });
    const rejected = await this.applicationRepository.count({
      where: { status: ApplicationStatus.REJECTED },
    });
    const moreInfo = await this.applicationRepository.count({
      where: { status: ApplicationStatus.MORE_INFO_REQUIRED },
    });

    return { total, pending, approved, rejected, moreInfo };
  }

  async review(
    id: string,
    dto: ReviewTeacherApplicationDto,
    reviewerId: string,
  ): Promise<TeacherApplication> {
    const application = await this.findOne(id);

    if (application.status === ApplicationStatus.APPROVED) {
      throw new BadRequestException('This application has already been approved');
    }

    application.reviewedBy = reviewerId;
    application.reviewedAt = new Date();
    if (dto.adminNotes) {
      application.adminNotes = dto.adminNotes;
    }

    switch (dto.action) {
      case ReviewAction.APPROVE:
        return this.approveApplication(application);

      case ReviewAction.REJECT:
        application.status = ApplicationStatus.REJECTED;
        application.rejectionReason = dto.rejectionReason || '';
        const rejected = await this.applicationRepository.save(application);
        await this.emailService.sendApplicationRejected(
          application.email,
          application.fullName,
          application.rejectionReason,
        );
        return rejected;

      case ReviewAction.REQUEST_INFO:
        application.status = ApplicationStatus.MORE_INFO_REQUIRED;
        application.infoRequestMessage = dto.infoRequestMessage || '';
        const updated = await this.applicationRepository.save(application);
        await this.emailService.sendMoreInfoRequired(
          application.email,
          application.fullName,
          application.infoRequestMessage,
        );
        return updated;

      default:
        throw new BadRequestException('Invalid review action');
    }
  }

  // ── Private helpers ───────────────────────────────────────────────

  private async approveApplication(application: TeacherApplication): Promise<TeacherApplication> {
    // Use application password or generate a temporary password
    const userPassword = application.password || this.generateTempPassword();

    try {
      // Create teacher via existing service (which also creates the User)
      const teacher = await this.teachersService.create({
        fullName: application.fullName,
        email: application.email,
        password: userPassword,
        gender: application.gender as any,
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

      application.status = ApplicationStatus.APPROVED;
      application.createdTeacherId = teacher.id;

      const saved = await this.applicationRepository.save(application);

      // Send approval email with credentials
      await this.emailService.sendApplicationApproved(
        application.email,
        application.fullName,
        application.email,
        application.password ? '(The password you created during application)' : userPassword,
      );

      return saved;
    } catch (err) {
      throw new BadRequestException(`Failed to create teacher account: ${err.message}`);
    }
  }

  private generateApplicationNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomBytes(3).toString('hex').toUpperCase();
    return `NJH-${timestamp}-${random}`;
  }

  private generateTempPassword(): string {
    return randomBytes(4).toString('hex') + '!A1';
  }
}

import { Repository } from 'typeorm';
import { TeacherApplication } from './entities/teacher-application.entity';
import { TeacherApplicationSettings } from './entities/teacher-application-settings.entity';
import { CreateTeacherApplicationDto } from './dto/create-teacher-application.dto';
import { ReviewTeacherApplicationDto } from './dto/review-teacher-application.dto';
import { QueryTeacherApplicationDto } from './dto/query-teacher-application.dto';
import { TeachersService } from '../teachers/teachers.service';
import { EmailService } from '../email/email.service';
export declare class TeacherApplicationsService {
    private applicationRepository;
    private settingsRepository;
    private teachersService;
    private emailService;
    constructor(applicationRepository: Repository<TeacherApplication>, settingsRepository: Repository<TeacherApplicationSettings>, teachersService: TeachersService, emailService: EmailService);
    getSettings(): Promise<TeacherApplicationSettings>;
    toggleApplicationsOpen(isOpen: boolean): Promise<TeacherApplicationSettings>;
    submit(dto: CreateTeacherApplicationDto): Promise<TeacherApplication>;
    trackApplication(email: string, applicationNumber: string): Promise<{
        status: string;
        applicationNumber: string;
        appliedAt: Date;
    }>;
    findAll(queryDto: QueryTeacherApplicationDto): Promise<{
        data: TeacherApplication[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<TeacherApplication>;
    getStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        moreInfo: number;
    }>;
    review(id: string, dto: ReviewTeacherApplicationDto, reviewerId: string): Promise<TeacherApplication>;
    private approveApplication;
    private generateApplicationNumber;
    private generateTempPassword;
}

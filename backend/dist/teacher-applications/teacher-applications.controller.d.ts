import { TeacherApplicationsService } from './teacher-applications.service';
import { CreateTeacherApplicationDto } from './dto/create-teacher-application.dto';
import { ReviewTeacherApplicationDto } from './dto/review-teacher-application.dto';
import { QueryTeacherApplicationDto } from './dto/query-teacher-application.dto';
export declare class TeacherApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: TeacherApplicationsService);
    getSettings(): Promise<import("./entities/teacher-application-settings.entity").TeacherApplicationSettings>;
    submit(dto: CreateTeacherApplicationDto): Promise<import("./entities/teacher-application.entity").TeacherApplication>;
    uploadDocument(file: Express.Multer.File): {
        url: string;
    };
    trackApplication(email: string, applicationNumber: string): Promise<{
        status: string;
        applicationNumber: string;
        appliedAt: Date;
    }>;
    getStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        moreInfo: number;
    }>;
    toggleSettings(body: {
        isApplicationsOpen: boolean;
    }): Promise<import("./entities/teacher-application-settings.entity").TeacherApplicationSettings>;
    findAll(queryDto: QueryTeacherApplicationDto): Promise<{
        data: import("./entities/teacher-application.entity").TeacherApplication[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<import("./entities/teacher-application.entity").TeacherApplication>;
    review(id: string, dto: ReviewTeacherApplicationDto, req: any): Promise<import("./entities/teacher-application.entity").TeacherApplication>;
}

import { Repository } from 'typeorm';
import { ZoomAnalyticsService } from './zoom-analytics.service';
import { TeachersService } from '../teachers/teachers.service';
import { Parent } from '../parents/entities/parent.entity';
import { Student } from '../students/entities/student.entity';
export declare class ZoomAnalyticsController {
    private readonly zoomAnalyticsService;
    private readonly teachersService;
    private readonly parentRepository;
    private readonly studentRepository;
    constructor(zoomAnalyticsService: ZoomAnalyticsService, teachersService: TeachersService, parentRepository: Repository<Parent>, studentRepository: Repository<Student>);
    getDashboardAnalytics(): Promise<any>;
    getTeacherAnalytics(req: any): Promise<any>;
    getTeacherAnalyticsById(teacherId: string): Promise<any>;
    getStudentAnalytics(req: any, studentId: string): Promise<any>;
    getMonthlyTrends(year: string, month: string): Promise<any>;
    getOverview(): Promise<any>;
}

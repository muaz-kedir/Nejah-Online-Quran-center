import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getSummary(query: any): Promise<any>;
    getStudentPerformance(query: any): Promise<{
        data: import("./reports.service").StudentPerformanceReport[];
        meta: any;
    }>;
    getTeacherActivity(query: any): Promise<{
        data: import("./reports.service").TeacherActivityReport[];
        meta: any;
    }>;
    getAttendanceAnalytics(query: any): Promise<import("./reports.service").AttendanceAnalytics>;
    getProgressAnalytics(query: any): Promise<import("./reports.service").ProgressAnalytics[]>;
    getRegistrationReports(query: any): Promise<import("./reports.service").RegistrationReport[]>;
    getParentActivityReports(query: any): Promise<import("./reports.service").ParentActivityReport[]>;
    getHomeworkReports(query: any): Promise<import("./reports.service").HomeworkReport>;
    getExamReports(query: any): Promise<import("./reports.service").ExamReport>;
    getTeacherReplacementReports(query: any): Promise<import("./reports.service").TeacherReplacementReport>;
}

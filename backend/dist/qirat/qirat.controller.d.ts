import { QiratService } from './qirat.service';
export declare class QiratController {
    private readonly qiratService;
    constructor(qiratService: QiratService);
    getDashboard(): Promise<{
        totalStudents: any;
        activeStudents: any;
        inactiveStudents: any;
        totalTeachers: any;
        activeTeachers: any;
        activeClasses: any;
        todaysClasses: number;
        completedClassesToday: number;
        attendanceRate: any;
        homeworkCompletionRate: any;
        studentsInQaidah: number;
        studentsInQuranReading: number;
        studentsInTajweed: number;
        studentsInHifz: number;
        activeReplacements: number;
        upcomingReplacements: number;
        totalReplacements: number;
        newStudentRegistrations: any;
        averageAcademicProgress: any;
    }>;
}

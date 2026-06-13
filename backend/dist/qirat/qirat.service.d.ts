import { Repository } from 'typeorm';
import { ReportsService } from '../reports/reports.service';
import { Student } from '../students/entities/student.entity';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';
export declare class QiratService {
    private readonly reportsService;
    private studentRepo;
    private sessionRepo;
    private replacementRepo;
    constructor(reportsService: ReportsService, studentRepo: Repository<Student>, sessionRepo: Repository<ClassSession>, replacementRepo: Repository<TeacherReplacement>);
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

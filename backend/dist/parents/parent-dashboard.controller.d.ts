import { Repository } from 'typeorm';
import { Parent } from './entities/parent.entity';
import { Student } from '../students/entities/student.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Feedback } from '../progress/entities/feedback.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ProgressLog } from '../progress/entities/progress-log.entity';
export declare class ParentDashboardController {
    private parentsRepository;
    private studentsRepository;
    private schedulesRepository;
    private homeworkRepository;
    private feedbackRepository;
    private progressRepository;
    private progressLogRepository;
    constructor(parentsRepository: Repository<Parent>, studentsRepository: Repository<Student>, schedulesRepository: Repository<Schedule>, homeworkRepository: Repository<Homework>, feedbackRepository: Repository<Feedback>, progressRepository: Repository<Progress>, progressLogRepository: Repository<ProgressLog>);
    getDashboardData(req: any): Promise<{
        message: string;
        parent: {
            name: string;
            email: any;
            id?: undefined;
            photo?: undefined;
        };
        stats: {
            totalChildren: number;
            activeClasses: number;
            attendanceRate: string;
            memorizationProgress: string;
            pendingHomework: number;
            upcomingExams: number;
        };
        children: any[];
        activities: any[];
        schedules: any[];
        homework?: undefined;
        feedbacks?: undefined;
    } | {
        parent: {
            id: string;
            name: string;
            email: string;
            photo: string;
        };
        stats: {
            totalChildren: number;
            activeClasses: number;
            attendanceRate: string;
            memorizationProgress: string;
            pendingHomework: number;
            upcomingExams: number;
        };
        children: {
            id: string;
            name: string;
            photo: string;
            level: string;
            teacher: string;
            attendance: number;
            memorization: number;
            currentSurah: string;
            currentAyah: number;
            currentPage: number;
            status: string;
            recentLogs: {
                id: string;
                surahName: string;
                lastStudiedPage: number;
                lastStudiedAyah: number;
                teacherName: string;
                date: Date;
            }[];
        }[];
        activities: any[];
        schedules: any[];
        homework: any[];
        feedbacks: any[];
        message?: undefined;
    }>;
}

import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ProgressLog } from '../progress/entities/progress-log.entity';
import { Feedback } from '../progress/entities/feedback.entity';
import { Homework, HomeworkStatus } from '../homework/entities/homework.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { StudentAttendance } from '../attendance/entities/student-attendance.entity';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { ResourcesService } from '../resources/resources.service';
import { AttendanceService } from '../attendance/attendance.service';
import { TeacherReplacementsService } from '../teacher-replacements/teacher-replacements.service';
export declare class StudentPortalService {
    private studentsRepository;
    private schedulesRepository;
    private attendanceRepository;
    private progressRepository;
    private progressLogRepository;
    private feedbackRepository;
    private homeworkRepository;
    private notificationRepository;
    private studentAttendanceRepository;
    private classSessionRepository;
    private resourcesService;
    private attendanceService;
    private replacementsService;
    constructor(studentsRepository: Repository<Student>, schedulesRepository: Repository<Schedule>, attendanceRepository: Repository<Attendance>, progressRepository: Repository<Progress>, progressLogRepository: Repository<ProgressLog>, feedbackRepository: Repository<Feedback>, homeworkRepository: Repository<Homework>, notificationRepository: Repository<Notification>, studentAttendanceRepository: Repository<StudentAttendance>, classSessionRepository: Repository<ClassSession>, resourcesService: ResourcesService, attendanceService: AttendanceService, replacementsService: TeacherReplacementsService);
    resolveStudent(userId: string): Promise<Student>;
    private avatarUrl;
    private findCurrentProgress;
    private todayWeekday;
    getDashboard(userId: string): Promise<{
        student: {
            id: string;
            name: string;
            fullName: string;
            initials: string;
            email: string;
            phone: string;
            country: string;
            city: string;
            level: string;
            enrollmentDate: Date;
            assignedTeacher: string;
            assignedTeacherId: string;
            effectiveTeacher: string;
            effectiveTeacherId: string;
            isTemporaryTeacher: boolean;
            temporaryTeacher: {
                name: string;
                startDate: string;
                endDate: string;
                originalTeacher: string;
            };
            attendanceRate: number;
            progressRate: number;
            avatarUrl: string;
        };
        welcome: {
            studentName: string;
            quranLevel: string;
            assignedTeacher: string;
            enrollmentDate: Date;
        };
        progress: {
            surahsCompleted: number;
            surahs: number;
            totalSurahs: number;
            currentSurah: string;
            currentAyah: number;
            currentPage: number;
            memorizedSurahs: number;
            memorizedAyahs: number;
            completedJuz: number;
            percentage: number;
            rank: string;
            lastStudiedSurah: string;
            ayahs: number;
            weeksActive: number;
            juzCompleted: number;
            currentJuz: string;
        };
        attendance: {
            totalClasses: any;
            attendedClasses: any;
            presentDays: any;
            absentDays: any;
            lateDays: any;
            rate: number;
            weekly: {
                date: string;
                present: boolean;
                session: string;
            }[];
        };
        upcomingClass: {
            id: string;
            name: string;
            teacher: any;
            teacherId: any;
            dayOfWeek: string;
            startTime: string;
            endTime: string;
            time: string;
            meetingLink: string;
            status: string;
            sessionId: string;
        };
        liveClass: {
            id: string;
            classTitle: string;
            meetingLink: string;
            teacher: {
                fullName: string;
            };
        };
        todaysLesson: {
            surah: string;
            ayahRange: string;
            revision: string;
            homework: {
                title: string;
                dueDate: Date;
            };
        };
        homework: {
            overdue: number;
            completed: number;
            pending: number;
            completionRate: number;
            recent: {
                id: string;
                title: string;
                subject: string;
                dueDate: string;
                status: HomeworkStatus;
                description: string;
            }[];
        };
        feedback: {
            teacher: string;
            date: string;
            content: string;
        };
        recentFeedback: {
            id: string;
            teacherName: string;
            date: Date;
            summary: string;
            content: string;
        }[];
        notifications: {
            id: string;
            title: string;
            content: string;
            type: import("../notifications/entities/notification.entity").NotificationChannel;
            isRead: boolean;
            createdAt: Date;
        }[];
        unreadNotifications: number;
        pendingTasks: {
            id: string;
            title: string;
            description: string;
            dueDate: string;
            icon: string;
            difficulty: string;
        }[];
        schedule: {
            id: string;
            day: string;
            time: string;
            subject: string;
            teacher: string;
            meetingLink: string;
        }[];
    }>;
    getClasses(userId: string): Promise<{
        current: {
            id: string;
            name: string;
            dayOfWeek: string;
            day: string;
            startTime: string;
            endTime: string;
            time: string;
            className: string;
            classType: string;
            teacherName: string;
            teacher: string;
            meetingLink: string;
            status: string;
        }[];
        upcoming: {
            id: string;
            name: string;
            dayOfWeek: string;
            day: string;
            startTime: string;
            endTime: string;
            time: string;
            className: string;
            classType: string;
            teacherName: string;
            teacher: string;
            meetingLink: string;
            status: string;
        }[];
        previous: {
            id: string;
            sessionId: string;
            classDate: Date;
            duration: number;
            lessonCovered: string;
            teacherNotes: string;
            teacherName: string;
            attendanceStatus: import("../attendance/entities/student-attendance.entity").StudentAttendanceStatus;
        }[];
        liveClass: ClassSession;
    }>;
    private mapSchedule;
    getProgressDetail(userId: string): Promise<{
        overview: {
            quranLevel: import("./entities/student.entity").QuranLevel;
            currentSurah: string;
            currentAyah: number;
            currentPage: number;
            memorizationPercentage: number;
            completedJuz: number;
            surahsCompleted: number;
            ayahsMemorized: number;
            weeksActive: number;
            rank: string;
        };
        percentage: number;
        surahs: number;
        ayahs: number;
        weeksActive: number;
        juzCompleted: number;
        currentJuz: string;
        rank: string;
        lastStudiedSurah: string;
        lastStudiedPage: number;
        dailyLogs: {
            id: string;
            surahName: string;
            surahNumber: number;
            topicName: string;
            topicNameAr: string;
            lastStudiedPage: number;
            startAyah: number;
            endAyah: number;
            lastStudiedAyah: number;
            memorizationStatus: string;
            revisionStatus: string;
            notes: string;
            isReview: boolean;
            completionStatus: string;
            teacherName: string;
            date: Date;
        }[];
        timeline: {
            type: string;
            title: string;
            description: string;
            date: Date;
        }[];
        tajweed: {
            id: string;
            notes: string;
            teacherName: string;
            date: Date;
            recommendations: string;
        }[];
        teacherFeedback: {
            id: string;
            teacherName: string;
            content: string;
            date: Date;
        }[];
    }>;
    getHomeworkList(userId: string): Promise<{
        id: string;
        title: string;
        description: string;
        assignedDate: Date;
        dueDate: Date;
        status: string;
        difficulty: import("../homework/entities/homework.entity").HomeworkDifficulty;
        teacher: string;
        subject: string;
    }[]>;
    submitHomework(userId: string, homeworkId: string, submissionNotes?: string): Promise<{
        success: boolean;
        id: string;
        status: HomeworkStatus.COMPLETED;
    }>;
    getProfile(userId: string): Promise<{
        student: {
            id: string;
            fullName: string;
            email: string;
            phone: string;
            country: string;
            city: string;
            level: string;
            enrollmentDate: Date;
            assignedTeacher: string;
            assignedTeacherId: string;
            avatarUrl: string;
        };
        statistics: {
            attendancePercentage: number;
            progressPercentage: number;
            homeworkCompletionRate: number;
        };
        messaging: {
            teacherId: string;
            teacherUserId: string;
            teacherName: string;
        };
    }>;
    getResources(search?: string, category?: string): Promise<import("../resources/resources.entity").Resource[]>;
    getNotifications(userId: string): Promise<Notification[]>;
    markNotificationRead(userId: string, notificationId: string): Promise<Notification>;
    markAllNotificationsRead(userId: string): Promise<{
        success: boolean;
    }>;
    getFeedback(userId: string): Promise<{
        id: string;
        teacherName: string;
        content: string;
        date: Date;
        summary: string;
    }[]>;
    getAttendanceDetail(userId: string): Promise<{
        stats: any;
        history: StudentAttendance[];
    }>;
}

import { StudentPortalService } from './student-portal.service';
export declare class StudentDashboardController {
    private readonly portal;
    constructor(portal: StudentPortalService);
    getDashboard(req: any): Promise<{
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
                status: import("../homework/entities/homework.entity").HomeworkStatus;
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
    getClasses(req: any): Promise<{
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
        liveClass: import("../attendance/entities/class-session.entity").ClassSession;
    }>;
    getProgress(req: any): Promise<{
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
    getHomework(req: any): Promise<{
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
    submitHomework(req: any, id: string, body: {
        submissionNotes?: string;
    }): Promise<{
        success: boolean;
        id: string;
        status: import("../homework/entities/homework.entity").HomeworkStatus.COMPLETED;
    }>;
    getNotifications(req: any): Promise<import("../notifications/entities/notification.entity").Notification[]>;
    markNotificationRead(req: any, id: string): Promise<import("../notifications/entities/notification.entity").Notification>;
    markAllNotificationsRead(req: any): Promise<{
        success: boolean;
    }>;
    getFeedback(req: any): Promise<{
        id: string;
        teacherName: string;
        content: string;
        date: Date;
        summary: string;
    }[]>;
    getAttendance(req: any): Promise<{
        stats: any;
        history: import("../attendance/entities/student-attendance.entity").StudentAttendance[];
    }>;
    getResources(search?: string, category?: string): Promise<import("../resources/resources.entity").Resource[]>;
    getProfile(req: any): Promise<{
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
}

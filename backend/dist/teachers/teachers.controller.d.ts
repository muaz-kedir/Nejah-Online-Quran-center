import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
export declare class TeachersController {
    private readonly teachersService;
    constructor(teachersService: TeachersService);
    private authenticatedUserId;
    getTeacherDashboard(req: any): Promise<{
        teacher: {
            id: string;
            fullName: string;
            email: string;
            phoneNumber: string;
            qualification: string;
            specialization: string;
            experience: number;
            availability: string[];
            avatarUrl: string;
        };
        stats: {
            totalStudents: number;
            todayClassesCount: number;
            upcomingClassesCount: number;
            pendingHomeworkReviews: number;
            averageAttendanceRate: number;
            averageProgressRate: number;
            notificationCount: number;
        };
        temporaryStudents: import("../teacher-replacements/entities/teacher-replacement.entity").TeacherReplacement[];
        reassignedAwayStudents: import("../teacher-replacements/entities/teacher-replacement.entity").TeacherReplacement[];
        todaySchedules: {
            id: string;
            studentName: string;
            quranLevel: string;
            startTime: string;
            endTime: string;
            status: string;
            meetingLink: string;
        }[];
        upcomingSchedules: {
            id: string;
            studentName: string;
            quranLevel: string;
            dayOfWeek: string;
            startTime: string;
            endTime: string;
            status: string;
        }[];
        students: {
            id: string;
            fullName: string;
            gender: import("../common/enums/gender.enum").Gender;
            level: import("../students/entities/student.entity").QuranLevel;
            status: import("../students/entities/student.entity").StudentStatus;
            attendanceRate: number;
            progressRate: number;
            nextClassTime: any;
        }[];
    }>;
    getMyDashboardStats(req: any): Promise<{
        totalStudents: number;
        todayClassesCount: number;
        attendanceRate: number;
        homeworkPending: number;
    }>;
    getTeacherStudents(req: any, query: any): Promise<{
        data: {
            isTemporaryAssignment: boolean;
            temporaryReplacement: import("../teacher-replacements/entities/teacher-replacement.entity").TeacherReplacement;
            id: string;
            fullName: string;
            gender: import("../common/enums/gender.enum").Gender;
            ageRange: import("../students/entities/student.entity").AgeRange;
            currentResidency: string;
            country: string;
            city: string;
            phone: string;
            level: import("../students/entities/student.entity").QuranLevel;
            progressionPaused: boolean;
            kitabRequested: boolean;
            kitabName: string;
            previousTraining: boolean;
            trainingDetails: string;
            referralSource: string;
            email: string;
            zoomEmail: string;
            status: import("../students/entities/student.entity").StudentStatus;
            statusChangedAt: Date;
            statusChangedBy: string;
            statusChangeReason: string;
            statusNotes: string;
            isAssigned: boolean;
            avatarUrl: string;
            familyName: string;
            familyPhone: string;
            familyAddress: string;
            familyCountry: string;
            learningGoals: string;
            attendanceRate: number;
            progressRate: number;
            studentCode: string;
            user: import("../users/entities/user.entity").User;
            userId: string;
            parent: import("../parents/entities/parent.entity").Parent;
            parentId: string;
            teacher: import("./entities/teacher.entity").Teacher;
            teacherId: string;
            schedules: import("../schedules/entities/schedule.entity").Schedule[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        temporaryAssignments: import("../teacher-replacements/entities/teacher-replacement.entity").TeacherReplacement[];
        reassignedAway: import("../teacher-replacements/entities/teacher-replacement.entity").TeacherReplacement[];
    }>;
    getTeacherStudent(req: any, studentId: string): Promise<import("../students/entities/student.entity").Student>;
    getTeacherSchedule(req: any): Promise<{
        id: string;
        studentName: string;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        status: string;
        meetingLink: string;
        notes: string;
    }[]>;
    getTeacherNotifications(req: any, query: any): Promise<{
        notifications: import("../notifications/entities/notification.entity").Notification[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    create(createTeacherDto: CreateTeacherDto): Promise<import("./entities/teacher.entity").Teacher>;
    getOverallStats(): Promise<{
        total: number;
        active: number;
        onLeave: number;
        pending: number;
    }>;
    findAll(queryDto: QueryTeacherDto): Promise<{
        data: import("./entities/teacher.entity").Teacher[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<import("./entities/teacher.entity").Teacher>;
    getAnalytics(id: string): Promise<{
        studentCount: number;
        studentDetails: {
            studentId: string;
            studentName: any;
            progressPercentage: number;
            rank: string;
            lastStudiedSurah: string;
            surahsCount: number;
        }[];
        totalWeeklyHours: number;
        topics: string[];
        monthlySalary: number;
        islamicEducationLevel: string;
    }>;
    update(id: string, updateTeacherDto: UpdateTeacherDto): Promise<import("./entities/teacher.entity").Teacher>;
    remove(id: string): Promise<void>;
    assignStudents(id: string, studentIds: string[]): Promise<import("./entities/teacher.entity").Teacher>;
}

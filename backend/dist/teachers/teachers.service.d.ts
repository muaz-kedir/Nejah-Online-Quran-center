import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { Student } from '../students/entities/student.entity';
import { Progress } from '../progress/entities/progress.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { UsersService } from '../users/users.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Homework } from '../homework/entities/homework.entity';
import { TeacherReplacementsService } from '../teacher-replacements/teacher-replacements.service';
export declare class TeachersService {
    private teachersRepository;
    private studentsRepository;
    private progressRepository;
    private schedulesRepository;
    private homeworkRepository;
    private usersService;
    private notificationsService;
    private replacementsService;
    constructor(teachersRepository: Repository<Teacher>, studentsRepository: Repository<Student>, progressRepository: Repository<Progress>, schedulesRepository: Repository<Schedule>, homeworkRepository: Repository<Homework>, usersService: UsersService, notificationsService: NotificationsService, replacementsService: TeacherReplacementsService);
    create(createTeacherDto: CreateTeacherDto): Promise<Teacher>;
    findAll(queryDto: QueryTeacherDto): Promise<{
        data: Teacher[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<Teacher>;
    findByUserId(userId: string): Promise<Teacher>;
    resolveAuthenticatedTeacher(userId: string): Promise<Teacher>;
    assertStudentBelongsToTeacher(teacherId: string, studentId: string): Promise<Student>;
    assertTeacherCanTeachStudent(teacherId: string, studentId: string): Promise<Student>;
    assertTeacherCanManageStudent(teacherId: string, studentId: string): Promise<Student>;
    assertTeacherCanViewStudent(teacherId: string, studentId: string): Promise<Student>;
    assertScheduleBelongsToTeacher(teacherId: string, scheduleId: string): Promise<Schedule>;
    update(id: string, updateTeacherDto: UpdateTeacherDto): Promise<Teacher>;
    remove(id: string): Promise<void>;
    assignStudents(teacherId: string, studentIds: string[]): Promise<Teacher>;
    getTeacherDashboardStats(teacherId: string): Promise<{
        totalStudents: number;
        todayClassesCount: number;
        attendanceRate: number;
        homeworkPending: number;
    }>;
    getOverallStats(): Promise<{
        total: number;
        active: number;
        onLeave: number;
        pending: number;
    }>;
    getTeacherAnalytics(id: string): Promise<{
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
    getTeacherDashboardData(teacherId: string): Promise<{
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
    getTeacherStudents(teacherId: string, page?: number, limit?: number): Promise<{
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
            user: User;
            userId: string;
            parent: import("../parents/entities/parent.entity").Parent;
            parentId: string;
            teacher: Teacher;
            teacherId: string;
            schedules: Schedule[];
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
    getTeacherSchedule(teacherId: string): Promise<{
        id: string;
        studentName: string;
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        status: string;
        meetingLink: string;
        notes: string;
    }[]>;
    getTeacherNotifications(teacherId: string, page?: number, limit?: number): Promise<{
        notifications: import("../notifications/entities/notification.entity").Notification[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}

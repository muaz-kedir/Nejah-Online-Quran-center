import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { StudentAttendance } from '../attendance/entities/student-attendance.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ProgressLog } from '../progress/entities/progress-log.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Exam } from '../exams/entities/exam.entity';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';
import { Notification } from '../notifications/entities/notification.entity';
export interface DateRangeFilter {
    startDate?: string;
    endDate?: string;
}
export interface StudentPerformanceReport {
    studentId: string;
    studentName: string;
    email: string;
    country: string;
    level: string;
    teacherName: string;
    status: string;
    currentTopic: string;
    totalClasses: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    leftEarlyCount: number;
    attendanceRate: number;
    averageProgress: number;
    lastExamScore?: number;
    homeworkCompletionRate: string;
}
export interface TeacherActivityReport {
    teacherId: string;
    teacherName: string;
    email: string;
    totalStudents: number;
    totalClasses: number;
    totalHoursTaught: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    completionRate: string;
}
export interface AttendanceAnalytics {
    totalSessions: number;
    totalStudentsAssigned: number;
    totalPresent: number;
    totalLate: number;
    totalAbsent: number;
    totalLeftEarly: number;
    overallAttendanceRate: number;
    sessionsByDay: Record<string, number>;
    attendanceByStatus: Record<string, number>;
}
export interface ProgressAnalytics {
    learningTrack: string;
    totalStudents: number;
    avgProgressPercentage: number;
    completedTopics: number;
    totalTopics: number;
    progressDistribution: Record<string, number>;
}
export interface RegistrationReport {
    date: string;
    totalRegistrations: number;
    byGender: Record<string, number>;
    byLevel: Record<string, number>;
    byCountry: Record<string, number>;
}
export interface ParentActivityReport {
    parentId: string;
    parentName: string;
    email: string;
    totalStudents: number;
    notificationsReceived: number;
    lastActive: Date;
}
export interface HomeworkReport {
    totalHomework: number;
    pending: number;
    completed: number;
    byDifficulty: Record<string, number>;
    byStudent: Record<string, number>;
    averageCompletionTime: number;
}
export interface ExamReport {
    totalExams: number;
    totalStudentsTaken: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    byLearningTrack: Record<string, number>;
    byDifficulty: Record<string, number>;
}
export interface TeacherReplacementReport {
    totalReplacements: number;
    upcoming: number;
    active: number;
    completed: number;
    cancelled: number;
    byReason: Record<string, number>;
    byStatus: Record<string, number>;
    details: Array<{
        id: string;
        studentName: string;
        originalTeacher: string;
        replacementTeacher: string;
        startDate: string;
        endDate: string;
        reason: string;
        status: string;
    }>;
}
export declare class ReportsService {
    private studentsRepository;
    private parentsRepository;
    private teachersRepository;
    private attendanceRepository;
    private classSessionRepository;
    private studentAttendanceRepository;
    private schedulesRepository;
    private progressRepository;
    private progressLogRepository;
    private homeworkRepository;
    private examsRepository;
    private replacementsRepository;
    private notificationRepository;
    constructor(studentsRepository: Repository<Student>, parentsRepository: Repository<Parent>, teachersRepository: Repository<Teacher>, attendanceRepository: Repository<Attendance>, classSessionRepository: Repository<ClassSession>, studentAttendanceRepository: Repository<StudentAttendance>, schedulesRepository: Repository<Schedule>, progressRepository: Repository<Progress>, progressLogRepository: Repository<ProgressLog>, homeworkRepository: Repository<Homework>, examsRepository: Repository<Exam>, replacementsRepository: Repository<TeacherReplacement>, notificationRepository: Repository<Notification>);
    getSummaryStatistics(dateRange?: DateRangeFilter): Promise<any>;
    private static readonly TRACK_TO_LEVELS;
    getStudentPerformance(filters: {
        learningProgram?: string;
        status?: string;
        teacherId?: string;
        country?: string;
        search?: string;
        dateRange?: DateRangeFilter;
        page?: number;
        limit?: number;
    }): Promise<{
        data: StudentPerformanceReport[];
        meta: any;
    }>;
    private getStudentAttendanceStats;
    private getStudentProgressStats;
    getTeacherActivity(filters: {
        dateRange?: DateRangeFilter;
        status?: string;
        country?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: TeacherActivityReport[];
        meta: any;
    }>;
    getAttendanceAnalytics(filters: DateRangeFilter & {
        teacherId?: string;
        studentId?: string;
    }): Promise<AttendanceAnalytics>;
    getProgressAnalytics(filters: {
        learningProgram?: string;
        status?: string;
    }): Promise<ProgressAnalytics[]>;
    private getTotalTopicsForTrack;
    getRegistrationReports(filters: DateRangeFilter & {
        country?: string;
        level?: string;
    }): Promise<RegistrationReport[]>;
    getParentActivityReports(filters: DateRangeFilter & {
        country?: string;
    }): Promise<ParentActivityReport[]>;
    getHomeworkReports(filters: DateRangeFilter & {
        difficulty?: string;
        status?: string;
    }): Promise<HomeworkReport>;
    getExamReports(filters: DateRangeFilter & {
        status?: string;
        learningTrack?: string;
    }): Promise<ExamReport>;
    getTeacherReplacementReports(filters: DateRangeFilter & {
        status?: string;
        reason?: string;
    }): Promise<TeacherReplacementReport>;
}

import { Teacher } from '../../teachers/entities/teacher.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { StudentAttendance } from './student-attendance.entity';
export declare enum SessionStatus {
    SCHEDULED = "SCHEDULED",
    LIVE = "LIVE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum TeacherAttendanceStatus {
    PRESENT = "PRESENT",
    LATE = "LATE",
    ABSENT = "ABSENT"
}
export declare class ClassSession {
    id: string;
    classTitle: string;
    subject: string;
    quranLevel: string;
    sessionDate: Date;
    scheduledStartTime: string;
    scheduledEndTime: string;
    actualStartTime: Date;
    actualEndTime: Date;
    status: SessionStatus;
    meetingLink: string;
    teacherAttendanceStatus: TeacherAttendanceStatus;
    teacherJoinTime: Date;
    teacherLeaveTime: Date;
    teacherDuration: number;
    totalStudentsAssigned: number;
    totalStudentsPresent: number;
    totalStudentsLate: number;
    totalStudentsAbsent: number;
    totalStudentsLeftEarly: number;
    teacher: Teacher;
    teacherId: string;
    schedule: Schedule;
    scheduleId: string;
    studentAttendances: StudentAttendance[];
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

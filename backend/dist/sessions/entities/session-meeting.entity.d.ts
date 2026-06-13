import { Schedule } from '../../schedules/entities/schedule.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { StudentSessionAttendance } from './student-session-attendance.entity';
export declare enum SessionStatus {
    SCHEDULED = "SCHEDULED",
    LIVE = "LIVE",
    ENDED = "ENDED",
    CANCELLED = "CANCELLED"
}
export declare enum TeacherAttendanceStatus {
    PRESENT = "PRESENT",
    LATE = "LATE",
    ABSENT = "ABSENT"
}
export declare class SessionMeeting {
    id: string;
    schedule: Schedule;
    scheduleId: string;
    teacher: Teacher;
    teacherId: string;
    meetingLink: string;
    status: SessionStatus;
    teacherJoinTime: Date;
    teacherLeaveTime: Date;
    actualStartTime: Date;
    actualEndTime: Date;
    totalDuration: number;
    attendanceStatus: TeacherAttendanceStatus;
    studentAttendances: StudentSessionAttendance[];
    createdAt: Date;
    updatedAt: Date;
}

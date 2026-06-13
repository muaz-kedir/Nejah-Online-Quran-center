import { Student } from '../../students/entities/student.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { ScheduleStudent } from './schedule-student.entity';
export declare class Schedule {
    id: string;
    className: string;
    dayOfWeek: string;
    startTimeString: string;
    endTimeString: string;
    startTime: Date;
    endTime: Date;
    student: Student;
    studentId: string;
    isGroupSession: boolean;
    scheduleStudents: ScheduleStudent[];
    teacher: Teacher;
    teacherId: string;
    meetingLink: string;
    classType: string;
    notes: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

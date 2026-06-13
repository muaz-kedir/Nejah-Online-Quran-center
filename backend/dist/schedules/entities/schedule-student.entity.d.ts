import { Schedule } from './schedule.entity';
import { Student } from '../../students/entities/student.entity';
export declare class ScheduleStudent {
    id: string;
    scheduleId: string;
    studentId: string;
    schedule: Schedule;
    student: Student;
}

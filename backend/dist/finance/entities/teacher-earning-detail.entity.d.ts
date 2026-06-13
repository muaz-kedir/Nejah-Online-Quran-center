import { TeacherPayrollRecord } from './teacher-payroll-record.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { Student } from '../../students/entities/student.entity';
export declare class TeacherEarningDetail {
    id: string;
    payrollRecordId: string;
    payrollRecord: TeacherPayrollRecord;
    teacherId: string;
    teacher: Teacher;
    studentId: string;
    student: Student;
    sessionsConducted: number;
    sessionRate: number;
    earnings: number;
    isReplacement: boolean;
    replacementId: string;
}

import { Teacher } from '../../teachers/entities/teacher.entity';
import { TeacherEarningDetail } from './teacher-earning-detail.entity';
export declare class TeacherPayrollRecord {
    id: string;
    teacherId: string;
    teacher: Teacher;
    billingMonth: string;
    totalSessions: number;
    totalEarnings: number;
    status: string;
    paidAt: Date;
    earningDetails: TeacherEarningDetail[];
    createdAt: Date;
    updatedAt: Date;
}

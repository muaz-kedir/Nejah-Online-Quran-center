import { FamilyBillingGroup } from './family-billing-group.entity';
import { Student } from '../../students/entities/student.entity';
export declare class FamilyBillingMember {
    id: string;
    familyBillingGroupId: string;
    familyBillingGroup: FamilyBillingGroup;
    studentId: string;
    student: Student;
    individualMonthlyFee: number;
}

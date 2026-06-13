import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';
export declare enum ParentStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare class Parent {
    id: string;
    fullName: string;
    email: string;
    residency: string;
    country: string;
    city: string;
    phoneNumber: string;
    relationshipWithStudent: string;
    status: ParentStatus;
    user: User;
    students: Student[];
    createdAt: Date;
    updatedAt: Date;
}

import { AgeRange } from '../../students/entities/student.entity';
export declare class StudentRegisterDto {
    fullName: string;
    gender: string;
    ageRange: AgeRange;
    residency?: string;
    country: string;
    city: string;
    phone: string;
    kitabRequested?: boolean;
    kitabName?: string;
    previousTraining?: boolean;
    trainingDetails?: string;
    referralSource?: string;
    levelOfQuran: string;
    email: string;
    password: string;
    confirmPassword: string;
}
export declare class ParentRegisterDto {
    fullName: string;
    email: string;
    phoneNumber: string;
    residency?: string;
    country: string;
    city: string;
    relationshipWithStudent: string;
    password: string;
    confirmPassword: string;
}
export declare class RegisterDto {
    student: StudentRegisterDto;
    parentId?: string;
    parent?: ParentRegisterDto;
}

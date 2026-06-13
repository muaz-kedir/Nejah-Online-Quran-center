import { ParentStatus } from '../entities/parent.entity';
export declare class CreateParentDto {
    fullName: string;
    email: string;
    residency?: string;
    country?: string;
    city?: string;
    phoneNumber?: string;
    relationshipWithStudent: string;
    status?: ParentStatus;
    password?: string;
}

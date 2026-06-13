import { UserRole } from '../../common/enums/user-role.enum';
export declare class User {
    id: string;
    email: string;
    password: string;
    name: string;
    get fullName(): string;
    role: UserRole;
    phone: string;
    avatar: string;
    get profileImage(): string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

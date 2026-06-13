import { UserRole } from '../../common/enums/user-role.enum';
export declare class CreateUserDto {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string;
    avatar?: string;
    isActive?: boolean;
}

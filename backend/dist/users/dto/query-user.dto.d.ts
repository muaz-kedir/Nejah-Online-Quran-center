import { UserRole } from '../../common/enums/user-role.enum';
export declare class QueryUserDto {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

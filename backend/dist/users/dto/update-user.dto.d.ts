import { CreateUserDto } from './create-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';
declare const UpdateUserDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateUserDto>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    email?: string;
    password?: string;
    name?: string;
    role?: UserRole;
    phone?: string;
    avatar?: string;
    isActive?: boolean;
}
export {};

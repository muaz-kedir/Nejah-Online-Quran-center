import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(queryDto: QueryUserDto): Promise<{
        data: User[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getProfile(user: User): Promise<User>;
    updateProfile(user: User, updateDto: Partial<UpdateUserDto>): Promise<User>;
    changePassword(user: User, changePasswordDto: ChangePasswordDto): Promise<void>;
    findOne(id: string): Promise<User>;
    update(id: string, updateUserDto: UpdateUserDto, currentUser: User): Promise<User>;
    remove(id: string, currentUser: User): Promise<void>;
    toggleStatus(id: string, currentUser: User): Promise<User>;
}

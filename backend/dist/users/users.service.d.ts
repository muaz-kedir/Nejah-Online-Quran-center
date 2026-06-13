import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersService implements OnModuleInit {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    onModuleInit(): Promise<void>;
    private seedDemoAccounts;
    private seedSuperAdmin;
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
    findOne(id: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, updateUserDto: UpdateUserDto, currentUser: User): Promise<User>;
    remove(id: string, currentUser: User): Promise<void>;
    toggleStatus(id: string, currentUser: User): Promise<User>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void>;
    getProfile(userId: string): Promise<User>;
    updateProfile(userId: string, updateDto: Partial<UpdateUserDto>): Promise<User>;
}

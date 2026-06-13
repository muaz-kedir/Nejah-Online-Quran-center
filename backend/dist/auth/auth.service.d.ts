import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ParentsService } from '../parents/parents.service';
import { StudentsService } from '../students/students.service';
import { Student } from '../students/entities/student.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../common/enums/user-role.enum';
export declare class AuthService {
    private usersService;
    private parentsService;
    private studentsService;
    private jwtService;
    private studentsRepository;
    constructor(usersService: UsersService, parentsService: ParentsService, studentsService: StudentsService, jwtService: JwtService, studentsRepository: Repository<Student>);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        parentStatus: string;
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: UserRole;
            studentId: string;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            studentId?: string;
        };
    }>;
    private roleLabel;
    checkStudentEmail(email: string): Promise<{
        available: boolean;
        message: string;
    }>;
    private toParentSearchResult;
    lookupParentsForRegistration(query: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        childrenCount: number;
    }[]>;
    checkParentDuplicate(email?: string, phoneNumber?: string): Promise<{
        exists: boolean;
        parent: {
            id: string;
            fullName: string;
            email: string;
            phoneNumber: string;
            childrenCount: number;
        };
        conflict: boolean;
        message: any;
    } | {
        exists: boolean;
        parent: any;
        conflict: boolean;
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    validateUser(userId: string): Promise<import("../users/entities/user.entity").User>;
}

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ParentLookupDto, ParentDuplicateCheckDto, CheckEmailDto } from './dto/parent-lookup.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        parentStatus: string;
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("../common/enums/user-role.enum").UserRole;
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
    checkEmail(dto: CheckEmailDto): Promise<{
        available: boolean;
        message: string;
    }>;
    parentLookup(dto: ParentLookupDto): Promise<{
        id: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        childrenCount: number;
    }[]>;
    parentDuplicateCheck(dto: ParentDuplicateCheckDto): Promise<{
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
    getProfile(user: any): any;
}

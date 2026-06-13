import { Repository } from 'typeorm';
import { Parent } from './entities/parent.entity';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { QueryParentDto } from './dto/query-parent.dto';
import { UsersService } from '../users/users.service';
export declare class ParentsService {
    private parentsRepository;
    private usersService;
    constructor(parentsRepository: Repository<Parent>, usersService: UsersService);
    private resolveResidency;
    findByPhone(phoneNumber: string): Promise<Parent | null>;
    createProfileForExistingUser(user: {
        id: string;
    }, dto: CreateParentDto): Promise<Parent>;
    findOrCreateForRegistration(dto: CreateParentDto): Promise<{
        parent: Parent;
        message: string;
    }>;
    search(searchQuery: string): Promise<Parent[]>;
    create(createParentDto: CreateParentDto): Promise<Parent>;
    findByEmail(email: string): Promise<Parent | null>;
    findAll(queryDto: QueryParentDto): Promise<{
        data: Parent[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<Parent>;
    update(id: string, updateParentDto: UpdateParentDto): Promise<Parent>;
    remove(id: string): Promise<void>;
    getParentStudents(id: string): Promise<import("../students/entities/student.entity").Student[]>;
    assignStudentToParent(parentId: string, studentId: string): Promise<Parent>;
    getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
    }>;
}

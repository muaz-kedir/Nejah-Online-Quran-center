import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { DelegateStudentDto } from './dto/delegate-student.dto';
import { Schedule } from '../schedules/entities/schedule.entity';
import { UsersService } from '../users/users.service';
export declare class StudentsService {
    private studentsRepository;
    private parentsRepository;
    private schedulesRepository;
    private usersService;
    constructor(studentsRepository: Repository<Student>, parentsRepository: Repository<Parent>, schedulesRepository: Repository<Schedule>, usersService: UsersService);
    private generateStudentCode;
    create(createStudentDto: CreateStudentDto): Promise<Student>;
    findAll(queryDto: QueryStudentDto & {
        isAssigned?: boolean;
    }): Promise<{
        data: Student[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findAllUnassigned(): Promise<Student[]>;
    findOne(id: string): Promise<Student>;
    findByEmail(email: string): Promise<Student | null>;
    update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student>;
    unassignFromTeacher(id: string): Promise<void>;
    remove(id: string): Promise<void>;
    getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        newStudentsThisMonth: number;
        averageAttendance: number;
    }>;
    changeStatus(id: string, status: any, reason: string, notes: string, adminId: string): Promise<Student>;
    delegateStudentToTeacher(delegateDto: DelegateStudentDto): Promise<{
        message: string;
        student: Student;
        schedule: Schedule;
    }>;
    resetPassword(studentId: string, newPassword: string): Promise<void>;
}

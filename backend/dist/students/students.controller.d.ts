import { StudentsService } from './students.service';
import { TeachersService } from '../teachers/teachers.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { DelegateStudentDto } from './dto/delegate-student.dto';
export declare class StudentsController {
    private readonly studentsService;
    private readonly teachersService;
    constructor(studentsService: StudentsService, teachersService: TeachersService);
    create(createStudentDto: CreateStudentDto): Promise<import("./entities/student.entity").Student>;
    findAll(req: any, queryDto: QueryStudentDto): Promise<{
        data: import("./entities/student.entity").Student[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        newStudentsThisMonth: number;
        averageAttendance: number;
    }>;
    delegateStudentToTeacher(delegateDto: DelegateStudentDto): Promise<{
        message: string;
        student: import("./entities/student.entity").Student;
        schedule: import("../schedules/entities/schedule.entity").Schedule;
    }>;
    getUnassigned(): Promise<import("./entities/student.entity").Student[]>;
    findOne(req: any, id: string): Promise<import("./entities/student.entity").Student>;
    update(id: string, updateStudentDto: UpdateStudentDto): Promise<import("./entities/student.entity").Student>;
    changeStatus(req: any, id: string, body: {
        status: string;
        reason: string;
        notes: string;
    }): Promise<import("./entities/student.entity").Student>;
    resetPassword(id: string, newPassword: string): Promise<{
        message: string;
    }>;
    remove(id: string): Promise<void>;
}

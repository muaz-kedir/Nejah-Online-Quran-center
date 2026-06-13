import { StudentsService } from './students.service';
import { SchedulesService } from '../schedules/schedules.service';
import { AssignStudentDto, UnassignStudentDto } from './dto/assign-student.dto';
export declare class AssignmentsController {
    private readonly studentsService;
    private readonly schedulesService;
    constructor(studentsService: StudentsService, schedulesService: SchedulesService);
    getUnassignedStudents(): Promise<import("./entities/student.entity").Student[]>;
    assignStudent(dto: AssignStudentDto): Promise<{
        message: string;
        schedules: any[];
    }>;
    unassignStudent(dto: UnassignStudentDto): Promise<{
        message: string;
    }>;
}

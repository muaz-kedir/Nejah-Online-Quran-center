import { Repository } from 'typeorm';
import { Homework, HomeworkStatus } from './entities/homework.entity';
import { Student } from '../students/entities/student.entity';
import { CreateHomeworkDto } from './dto/create-homework.dto';
export declare class HomeworkService {
    private homeworkRepository;
    private studentRepository;
    constructor(homeworkRepository: Repository<Homework>, studentRepository: Repository<Student>);
    create(dto: CreateHomeworkDto, assignedByTeacherId?: string, replacementAssignmentId?: string): Promise<Homework>;
    findByStudent(studentId: string): Promise<Homework[]>;
    findOne(id: string): Promise<Homework>;
    updateStatus(id: string, status: HomeworkStatus): Promise<Homework>;
    remove(id: string): Promise<void>;
}

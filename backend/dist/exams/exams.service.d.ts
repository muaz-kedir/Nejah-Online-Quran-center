import { Repository } from 'typeorm';
import { Exam, ExamStatus } from './entities/exam.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Progress } from '../progress/entities/progress.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
export declare class ExamsService {
    private examsRepository;
    private studentsRepository;
    private teachersRepository;
    private progressRepository;
    constructor(examsRepository: Repository<Exam>, studentsRepository: Repository<Student>, teachersRepository: Repository<Teacher>, progressRepository: Repository<Progress>);
    create(createExamDto: CreateExamDto): Promise<Exam>;
    findAll(query: {
        studentId?: string;
        teacherId?: string;
        status?: ExamStatus;
        page?: number;
        limit?: number;
    }): Promise<{
        data: Exam[];
        meta: any;
    }>;
    findOne(id: string): Promise<Exam>;
    update(id: string, updateExamDto: UpdateExamDto): Promise<Exam>;
    remove(id: string): Promise<void>;
    gradeExam(id: string, score: number, maxScore: number, feedback: string): Promise<Exam>;
}

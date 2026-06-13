import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
export declare class ExamsController {
    private readonly examsService;
    constructor(examsService: ExamsService);
    create(createExamDto: CreateExamDto): Promise<import("./entities/exam.entity").Exam>;
    findAll(query: any): Promise<{
        data: import("./entities/exam.entity").Exam[];
        meta: any;
    }>;
    findOne(id: string): Promise<import("./entities/exam.entity").Exam>;
    update(id: string, updateExamDto: UpdateExamDto): Promise<import("./entities/exam.entity").Exam>;
    remove(id: string): Promise<void>;
    gradeExam(id: string, score: number, maxScore: number, feedback: string): Promise<import("./entities/exam.entity").Exam>;
    gradeExamDirect(id: string, gradeData: {
        score: number;
        maxScore: number;
        feedback: string;
    }): Promise<import("./entities/exam.entity").Exam>;
}

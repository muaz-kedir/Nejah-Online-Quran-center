import { ExamDifficulty, ExamStatus } from '../entities/exam.entity';
export declare class CreateExamDto {
    title: string;
    description?: string;
    scheduledDate: Date;
    durationMinutes?: number;
    difficulty?: ExamDifficulty;
    status?: ExamStatus;
    studentId: string;
    teacherId?: string;
    progressId?: string;
    correctAnswers?: string;
    studentAnswers?: string;
}

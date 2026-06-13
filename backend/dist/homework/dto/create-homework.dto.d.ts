import { HomeworkDifficulty } from '../entities/homework.entity';
export declare class CreateHomeworkDto {
    title: string;
    description: string;
    difficulty?: HomeworkDifficulty;
    dueDate: string;
    studentId: string;
}

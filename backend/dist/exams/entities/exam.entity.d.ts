import { Student } from '../../students/entities/student.entity';
import { Progress } from '../../progress/entities/progress.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
export declare enum ExamDifficulty {
    EASY = "Easy",
    MEDIUM = "Medium",
    HARD = "Hard"
}
export declare enum ExamStatus {
    SCHEDULED = "Scheduled",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed"
}
export declare class Exam {
    id: string;
    title: string;
    description: string;
    scheduledDate: Date;
    durationMinutes: number;
    difficulty: ExamDifficulty;
    status: ExamStatus;
    score: number;
    maxScore: number;
    feedback: string;
    isGraded: boolean;
    correctAnswers: string[];
    studentAnswers: string[];
    student: Student;
    studentId: string;
    teacher: Teacher;
    teacherId: string;
    progress: Progress;
    progressId: string;
    createdAt: Date;
    updatedAt: Date;
}

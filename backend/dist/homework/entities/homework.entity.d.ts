import { Student } from '../../students/entities/student.entity';
export declare enum HomeworkDifficulty {
    EASY = "Easy",
    MEDIUM = "Medium",
    HIGH = "High"
}
export declare enum HomeworkStatus {
    PENDING = "Pending",
    COMPLETED = "Completed"
}
export declare class Homework {
    id: string;
    title: string;
    description: string;
    difficulty: HomeworkDifficulty;
    status: HomeworkStatus;
    dueDate: Date;
    student: Student;
    studentId: string;
    assignedByTeacherId: string;
    replacementAssignmentId: string;
    createdAt: Date;
    updatedAt: Date;
}

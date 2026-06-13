import { Student } from '../../students/entities/student.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
export declare class Feedback {
    id: string;
    content: string;
    student: Student;
    studentId: string;
    teacher: Teacher;
    teacherId: string;
    createdAt: Date;
    updatedAt: Date;
}

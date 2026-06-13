import { Student } from '../../students/entities/student.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
export declare class ProgressLog {
    id: string;
    student: Student;
    studentId: string;
    teacher: Teacher;
    teacherId: string;
    learningTrack: string;
    topicId: string;
    topicName: string;
    topicNameAr: string;
    surahNumber: number;
    surahName: string;
    lastStudiedPage: number;
    startAyah: number;
    lastStudiedAyah: number;
    endAyah: number;
    memorizationStatus: string;
    revisionStatus: string;
    notes: string;
    completionStatus: string;
    isReview: boolean;
    createdAt: Date;
}

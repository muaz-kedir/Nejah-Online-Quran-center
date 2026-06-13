import { Student } from '../../students/entities/student.entity';
export declare class Progress {
    id: string;
    surahsCount: number;
    ayahsCount: number;
    weeksActive: number;
    progressPercentage: number;
    rank: string;
    surahNumber: number;
    lastStudiedSurah: string;
    lastStudiedPage: number;
    lastStudiedAyah: number;
    learningTrack: string;
    currentTopicId: string;
    completedTopicIds: string[];
    promotionStatus: string;
    student: Student;
    studentId: string;
    createdAt: Date;
    updatedAt: Date;
}

import { Student } from '../../students/entities/student.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
export type LevelHistoryStatus = 'in_progress' | 'completed' | 'repeated' | 'demoted' | 'paused';
export type LevelChangeType = 'initial' | 'auto_promotion' | 'manual_promotion' | 'manual_demotion' | 'repeat' | 'pause' | 'resume';
export declare class StudentLevelHistory {
    id: string;
    studentId: string;
    student: Student;
    level: string;
    learningTrack: string;
    startedAt: Date;
    completedAt: Date | null;
    status: LevelHistoryStatus;
    changeType: LevelChangeType;
    teacherId: string;
    teacher: Teacher;
    completedTopicIdsSnapshot: string[] | null;
    progressPercentageSnapshot: number | null;
    changedByUserId: string | null;
    reason: string | null;
    createdAt: Date;
}

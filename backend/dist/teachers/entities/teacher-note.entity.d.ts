import { Teacher } from './teacher.entity';
export declare enum TeacherNoteType {
    CLASS_REMINDER = "Class Reminder",
    OBSERVATION = "Observation",
    GENERAL_REMINDER = "General Reminder"
}
export declare class TeacherNote {
    id: string;
    type: TeacherNoteType;
    title: string;
    content: string;
    teacher: Teacher;
    teacherId: string;
    createdAt: Date;
    updatedAt: Date;
}

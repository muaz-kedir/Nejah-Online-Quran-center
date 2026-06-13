export declare class CreateClassSessionDto {
    classTitle: string;
    subject: string;
    quranLevel: string;
    sessionDate: Date;
    scheduledStartTime: string;
    scheduledEndTime: string;
    teacherId: string;
    scheduleId?: string;
    assignedStudentIds?: string[];
    notes?: string;
}

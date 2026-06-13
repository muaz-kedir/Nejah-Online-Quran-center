export declare class CreateScheduleDto {
    teacherId: string;
    studentId?: string;
    studentIds?: string[];
    isGroupSession?: boolean;
    dayOfWeek: string;
    startTimeString: string;
    endTimeString: string;
    meetingLink?: string;
    classType?: string;
    className?: string;
    notes?: string;
}

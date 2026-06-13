declare class ScheduleSlotDto {
    dayOfWeek: string;
    startTimeString: string;
    endTimeString: string;
    className?: string;
}
export declare class AssignStudentDto {
    studentId: string;
    teacherId: string;
    schedules?: ScheduleSlotDto[];
}
export declare class UnassignStudentDto {
    studentId: string;
}
export {};

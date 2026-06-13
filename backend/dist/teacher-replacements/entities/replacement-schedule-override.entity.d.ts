import { TeacherReplacement } from './teacher-replacement.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
export declare class ReplacementScheduleOverride {
    id: string;
    replacementId: string;
    replacement: TeacherReplacement;
    originalScheduleId: string;
    originalSchedule: Schedule;
    replacementTeacherId: string;
    replacementTeacher: Teacher;
    meetingLink: string;
    startTimeString: string;
    endTimeString: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

import { Gender } from '../../common/enums/gender.enum';
export declare class CreateTeacherDto {
    fullName: string;
    email: string;
    password: string;
    gender?: Gender;
    phoneNumber?: string;
    qualification?: string;
    specialization?: string;
    experience?: number;
    country?: string;
    city?: string;
    streetAddress?: string;
    dateOfBirth?: string;
    languages?: string[];
    internetConnectionType?: string;
    qiratEducationLevel?: string;
    teachingTimeAvailability?: string[];
    marketingSource?: string;
    additionalComments?: string;
    status?: string;
    avatarUrl?: string;
    weeklySchedule?: string;
    hourlyRate?: number;
    monthlySalary?: number;
    islamicEducationLevel?: string;
    teachingTopics?: string;
    notes?: string;
}

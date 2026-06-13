import { Parent } from '../../parents/entities/parent.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { User } from '../../users/entities/user.entity';
import { Gender } from '../../common/enums/gender.enum';
import { Schedule } from '../../schedules/entities/schedule.entity';
export declare enum QuranLevel {
    QAIDA_NOORANIYA = "Qaida Nooraniya",
    QURAN_READING = "Quran Reading",
    HIFZ_PROGRAM = "Hifz Program",
    TAJWEED_PROGRAM = "Tajweed Program",
    HIFZ_MURAJAA = "Hifz Muraja'a"
}
export declare enum AgeRange {
    UNDER_18 = "Under 18",
    EIGHTEEN_TO_TWENTY_FIVE = "18 - 25",
    ABOVE_TWENTY_FIVE = "Above 25"
}
export declare enum StudentStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PENDING = "pending"
}
export declare class Student {
    id: string;
    fullName: string;
    gender: Gender;
    ageRange: AgeRange;
    currentResidency: string;
    country: string;
    city: string;
    phone: string;
    level: QuranLevel;
    progressionPaused: boolean;
    kitabRequested: boolean;
    kitabName: string;
    previousTraining: boolean;
    trainingDetails: string;
    referralSource: string;
    email: string;
    zoomEmail: string;
    status: StudentStatus;
    statusChangedAt: Date;
    statusChangedBy: string;
    statusChangeReason: string;
    statusNotes: string;
    isAssigned: boolean;
    avatarUrl: string;
    familyName: string;
    familyPhone: string;
    familyAddress: string;
    familyCountry: string;
    learningGoals: string;
    attendanceRate: number;
    progressRate: number;
    studentCode: string;
    user: User;
    userId: string;
    parent: Parent;
    parentId: string;
    teacher: Teacher;
    teacherId: string;
    schedules: Schedule[];
    createdAt: Date;
    updatedAt: Date;
}

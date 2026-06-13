export declare enum ApplicationStatus {
    PENDING_REVIEW = "PENDING_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    MORE_INFO_REQUIRED = "MORE_INFO_REQUIRED"
}
export declare class TeacherApplication {
    id: string;
    applicationNumber: string;
    fullName: string;
    password?: string;
    gender: string;
    dateOfBirth: string;
    phoneNumber: string;
    email: string;
    country: string;
    city: string;
    streetAddress: string;
    languages: string[];
    internetConnectionType: string;
    qiratEducationLevel: string;
    islamicEducationLevel: string;
    teachingTimeAvailability: string[];
    marketingSource: string;
    nationalIdUrl: string;
    quranCertificateUrl: string;
    islamicCertificateUrl: string;
    teachingExperienceUrl: string;
    cvResumeUrl: string;
    additionalComments: string;
    status: ApplicationStatus;
    adminNotes: string;
    rejectionReason: string;
    infoRequestMessage: string;
    reviewedBy: string;
    reviewedAt: Date;
    createdTeacherId: string;
    createdAt: Date;
    updatedAt: Date;
}

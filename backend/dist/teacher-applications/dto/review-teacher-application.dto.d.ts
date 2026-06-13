export declare enum ReviewAction {
    APPROVE = "approve",
    REJECT = "reject",
    REQUEST_INFO = "request_info"
}
export declare class ReviewTeacherApplicationDto {
    action: ReviewAction;
    rejectionReason?: string;
    infoRequestMessage?: string;
    adminNotes?: string;
}

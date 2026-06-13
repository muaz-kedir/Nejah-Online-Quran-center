import { UserRole } from '../common/enums/user-role.enum';
export declare enum ResourceCategory {
    QURAN_RESOURCES = "Quran Resources",
    QAIDA_NOORANIYA = "Qaida Nooraniya",
    TAJWEED_MATERIALS = "Tajweed Materials",
    ISLAMIC_STUDIES = "Islamic Studies Materials",
    CLASS_MATERIALS = "Class Materials"
}
export declare enum ResourceStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare class Resource {
    id: string;
    title: string;
    description: string;
    category: ResourceCategory;
    fileUrl: string;
    createdByRole: UserRole;
    createdById: string;
    status: ResourceStatus;
    tags: string;
    downloadCount: number;
    lastDownloadedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

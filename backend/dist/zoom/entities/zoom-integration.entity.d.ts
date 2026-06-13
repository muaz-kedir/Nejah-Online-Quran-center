import { Teacher } from '../../teachers/entities/teacher.entity';
export declare class ZoomIntegration {
    id: string;
    teacher: Teacher;
    teacherId: string;
    zoomUserId: string;
    zoomEmail: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiresAt: Date;
    connectionStatus: string;
    connectedAt: Date;
    disconnectedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

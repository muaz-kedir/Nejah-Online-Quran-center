import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { EncryptionService } from '../common/encryption.service';
export declare class ZoomService {
    private readonly configService;
    private readonly httpService;
    private readonly zoomIntegrationRepository;
    private readonly encryptionService;
    private readonly logger;
    private readonly baseUrl;
    private cachedToken;
    constructor(configService: ConfigService, httpService: HttpService, zoomIntegrationRepository: Repository<ZoomIntegration>, encryptionService: EncryptionService);
    private get accountId();
    private get clientId();
    private get clientSecret();
    private get secretToken();
    getAccessToken(): Promise<string>;
    verifyWebhookSignature(body: Record<string, unknown>, signatureHeader: string): boolean;
    createMeeting(teacherZoomUserId: string, topic: string, startTime: Date, durationMinutes: number, settings?: Record<string, unknown>): Promise<{
        zoomMeetingId: string;
        zoomJoinUrl: string;
        zoomStartUrl: string;
        zoomPassword: string;
    }>;
    updateMeeting(zoomMeetingId: string, updateData: Record<string, unknown>): Promise<void>;
    deleteMeeting(zoomMeetingId: string): Promise<void>;
    getMeeting(zoomMeetingId: string): Promise<Record<string, unknown> | null>;
    getMeetingAnalytics(zoomMeetingId: string): Promise<Record<string, unknown> | null>;
    getZoomUser(zoomUserId: string): Promise<Record<string, unknown> | null>;
    saveTeacherIntegration(teacherId: string, zoomUserId: string, zoomEmail: string, tokens?: {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: Date;
    }): Promise<ZoomIntegration>;
    disconnectTeacher(teacherId: string): Promise<ZoomIntegration>;
    getTeacherIntegration(teacherId: string): Promise<ZoomIntegration | null>;
    getAllIntegrations(): Promise<ZoomIntegration[]>;
    getTeacherByZoomUserId(zoomUserId: string): Promise<ZoomIntegration | null>;
}

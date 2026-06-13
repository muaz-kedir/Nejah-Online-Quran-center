"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ZoomService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zoom_integration_entity_1 = require("./entities/zoom-integration.entity");
const encryption_service_1 = require("../common/encryption.service");
const crypto = require("crypto");
let ZoomService = ZoomService_1 = class ZoomService {
    constructor(configService, httpService, zoomIntegrationRepository, encryptionService) {
        this.configService = configService;
        this.httpService = httpService;
        this.zoomIntegrationRepository = zoomIntegrationRepository;
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(ZoomService_1.name);
        this.baseUrl = 'https://api.zoom.us/v2';
        this.cachedToken = null;
    }
    get accountId() {
        return this.configService.get('ZOOM_ACCOUNT_ID');
    }
    get clientId() {
        return this.configService.get('ZOOM_CLIENT_ID');
    }
    get clientSecret() {
        return this.configService.get('ZOOM_CLIENT_SECRET');
    }
    get secretToken() {
        return this.configService.get('ZOOM_SECRET_TOKEN');
    }
    async getAccessToken() {
        if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
            return this.cachedToken.accessToken;
        }
        const tokenUrl = 'https://zoom.us/oauth/token';
        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(tokenUrl, new URLSearchParams({ grant_type: 'account_credentials', account_id: this.accountId }), {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }));
            const { access_token, expires_in } = response.data;
            this.cachedToken = {
                accessToken: access_token,
                expiresAt: Date.now() + (expires_in - 60) * 1000,
            };
            return access_token;
        }
        catch (error) {
            this.logger.error('Failed to get Zoom access token', error.stack);
            throw new common_1.HttpException('Failed to authenticate with Zoom', common_1.HttpStatus.UNAUTHORIZED);
        }
    }
    verifyWebhookSignature(body, signatureHeader) {
        if (!this.secretToken) {
            this.logger.warn('ZOOM_SECRET_TOKEN not configured, skipping webhook verification');
            return true;
        }
        if (!signatureHeader) {
            this.logger.warn('Webhook request missing authorization header');
            return false;
        }
        try {
            const rawBody = JSON.stringify(body);
            const expectedSignature = crypto
                .createHmac('sha256', this.secretToken)
                .update(rawBody)
                .digest('hex');
            const expected = `v0=${expectedSignature}`;
            const actual = signatureHeader.trim();
            return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
        }
        catch {
            this.logger.warn('Webhook signature verification failed');
            return false;
        }
    }
    async createMeeting(teacherZoomUserId, topic, startTime, durationMinutes, settings) {
        const token = await this.getAccessToken();
        const defaultSettings = {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            mute_upon_entry: true,
            waiting_room: false,
            auto_recording: 'none',
            approval_type: 2,
            audio: 'voip',
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/users/${teacherZoomUserId}/meetings`, {
                topic,
                type: 2,
                start_time: startTime.toISOString(),
                duration: durationMinutes,
                timezone: 'UTC',
                settings: { ...defaultSettings, ...settings },
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }));
            const meeting = response.data;
            return {
                zoomMeetingId: meeting.id.toString(),
                zoomJoinUrl: meeting.join_url,
                zoomStartUrl: meeting.start_url,
                zoomPassword: meeting.password || '',
            };
        }
        catch (error) {
            this.logger.error(`Failed to create Zoom meeting: ${error.message}`, error.stack);
            const status = error?.response?.status;
            if (status === 404) {
                throw new common_1.HttpException('Zoom user not found — check Zoom integration settings', common_1.HttpStatus.BAD_REQUEST);
            }
            if (status === 429) {
                throw new common_1.HttpException('Zoom API rate limit exceeded — try again later', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            throw new common_1.HttpException(`Failed to create Zoom meeting: ${error.message}`, error?.response?.status || common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async updateMeeting(zoomMeetingId, updateData) {
        const token = await this.getAccessToken();
        const payload = {};
        if (updateData.topic)
            payload.topic = updateData.topic;
        if (updateData.startTime) {
            payload.start_time = new Date(updateData.startTime).toISOString();
            payload.type = 2;
        }
        if (updateData.durationMinutes)
            payload.duration = updateData.durationMinutes;
        if (updateData.settings)
            payload.settings = updateData.settings;
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.patch(`${this.baseUrl}/meetings/${zoomMeetingId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }));
        }
        catch (error) {
            this.logger.error(`Failed to update Zoom meeting ${zoomMeetingId}: ${error.message}`, error.stack);
            throw new common_1.HttpException(`Failed to update Zoom meeting: ${error.message}`, error?.response?.status || common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async deleteMeeting(zoomMeetingId) {
        const token = await this.getAccessToken();
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.delete(`${this.baseUrl}/meetings/${zoomMeetingId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }));
        }
        catch (error) {
            this.logger.error(`Failed to delete Zoom meeting ${zoomMeetingId}: ${error.message}`, error.stack);
            throw new common_1.HttpException(`Failed to delete Zoom meeting: ${error.message}`, error?.response?.status || common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async getMeeting(zoomMeetingId) {
        const token = await this.getAccessToken();
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/meetings/${zoomMeetingId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get Zoom meeting ${zoomMeetingId}: ${error.message}`, error.stack);
            return null;
        }
    }
    async getMeetingAnalytics(zoomMeetingId) {
        const token = await this.getAccessToken();
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/meetings/${zoomMeetingId}/participants`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page_size: 300 },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get Zoom meeting analytics: ${error.message}`, error.stack);
            return null;
        }
    }
    async getZoomUser(zoomUserId) {
        const token = await this.getAccessToken();
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/users/${zoomUserId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get Zoom user: ${error.message}`, error.stack);
            return null;
        }
    }
    async saveTeacherIntegration(teacherId, zoomUserId, zoomEmail, tokens) {
        let integration = await this.zoomIntegrationRepository.findOne({ where: { teacherId } });
        if (!integration) {
            integration = this.zoomIntegrationRepository.create({ teacherId });
        }
        integration.zoomUserId = zoomUserId;
        integration.zoomEmail = zoomEmail;
        integration.connectionStatus = 'connected';
        integration.connectedAt = new Date();
        if (tokens?.accessToken)
            integration.accessToken = this.encryptionService.encrypt(tokens.accessToken);
        if (tokens?.refreshToken)
            integration.refreshToken = this.encryptionService.encrypt(tokens.refreshToken);
        if (tokens?.expiresAt)
            integration.tokenExpiresAt = tokens.expiresAt;
        return this.zoomIntegrationRepository.save(integration);
    }
    async disconnectTeacher(teacherId) {
        const integration = await this.zoomIntegrationRepository.findOne({ where: { teacherId } });
        if (!integration) {
            throw new common_1.HttpException('Zoom integration not found', common_1.HttpStatus.NOT_FOUND);
        }
        integration.connectionStatus = 'disconnected';
        integration.disconnectedAt = new Date();
        integration.accessToken = null;
        integration.refreshToken = null;
        integration.tokenExpiresAt = null;
        return this.zoomIntegrationRepository.save(integration);
    }
    async getTeacherIntegration(teacherId) {
        return this.zoomIntegrationRepository.findOne({ where: { teacherId } });
    }
    async getAllIntegrations() {
        return this.zoomIntegrationRepository.find({ relations: ['teacher'] });
    }
    async getTeacherByZoomUserId(zoomUserId) {
        return this.zoomIntegrationRepository.findOne({
            where: { zoomUserId },
            relations: ['teacher'],
        });
    }
};
exports.ZoomService = ZoomService;
exports.ZoomService = ZoomService = ZoomService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(zoom_integration_entity_1.ZoomIntegration)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        typeorm_2.Repository,
        encryption_service_1.EncryptionService])
], ZoomService);
//# sourceMappingURL=zoom.service.js.map
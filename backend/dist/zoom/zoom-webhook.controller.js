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
var ZoomWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomWebhookController = void 0;
const common_1 = require("@nestjs/common");
const zoom_webhook_service_1 = require("./zoom-webhook.service");
const zoom_service_1 = require("./zoom.service");
const zoom_webhook_dto_1 = require("./dto/zoom-webhook.dto");
const throttler_1 = require("@nestjs/throttler");
const crypto = require("crypto");
let ZoomWebhookController = ZoomWebhookController_1 = class ZoomWebhookController {
    constructor(zoomWebhookService, zoomService) {
        this.zoomWebhookService = zoomWebhookService;
        this.zoomService = zoomService;
        this.logger = new common_1.Logger(ZoomWebhookController_1.name);
    }
    async handleWebhook(body, authHeader) {
        const isValid = this.zoomService.verifyWebhookSignature(body, authHeader || '');
        if (!isValid) {
            this.logger.warn('Invalid webhook signature received');
            return { status: false, message: 'Invalid signature' };
        }
        const event = body.event;
        const payload = body.payload;
        if (event === 'endpoint.url_validation') {
            const plainToken = payload?.plainToken;
            if (plainToken) {
                const hashForVerify = crypto
                    .createHmac('sha256', this.zoomService.secretToken || '')
                    .update(plainToken)
                    .digest('hex');
                return { plainToken, encryptedToken: hashForVerify };
            }
        }
        const eventId = payload?.object?.id
            ? `${event}_${payload.object.id}_${payload.event_ts || Date.now()}`
            : undefined;
        try {
            await this.zoomWebhookService.handleWebhook(event, payload, eventId);
            return { status: true, message: 'Webhook processed' };
        }
        catch (error) {
            this.logger.error(`Webhook processing error: ${error.message}`, error.stack);
            return { status: false, message: 'Processing error' };
        }
    }
};
exports.ZoomWebhookController = ZoomWebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zoom_webhook_dto_1.ZoomWebhookDto, String]),
    __metadata("design:returntype", Promise)
], ZoomWebhookController.prototype, "handleWebhook", null);
exports.ZoomWebhookController = ZoomWebhookController = ZoomWebhookController_1 = __decorate([
    (0, common_1.Controller)('zoom/webhook'),
    __metadata("design:paramtypes", [zoom_webhook_service_1.ZoomWebhookService,
        zoom_service_1.ZoomService])
], ZoomWebhookController);
//# sourceMappingURL=zoom-webhook.controller.js.map
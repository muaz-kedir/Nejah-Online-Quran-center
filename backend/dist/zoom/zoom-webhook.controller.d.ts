import { ZoomWebhookService } from './zoom-webhook.service';
import { ZoomService } from './zoom.service';
import { ZoomWebhookDto } from './dto/zoom-webhook.dto';
export declare class ZoomWebhookController {
    private readonly zoomWebhookService;
    private readonly zoomService;
    private readonly logger;
    constructor(zoomWebhookService: ZoomWebhookService, zoomService: ZoomService);
    handleWebhook(body: ZoomWebhookDto, authHeader: string): Promise<{
        status: boolean;
        message: string;
        plainToken?: undefined;
        encryptedToken?: undefined;
    } | {
        plainToken: any;
        encryptedToken: string;
        status?: undefined;
        message?: undefined;
    }>;
}

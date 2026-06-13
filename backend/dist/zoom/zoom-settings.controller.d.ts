import { ZoomService } from './zoom.service';
import { TeachersService } from '../teachers/teachers.service';
declare class ConnectZoomDto {
    zoomUserId: string;
    zoomEmail?: string;
}
export declare class ZoomSettingsController {
    private readonly zoomService;
    private readonly teachersService;
    constructor(zoomService: ZoomService, teachersService: TeachersService);
    connect(req: any, dto: ConnectZoomDto): Promise<import("./entities/zoom-integration.entity").ZoomIntegration>;
    disconnect(req: any): Promise<import("./entities/zoom-integration.entity").ZoomIntegration>;
    getStatus(req: any): Promise<import("./entities/zoom-integration.entity").ZoomIntegration>;
    getAll(): Promise<import("./entities/zoom-integration.entity").ZoomIntegration[]>;
    getZoomUser(zoomUserId: string): Promise<Record<string, unknown>>;
}
export {};

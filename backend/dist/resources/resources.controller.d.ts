import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
export declare class ResourcesController {
    private readonly resourcesService;
    constructor(resourcesService: ResourcesService);
    findAll(req: any, search?: string, category?: string): Promise<import("./resources.entity").Resource[]>;
    findOne(req: any, id: string): Promise<import("./resources.entity").Resource>;
    create(dto: CreateResourceDto): Promise<import("./resources.entity").Resource>;
    update(id: string, dto: UpdateResourceDto): Promise<import("./resources.entity").Resource>;
    remove(id: string): Promise<{
        message: string;
    }>;
}

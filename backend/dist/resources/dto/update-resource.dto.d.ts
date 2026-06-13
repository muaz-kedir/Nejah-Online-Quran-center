import { ResourceCategory } from '../resources.entity';
import { ResourceStatus } from '../resources.entity';
export declare class UpdateResourceDto {
    title?: string;
    description?: string;
    category?: ResourceCategory;
    fileUrl?: string;
    tags?: string;
    status?: ResourceStatus;
}

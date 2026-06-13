import { ResourceCategory } from '../resources.entity';
export declare class CreateResourceDto {
    title: string;
    description: string;
    category: ResourceCategory;
    fileUrl: string;
    tags?: string;
}

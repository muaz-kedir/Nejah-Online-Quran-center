import { ParentStatus } from '../entities/parent.entity';
export declare class QueryParentDto {
    search?: string;
    status?: ParentStatus;
    page?: number;
    limit?: number;
}

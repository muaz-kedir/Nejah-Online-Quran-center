import { ParentsService } from './parents.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { QueryParentDto } from './dto/query-parent.dto';
export declare class ParentsController {
    private readonly parentsService;
    constructor(parentsService: ParentsService);
    create(createParentDto: CreateParentDto): Promise<import("./entities/parent.entity").Parent>;
    findAll(queryDto: QueryParentDto): Promise<{
        data: import("./entities/parent.entity").Parent[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    search(search: string): Promise<import("./entities/parent.entity").Parent[]>;
    getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
    }>;
    findOne(id: string): Promise<import("./entities/parent.entity").Parent>;
    getParentStudents(id: string): Promise<import("../students/entities/student.entity").Student[]>;
    update(id: string, updateParentDto: UpdateParentDto): Promise<import("./entities/parent.entity").Parent>;
    remove(id: string): Promise<void>;
}

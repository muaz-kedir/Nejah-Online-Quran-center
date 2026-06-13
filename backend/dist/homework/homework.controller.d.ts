import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkStatusDto } from './dto/update-homework-status.dto';
import { TeachersService } from '../teachers/teachers.service';
import { TeacherReplacementsService } from '../teacher-replacements/teacher-replacements.service';
export declare class HomeworkController {
    private homeworkService;
    private teachersService;
    private replacementsService;
    constructor(homeworkService: HomeworkService, teachersService: TeachersService, replacementsService: TeacherReplacementsService);
    create(req: any, dto: CreateHomeworkDto): Promise<import("./entities/homework.entity").Homework>;
    findByStudent(req: any, studentId: string): Promise<import("./entities/homework.entity").Homework[]>;
    updateStatus(req: any, id: string, dto: UpdateHomeworkStatusDto): Promise<import("./entities/homework.entity").Homework>;
    remove(req: any, id: string): Promise<{
        message: string;
    }>;
}

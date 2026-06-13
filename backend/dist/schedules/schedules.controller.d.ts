import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { TeachersService } from '../teachers/teachers.service';
export declare class SchedulesController {
    private readonly schedulesService;
    private readonly teachersService;
    constructor(schedulesService: SchedulesService, teachersService: TeachersService);
    create(req: any, createScheduleDto: CreateScheduleDto): Promise<import("./entities/schedule.entity").Schedule>;
    findAll(req: any, studentId?: string, teacherId?: string): Promise<import("./entities/schedule.entity").Schedule[]>;
    getStudentSchedules(req: any, studentId: string): Promise<import("./entities/schedule.entity").Schedule[]>;
    getTeacherSchedules(req: any, teacherId: string): Promise<import("./entities/schedule.entity").Schedule[]>;
    getTeacherSchedulesByDay(req: any, teacherId: string, day: string): Promise<import("./entities/schedule.entity").Schedule[]>;
    findOne(req: any, id: string): Promise<import("./entities/schedule.entity").Schedule>;
    update(req: any, id: string, updateScheduleDto: UpdateScheduleDto): Promise<import("./entities/schedule.entity").Schedule>;
    remove(req: any, id: string): Promise<import("./entities/schedule.entity").Schedule>;
}

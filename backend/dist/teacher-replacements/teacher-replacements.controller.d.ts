import { TeacherReplacementsService } from './teacher-replacements.service';
import { CreateTeacherReplacementDto } from './dto/create-teacher-replacement.dto';
import { UpdateTeacherReplacementDto } from './dto/update-teacher-replacement.dto';
import { StartReplacementClassDto } from './dto/start-replacement-class.dto';
import { QueryTeacherReplacementDto } from './dto/query-teacher-replacement.dto';
export declare class TeacherReplacementsController {
    private readonly replacementsService;
    constructor(replacementsService: TeacherReplacementsService);
    create(req: any, dto: CreateTeacherReplacementDto): Promise<{
        message: string;
        data: import("./entities/teacher-replacement.entity").TeacherReplacement[];
    }>;
    findAll(req: any, query: QueryTeacherReplacementDto): Promise<{
        data: import("./entities/teacher-replacement.entity").TeacherReplacement[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getTemporaryStudents(teacherId: string): Promise<import("./entities/teacher-replacement.entity").TeacherReplacement[]>;
    getReassignedAway(teacherId: string): Promise<import("./entities/teacher-replacement.entity").TeacherReplacement[]>;
    findOne(id: string): Promise<{
        audits: import("./entities/teacher-replacement-audit.entity").TeacherReplacementAudit[];
        id: string;
        studentId: string;
        student: import("../students/entities/student.entity").Student;
        originalTeacherId: string;
        originalTeacher: import("../teachers/entities/teacher.entity").Teacher;
        replacementTeacherId: string;
        replacementTeacher: import("../teachers/entities/teacher.entity").Teacher;
        startDate: string;
        endDate: string;
        startTimeString: string;
        endTimeString: string;
        meetingLink: string;
        classSessionId: string;
        reason: import("../common/enums/replacement-reason.enum").ReplacementReason;
        customReason: string;
        notes: string;
        status: import("../common/enums/replacement-status.enum").ReplacementStatus;
        createdBy: string;
        creator: import("../users/entities/user.entity").User;
        updatedBy: string;
        cancelledBy: string;
        cancelledAt: Date;
        completedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(req: any, id: string, dto: UpdateTeacherReplacementDto): Promise<import("./entities/teacher-replacement.entity").TeacherReplacement>;
    cancel(req: any, id: string): Promise<import("./entities/teacher-replacement.entity").TeacherReplacement>;
    startClass(req: any, id: string, dto: StartReplacementClassDto): Promise<{
        message: string;
        session: import("../attendance/entities/class-session.entity").ClassSession;
        replacement: import("./entities/teacher-replacement.entity").TeacherReplacement;
    }>;
}

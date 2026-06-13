import { Repository } from 'typeorm';
import { Student, QuranLevel } from '../students/entities/student.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Homework } from '../homework/entities/homework.entity';
import { TeacherNote } from './entities/teacher-note.entity';
import { Progress } from '../progress/entities/progress.entity';
import { TeachersService } from './teachers.service';
import { TeacherReplacementsService } from '../teacher-replacements/teacher-replacements.service';
export declare class TeacherDashboardController {
    private studentsRepository;
    private schedulesRepository;
    private homeworkRepository;
    private notesRepository;
    private progressRepository;
    private teachersService;
    private replacementsService;
    constructor(studentsRepository: Repository<Student>, schedulesRepository: Repository<Schedule>, homeworkRepository: Repository<Homework>, notesRepository: Repository<TeacherNote>, progressRepository: Repository<Progress>, teachersService: TeachersService, replacementsService: TeacherReplacementsService);
    private requireTeacher;
    getDashboardData(req: any): Promise<{
        teacher: {
            id: string;
            name: string;
            title: string;
            avatar: string;
        };
        stats: {
            totalStudents: number;
            todayClasses: number;
            overallAttendance: number;
            homeworkPending: number;
        };
        temporaryStudents: import("../teacher-replacements/entities/teacher-replacement.entity").TeacherReplacement[];
        reassignedAwayStudents: import("../teacher-replacements/entities/teacher-replacement.entity").TeacherReplacement[];
        studentProgress: {
            id: string;
            name: string;
            initials: string;
            currentSurah: string;
            status: string;
            progress: number;
        }[];
        notes: {
            id: string;
            type: import("./entities/teacher-note.entity").TeacherNoteType;
            title: string;
            content: string;
            createdAt: string;
        }[];
        sessions: {
            id: string;
            time: string;
            title: string;
            type: string;
            students: string[];
            status: string;
        }[];
    }>;
    getTodaySessions(req: any): Promise<{
        scheduleId: string;
        title: string;
        isGroupSession: boolean;
        studentCount: number;
        students: {
            id: string;
            fullName: string;
            level: QuranLevel;
        }[];
        studentName: string;
        studentAvatar: string;
        sessionType: string;
        startTime: string;
        endTime: string;
        meetingLink: string;
        status: string;
        level: string;
    }[]>;
    getNotes(req: any): Promise<TeacherNote[]>;
    createNote(req: any, body: {
        title: string;
        content: string;
        type: string;
    }): Promise<TeacherNote>;
    updateNote(req: any, id: string, body: {
        title?: string;
        content?: string;
        type?: string;
    }): Promise<TeacherNote>;
    deleteNote(req: any, id: string): Promise<{
        success: boolean;
    }>;
}

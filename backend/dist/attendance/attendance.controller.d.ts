import { AttendanceService } from './attendance.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { StartMeetingDto } from './dto/start-meeting.dto';
import { RecordStudentAttendanceDto } from './dto/record-student-attendance.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { TeachersService } from '../teachers/teachers.service';
import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
export declare class AttendanceController {
    private attendanceService;
    private teachersService;
    private studentsRepository;
    constructor(attendanceService: AttendanceService, teachersService: TeachersService, studentsRepository: Repository<Student>);
    private resolveStudentIdForUser;
    private resolveTeacherIdForUser;
    createSession(req: any, dto: CreateClassSessionDto): Promise<import("./entities/class-session.entity").ClassSession>;
    startMeeting(dto: StartMeetingDto): Promise<import("./entities/class-session.entity").ClassSession>;
    endSession(dto: EndSessionDto): Promise<import("./entities/class-session.entity").ClassSession>;
    recordAttendance(req: any, dto: RecordStudentAttendanceDto): Promise<import("./entities/student-attendance.entity").StudentAttendance>;
    getSession(id: string): Promise<import("./entities/class-session.entity").ClassSession>;
    getSessionByScheduleToday(req: any, scheduleId: string): Promise<import("./entities/class-session.entity").ClassSession>;
    getStudentLiveClass(req: any): Promise<import("./entities/class-session.entity").ClassSession>;
    getTeacherSessions(req: any, date?: string, teacherIdQuery?: string): Promise<import("./entities/class-session.entity").ClassSession[]>;
    getStudentHistory(req: any, studentIdQuery?: string): Promise<import("./entities/student-attendance.entity").StudentAttendance[]>;
    getStudentStats(req: any, studentIdQuery?: string): Promise<any>;
    getLiveClasses(): Promise<import("./entities/class-session.entity").ClassSession[]>;
    getTodaysSessions(req: any): Promise<import("./entities/class-session.entity").ClassSession[]>;
}

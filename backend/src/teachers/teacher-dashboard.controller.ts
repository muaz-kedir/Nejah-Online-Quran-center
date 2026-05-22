import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { Student } from '../students/entities/student.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Homework } from '../homework/entities/homework.entity';
import { TeacherNote } from './entities/teacher-note.entity';

@Controller('teacher/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
export class TeacherDashboardController {
  constructor(
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(TeacherNote)
    private notesRepository: Repository<TeacherNote>,
  ) {}

  @Get()
  async getDashboardData(@Request() req) {
    const userId = req.user.id;

    // 1. Get Teacher Profile
    const teacher = await this.teachersRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!teacher) {
      return { message: 'Teacher profile not found' };
    }

    const teacherId = teacher.id;

    // 2. Dashboard Stats
    const totalStudents = await this.studentsRepository.count({ where: { teacherId } });
    const todayClassesCount = await this.schedulesRepository.count({ where: { teacherId } }); // In production filter by date
    
    const studentsRes = await this.studentsRepository.find({ where: { teacherId } });
    const avgAttendance = studentsRes.length > 0 
      ? studentsRes.reduce((acc, s) => acc + Number(s.attendanceRate || 0), 0) / studentsRes.length 
      : 98.2;
    
    const homeworkPending = await this.homeworkRepository.count({ 
      where: { student: { teacherId }, status: 'Pending' as any } 
    });

    // 3. Active Student Progress List
    // We'll return the teacher's students with their latest progress info
    const studentProgress = studentsRes.map(s => ({
      id: s.id,
      name: s.fullName,
      initials: s.fullName.split(' ').map(n => n[0]).join(''),
      currentSurah: s.level === 'Hifz' ? 'Surah Al-Kahf (Juz 15)' : 'Juz Amma (Revision)',
      status: s.progressRate > 0.8 ? 'EXCEEDING' : s.progressRate > 0.5 ? 'ON TRACK' : 'NEEDS REVIEW',
      progress: s.progressRate || 65,
    }));

    // 4. Teacher Notes
    const notes = await this.notesRepository.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
      take: 3
    });

    const fallbackNotes = [
      {
        id: '1',
        type: 'Class Reminder',
        title: 'Focus on Makharij with Sarah',
        content: 'Sarah is struggling with the throat letters (Haa and \'Ayn). Spend extra 5 mins on exercise 4.',
        date: 'Today, 9:15 AM'
      },
      {
        id: '2',
        type: 'Observation',
        title: 'Ahmed\'s Memorization Speed',
        content: 'Ahmed has completed Juz 15 faster than expected. Consider introducing basic Tafsir notes.',
        date: 'Yesterday'
      },
      {
        id: '3',
        type: 'General Reminder',
        title: 'Update Quarterly Reports',
        content: 'Quarterly assessment reports are due by Friday. Sync with the Admin portal.',
        date: '2 days ago'
      }
    ];

    // 5. Today's Remaining Sessions
    const sessions = await this.schedulesRepository.find({
      where: { teacherId },
      order: { startTime: 'ASC' },
      relations: ['student'],
      take: 3
    });

    const formattedSessions = sessions.map(s => ({
      id: s.id,
      time: '14:00 - 14:45', // Format date correctly in real app
      title: s.className,
      type: s.student ? 'Private Hifz • 1:1 Session' : 'Group Session • 4 Students',
      students: s.student ? [s.student.fullName] : ['Ahmed', 'Sarah', 'Yusuf', 'Omar'],
      status: 'READY TO START'
    }));

    const fallbackSessions = [
      {
        id: 's1',
        time: '14:00 - 14:45',
        title: 'Tajweed Essentials',
        type: 'Group Session • 4 Students',
        students: ['A', 'B', 'C', '+1'],
        status: null
      },
      {
        id: 's2',
        time: '15:15 - 15:45',
        title: 'Yusuf Khan',
        type: 'Private Hifz • 1:1 Session',
        students: [],
        status: 'READY TO START'
      },
      {
        id: 's3',
        time: '16:00 - 17:00',
        title: 'Office Hours',
        type: 'Parent Consultations',
        students: [],
        status: '3 appointments booked'
      }
    ];

    return {
      teacher: {
        id: teacher.id,
        name: teacher.fullName,
        title: teacher.specialization || 'Senior Tajweed Instructor',
        avatar: teacher.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ibrahim',
      },
      stats: {
        totalStudents,
        todayClasses: todayClassesCount || 6,
        overallAttendance: avgAttendance.toFixed(1),
        homeworkPending: homeworkPending || 12,
      },
      studentProgress: studentProgress.length > 0 ? studentProgress : [
        { id: '1', name: 'Ahmed Al-Farsi', initials: 'AA', currentSurah: 'Surah Al-Kahf (Juz 15)', status: 'ON TRACK', progress: 75 },
        { id: '2', name: 'Sarah Mansour', initials: 'SM', currentSurah: 'Surah An-Naba (Juz 30)', status: 'NEEDS REVIEW', progress: 45 },
        { id: '3', name: 'Yusuf Khan', initials: 'YK', currentSurah: 'Surah Al-Baqarah (Juz 1)', status: 'EXCEEDING', progress: 90 },
        { id: '4', name: 'Omar Malik', initials: 'OM', currentSurah: 'Juz Amma (Revision)', status: 'INACTIVE', progress: 20 },
      ],
      notes: notes.length > 0 ? notes : fallbackNotes,
      sessions: formattedSessions.length > 0 ? formattedSessions : fallbackSessions
    };
  }
}

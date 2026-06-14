import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan, In } from 'typeorm';
import { ExamEvaluation, EvaluationType } from './entities/exam-evaluation.entity';
import { Student, QuranLevel } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Parent } from '../parents/entities/parent.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { QueryEvaluationDto } from './dto/query-evaluation.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { LevelProgressionService, getNextLevel } from '../progress/level-progression.service';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(ExamEvaluation)
    private readonly evaluationRepository: Repository<ExamEvaluation>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly levelProgressionService: LevelProgressionService,
  ) {}

  async create(createDto: CreateEvaluationDto, creatorUserId: string, creatorRole: string): Promise<ExamEvaluation> {
    const student = await this.studentRepository.findOne({
      where: { id: createDto.studentId },
      relations: ['parent', 'parent.user'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Determine teacherId if the creator is a teacher
    let teacherId: string | null = null;
    if (creatorRole === UserRole.TEACHER) {
      const teacher = await this.teacherRepository.findOne({ where: { userId: creatorUserId } });
      if (!teacher) {
        throw new NotFoundException('Teacher profile not found for user');
      }
      teacherId = teacher.id;
    }

    // Auto-detect program type based on student's current level
    let programType = 'Other';
    const lvl = student.level;
    if (lvl === QuranLevel.QAIDA_NOORANIYA) {
      programType = 'Qaidah Nooraniyah';
    } else if (lvl === QuranLevel.QURAN_READING) {
      programType = 'Quran Reading';
    } else if (lvl === QuranLevel.TAJWEED_PROGRAM) {
      programType = 'Tajweed';
    } else if (lvl === QuranLevel.HIFZ_PROGRAM || lvl === QuranLevel.HIFZ_MURAJAA) {
      programType = 'Hifz (Memorization)';
    }

    // Determine promotion recommendation based on score (>= 80% ready, < 80% continue)
    const promotionRecommendation =
      createDto.score >= 80 ? 'Ready For Promotion' : 'Continue Current Level';

    const evaluation = this.evaluationRepository.create({
      studentId: createDto.studentId,
      teacherId: teacherId,
      programType: programType,
      currentLevel: student.level,
      evaluationType: createDto.evaluationType,
      evaluationDate: new Date(createDto.evaluationDate),
      score: createDto.score,
      teacherComments: createDto.teacherComments,
      recommendations: createDto.recommendations,
      promotionRecommendation: promotionRecommendation,
      criteriaRatings: createDto.criteriaRatings || {},
      metadata: createDto.metadata || {},
      promotionStatus: 'Pending',
    });

    const saved = await this.evaluationRepository.save(evaluation);

    // Send notifications to Student, Parent, Qirat Managers, and Super Admins
    try {
      const recipientIds: string[] = [];

      // Add student user ID
      if (student.userId) {
        recipientIds.push(student.userId);
      }

      // Add parent user ID
      if (student.parent?.user?.id) {
        recipientIds.push(student.parent.user.id);
      }

      // Add Qirat Managers and Super Admins
      const admins = await this.userRepository.find({
        where: {
          role: In([UserRole.QIRAT_MANAGER, UserRole.SUPER_ADMIN, UserRole.ADMIN]),
        },
      });
      recipientIds.push(...admins.map((u) => u.id));

      if (recipientIds.length > 0) {
        await this.notificationsService.sendCustomNotifications(
          recipientIds,
          'Exam Evaluation Published',
          'Your latest exam evaluation has been published.',
          { evaluationId: saved.id, studentId: student.id },
        );
      }
    } catch (err) {
      console.error('Failed to send notifications for evaluation', err);
    }

    return saved;
  }

  async findAll(queryDto: QueryEvaluationDto, user: { id: string; role: string }): Promise<ExamEvaluation[]> {
    const where: any = {};

    // Base filtering based on queryDto
    if (queryDto.studentId) {
      where.studentId = queryDto.studentId;
    }
    if (queryDto.teacherId) {
      where.teacherId = queryDto.teacherId;
    }
    if (queryDto.programType) {
      where.programType = queryDto.programType;
    }
    if (queryDto.evaluationType) {
      where.evaluationType = queryDto.evaluationType;
    }
    if (queryDto.promotionStatus) {
      where.promotionStatus = queryDto.promotionStatus;
    }
    if (queryDto.startDate && queryDto.endDate) {
      where.evaluationDate = Between(new Date(queryDto.startDate), new Date(queryDto.endDate));
    } else if (queryDto.startDate) {
      where.evaluationDate = MoreThan(new Date(queryDto.startDate));
    } else if (queryDto.endDate) {
      where.evaluationDate = LessThan(new Date(queryDto.endDate));
    }

    // Role-based row-level security filters
    if (user.role === UserRole.STUDENT) {
      // Students can only see their own evaluations
      const student = await this.studentRepository.findOne({ where: { userId: user.id } });
      if (!student) return [];
      where.studentId = student.id;
    } else if (user.role === UserRole.PARENT) {
      // Parents can only see their children's evaluations
      const parent = await this.userRepository.manager.findOne(Parent, {
        where: { user: { id: user.id } },
        relations: ['students'],
      });
      if (!parent || !parent.students || !parent.students.length) return [];
      where.studentId = In(parent.students.map((c) => c.id));
    } else if (user.role === UserRole.TEACHER) {
      // Teachers can only see evaluations they created, or for students assigned to them
      const teacher = await this.teacherRepository.findOne({ where: { userId: user.id } });
      if (!teacher) return [];
      
      const assignedStudents = await this.studentRepository.find({
        where: { teacherId: teacher.id },
      });
      
      const studentIds = assignedStudents.map((s) => s.id);
      
      // Where either student is assigned OR teacher is the creator
      const baseWhere = { ...where };
      
      const criteria: any[] = [
        { ...baseWhere, teacherId: teacher.id }
      ];
      
      if (studentIds.length > 0) {
        criteria.push({ ...baseWhere, studentId: In(studentIds) });
      }
      
      return this.evaluationRepository.find({
        where: criteria,
        relations: ['student', 'teacher'],
        order: { evaluationDate: 'DESC' },
      });
    }

    return this.evaluationRepository.find({
      where,
      relations: ['student', 'teacher'],
      order: { evaluationDate: 'DESC' },
    });
  }

  async findOne(id: string, user: { id: string; role: string }): Promise<ExamEvaluation> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['student', 'teacher'],
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    // Role-based security checks
    if (user.role === UserRole.STUDENT) {
      const student = await this.studentRepository.findOne({ where: { userId: user.id } });
      if (!student || evaluation.studentId !== student.id) {
        throw new BadRequestException('Access denied');
      }
    } else if (user.role === UserRole.PARENT) {
      const parent = await this.userRepository.manager.findOne(Parent, {
        where: { user: { id: user.id } },
        relations: ['students'],
      });
      const isParentOfStudent = parent?.students?.some((s) => s.id === evaluation.studentId);
      if (!isParentOfStudent) {
        throw new BadRequestException('Access denied');
      }
    } else if (user.role === UserRole.TEACHER) {
      const teacher = await this.teacherRepository.findOne({ where: { userId: user.id } });
      if (!teacher) {
        throw new BadRequestException('Access denied');
      }
      const isAssigned = await this.studentRepository.findOne({
        where: { id: evaluation.studentId, teacherId: teacher.id },
      });
      if (evaluation.teacherId !== teacher.id && !isAssigned) {
        throw new BadRequestException('Access denied');
      }
    }

    return evaluation;
  }

  async approvePromotion(id: string, approvalNotes: string, approvedByUserId: string): Promise<ExamEvaluation> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    if (evaluation.promotionRecommendation !== 'Ready For Promotion') {
      throw new BadRequestException('Promotion not recommended in this evaluation');
    }

    if (evaluation.promotionStatus !== 'Pending') {
      throw new BadRequestException(`Promotion is already ${evaluation.promotionStatus}`);
    }

    const student = evaluation.student;
    const nextLevel = getNextLevel(student.level);
    if (!nextLevel) {
      throw new BadRequestException('Student is already at the final level');
    }

    // Update evaluation status
    evaluation.promotionStatus = 'Approved';
    evaluation.approvedByUserId = approvedByUserId;
    evaluation.approvalDate = new Date();
    evaluation.approvalNotes = approvalNotes;

    const saved = await this.evaluationRepository.save(evaluation);

    // Call progression service to update level
    await this.levelProgressionService.promote(
      student,
      nextLevel,
      'manual_promotion',
      approvedByUserId,
      approvalNotes || `Promotion approved via Evaluation #${id}`,
    );

    return saved;
  }

  async rejectPromotion(id: string, rejectionNotes: string, rejectedByUserId: string): Promise<ExamEvaluation> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    if (evaluation.promotionStatus !== 'Pending') {
      throw new BadRequestException(`Promotion is already ${evaluation.promotionStatus}`);
    }

    evaluation.promotionStatus = 'Rejected';
    evaluation.approvedByUserId = rejectedByUserId;
    evaluation.approvalDate = new Date();
    evaluation.approvalNotes = rejectionNotes;

    return this.evaluationRepository.save(evaluation);
  }

  async getReportsStats(filters: {
    studentId?: string;
    teacherId?: string;
    programType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const where: any = {};
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.programType) where.programType = filters.programType;
    if (filters.startDate && filters.endDate) {
      where.evaluationDate = Between(new Date(filters.startDate), new Date(filters.endDate));
    }

    const evaluations = await this.evaluationRepository.find({ where });
    if (!evaluations.length) {
      return {
        totalEvaluations: 0,
        averageScore: 0,
        promotionReadyCount: 0,
        continueCount: 0,
        promotionRate: 0,
        scoreTrend: [],
      };
    }

    const totalEvaluations = evaluations.length;
    const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0);
    const averageScore = parseFloat((totalScore / totalEvaluations).toFixed(2));

    const promotionReadyCount = evaluations.filter((e) => e.promotionRecommendation === 'Ready For Promotion').length;
    const continueCount = totalEvaluations - promotionReadyCount;
    const promotionRate = parseFloat(((promotionReadyCount / totalEvaluations) * 100).toFixed(2));

    // Get score trend grouped by month/date
    const scoreTrend = evaluations
      .sort((a, b) => a.evaluationDate.getTime() - b.evaluationDate.getTime())
      .map((e) => ({
        date: e.evaluationDate.toISOString().split('T')[0],
        score: e.score,
        type: e.evaluationType,
        level: e.currentLevel,
      }));

    return {
      totalEvaluations,
      averageScore,
      promotionReadyCount,
      continueCount,
      promotionRate,
      scoreTrend,
    };
  }
}

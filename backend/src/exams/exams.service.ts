import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam, ExamDifficulty, ExamStatus } from './entities/exam.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Progress } from '../progress/entities/progress.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examsRepository: Repository<Exam>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
  ) {}

  async create(createExamDto: CreateExamDto): Promise<Exam> {
    const student = await this.studentsRepository.findOne({
      where: { id: createExamDto.studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const teacher = createExamDto.teacherId 
      ? await this.teachersRepository.findOne({ where: { id: createExamDto.teacherId } }) 
      : null;

    const progress = createExamDto.progressId
      ? await this.progressRepository.findOne({ where: { id: createExamDto.progressId } })
      : null;

    const exam = this.examsRepository.create({
      title: createExamDto.title,
      description: createExamDto.description,
      scheduledDate: createExamDto.scheduledDate,
      durationMinutes: createExamDto.durationMinutes,
      difficulty: createExamDto.difficulty,
      status: createExamDto.status,
      studentId: createExamDto.studentId,
      teacherId: createExamDto.teacherId || null,
      progressId: createExamDto.progressId || null,
      correctAnswers: createExamDto.correctAnswers ? createExamDto.correctAnswers.split(',') : null,
      studentAnswers: createExamDto.studentAnswers ? createExamDto.studentAnswers.split(',') : null,
    });

    return this.examsRepository.save(exam);
  }

  async findAll(query: {
    studentId?: string;
    teacherId?: string;
    status?: ExamStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: Exam[]; meta: any }> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const where: any = {};

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.teacherId) {
      where.teacherId = query.teacherId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [exams, total] = await this.examsRepository.findAndCount({
      where,
      relations: ['student', 'teacher', 'progress'],
      skip: (page - 1) * limit,
      take: limit,
      order: { scheduledDate: 'DESC' },
    });

    return {
      data: exams,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.examsRepository.findOne({
      where: { id },
      relations: ['student', 'teacher', 'progress'],
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return exam;
  }

  async update(id: string, updateExamDto: UpdateExamDto): Promise<Exam> {
    const exam = await this.findOne(id);

    if (updateExamDto.score !== undefined && updateExamDto.score !== null) {
      exam.status = ExamStatus.COMPLETED;
      exam.isGraded = true;
    }

    Object.assign(exam, updateExamDto);
    return this.examsRepository.save(exam);
  }

  async remove(id: string): Promise<void> {
    const exam = await this.findOne(id);
    await this.examsRepository.remove(exam);
  }

  async gradeExam(
    id: string,
    score: number,
    maxScore: number,
    feedback: string,
  ): Promise<Exam> {
    const exam = await this.findOne(id);

    if (exam.status !== ExamStatus.IN_PROGRESS && exam.status !== ExamStatus.SCHEDULED) {
      throw new BadRequestException('Exam must be in progress or scheduled to be graded');
    }

    exam.score = score;
    exam.maxScore = maxScore;
    exam.feedback = feedback;
    exam.isGraded = true;
    exam.status = ExamStatus.COMPLETED;

    return this.examsRepository.save(exam);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Homework, HomeworkStatus } from './entities/homework.entity';
import { Student } from '../students/entities/student.entity';
import { CreateHomeworkDto } from './dto/create-homework.dto';

@Injectable()
export class HomeworkService {
  constructor(
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(dto: CreateHomeworkDto): Promise<Homework> {
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const homework = this.homeworkRepository.create({
      title: dto.title,
      description: dto.description,
      difficulty: dto.difficulty,
      dueDate: new Date(dto.dueDate),
      studentId: dto.studentId,
      status: HomeworkStatus.PENDING,
    });

    return this.homeworkRepository.save(homework);
  }

  async findByStudent(studentId: string): Promise<Homework[]> {
    return this.homeworkRepository.find({
      where: { studentId },
      relations: ['student'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Homework> {
    const homework = await this.homeworkRepository.findOne({ where: { id } });
    if (!homework) {
      throw new NotFoundException('Homework not found');
    }
    return homework;
  }

  async updateStatus(id: string, status: HomeworkStatus): Promise<Homework> {
    const homework = await this.findOne(id);
    homework.status = status;
    return this.homeworkRepository.save(homework);
  }

  async remove(id: string): Promise<void> {
    const homework = await this.findOne(id);
    await this.homeworkRepository.remove(homework);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
  ) {}

  async findAll(studentId?: string, teacherId?: string) {
    const qb = this.schedulesRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.student', 'student')
      .leftJoinAndSelect('schedule.teacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'user');

    if (studentId) {
      qb.andWhere('schedule.studentId = :studentId', { studentId });
    }

    if (teacherId) {
      qb.andWhere('schedule.teacherId = :teacherId', { teacherId });
    }

    return qb.orderBy('schedule.startTime', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.schedulesRepository.findOne({
      where: { id },
      relations: ['student', 'teacher', 'teacher.user'],
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async getStudentSchedules(studentId: string) {
    return this.findAll(studentId);
  }

  async getTeacherSchedules(teacherId: string) {
    return this.findAll(undefined, teacherId);
  }
}

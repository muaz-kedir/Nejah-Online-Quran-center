import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
  ) {}

  async createSchedule(data: {
    studentId: string;
    teacherId: string;
    dayOfWeek: string;
    startTimeString: string;
    endTimeString: string;
    className?: string;
  }) {
    const { startTimeString, endTimeString, dayOfWeek, teacherId } = data;

    if (!startTimeString || !endTimeString) {
      throw new BadRequestException('Schedule must include both start and end times');
    }

    if (startTimeString >= endTimeString) {
      throw new BadRequestException('Schedule start time must be before end time');
    }

    const existingSchedules = await this.schedulesRepository.find({
      where: {
        teacherId,
        dayOfWeek,
        status: 'active'
      }
    });

    const isOverlap = (existingStart: string, existingEnd: string, newStart: string, newEnd: string) => {
      return existingStart < newEnd && newStart < existingEnd;
    };

    for (const existing of existingSchedules) {
      if (isOverlap(existing.startTimeString, existing.endTimeString, startTimeString, endTimeString)) {
        throw new BadRequestException(
          `Teacher already has a class on ${dayOfWeek} from ${existing.startTimeString} to ${existing.endTimeString}`,
        );
      }
    }

    const schedule = this.schedulesRepository.create({
      ...data,
      className: data.className || 'Quran Class',
      status: 'active'
    });

    return this.schedulesRepository.save(schedule);
  }

  async findAll(studentId?: string, teacherId?: string) {
    const qb = this.schedulesRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.student', 'student')
      .leftJoinAndSelect('schedule.teacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .where("schedule.status = :status", { status: 'active' });

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

  async clearStudentSchedules(studentId: string) {
    await this.schedulesRepository.delete({ studentId });
  }

  async deleteSchedule(id: string) {
    const schedule = await this.schedulesRepository.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return this.schedulesRepository.remove(schedule);
  }
}

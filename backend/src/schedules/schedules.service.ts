import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { ScheduleStudent } from './entities/schedule-student.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { matchesDayOfWeek } from '../common/utils/day-of-week.util';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(ScheduleStudent)
    private scheduleStudentsRepository: Repository<ScheduleStudent>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
  ) {}

  private isOverlap(
    existingStart: string,
    existingEnd: string,
    newStart: string,
    newEnd: string,
  ) {
    return existingStart < newEnd && newStart < existingEnd;
  }

  private async validateNoOverlap(
    teacherId: string,
    dayOfWeek: string,
    startTimeString: string,
    endTimeString: string,
    excludeId?: string,
  ) {
    const existingSchedules = await this.schedulesRepository.find({
      where: { teacherId, dayOfWeek, status: 'active' },
    });

    for (const existing of existingSchedules) {
      if (excludeId && existing.id === excludeId) continue;
      if (
        this.isOverlap(
          existing.startTimeString,
          existing.endTimeString,
          startTimeString,
          endTimeString,
        )
      ) {
        throw new BadRequestException(
          `Teacher already has a class on ${dayOfWeek} from ${existing.startTimeString} to ${existing.endTimeString}`,
        );
      }
    }
  }

  private async validateGroupStudents(teacherId: string, studentIds: string[]) {
    const students = await this.studentsRepository.find({
      where: { id: In(studentIds) },
    });

    if (students.length !== studentIds.length) {
      throw new BadRequestException('One or more students were not found');
    }

    const notAssigned = students.filter((s) => s.teacherId !== teacherId);
    if (notAssigned.length > 0) {
      throw new BadRequestException(
        `Students must be assigned to this teacher: ${notAssigned.map((s) => s.fullName).join(', ')}`,
      );
    }
  }

  async createSchedule(data: CreateScheduleDto) {
    const { startTimeString, endTimeString, dayOfWeek, teacherId } = data;
    const isGroupSession = !!data.isGroupSession;

    if (!startTimeString || !endTimeString) {
      throw new BadRequestException('Schedule must include both start and end times');
    }

    if (startTimeString >= endTimeString) {
      throw new BadRequestException('Schedule start time must be before end time');
    }

    if (isGroupSession) {
      if (!data.studentIds || data.studentIds.length < 2) {
        throw new BadRequestException('Group sessions require at least 2 students');
      }
      if (data.studentId) {
        throw new BadRequestException('Group sessions must not include a single studentId');
      }
      await this.validateGroupStudents(teacherId, data.studentIds);
    } else {
      if (!data.studentId) {
        throw new BadRequestException('Individual sessions require a studentId');
      }
    }

    await this.validateNoOverlap(teacherId, dayOfWeek, startTimeString, endTimeString);

    const schedule = this.schedulesRepository.create({
      teacherId,
      dayOfWeek,
      startTimeString,
      endTimeString,
      meetingLink: data.meetingLink,
      classType: data.classType,
      className: data.className || 'Quran Class',
      notes: data.notes,
      status: 'active',
      isGroupSession,
      studentId: isGroupSession ? null : data.studentId,
    });

    const saved = await this.schedulesRepository.save(schedule);

    if (isGroupSession && data.studentIds) {
      const rows = data.studentIds.map((studentId) =>
        this.scheduleStudentsRepository.create({ scheduleId: saved.id, studentId }),
      );
      await this.scheduleStudentsRepository.save(rows);
    }

    return this.findOne(saved.id);
  }

  async findAll(studentId?: string, teacherId?: string) {
    const qb = this.schedulesRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.student', 'student')
      .leftJoinAndSelect('schedule.scheduleStudents', 'scheduleStudents')
      .leftJoinAndSelect('scheduleStudents.student', 'groupStudent')
      .leftJoinAndSelect('schedule.teacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .where('schedule.status = :status', { status: 'active' });

    if (studentId) {
      qb.andWhere(
        '(schedule.studentId = :studentId OR scheduleStudents.studentId = :studentId)',
        { studentId },
      );
    }

    if (teacherId) {
      qb.andWhere('schedule.teacherId = :teacherId', { teacherId });
    }

    return qb.orderBy('schedule.startTime', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.schedulesRepository.findOne({
      where: { id },
      relations: [
        'student',
        'teacher',
        'teacher.user',
        'scheduleStudents',
        'scheduleStudents.student',
      ],
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

  async getTeacherSchedulesByDay(teacherId: string, day: string) {
    const schedules = await this.schedulesRepository.find({
      where: { teacherId, status: 'active' },
      relations: [
        'student',
        'teacher',
        'teacher.user',
        'scheduleStudents',
        'scheduleStudents.student',
      ],
      order: { startTimeString: 'ASC' },
    });

    return schedules.filter((schedule) =>
      matchesDayOfWeek(schedule.dayOfWeek, day),
    );
  }

  async updateSchedule(id: string, updateData: UpdateScheduleDto) {
    const schedule = await this.findOne(id);

    if (updateData.startTimeString || updateData.endTimeString || updateData.dayOfWeek) {
      const startTimeString = updateData.startTimeString || schedule.startTimeString;
      const endTimeString = updateData.endTimeString || schedule.endTimeString;
      const dayOfWeek = updateData.dayOfWeek || schedule.dayOfWeek;

      if (startTimeString >= endTimeString) {
        throw new BadRequestException('Schedule start time must be before end time');
      }

      await this.validateNoOverlap(
        schedule.teacherId,
        dayOfWeek,
        startTimeString,
        endTimeString,
        id,
      );
    }

    const { studentIds, isGroupSession, studentId, ...rest } = updateData;
    Object.assign(schedule, rest);
    return this.schedulesRepository.save(schedule);
  }

  async clearStudentSchedules(studentId: string) {
    await this.schedulesRepository.delete({ studentId });

    const groupMemberships = await this.scheduleStudentsRepository.find({
      where: { studentId },
    });

    for (const membership of groupMemberships) {
      await this.scheduleStudentsRepository.delete({ id: membership.id });

      const remaining = await this.scheduleStudentsRepository.count({
        where: { scheduleId: membership.scheduleId },
      });

      if (remaining === 0) {
        await this.schedulesRepository.delete({ id: membership.scheduleId });
      }
    }
  }

  async deleteSchedule(id: string) {
    const schedule = await this.schedulesRepository.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return this.schedulesRepository.remove(schedule);
  }
}

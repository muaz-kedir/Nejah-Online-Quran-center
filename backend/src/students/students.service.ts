import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  async create(studentData: Partial<Student>): Promise<Student> {
    const student = this.studentsRepository.create(studentData);
    return this.studentsRepository.save(student);
  }

  async findAll(): Promise<Student[]> {
    return this.studentsRepository.find({
      relations: ['user', 'parent']
    });
  }

  async findByEmail(email: string): Promise<Student | null> {
    return this.studentsRepository.findOne({ 
      where: { email },
      relations: ['user', 'parent']
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({ 
      where: { id },
      relations: ['user', 'parent']
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async update(id: string, updateData: Partial<Student>): Promise<Student> {
    const student = await this.findOne(id);
    Object.assign(student, updateData);
    return this.studentsRepository.save(student);
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentsRepository.remove(student);
  }
}

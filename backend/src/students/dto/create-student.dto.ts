import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { QuranLevel, Gender, StudentStatus } from '../entities/student.entity';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsNumber()
  @Min(3)
  @Max(80)
  age: number;

  @IsOptional()
  @IsString()
  currentResidency?: string;

  @IsEnum(QuranLevel)
  level: QuranLevel;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { QuranLevel, StudentStatus } from '../entities/student.entity';
import { Gender } from '../../common/enums/gender.enum';

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
  teacherId?: string | null;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsNumber()
  attendanceRate?: number;

  @IsOptional()
  @IsNumber()
  progressRate?: number;

  @IsOptional()
  @IsString()
  familyName?: string;

  @IsOptional()
  @IsString()
  familyPhone?: string;

  @IsOptional()
  @IsString()
  familyAddress?: string;

  @IsOptional()
  @IsString()
  familyCountry?: string;

  @IsOptional()
  @IsString()
  learningGoals?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

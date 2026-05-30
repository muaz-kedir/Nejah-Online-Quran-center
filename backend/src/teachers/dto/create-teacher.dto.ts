import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '../../common/enums/gender.enum';

export class CreateTeacherDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  qualification?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsNumber()
  @IsOptional()
  experience?: number;

  @IsString()
  @IsOptional()
  currentResidency?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  weeklySchedule?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlySalary?: number;

  @IsString()
  @IsOptional()
  islamicEducationLevel?: string;

  @IsString()
  @IsOptional()
  teachingTopics?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

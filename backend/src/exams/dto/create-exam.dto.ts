import { IsString, IsOptional, IsUUID, IsDate, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { ExamDifficulty, ExamStatus } from '../entities/exam.entity';

export class CreateExamDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  scheduledDate: Date;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsEnum(ExamDifficulty)
  @IsOptional()
  difficulty?: ExamDifficulty;

  @IsEnum(ExamStatus)
  @IsOptional()
  status?: ExamStatus;

  @IsUUID()
  studentId: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsUUID()
  @IsOptional()
  progressId?: string;

  @IsString()
  @IsOptional()
  correctAnswers?: string;

  @IsString()
  @IsOptional()
  studentAnswers?: string;
}

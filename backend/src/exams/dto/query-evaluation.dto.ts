import { IsOptional, IsString, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { EvaluationType } from '../entities/exam-evaluation.entity';

export class QueryEvaluationDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsString()
  programType?: string;

  @IsOptional()
  @IsEnum(EvaluationType)
  evaluationType?: EvaluationType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  promotionStatus?: string;
}

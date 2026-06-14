import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
} from 'class-validator';
import { EvaluationType } from '../entities/exam-evaluation.entity';

export class CreateEvaluationDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(EvaluationType)
  @IsNotEmpty()
  evaluationType: EvaluationType;

  @IsDateString()
  @IsNotEmpty()
  evaluationDate: string;

  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @IsString()
  @IsNotEmpty()
  teacherComments: string;

  @IsString()
  @IsOptional()
  recommendations?: string;

  @IsObject()
  @IsOptional()
  criteriaRatings?: Record<string, string | number>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

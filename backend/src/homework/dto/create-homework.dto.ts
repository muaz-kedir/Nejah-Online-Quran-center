import { IsString, IsEnum, IsDateString, IsUUID, IsOptional } from 'class-validator';
import { HomeworkDifficulty } from '../entities/homework.entity';

export class CreateHomeworkDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(HomeworkDifficulty)
  difficulty?: HomeworkDifficulty;

  @IsDateString()
  dueDate: string;

  @IsUUID()
  studentId: string;
}

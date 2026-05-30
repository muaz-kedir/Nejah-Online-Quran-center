import { IsEnum } from 'class-validator';
import { HomeworkStatus } from '../entities/homework.entity';

export class UpdateHomeworkStatusDto {
  @IsEnum(HomeworkStatus)
  status: HomeworkStatus;
}

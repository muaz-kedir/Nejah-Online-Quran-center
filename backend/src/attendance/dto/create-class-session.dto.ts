import { IsString, IsDate, IsUUID, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassSessionDto {
  @IsString()
  classTitle: string;

  @IsString()
  subject: string;

  @IsString()
  quranLevel: string;

  @IsDate()
  @Type(() => Date)
  sessionDate: Date;

  @IsString()
  scheduledStartTime: string;

  @IsString()
  scheduledEndTime: string;

  @IsUUID()
  teacherId: string;

  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  @IsOptional()
  @IsArray()
  assignedStudentIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

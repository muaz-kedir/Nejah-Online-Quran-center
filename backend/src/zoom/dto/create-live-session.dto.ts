import { IsString, IsUUID, IsOptional, IsDate, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { LiveSessionStatus } from '../enums/live-session-status.enum';

export class CreateLiveSessionDto {
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  @IsDate()
  @Type(() => Date)
  scheduledStart: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledEnd?: Date;

  @IsOptional()
  @IsEnum(LiveSessionStatus)
  status?: LiveSessionStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ScheduleSlotDto {
  @IsString()
  dayOfWeek: string;

  @IsString()
  startTimeString: string;

  @IsString()
  endTimeString: string;

  @IsString()
  @IsOptional()
  className?: string;
}

export class AssignStudentDto {
  @IsString()
  studentId: string;

  @IsString()
  teacherId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedules?: ScheduleSlotDto[];
}

export class UnassignStudentDto {
  @IsString()
  studentId: string;
}

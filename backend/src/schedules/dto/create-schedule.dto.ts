import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsUUID()
  teacherId: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('4', { each: true })
  studentIds?: string[];

  @IsOptional()
  @IsBoolean()
  isGroupSession?: boolean;

  @IsNotEmpty()
  @IsString()
  dayOfWeek: string;

  @IsNotEmpty()
  @IsString()
  startTimeString: string;

  @IsNotEmpty()
  @IsString()
  endTimeString: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  classType?: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

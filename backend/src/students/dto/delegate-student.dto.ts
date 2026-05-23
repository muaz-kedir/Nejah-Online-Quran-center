import { IsUUID, IsNotEmpty, IsDateString, IsOptional, IsString } from 'class-validator';

export class DelegateStudentDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  teacherId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsOptional()
  className?: string;

  @IsString()
  @IsOptional()
  meetingLink?: string;
}

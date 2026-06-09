import { IsString, IsUUID, IsOptional } from 'class-validator';

export class RecordStudentAttendanceDto {
  @IsUUID()
  classSessionId: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsString()
  action?: 'join' | 'leave';
}

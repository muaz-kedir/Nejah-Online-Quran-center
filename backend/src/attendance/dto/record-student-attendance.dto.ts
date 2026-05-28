import { IsString, IsUUID, IsOptional } from 'class-validator';

export class RecordStudentAttendanceDto {
  @IsUUID()
  classSessionId: string;

  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsString()
  action?: 'join' | 'leave';
}

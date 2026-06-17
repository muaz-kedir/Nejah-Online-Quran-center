import { IsString, IsUUID, IsOptional } from 'class-validator';

export class StartMeetingDto {
  @IsUUID()
  classSessionId: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;
}

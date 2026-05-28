import { IsString, IsUUID } from 'class-validator';

export class StartMeetingDto {
  @IsUUID()
  classSessionId: string;

  @IsString()
  meetingLink: string;
}

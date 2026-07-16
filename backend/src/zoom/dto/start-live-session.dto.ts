import { IsOptional, IsString, Matches } from 'class-validator';

export class StartLiveSessionDto {
  @IsOptional()
  @IsString()
  @Matches(/^https:\/\//, { message: 'Meeting link must be a valid HTTPS URL' })
  meetingLink?: string;
}

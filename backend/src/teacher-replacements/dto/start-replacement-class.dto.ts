import { IsString, Matches } from 'class-validator';

export class StartReplacementClassDto {
  @IsString()
  @Matches(/^https?:\/\/.+/i, { message: 'Meeting link must be a valid URL (http:// or https://)' })
  meetingLink: string;
}

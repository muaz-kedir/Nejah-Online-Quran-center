import { IsString, IsUUID } from 'class-validator';

export class CreateSessionNoteDto {
  @IsUUID()
  sessionId: string;

  @IsUUID()
  teacherId: string;

  @IsString()
  content: string;
}

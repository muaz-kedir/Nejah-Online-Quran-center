import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateSessionNoteDto {
  @IsUUID()
  sessionId: string;

  @IsUUID()
  teacherId: string;

  @IsString()
  @MinLength(1, { message: 'Content must not be empty' })
  content: string;
}

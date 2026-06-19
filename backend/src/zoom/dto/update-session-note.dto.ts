import { IsString, IsOptional, MinLength, IsEnum } from 'class-validator';
import { SessionNoteVisibility } from '../entities/session-note.entity';

export class UpdateSessionNoteDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Content must not be empty' })
  content?: string;

  @IsOptional()
  @IsEnum(SessionNoteVisibility)
  visibility?: SessionNoteVisibility;

  @IsOptional()
  @IsString()
  lessonSummary?: string;

  @IsOptional()
  @IsString()
  topicsCovered?: string;

  @IsOptional()
  @IsString()
  homeworkAssigned?: string;

  @IsOptional()
  @IsString()
  completionRemarks?: string;

  @IsOptional()
  @IsString()
  studentPerformance?: string;
}

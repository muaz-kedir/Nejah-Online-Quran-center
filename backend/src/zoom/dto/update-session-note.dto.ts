import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateSessionNoteDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Content must not be empty' })
  content?: string;
}

import { IsString, IsOptional } from 'class-validator';

export class UpdateSessionNoteDto {
  @IsOptional()
  @IsString()
  content?: string;
}

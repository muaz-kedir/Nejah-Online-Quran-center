import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsString()
  fileUrl: string;

  @IsString()
  @IsOptional()
  tags?: string;
}

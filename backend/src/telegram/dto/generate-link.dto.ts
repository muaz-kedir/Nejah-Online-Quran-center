import { IsString, IsOptional } from 'class-validator';

export class GenerateLinkDto {
  @IsString()
  @IsOptional()
  returnUrl?: string;
}

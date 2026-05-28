import { IsUUID, IsOptional, IsString } from 'class-validator';

export class EndSessionDto {
  @IsUUID()
  classSessionId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

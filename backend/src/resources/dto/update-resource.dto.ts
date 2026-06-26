import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ResourceStatus } from '../resources.entity';

export class UpdateResourceDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;
}

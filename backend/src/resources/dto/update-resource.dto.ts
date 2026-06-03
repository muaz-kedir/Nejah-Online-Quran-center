import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ResourceCategory } from '../resources.entity';
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
  @IsEnum(ResourceCategory)
  category?: ResourceCategory;

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

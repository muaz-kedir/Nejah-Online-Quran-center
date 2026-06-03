import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ResourceCategory } from '../resources.entity';

export class CreateResourceDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  @IsEnum(ResourceCategory)
  category: ResourceCategory;

  @IsString()
  fileUrl: string;

  @IsString()
  @IsOptional()
  tags?: string;
}

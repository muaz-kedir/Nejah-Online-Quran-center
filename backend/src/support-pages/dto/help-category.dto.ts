import { IsOptional, IsString, IsNumber, IsArray, IsObject } from 'class-validator';

export class CreateCategoryDto {
  @IsObject()
  name: Record<string, string>;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsObject()
  description?: Record<string, string>;

  @IsString()
  slug: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsObject()
  name?: Record<string, string>;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsObject()
  description?: Record<string, string>;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class ReorderCategoriesDto {
  @IsArray()
  ids: string[];
}

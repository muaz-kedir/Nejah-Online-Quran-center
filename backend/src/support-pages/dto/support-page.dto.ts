import { IsOptional, IsString, IsEnum, IsObject } from 'class-validator';
import { PageStatus } from '../entities/support-page.entity';

export class CreateSupportPageDto {
  @IsString()
  slug: string;

  @IsOptional()
  @IsObject()
  title?: Record<string, string>;

  @IsOptional()
  @IsObject()
  subtitle?: Record<string, string>;

  @IsOptional()
  @IsObject()
  content?: Record<string, string>;

  @IsOptional()
  @IsObject()
  metaTitle?: Record<string, string>;

  @IsOptional()
  @IsObject()
  metaDescription?: Record<string, string>;

  @IsOptional()
  @IsObject()
  metaKeywords?: Record<string, string>;

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;
}

export class UpdateSupportPageDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsObject()
  title?: Record<string, string>;

  @IsOptional()
  @IsObject()
  subtitle?: Record<string, string>;

  @IsOptional()
  @IsObject()
  content?: Record<string, string>;

  @IsOptional()
  @IsObject()
  metaTitle?: Record<string, string>;

  @IsOptional()
  @IsObject()
  metaDescription?: Record<string, string>;

  @IsOptional()
  @IsObject()
  metaKeywords?: Record<string, string>;

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;
}

export class UpdatePageStatusDto {
  @IsEnum(PageStatus)
  status: PageStatus;
}

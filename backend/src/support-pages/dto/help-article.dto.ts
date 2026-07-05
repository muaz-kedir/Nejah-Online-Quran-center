import { IsOptional, IsString, IsEnum, IsObject, IsArray, IsUUID, IsNumber, IsBoolean } from 'class-validator';
import { ArticleStatus } from '../entities/help-article.entity';

export class CreateArticleDto {
  @IsObject()
  title: Record<string, string>;

  @IsString()
  slug: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsObject()
  shortDescription?: Record<string, string>;

  @IsOptional()
  @IsObject()
  content?: Record<string, string>;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}

export class UpdateArticleDto {
  @IsOptional()
  @IsObject()
  title?: Record<string, string>;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsObject()
  shortDescription?: Record<string, string>;

  @IsOptional()
  @IsObject()
  content?: Record<string, string>;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}

export class ArticleQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class ArticleFeedbackDto {
  @IsBoolean()
  isHelpful: boolean;
}

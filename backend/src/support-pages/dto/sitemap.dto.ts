import { IsOptional, IsString, IsBoolean, IsNumber, IsArray, IsUUID } from 'class-validator';

export class CreateSitemapItemDto {
  @IsString()
  title: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class UpdateSitemapItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class ReorderSitemapDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}

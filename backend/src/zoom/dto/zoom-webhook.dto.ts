import { IsString, IsObject, IsOptional, IsNotEmptyObject } from 'class-validator';

export class ZoomWebhookDto {
  @IsString()
  event: string;

  @IsObject()
  @IsNotEmptyObject()
  payload: Record<string, unknown>;

  @IsOptional()
  @IsString()
  event_ts?: string;
}

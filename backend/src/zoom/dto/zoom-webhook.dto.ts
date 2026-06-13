import { IsString, IsObject, IsOptional } from 'class-validator';

export class ZoomWebhookDto {
  @IsString()
  event: string;

  @IsObject()
  payload: any;

  @IsOptional()
  @IsString()
  event_ts?: string;
}

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @IsString()
  @IsOptional()
  deviceInfo?: string;

  @IsString()
  @IsOptional()
  platform?: string;
}

export class UnregisterFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}

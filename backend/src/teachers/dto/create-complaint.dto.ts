import { IsString, IsNotEmpty } from 'class-validator';

export class CreateComplaintDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  details: string;
}

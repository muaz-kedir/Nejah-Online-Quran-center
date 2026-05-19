import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ParentStatus } from '../entities/parent.entity';

export class CreateParentDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  residency: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsNotEmpty()
  @IsString()
  relationshipWithStudent: string;

  @IsOptional()
  @IsEnum(ParentStatus)
  status?: ParentStatus;

  @IsOptional()
  @IsString()
  password?: string;
}

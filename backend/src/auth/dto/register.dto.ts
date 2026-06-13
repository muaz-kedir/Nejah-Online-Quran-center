import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateIf,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AgeRange } from '../../students/entities/student.entity';

export class StudentRegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsEnum(AgeRange)
  @IsNotEmpty()
  ageRange: AgeRange;

  @IsString()
  @IsOptional()
  residency?: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsBoolean()
  @IsOptional()
  kitabRequested?: boolean;

  @IsString()
  @IsOptional()
  kitabName?: string;

  @IsBoolean()
  @IsOptional()
  previousTraining?: boolean;

  @IsString()
  @IsOptional()
  trainingDetails?: string;

  @IsString()
  @IsOptional()
  referralSource?: string;

  @IsString()
  @IsNotEmpty()
  levelOfQuran: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export class ParentRegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  residency?: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  relationshipWithStudent: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export class RegisterDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => StudentRegisterDto)
  student: StudentRegisterDto;

  // When set, the student is linked to this existing parent and no new
  // parent account is created (parent info form was skipped).
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ValidateIf((o) => o.student?.ageRange === AgeRange.UNDER_18 && !o.parentId)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ParentRegisterDto)
  parent?: ParentRegisterDto;
}

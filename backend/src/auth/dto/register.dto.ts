import { IsEmail, IsNotEmpty, IsString, MinLength, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentRegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsNumber()
  @IsNotEmpty()
  age: number;

  @IsString()
  @IsNotEmpty()
  residency: string;

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
  @IsNotEmpty()
  residency: string;

  @IsString()
  @IsNotEmpty()
  relationshipWithStudent: string;
}

export class RegisterDto {
  @ValidateNested()
  @Type(() => StudentRegisterDto)
  student: StudentRegisterDto;

  @ValidateNested()
  @Type(() => ParentRegisterDto)
  parent: ParentRegisterDto;
}

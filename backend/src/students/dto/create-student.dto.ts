import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEmail } from 'class-validator';

export class CreateStudentDto {
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

  @IsOptional()
  userId?: string;

  @IsOptional()
  parentId?: string;
}

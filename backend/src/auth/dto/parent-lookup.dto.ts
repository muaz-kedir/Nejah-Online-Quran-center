import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ParentLookupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  query: string;
}

export class CheckEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ParentDuplicateCheckDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

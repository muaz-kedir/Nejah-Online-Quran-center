import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateTeacherApplicationDto {
  // ── Personal Details ─────────────────────────────────────────────

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  streetAddress?: string;

  // ── Qualifications ───────────────────────────────────────────────

  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @IsString()
  @IsOptional()
  internetConnectionType?: string;

  @IsString()
  @IsOptional()
  qiratEducationLevel?: string;

  @IsString()
  @IsOptional()
  islamicEducationLevel?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  teachingTimeAvailability?: string[];

  @IsString()
  @IsOptional()
  marketingSource?: string;

  // ── Document URLs ────────────────────────────────────────────────

  @IsString()
  @IsOptional()
  nationalIdUrl?: string;

  @IsString()
  @IsOptional()
  quranCertificateUrl?: string;

  @IsString()
  @IsOptional()
  islamicCertificateUrl?: string;

  @IsString()
  @IsOptional()
  teachingExperienceUrl?: string;

  @IsString()
  @IsOptional()
  cvResumeUrl?: string;

  // ── Additional ───────────────────────────────────────────────────

  @IsString()
  @IsOptional()
  additionalComments?: string;
}

import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ReviewAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_INFO = 'request_info',
}

export class ReviewTeacherApplicationDto {
  @IsEnum(ReviewAction)
  action: ReviewAction;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  infoRequestMessage?: string;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}

import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateFeeConfigDto {
  @IsString()
  learningGoalId: string;

  @IsString()
  country: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

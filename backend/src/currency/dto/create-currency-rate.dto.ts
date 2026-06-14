import { IsString, IsNumber, Length } from 'class-validator';

export class CreateCurrencyRateDto {
  @IsString()
  @Length(3, 3)
  fromCurrency: string;

  @IsString()
  @Length(3, 3)
  toCurrency: string;

  @IsNumber()
  rate: number;
}

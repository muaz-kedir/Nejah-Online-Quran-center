import { PartialType } from '@nestjs/mapped-types';
import { CreateFeeConfigDto } from './create-fee-config.dto';

export class UpdateFeeConfigDto extends PartialType(CreateFeeConfigDto) {}

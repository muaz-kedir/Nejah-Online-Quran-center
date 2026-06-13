import { PartialType } from '@nestjs/mapped-types';
import { CreateLiveSessionDto } from './create-live-session.dto';

export class UpdateLiveSessionDto extends PartialType(CreateLiveSessionDto) {}

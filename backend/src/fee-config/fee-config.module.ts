import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeConfig } from './entities/fee-config.entity';
import { FeeConfigController } from './fee-config.controller';
import { FeeConfigService } from './fee-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeeConfig])],
  controllers: [FeeConfigController],
  providers: [FeeConfigService],
  exports: [FeeConfigService],
})
export class FeeConfigModule {}

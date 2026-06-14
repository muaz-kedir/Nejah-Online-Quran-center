import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppGateway } from './websocket.gateway';

@Module({
  imports: [ConfigModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class WebsocketModule {}

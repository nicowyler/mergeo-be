import { Module } from '@nestjs/common';
import { ServerSentEventsController } from './server-sent-events.controller';

@Module({
  controllers: [ServerSentEventsController],
  providers: [],
})
export class ServerSentEventsModule {}

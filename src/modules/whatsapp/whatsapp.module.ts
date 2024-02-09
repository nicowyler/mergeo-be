import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { HttpModule } from '@nestjs/axios';
import { WhatsSppProvider } from './whatsapp.provider';

@Module({
  imports: [
    HttpModule.registerAsync({
      useClass: WhatsSppProvider,
    }),
  ],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsAppModule {}

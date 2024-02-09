import { EventPayloads } from '@/common/interface/event-types.interface';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { firstValueFrom } from 'rxjs';
import { bodyParams, testTemplate } from './whatsappTemplates';
import { WhatsApp } from '@/common/enum/email.enum';
@Injectable()
export class WhatsappService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent(WhatsApp.Test)
  async whatappMessage(payload: EventPayloads['whatsapp.message']) {
    const { tempalteName, userName, providerName, unitsCount, product } =
      payload;

    const requestBody = testTemplate(tempalteName, '54111566604142', {
      providerName: providerName,
      userName: userName,
      unitsCount: unitsCount,
      product: product,
    } as bodyParams);

    const url = this.config.get('WHATSAPP_URL');

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, requestBody),
      );
      console.log(data);
      return data;
    } catch (err) {
      console.log(err.response);
    }
  }
}

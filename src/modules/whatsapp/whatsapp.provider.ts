import { ConfigService } from '@nestjs/config';
import { HttpModuleOptions, HttpModuleOptionsFactory } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsSppProvider implements HttpModuleOptionsFactory {
  constructor(private readonly config: ConfigService) {}
  createHttpOptions(): HttpModuleOptions | Promise<HttpModuleOptions> {
    const token = this.config.get('WHATSAPP_TOKEN');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        ContentType: 'application/json',
      },
    };
  }
}

// src/gs1/gs1.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { Gs1Service } from './gs1.service';

@Controller('gs1')
export class Gs1Controller {
  constructor(private readonly gs1Service: Gs1Service) {}

  @Get('gtin/:gtin')
  async consultaGTIN(@Param('gtin') gtin: string) {
    return this.gs1Service.getProductByGTIN(gtin);
  }
}

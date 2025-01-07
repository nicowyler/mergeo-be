import { Module } from '@nestjs/common';
import { Gs1Service } from './gs1.service';
import { Gs1Controller } from './gs1.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [Gs1Controller],
  providers: [Gs1Service],
  exports: [Gs1Service],
})
export class Gs1Module {}

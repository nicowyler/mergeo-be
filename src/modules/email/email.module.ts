import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailProvider } from './email.provider';

@Module({
  imports: [EmailProvider],
  providers: [EmailService],
  exports: [EmailProvider],
})
export class EmailModule {}

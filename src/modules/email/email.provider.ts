import { DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { MailerModule } from '@nestjs-modules/mailer';

export const EmailProvider: DynamicModule = MailerModule.forRootAsync({
  inject: [ConfigService],
  async useFactory(config: ConfigService) {
    const mailerConfig = {
      transport: {
        host: config.get('MAIL_HOST'),
        secure: false,
        auth: {
          user: config.get('MAIL_USER'),
          pass: config.get('MAIL_PASSWORD'),
        },
      },
      defaults: {
        from: config.get('MAIL_FROM'),
      },
      template: {
        dir: join(__dirname, '../../emails/'),
        adapter: new EjsAdapter(),
        options: {
          strict: true,
        },
      },
    };

    return mailerConfig;
  },
});

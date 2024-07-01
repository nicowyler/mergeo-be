import { EventPayloads } from '../../common/interface/event-types.interface';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { AES } from 'crypto-js';
import { Emails } from 'src/common/enum';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent('user.welcome')
  async welcomeEmail(data: EventPayloads['user.welcome']) {
    const { email, name } = data;

    const subject = `Welcome to Company: ${name}`;

    await this.mailerService.sendMail({
      to: email,
      subject,
      template: './partials/welcome',
      context: {
        name,
      },
    });
  }

  @OnEvent(Emails.ResetPassword)
  async forgotPasswordEmail(data: EventPayloads[Emails.ResetPassword]) {
    const { email, link } = data;

    const subject = `Reset Password`;

    await this.mailerService.sendMail({
      to: email,
      subject,
      sender: 'Mergeo',
      template: './templates/main',
      context: {
        template: './partials/forgot-password',
        link: link,
      },
    });
  }

  @OnEvent('user.invited')
  async invitedUserEmail(data: EventPayloads['user.invited']) {
    const { email, owner, company, password } = data;

    const subject = `Bienvenido a Mergeo!`;

    await this.mailerService.sendMail({
      to: email,
      subject,
      sender: 'Mergeo',
      template: './templates/main',
      context: {
        template: './partials/user-invited',
        email,
        owner,
        company,
        password,
        link: `${this.config.get('USER_HOST')}/change-password`,
      },
    });
  }

  @OnEvent('user.verify-email')
  async verifyEmail(data: EventPayloads['user.verify-email']) {
    const { email, name, activationCode } = data;

    const subject = `Verify Email`;
    const params = JSON.stringify({ email, activationCode });
    const secret = this.config.get('ACTIVATION_CODE_KEY');

    const encryptedData = AES.encrypt(
      JSON.stringify(params),
      secret,
    ).toString();

    await this.mailerService.sendMail({
      to: email,
      sender: 'Mergeo',
      subject,
      template: './templates/main',
      context: {
        template: './partials/verify-email',
        activationCode,
        name,
        link: `${this.config.get(
          'USER_HOST',
        )}/registration/validate?data=${encryptedData}`,
      },
    });
  }
}

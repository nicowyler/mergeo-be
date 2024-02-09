import { EventPayloads } from '@/common/interface/event-types.interface';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
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

  @OnEvent('user.reset-password')
  async forgotPasswordEmail(data: EventPayloads['user.reset-password']) {
    const { email, link } = data;

    const subject = `Reset Password`;

    await this.mailerService.sendMail({
      to: email,
      subject,
      sender: 'Mergeo',
      template: './templates/main',
      context: {
        template: './partials/forgot-password',
        link: `${this.config.get(
          'USER_HOST',
        )}/reset-password?token=29912839128129128`,
      },
    });
  }

  @OnEvent('user.verify-email')
  async verifyEmail(data: EventPayloads['user.verify-email']) {
    const { email, name, activationCode } = data;

    const subject = `Verify Email`;

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
        )}/verify-code?code=${activationCode}`,
      },
    });
  }
}

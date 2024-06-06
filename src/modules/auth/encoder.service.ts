import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EncoderService {
  generateActivationCode(): string {
    const minm = 100000;
    const maxm = 999999;
    const activationCode = Math.floor(Math.random() * (maxm - minm + 1)) + minm;

    return `${activationCode}`;
  }

  async encodePassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }

  async compareHashedPassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    const match = await bcrypt.compare(password, passwordHash);
    return match;
  }
}

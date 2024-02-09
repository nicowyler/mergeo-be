import { DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

export const AuthProvider: DynamicModule = JwtModule.registerAsync({
  imports: [PassportModule],
  inject: [ConfigService],
  async useFactory(config: ConfigService) {
    const JwtConfig = JwtModule.register({
      secret: config.get('SECRET'),
      signOptions: { expiresIn: '60s' },
    });

    return JwtConfig;
  },
});

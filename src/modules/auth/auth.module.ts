import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthProvider } from './auth.provider';
import { AuthController } from './auth.controller';
import { UserModule } from '@/modules/user/user.module';
import { UserService } from '../user/user.service';
import { EncoderService } from './encoder.service';
import { TypedEventEmitter } from '@/modules/event-emitter/typed-event-emitter.class';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UserModule,
    AuthProvider,
  ],
  providers: [AuthService, EncoderService, TypedEventEmitter, UserService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

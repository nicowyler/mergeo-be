import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './modules/database/database.module';
import { EmailModule } from './modules/email/email.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './modules/auth/auth.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { CorsMiddleware } from './common/middlewares/cors.middleware';
import { CompanyModule } from './modules/company/company.module';
import { RoleModule } from './modules/role/role.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    RoleModule,
    CompanyModule,
    DatabaseModule,
    EmailModule,
    WhatsAppModule,
    EventEmitterModule.forRoot(),
    AuthModule,
  ],
})
export class AppModule {
  static port: number;

  constructor(private readonly configService: ConfigService) {
    AppModule.port = +this.configService.get('PORT');
  }
  configure(consumer: MiddlewareConsumer) {
    // Apply the CORS middleware globally
    consumer.apply(CorsMiddleware).forRoutes('*');
  }
}

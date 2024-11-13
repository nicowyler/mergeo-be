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
import { SearchListModule } from 'src/modules/searchList/searchList.module';
import { ProductModule } from './modules/product/product.module';
import { PreOrderModule } from './modules/pre-order/pre-order.module';
import { BullModule } from '@nestjs/bull';
import { BuyOrderModule } from './modules/buy-order/buy-order.module';
import { ServerSentEventsModule } from './modules/server-sent-events/server-sent-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      redis: {
        host: 'localhost', // Use your Redis host
        port: 6379, // Use your Redis port
      },
    }),
    UserModule,
    RoleModule,
    CompanyModule,
    DatabaseModule,
    EmailModule,
    WhatsAppModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    SearchListModule,
    ProductModule,
    PreOrderModule,
    BuyOrderModule,
    ServerSentEventsModule,
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

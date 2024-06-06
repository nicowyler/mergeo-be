import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { CORS } from './common/constants';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get('USER_HOST');
  if (frontendUrl) {
    app.enableCors(CORS);
  }

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  await app.listen(AppModule.port);
}
bootstrap();

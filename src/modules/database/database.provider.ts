import { EnvUtils } from '@/common/utils';
import { DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const DatabaseProvider: DynamicModule = TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  async useFactory(config: ConfigService) {
    const dbConfig = {
      type: 'postgres',
      host: config.get('DB_HOST'),
      port: +config.get('DB_PORT'),
      database: config.get('DB_NAME'),
      username: config.get('DB_USER'),
      password: config.get('DB_PASSWORD'),
      logging: config.get('DB_LOGGING'),
      autoLoadEntities: true,
      synchronize: EnvUtils.isDevelopmentEnv(config.get('NODE_ENV')),
      namingStrategy: new SnakeNamingStrategy(),
    } as ConnectOptions;

    return dbConfig;
  },
});

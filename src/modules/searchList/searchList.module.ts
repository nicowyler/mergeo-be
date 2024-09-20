import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncoderService } from '../auth/encoder.service';
import { TypedEventEmitterModule } from '../event-emitter/typed-event-emitter.module';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '../../guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { SearchListService } from 'src/modules/searchList/searchList.service';
import { SearchList } from 'src/modules/searchList/searchList.entity';
import { SearchListController } from 'src/modules/searchList/searchList.controller';
import { SearchListProduct } from 'src/modules/searchList/searchListProduct.entity';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads', // specify the upload directory
    }),
    TypeOrmModule.forFeature([SearchList, SearchListProduct]),
    TypedEventEmitterModule,
    PassportModule,
  ],
  controllers: [SearchListController],
  providers: [SearchListService, EncoderService, JwtService, AuthGuard],
})
export class SearchListModule {}

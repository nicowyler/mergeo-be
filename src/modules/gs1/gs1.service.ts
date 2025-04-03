// src/gs1/gs1.service.ts
import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class Gs1Service {
  private readonly logger = new Logger(Gs1Service.name);
  private readonly GS1_TOKEN_CACHE_KEY = 'gs1_token';
  private readonly GS1_TOKEN_EXPIRY_CACHE_KEY = 'gs1_token_expiry';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async isTokenExpired(): Promise<boolean> {
    const cachedToken = await this.cacheManager.get<string>(
      this.GS1_TOKEN_CACHE_KEY,
    );
    const cachedExpiry = await this.cacheManager.get<string>(
      this.GS1_TOKEN_EXPIRY_CACHE_KEY,
    );

    if (!cachedToken || !cachedExpiry) {
      return true;
    }
    return new Date() >= new Date(cachedExpiry);
  }

  async getToken(): Promise<string> {
    const cachedToken = await this.cacheManager.get<string>(
      this.GS1_TOKEN_CACHE_KEY,
    );
    if (cachedToken && !(await this.isTokenExpired())) {
      return cachedToken;
    }

    this.logger.log('Token is expired or not found, fetching a new one...');
    return this.fetchNewToken();
  }

  private async fetchNewToken(): Promise<string> {
    const url = this.configService.get<string>('GS1_TOKEN_URL');
    const username = this.configService.get<string>('GS1_USERNAME');
    const password = this.configService.get<string>('GS1_PASSWORD');
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);
    body.append('grant_type', 'password');

    try {
      this.logger.log(
        `Obteniendo token para GTIN: url:${url} / user:${username} / pass:${password} }`,
      );
      const response = await firstValueFrom(
        this.httpService.post(url, body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      const token = response.data.access_token;
      const expirationTime = new Date(
        response.data['.expires'].split('.')[0] + 'Z', // Added dot prefix to access .expires
      );
      const ttl = response.data.expires_in;

      // Store in cache with calculated TTL
      await this.cacheManager.set(this.GS1_TOKEN_CACHE_KEY, token, ttl);
      await this.cacheManager.set(
        this.GS1_TOKEN_EXPIRY_CACHE_KEY,
        expirationTime.toISOString(),
        ttl,
      );

      this.logger.log(`Token obtained, expires at: ${expirationTime}`);
      this.logger.log(`token obtenido: ${token}`);
      return token;
    } catch (error) {
      this.logger.error(
        `Error al obtener el token para GTIN: ${error.message}`,
        error.stack,
      );

      throw new HttpException(
        'Error al obtener el token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  // GTIN
  async getProductByGTIN(gtin: string): Promise<any> {
    const token = await this.getToken();
    const url = `${this.configService.get<string>(
      'GS1_API_URL',
    )}/api/Producto/ConsultaGTIN?GTIN=${gtin}`;

    this.logger.log(`Consultando producto por GTIN ${gtin}: url:${url}`);

    try {
      // Wrong: agent is being passed as the request body
      const response = await firstValueFrom(
        this.httpService.post(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      this.logger.log(
        `Producto obtenido por GTIN ${gtin}: ${JSON.stringify(response.data)}`,
      );
      if (
        !response.data.name ||
        !response.data.netContent ||
        !response.data.measurmentUnit ||
        response.data.name === 'Unknown Product'
      ) {
        return null;
      }
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error al consultar el producto por GTIN ${gtin}: ${JSON.stringify(
          error,
        )}`,
        error.stack,
      );

      if (error.code == 'ERR_BAD_REQUEST') {
        throw new NotFoundException(error.response.data.Message);
      }

      throw new HttpException(
        'Error al consultar el producto',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

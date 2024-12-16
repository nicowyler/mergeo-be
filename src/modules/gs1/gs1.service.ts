// src/gs1/gs1.service.ts
import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, NotFoundError } from 'rxjs';
import * as https from 'https';
import * as fs from 'fs';

@Injectable()
export class Gs1Service {
  private token: string | null = null;
  private expirationTime: Date;
  private readonly logger = new Logger(Gs1Service.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private isTokenExpired(): boolean {
    if (!this.expirationTime) {
      return true;
    }
    return new Date() > this.expirationTime;
  }

  private createHttpsAgent() {
    const pfxPath = this.configService.get<string>('GS1_PFX_PATH');
    const pfxPassword = this.configService.get<string>('GS1_PFX_PASSWORD');
    const caPath = this.configService.get<string>('GS1_CA_PATH');

    if (!pfxPath || !caPath) {
      throw new Error('Certificados no configurados correctamente.');
    }

    return new https.Agent({
      pfx: fs.readFileSync(pfxPath), // Archivo .pfx
      passphrase: pfxPassword, // Contraseña del archivo .pfx
      ca: fs.readFileSync(caPath), // Certificado de autoridad .cer
      rejectUnauthorized: false, // Asegúrate de validar el certificado del servidor
    });
  }

  async getToken(): Promise<string> {
    // Check if the token is expired
    if (this.isTokenExpired()) {
      console.log('Token is expired, fetching a new one...');
      return this.fetchNewToken();
    }
    return this.token;
  }

  private async fetchNewToken(): Promise<string> {
    const url = this.configService.get<string>('GS1_TOKEN_URL');
    const username = this.configService.get<string>('GS1_USERNAME');
    const password = this.configService.get<string>('GS1_PASSWORD');
    const httpsAgent = this.createHttpsAgent();

    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);
    body.append('grant_type', 'password');

    try {
      this.logger.log(
        `Obteniendo token para GTIN: url:${url} / user:${username} / pass:${password} / agent:${httpsAgent}`,
      );
      const response = await firstValueFrom(
        this.httpService.post(url, body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      this.token = response.data.access_token;
      this.logger.log(`token obtenido: ${this.token}`);
      return this.token;
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
    const agent = this.createHttpsAgent();
    const url = `${this.configService.get<string>(
      'GS1_API_URL',
    )}/api/Producto/ConsultaGTIN?GTIN=${gtin}`;

    try {
      this.logger.log(`Obteniendo producto por GTIN ${gtin}`);
      const response = await firstValueFrom(
        this.httpService.post(url, agent, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      this.logger.log(
        `Producto obtenido por GTIN ${gtin}: ${JSON.stringify(response.data)}`,
      );
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

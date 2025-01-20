import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const handlerMessage = this.reflector.get<string | (() => string)>(
      'response_message',
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data: any) => {
        const statusCode = response.statusCode || 200;

        // Use the service message if available; otherwise, use the decorator message
        const dynamicMessage =
          data?.message !== undefined ? data.message : handlerMessage;

        if (data?.message) {
          delete data.message;
        }

        return {
          statusCode,
          message: dynamicMessage,
          data: data?.data || data,
        };
      }),
    );
  }
}

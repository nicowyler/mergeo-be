import {
  Controller,
  Post,
  Param,
  Sse,
  MessageEvent,
  Logger,
} from '@nestjs/common';
import { UUID } from 'crypto';
import { filter, fromEvent, map, Observable } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  SERVER_SENT_EVENT,
  SERVER_SENT_EVENTS,
} from 'src/common/enum/serverSentEvents.enum';
import {
  OrderStatusUpdate,
  ProductUploadUpdate,
} from 'src/modules/server-sent-events/event.types';

@Controller('server-sent-events')
export class ServerSentEventsController {
  private readonly logger = new Logger(ServerSentEventsController.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}
  @Sse('client/:id')
  sendClientOrderStatusUpdates(
    @Param('id') clientId: UUID,
  ): Observable<MessageEvent> {
    this.logger.log(`Subscribing to SSE for client ${clientId}`);

    return fromEvent(this.eventEmitter, SERVER_SENT_EVENT).pipe(
      filter((event: OrderStatusUpdate) => event.clientId === clientId),
      map((payload) => ({
        data: payload,
      })),
    );
  }

  @Sse('provider/:id')
  sendProviderOrderStatusUpdates(
    @Param('id') providerId: UUID,
  ): Observable<MessageEvent> {
    this.logger.log(`Subscribing to SSE for client ${providerId}`);

    return fromEvent(this.eventEmitter, SERVER_SENT_EVENT).pipe(
      filter((event: OrderStatusUpdate) => event.providerId === providerId),
      map((payload) => ({
        data: payload,
      })),
    );
  }

  @Sse('provider/productUpload/:id')
  sendProviderProductsUploadUpdates(
    @Param('id') providerId: UUID,
  ): Observable<MessageEvent> {
    this.logger.log(`Subscribing to SSE for client ${providerId}`);

    return fromEvent(this.eventEmitter, SERVER_SENT_EVENT).pipe(
      filter((event: ProductUploadUpdate) => event.providerId === providerId),
      map((payload) => ({
        data: payload,
      })),
    );
  }

  @Post('test-event')
  testEvent() {
    const mockOrderId: UUID = '558fdb71-b7e4-4620-ab5a-9d039f2a4385' as UUID;
    const mockClientId: UUID = 'd3ec937c-a1bf-4c34-90c2-80c5c9deadfe' as UUID;

    this.eventEmitter.emit(SERVER_SENT_EVENT, {
      message: SERVER_SENT_EVENTS.orderCreated,
      orderId: mockOrderId,
      clientId: mockClientId,
    });

    return { status: 'Event emitted' };
  }
}

import {
  Publisher,
  OrderConfirmedEvent,
  OrderEventSubjects,
} from "@ezdev/core";

export class OrderConfirmedPublisher extends Publisher<OrderConfirmedEvent> {
  subject: OrderEventSubjects.OrderConfirmed =
    OrderEventSubjects.OrderConfirmed;
}

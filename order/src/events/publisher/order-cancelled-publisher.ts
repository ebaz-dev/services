import {
  Publisher,
  OrderCancelledEvent,
  OrderEventSubjects,
} from "@ezdev/core";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: OrderEventSubjects.OrderCancelled =
    OrderEventSubjects.OrderCancelled;
}

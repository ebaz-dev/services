import { Publisher } from "@ebazdev/core";
import { OrderCancelledEvent, OrderEventSubjects } from "@ezdev/core";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: OrderEventSubjects.OrderCancelled =
    OrderEventSubjects.OrderCancelled;
}

import { Publisher } from "@ebazdev/core";
import { OrderConfirmedEvent, OrderEventSubjects } from "@ezdev/core";

export class OrderConfirmedPublisher extends Publisher<OrderConfirmedEvent> {
  subject: OrderEventSubjects.OrderConfirmed =
    OrderEventSubjects.OrderConfirmed;
}

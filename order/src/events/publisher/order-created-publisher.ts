import { Publisher, OrderCreatedEvent, OrderEventSubjects } from "@ezdev/core";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  subject: OrderEventSubjects.OrderCreated = OrderEventSubjects.OrderCreated;
}

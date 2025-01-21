import {
  Publisher,
  OrderReturnedEvent,
  OrderEventSubjects,
} from "@ezdev/core";

export class OrderReturnedPublisher extends Publisher<OrderReturnedEvent> {
  subject: OrderEventSubjects.OrderReturned =
    OrderEventSubjects.OrderReturned;
}

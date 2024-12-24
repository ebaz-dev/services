import {
  Publisher,
  OrderDeliveredEvent,
  OrderEventSubjects,
} from "@ezdev/core";

export class OrderDeliveredPublisher extends Publisher<OrderDeliveredEvent> {
  subject: OrderEventSubjects.OrderDelivered =
    OrderEventSubjects.OrderDelivered;
}

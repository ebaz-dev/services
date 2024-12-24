import {
  Publisher,
  OrderEventSubjects,
  OrderPaymentMethodUpdatedEvent,
} from "@ezdev/core";

export class OrderPaymentMethodUpdatedPublisher extends Publisher<OrderPaymentMethodUpdatedEvent> {
  subject: OrderEventSubjects.OrderPaymentMethodUpdated =
    OrderEventSubjects.OrderPaymentMethodUpdated;
}

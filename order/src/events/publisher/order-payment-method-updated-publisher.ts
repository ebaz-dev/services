import { Publisher } from "@ebazdev/core";
import {
  OrderEventSubjects,
  OrderPaymentMethodUpdatedEvent,
} from "@ezdev/core";

export class OrderPaymentMethodUpdatedPublisher extends Publisher<OrderPaymentMethodUpdatedEvent> {
  subject: OrderEventSubjects.OrderPaymentMethodUpdated =
    OrderEventSubjects.OrderPaymentMethodUpdated;
}

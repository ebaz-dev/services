import { OrderDoc } from "../../models/order/order";
import { OrderEventSubjects } from "./order-event-subjects";

export interface OrderPaymentMethodUpdatedEvent {
  subject: OrderEventSubjects.OrderPaymentMethodUpdated;
  data: OrderDoc;
}

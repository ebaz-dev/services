import { OrderDoc } from "../../models/order/order";
import { OrderEventSubjects } from "./order-event-subjects";

export interface OrderCancelledEvent {
  subject: OrderEventSubjects.OrderCancelled;
  data: OrderDoc;
}

import { OrderDoc } from "../../models/order/order";
import { OrderEventSubjects } from "./order-event-subjects";

export interface OrderReturnedEvent {
  subject: OrderEventSubjects.OrderReturned;
  data: OrderDoc;
}

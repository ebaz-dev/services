import { OrderDoc } from "../../models/order/order";
import { OrderEventSubjects } from "./order-event-subjects";

export interface OrderCreatedEvent {
  subject: OrderEventSubjects.OrderCreated;
  data: OrderDoc;
}

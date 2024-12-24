import { CartDoc } from "../../models/order/cart";
import { CartEventSubjects } from "./cart-event-subjects";

export interface CartConfirmedEvent {
  subject: CartEventSubjects.CartConfirmed;
  data: CartDoc;
}

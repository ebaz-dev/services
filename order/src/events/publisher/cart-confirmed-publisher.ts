import { Publisher, CartConfirmedEvent, CartEventSubjects } from "@ezdev/core";

export class CartConfirmedPublisher extends Publisher<CartConfirmedEvent> {
  subject: CartEventSubjects.CartConfirmed = CartEventSubjects.CartConfirmed;
}

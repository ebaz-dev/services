import {
  Publisher,
  CartEventSubjects,
  CartProductRemovedEvent,
} from "@ezdev/core";

export class CartProductRemovedPublisher extends Publisher<CartProductRemovedEvent> {
  subject: CartEventSubjects.CartProductRemoved =
    CartEventSubjects.CartProductRemoved;
}

import { Publisher } from "@ebazdev/core";
import { CartEventSubjects, CartProductRemovedEvent } from "@ezdev/core";

export class CartProductRemovedPublisher extends Publisher<CartProductRemovedEvent> {
  subject: CartEventSubjects.CartProductRemoved =
    CartEventSubjects.CartProductRemoved;
}

import {
  Publisher,
  CartEventSubjects,
  CartProductAddedEvent,
} from "@ezdev/core";

export class CartProductAddedPublisher extends Publisher<CartProductAddedEvent> {
  subject: CartEventSubjects.CartProductAdded =
    CartEventSubjects.CartProductAdded;
}

import {
  Publisher,
  CartInventoryCheckedEvent,
  OrderInventoryEventSubjects,
} from "@ezdev/core";

export class CartInventoryChecked extends Publisher<CartInventoryCheckedEvent> {
  subject: OrderInventoryEventSubjects.CartInventoryChecked =
    OrderInventoryEventSubjects.CartInventoryChecked;
}

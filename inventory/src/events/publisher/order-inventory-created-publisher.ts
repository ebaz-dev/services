import {
  Publisher,
  OrderInventoryCreatedEvent,
  OrderInventoryEventSubjects,
} from "@ezdev/core";

export class OrderInventoryCreatedPublisher extends Publisher<OrderInventoryCreatedEvent> {
  subject: OrderInventoryEventSubjects.OrderInventoryCreated =
    OrderInventoryEventSubjects.OrderInventoryCreated;
}

import {
  Publisher,
  InventoryCreatedEvent,
  InventoryEventSubjects,
} from "@ezdev/core";

export class InventoryCreatedPublisher extends Publisher<InventoryCreatedEvent> {
  subject: InventoryEventSubjects.InventoryCreated =
    InventoryEventSubjects.InventoryCreated;
}

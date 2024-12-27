import {
  Publisher,
  InventoryUpdatedEvent,
  InventoryEventSubjects,
} from "@ezdev/core";

export class InventoryUpdatedPublisher extends Publisher<InventoryUpdatedEvent> {
  subject: InventoryEventSubjects.InventoryUpdated =
    InventoryEventSubjects.InventoryUpdated;
}

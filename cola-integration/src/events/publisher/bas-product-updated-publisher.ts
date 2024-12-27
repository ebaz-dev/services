import {
  Publisher,
  BasProductUpdatedEvent,
  BasProductSubjects,
} from "@ezdev/core";

export class BasProductUpdatedEventPublisher extends Publisher<BasProductUpdatedEvent> {
  subject: BasProductSubjects.BasProductUpdated =
    BasProductSubjects.BasProductUpdated;
}

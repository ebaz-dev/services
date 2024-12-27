import {
  Publisher,
  BasProductRecievedEvent,
  BasProductSubjects,
} from "@ezdev/core";

export class BasProductRecievedEventPublisher extends Publisher<BasProductRecievedEvent> {
  subject: BasProductSubjects.BasProductRecieved =
    BasProductSubjects.BasProductRecieved;
}

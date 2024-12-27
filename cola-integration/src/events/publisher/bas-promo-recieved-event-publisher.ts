import {
  Publisher,
  BasPromoRecievedEvent,
  BasPromoSubjects,
} from "@ezdev/core";

export class BasPromoRecievedEventPublisher extends Publisher<BasPromoRecievedEvent> {
  subject: BasPromoSubjects.BasPromoRecieved =
    BasPromoSubjects.BasPromoRecieved;
}

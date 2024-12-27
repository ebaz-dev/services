import { Publisher, BasPromoUpdatedEvent, BasPromoSubjects } from "@ezdev/core";

export class BasPromoUpdatedEventPublisher extends Publisher<BasPromoUpdatedEvent> {
  subject: BasPromoSubjects.BasPromoUpdated = BasPromoSubjects.BasPromoUpdated;
}

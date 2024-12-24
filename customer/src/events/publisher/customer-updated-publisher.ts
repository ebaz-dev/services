import {
  Publisher,
  CustomerEventSubjects,
  CustomerUpdatedEvent,
} from "@ezdev/core";

export class CustomerUpdatedPublisher extends Publisher<CustomerUpdatedEvent> {
  subject: CustomerEventSubjects.CustomerUpdated =
    CustomerEventSubjects.CustomerUpdated;
}

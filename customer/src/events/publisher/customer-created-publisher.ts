import {
  Publisher,
  CustomerCreatedEvent,
  CustomerEventSubjects,
} from "@ezdev/core";

export class CustomerCreatedPublisher extends Publisher<CustomerCreatedEvent> {
  subject: CustomerEventSubjects.CustomerCreated =
    CustomerEventSubjects.CustomerCreated;
}

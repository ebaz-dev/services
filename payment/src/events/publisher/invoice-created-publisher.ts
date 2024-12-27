import {
  Publisher,
  InvoiceCreatedEvent,
  InvoiceEventSubjects,
} from "@ezdev/core";

export class InvoiceCreatedPublisher extends Publisher<InvoiceCreatedEvent> {
  subject: InvoiceEventSubjects.InvoiceCreated =
    InvoiceEventSubjects.InvoiceCreated;
}

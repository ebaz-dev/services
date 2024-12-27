import { Publisher, InvoicePaidEvent, InvoiceEventSubjects } from "@ezdev/core";

export class InvoicePaidPublisher extends Publisher<InvoicePaidEvent> {
  subject: InvoiceEventSubjects.InvoicePaid = InvoiceEventSubjects.InvoicePaid;
}

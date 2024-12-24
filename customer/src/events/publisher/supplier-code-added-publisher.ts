import {
  Publisher,
  SupplierCodeAddedEvent,
  CustomerEventSubjects,
} from "@ezdev/core";

export class SupplierCodeAddedPublisher extends Publisher<SupplierCodeAddedEvent> {
  subject: CustomerEventSubjects.SupplierCodeAdded =
    CustomerEventSubjects.SupplierCodeAdded;
}

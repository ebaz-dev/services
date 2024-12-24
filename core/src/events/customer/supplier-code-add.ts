import { CustomerEventSubjects } from "./customer-event-subjects";

export interface SupplierCodeAddedEvent {
  subject: CustomerEventSubjects.SupplierCodeAdded;
  data: {
    merchantId: string;
    holdingKey: string;
    tsId: string;
  };
}

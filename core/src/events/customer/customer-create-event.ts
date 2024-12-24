import { CustomerDoc } from "../../models/customer/customer";
import { CustomerEventSubjects } from "./customer-event-subjects";

export interface CustomerCreatedEvent {
  subject: CustomerEventSubjects.CustomerCreated;
  data: CustomerDoc;
}

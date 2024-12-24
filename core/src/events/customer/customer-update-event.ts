import { CustomerDoc } from "../../models/customer/customer";
import { CustomerEventSubjects } from "./customer-event-subjects";

export interface CustomerUpdatedEvent {
  subject: CustomerEventSubjects.CustomerUpdated;
  data: CustomerDoc;
}

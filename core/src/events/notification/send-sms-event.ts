import { NotificationEventSubject } from "./notification-event-subjects";

export interface SendSMSEvent {
  subject: NotificationEventSubject.SendSMS;
  data: {
    phoneNumber: string;
    text: string;
  };
}

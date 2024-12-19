import { Publisher } from "@ezdev/core";
import { NotificationEventSubject, SendSMSEvent } from "@ebazdev/notification";

export class SendSMSPublisher extends Publisher<SendSMSEvent> {
  subject: NotificationEventSubject = NotificationEventSubject.SendSMS;
}

import { Publisher } from "@ezdev/core";
import { NotificationEventSubject, SendSMSEvent } from "@ezdev/core";

export class SendSMSPublisher extends Publisher<SendSMSEvent> {
  subject: NotificationEventSubject = NotificationEventSubject.SendSMS;
}

import { Listener, NotificationEventSubject, SendSMSEvent } from "@ezdev/core";
import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import axios from "axios";

export class SendSMSListener extends Listener<SendSMSEvent> {
  subject: NotificationEventSubject.SendSMS = NotificationEventSubject.SendSMS;
  queueGroupName = queueGroupName;
  async onMessage(data: SendSMSEvent["data"], msg: Message) {
    try {
      if (data.phoneNumber) {
        const payload = {
          phoneNumbers: [data.phoneNumber],
          text: data.text,
        };

        const response = await axios.post(
          "https://api2.ebazaar.mn/api/noticenter/local/notifier/sms",
          payload,
          {
            headers: {
              master_token:
                "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
              "Content-Type": "application/json",
            },
          }
        );
      }
    } catch (err) {
      console.log(err);
    }
    msg.ack();
  }
}
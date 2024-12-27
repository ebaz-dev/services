import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import {
  OrderPaymentMethodUpdatedEvent,
  OrderEventSubjects,
  Listener,
} from "@ezdev/core";
import { sendOrder } from "../../utils/send-order";

export class OrderPaymentMethodUpdatedListener extends Listener<OrderPaymentMethodUpdatedEvent> {
  readonly subject = OrderEventSubjects.OrderPaymentMethodUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderPaymentMethodUpdatedEvent["data"], msg: Message) {
    try {
      await sendOrder(data.id);
      msg.ack();
    } catch (error) {
      console.error("Error processing OrderPaymentMethodUpdatedEvent:", error);
      msg.ack();
    }
  }
}

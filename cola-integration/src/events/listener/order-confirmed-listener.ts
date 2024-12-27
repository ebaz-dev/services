import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import { OrderConfirmedEvent, OrderEventSubjects, Listener } from "@ezdev/core";
import { baseSendOrder } from "../../utils/base-send-order";

export class OrderConfirmedListener extends Listener<OrderConfirmedEvent> {
  readonly subject = OrderEventSubjects.OrderConfirmed;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderConfirmedEvent["data"], msg: Message) {
    try {
      await baseSendOrder(data.id);
      msg.ack();
    } catch (error) {
      console.error("Error processing OrderConfirmedEvent:", error);
      msg.ack();
    }
  }
}

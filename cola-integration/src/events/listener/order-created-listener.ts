import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import { OrderCreatedEvent, OrderEventSubjects, Listener } from "@ezdev/core";
import { baseSendOrder } from "../../utils/base-send-order";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = OrderEventSubjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    try {
      await baseSendOrder(data.id);
      msg.ack();
    } catch (error) {
      console.error("Error processing OrderCreatedEvent:", error);
      msg.ack();
    }
  }
}

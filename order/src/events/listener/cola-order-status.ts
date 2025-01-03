import { Message } from "node-nats-streaming";
import { Listener } from "@ezdev/core";
import { queueGroupName } from "./queue-group-name";
import {
  Order,
  OrderStatus,
  OrderActions,
  OrderLog,
  OrderLogType,
  colaOrderStatuses,
  ColaOrderStatusRecievedEvent,
  ColaOrderStatusSubjects,
} from "@ezdev/core";
import { OrderConfirmedPublisher } from "../publisher/order-confirmed-publisher";
import { natsWrapper } from "../../nats-wrapper";
import { OrderCancelledPublisher } from "../publisher/order-cancelled-publisher";
import { OrderDeliveredPublisher } from "../publisher/order-delivered-publisher";

export class ColaOrderStatusReceivedListener extends Listener<ColaOrderStatusRecievedEvent> {
  readonly subject = ColaOrderStatusSubjects.OrderStatusRecieved;
  queueGroupName = queueGroupName;

  async onMessage(data: ColaOrderStatusRecievedEvent["data"], msg: Message) {
    try {
      const { orderId, status } = data;

      const order = await Order.findOne({ orderNo: orderId });
      if (!order) {
        throw new Error("order not found");
      }
      if (status === colaOrderStatuses.confirmed) {
        order.status = OrderStatus.Confirmed;
        await OrderLog.create({
          orderId: order.id,
          author: { name: "BAS" },
          type: OrderLogType.Status,
          action: OrderActions.Confirmed,
        });
        await new OrderConfirmedPublisher(natsWrapper.client).publish(order);
      } else if (status === colaOrderStatuses.cancelled) {
        order.status = OrderStatus.Cancelled;
        await OrderLog.create({
          orderId: order.id,
          author: { name: "BAS" },
          type: OrderLogType.Status,
          action: OrderActions.Cancelled,
        });
        await new OrderCancelledPublisher(natsWrapper.client).publish(order);
      }
      if (status === colaOrderStatuses.delivered) {
        order.status = OrderStatus.Delivered;
        await OrderLog.create({
          orderId: order.id,
          author: { name: "BAS" },
          type: OrderLogType.Status,
          action: OrderActions.Delivered,
        });
        await new OrderDeliveredPublisher(natsWrapper.client).publish(order);
      }
      await order.save();
      msg.ack();
    } catch (error) {
      console.error("Error processing OrderstatusRecieved:", error);
      msg.ack();
    }
  }
}

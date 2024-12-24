import { Message } from "node-nats-streaming";
import {
  Listener,
  Order,
  OrderCancelledEvent,
  OrderEventSubjects,
  Employee,
} from "@ezdev/core";
import { queueGroupName } from "./queue-group-name";
import { sendMassNotifcation } from "../../utils/send-mass-notificaion";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = OrderEventSubjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent["data"], msg: Message) {
    const { id } = data;

    const order = await Order.findById(id);

    if (!order) {
      throw new Error("Order not found");
    }

    const employees = await Employee.find({ customerId: order.merchantId });
    const userIds = employees.map((employee) => employee.userId);

    await sendMassNotifcation({
      userIds,
      title: `Таны ${order.orderNo} дугаартай захиалга цуцлагдлаа`,
      body: `Та дэлгэрэнгүй дээр дарж харна уу.`,
      senderName: "system",
      supplierId: order.supplierId,
    });

    msg.ack();
  }
}

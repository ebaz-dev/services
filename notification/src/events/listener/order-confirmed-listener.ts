import { Message } from "node-nats-streaming";
import { Listener } from "@ezdev/core";
import {
  Order,
  OrderConfirmedEvent,
  OrderEventSubjects,
  Employee,
} from "@ezdev/core";
import { queueGroupName } from "./queue-group-name";
import { sendMassNotifcation } from "../../utils/send-mass-notificaion";

export class OrderConfirmedListener extends Listener<OrderConfirmedEvent> {
  readonly subject = OrderEventSubjects.OrderConfirmed;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderConfirmedEvent["data"], msg: Message) {
    const { id } = data;

    const order = await Order.findById(id);

    if (!order) {
      throw new Error("Order not found");
    }

    const employees = await Employee.find({ customerId: order.merchantId });
    const userIds = employees.map((employee) => employee.id);

    await sendMassNotifcation({
      userIds,
      title: `Таны ${order.orderNo} дугаартай захиалга баталгаажлаа`,
      body: `Та дэлгэрэнгүй дээр дарж харна уу.`,
      senderName: "system",
      supplierId: order.supplierId,
    });

    msg.ack();
  }
}

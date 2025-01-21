import { Message } from "node-nats-streaming";
import {
  Listener,
  Order,
  OrderEventSubjects,
  Employee,
  OrderReturnedEvent,
} from "@ezdev/core";
import { queueGroupName } from "./queue-group-name";
import { sendMassNotifcation } from "../../utils/send-mass-notificaion";

export class OrderReturnedListener extends Listener<OrderReturnedEvent> {
  readonly subject = OrderEventSubjects.OrderReturned;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderReturnedEvent["data"], msg: Message) {
    const { id } = data;

    const order = await Order.findById(id);

    if (!order) {
      throw new Error("Order not found");
    }

    const employees = await Employee.find({ customerId: order.merchantId });
    const userIds = employees.map((employee) => employee.userId);

    await sendMassNotifcation({
      userIds,
      title: `Таны ${order.orderNo} дугаартай захиалгыг ХТ хүлээгдэж буй төлөвт шилжүүллээ.`,
      body: `Та дэлгэрэнгүй дээр дарж харна уу.`,
      senderName: "system",
      supplierId: order.supplierId,
    });

    msg.ack();
  }
}

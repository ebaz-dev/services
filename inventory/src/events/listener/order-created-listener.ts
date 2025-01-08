import { Message } from "node-nats-streaming";
import {
  Listener,
  OrderCreatedEvent,
  OrderEventSubjects,
  OrderInventory,
} from "@ezdev/core";
import { queueGroupName } from "./queu-group-name";
import mongoose from "@ezdev/core/lib/mongoose";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = OrderEventSubjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    const { id, cartId, supplierId, merchantId, status } = data;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderInventory = await OrderInventory.findOne({
        cartId: cartId,
      }).session(session);

      if (!orderInventory) {
        throw new Error(`Order inventory not found for ID: ${id}`);
      }

      orderInventory.orderId = id;
      orderInventory.orderStatus = status;
      orderInventory.supplierId = supplierId;
      orderInventory.merchantId = merchantId;

      await orderInventory.save({ session });

      await session.commitTransaction();
      msg.ack();
    } catch (error) {
      console.error(`Error processing order ID: ${id}`, error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      await session.endSession();
    }
  }
}

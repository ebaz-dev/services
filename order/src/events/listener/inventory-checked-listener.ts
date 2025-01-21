import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import {
  Listener,
  Cart,
  CartStatus,
  Order,
  OrderStatus,
  PaymentMethods,
  OrderActions,
  OrderLog,
  OrderLogType,
  Merchant,
  OrderInventoryEventSubjects,
  CartInventoryCheckedEvent,
} from "@ezdev/core";
import { natsWrapper } from "../../nats-wrapper";
import { OrderCreatedPublisher } from "../publisher/order-created-publisher";
import { migrateProducts } from "../../utils/migrateProducts";
import { getOrderNumber } from "../../utils/order-number";

export class CartInventoryCheckedListener extends Listener<CartInventoryCheckedEvent> {
  readonly subject = OrderInventoryEventSubjects.CartInventoryChecked;
  queueGroupName = queueGroupName;

  async onMessage(data: CartInventoryCheckedEvent["data"], msg: Message) {
    try {
      const { cartId, status, insufficientProducts } = data;

      const cart = await Cart.findById(cartId);

      if (!cart) {
        throw new Error("Cart not found");
      }

      if (status === "confirmed") {
        const data = await migrateProducts(cart);
        console.log("datas", data, data.qualifiedPromos);
        const merchant = await Merchant.findById(cart.merchantId);
        const orderNo = await getOrderNumber(
          cart.supplierId.toString(),
          !!merchant?.test
        );

        const order = await Order.create({
          status: OrderStatus.Created,
          supplierId: cart.supplierId,
          merchantId: cart.merchantId,
          userId: cart.userId,
          cartId: cart.id,
          orderedAt: new Date(),
          deliveryDate: cart.deliveryDate,
          products: data.products,
          giftProducts: data.giftProducts,
          orderNo,
          merchantDebt: data.merchantDebt,
          paymentMethod: PaymentMethods.Cash,
          tierDiscountPercent: data.tierDiscount
            ? data.tierDiscount.tierDiscountPercent
            : 0,
          qualifiedPromos: data.qualifiedPromos.map((promo) => {
            return {
              id: promo.id,
              thirdPartyData: promo.thirdPartyData,
              name: promo.name,
              startDate: promo.startDate,
              endDate: promo.endDate,
              promoNo: promo.promoNo,
              tresholdAmount: promo.tresholdAmount,
              thresholdQuantity: promo.thresholdQuantity,
              promoPercent: promo.promoPercent,
              giftQuantity: promo.giftQuantity,
              promoTypeId: promo.promoTypeId,
              promoTypeName: promo.promoTypeName,
              promoType: promo.promoTypeId,
              giftProducts: promo.giftProducts,
              giftProductPackages: promo.giftProductPackages,
            };
          }),
          tierDiscount: data.tierDiscount,
        });
        await OrderLog.create({
          orderId: order.id,
          author: { id: cart.userId },
          type: OrderLogType.Status,
          action: OrderActions.Created,
        });
        cart.set({ status: CartStatus.Ordered, orderedAt: new Date() });
        await cart.save();
        if (cart.refOrderId) {
          await Order.updateOne(
            { _id: cart.refOrderId },
            { $set: { status: OrderStatus.ReOrdered } },
            { upsert: true }
          );
        }
        await new OrderCreatedPublisher(natsWrapper.client).publish(order);
      } else if (status === "cancelled") {
        cart.set({
          status: CartStatus.Returned,
          returnedProducts: insufficientProducts,
        });
        await cart.save();
      }
      msg.ack();
    } catch (error) {
      console.error("Error processing InventoryCreatedEvent:", error);
    }
  }
}

import { Message } from "node-nats-streaming";
import {
  Listener,
  BadRequestError,
  CartConfirmedEvent,
  CartEventSubjects,
  Cart,
  Inventory,
  InventoryCheckSatus,
  IReturnFindWithAdjustedPrice,
  Product,
  EventLog,
  Supplier,
} from "@ezdev/core";
import { queueGroupName } from "./queu-group-name";
import { CartInventoryChecked } from "../publisher/cart-inventory-checked-publisher";
import { natsWrapper } from "../../nats-wrapper";
import mongoose, { Types } from "@ezdev/core/lib/mongoose";

export class CartCreatedListener extends Listener<CartConfirmedEvent> {
  readonly subject = CartEventSubjects.CartConfirmed;
  queueGroupName = queueGroupName;

  async onMessage(data: CartConfirmedEvent["data"], msg: Message) {
    const { id } = data;

    const receivedAt = new Date();

    try {
      const initialLog = await EventLog.build({
        cartId: new mongoose.Types.ObjectId(id),
        eventType: this.subject,
        receivedAt,
      }).save();

      const cart = await Cart.findById(id);
      if (!cart) throw new BadRequestError("Cart not found");

      const supplierId = cart.supplierId as mongoose.Types.ObjectId;
      const merchantId = cart.merchantId as mongoose.Types.ObjectId;
      const products = cart.products;

      const supplier = await Supplier.findById(supplierId);
      if (!supplier) throw new BadRequestError("Supplier not found");

      const holdingKey = supplier?.holdingKey;

      const isBasSupplier = holdingKey
        ? ["AG", "TD", "MCSCC", "MG"].includes(holdingKey)
        : false;

      const insufficientProducts = await this.checkInventory(
        products,
        supplierId,
        merchantId,
        isBasSupplier
      );

      const returnedAt = new Date();
      const processingTime = returnedAt.getTime() - receivedAt.getTime();

      if (insufficientProducts.length > 0) {
        await new CartInventoryChecked(natsWrapper.client).publish({
          cartId: id.toString(),
          status: InventoryCheckSatus.cancelled,
          insufficientProducts,
        });

        initialLog.supplierId = supplierId;
        initialLog.merchantId = merchantId;
        initialLog.products = products;
        initialLog.returnedAt = returnedAt;
        initialLog.processingTime = processingTime;
        await initialLog.save();

        return;
      } else {
        await new CartInventoryChecked(natsWrapper.client).publish({
          cartId: id.toString(),
          status: InventoryCheckSatus.confirmed,
        });

        initialLog.supplierId = supplierId;
        initialLog.merchantId = merchantId;
        initialLog.products = products;
        initialLog.returnedAt = returnedAt;
        initialLog.processingTime = processingTime;
        await initialLog.save();
      }
      msg.ack();
    } catch (error) {
      console.log(
        "Error occurred during checking cart confirmed event at inventory service"
      );
      console.log(error);

      await new CartInventoryChecked(natsWrapper.client).publish({
        cartId: id.toString(),
        status: InventoryCheckSatus.errorOccured,
      });

      msg.ack();
    }
  }

  private async checkInventory(
    products: any[],
    supplierId: mongoose.Types.ObjectId,
    merchantId: mongoose.Types.ObjectId,
    isBasSupplier: boolean
  ): Promise<string[]> {
    const insufficientProducts: string[] = [];

    for (const item of products) {
      if (isBasSupplier) {
        const merchantProducts = isBasSupplier
          ? await this.fetchMerchantProducts(products, supplierId, merchantId)
          : [];

        const merchantProduct = merchantProducts.find(
          (mp: any) => mp.id.toString() === item.id.toString()
        );

        if (
          !merchantProduct ||
          (merchantProduct.inventory?.availableStock ?? 0) < item.quantity
        ) {
          insufficientProducts.push(item.id.toString());
        }
      } else {
        const inventory = await Inventory.findOne({
          productId: item.id,
        });

        if (!inventory || item.quantity > inventory.availableStock) {
          insufficientProducts.push(item.id.toString());
        } else {
          inventory.availableStock -= item.quantity;
          inventory.reservedStock += item.quantity;
        }
      }
    }
    return insufficientProducts;
  }

  private async fetchMerchantProducts(
    products: any[],
    supplierId: mongoose.Types.ObjectId,
    merchantId: mongoose.Types.ObjectId
  ) {
    const productIds = products
      .map((item: any) => item.id?.$oid || item.id)
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .join(",");

    const idsArray = productIds.split(",").map((id: string) => id.trim());
    const query = { _id: { $in: idsArray }, customerId: supplierId };

    const result: IReturnFindWithAdjustedPrice =
      await Product.findWithAdjustedPrice({
        query,
        skip: 0,
        limit: 2000,
        sort: { priority: 1 },
        merchant: {
          merchantId: merchantId,
          businessTypeId: new Types.ObjectId(),
        },
      });

    return result.products;
  }
}

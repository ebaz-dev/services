import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queu-group-name";
import {
  Promo,
  Listener,
  BasPromoUpdatedEvent,
  BasPromoSubjects,
} from "@ezdev/core";
import mongoose from "@ezdev/core/lib/mongoose";
import slugify from "slugify";

export class BasPromoUpdatedEventListener extends Listener<BasPromoUpdatedEvent> {
  readonly subject = BasPromoSubjects.BasPromoUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: BasPromoUpdatedEvent["data"], msg: Message) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { supplierId, id, updatedFields } = data;

      const promo = await Promo.findOne({
        _id: id,
        customerId: supplierId,
      }).session(session);

      if (!promo) {
        throw new Error("Promo not found");
      }

      if (!promo.slug) {
        promo.slug = slugify(promo.name, { lower: true, strict: true });
      }

      if (updatedFields.name && updatedFields.name !== undefined) {
        promo.name = updatedFields.name;
        promo.slug = slugify(updatedFields.name, { lower: true, strict: true });
      }

      if (updatedFields.startDate && updatedFields.startDate !== undefined) {
        promo.startDate = new Date(updatedFields.startDate);
      }

      if (updatedFields.endDate && updatedFields.endDate !== undefined) {
        promo.endDate = new Date(updatedFields.endDate);
      }

      if (
        updatedFields.thresholdQuantity &&
        updatedFields.thresholdQuantity !== undefined
      ) {
        promo.thresholdQuantity = updatedFields.thresholdQuantity;
      }

      if (
        updatedFields.promoPercent &&
        updatedFields.promoPercent !== undefined
      ) {
        promo.promoPercent = updatedFields.promoPercent;
      }

      if (
        updatedFields.giftQuantity &&
        updatedFields.giftQuantity !== undefined
      ) {
        promo.giftQuantity = updatedFields.giftQuantity;
      }

      if (updatedFields.isActive && updatedFields.isActive !== undefined) {
        promo.isActive = updatedFields.isActive;
      }

      if (updatedFields.tradeshops && updatedFields.tradeshops !== undefined) {
        promo.tradeshops = updatedFields.tradeshops;
      }

      if (updatedFields.products && updatedFields.products !== undefined) {
        promo.products = updatedFields.products.map(
          (product: any) => new mongoose.Types.ObjectId(product)
        );
      }

      if (
        updatedFields.giftProducts &&
        updatedFields.giftProducts !== undefined
      ) {
        promo.giftProducts = updatedFields.giftProducts.map(
          (product: any) => new mongoose.Types.ObjectId(product)
        );
      }

      await promo.save({ session });

      await session.commitTransaction();

      msg.ack();
    } catch (error: any) {
      console.error("Error processing bas promo updated event:", error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      session.endSession();
    }
  }
}

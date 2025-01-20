import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queu-group-name";
import {
  Listener,
  Product,
  Brand,
  BasProductUpdatedEvent,
  BasProductSubjects,
} from "@ezdev/core";
import mongoose from "@ezdev/core/lib/mongoose";
import slugify from "slugify";
import { DefaultImage } from "../../utils/default-image";

export class BasProductUpdatedEventListener extends Listener<BasProductUpdatedEvent> {
  readonly subject = BasProductSubjects.BasProductUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: BasProductUpdatedEvent["data"], msg: Message) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { supplierId, productId, updatedFields } = data;

      const product = await Product.findById(productId).session(session);

      if (!product) {
        throw new Error("Product not found");
      }

      if (updatedFields.productName) {
        product.name = updatedFields.productName;
        product.slug = slugify(updatedFields.productName, {
          lower: true,
          strict: true,
        });
      }

      if (updatedFields.brandName) {
        const existingBrand = await Brand.findOne({
          name: updatedFields.brandName,
          customerId: supplierId,
        }).session(session);

        if (!existingBrand) {
          const newBrand = new Brand({
            name: updatedFields.brandName,
            slug: slugify(updatedFields.brandName, { lower: true }),
            customerId: supplierId,
            image: DefaultImage.defaultImage,
            isActive: true,
          });

          await newBrand.save({ session });
          product.brandId = newBrand._id as mongoose.Types.ObjectId;
        } else {
          product.brandId = existingBrand._id as mongoose.Types.ObjectId;
        }
      }

      if (updatedFields.capacity && Number(updatedFields.capacity) > 0) {
        product.attributes = product.attributes || [];
        const capacityAttribute = product.attributes.find(
          (attr) => attr.key === "size"
        );

        if (capacityAttribute) {
          capacityAttribute.value = updatedFields.capacity;
        } else {
          product.attributes.push({
            id: new mongoose.Types.ObjectId("66ebb4370904055b002055c1"),
            name: "Хэмжээ",
            slug: "hemzhee",
            key: "size",
            value: updatedFields.capacity,
          });
        }
      }

      if (updatedFields.incase !== undefined) {
        product.inCase = updatedFields.incase;
      }

      if (updatedFields.barcode) {
        product.barCode = updatedFields.barcode;
      }

      if (updatedFields.vendorId) {
        product.vendorId = updatedFields.vendorId;
      }

      if (updatedFields.priority !== undefined) {
        product.priority = updatedFields.priority;
      }

      await product.save({ session });

      await session.commitTransaction();

      msg.ack();
    } catch (error: any) {
      console.error("Error processing bas product updated event:", error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      session.endSession();
    }
  }
}

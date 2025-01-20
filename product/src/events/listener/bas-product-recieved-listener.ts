import { Message } from "node-nats-streaming";
import {
  Listener,
  BasProductRecievedEvent,
  BasProductSubjects,
  Product,
  ProductPrice,
  Brand,
} from "@ezdev/core";
import { queueGroupName } from "./queu-group-name";
import { ProductCreatedPublisher } from "../publisher/product-created-publisher";
import mongoose from "@ezdev/core/lib/mongoose";
import slugify from "slugify";
import { natsWrapper } from "../../nats-wrapper";
import { DefaultImage } from "../../utils/default-image";

export class BasProductRecievedEventListener extends Listener<BasProductRecievedEvent> {
  readonly subject = BasProductSubjects.BasProductRecieved;
  queueGroupName = queueGroupName;

  async onMessage(data: BasProductRecievedEvent["data"], msg: Message) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        supplierId,
        basId,
        productName,
        brandName,
        incase,
        capacity,
        sectorName,
        business,
        barcode,
        vendorId,
        splitSale,
      } = data;

      const existingProduct = await Product.findOne({
        "thirdPartyData.productId": parseInt(basId),
        customerId: supplierId,
      }).session(session);

      if (existingProduct) {
        console.log("Product already exists in the database");
        throw new Error("Product already exists in the database");
      }

      if (!productName || typeof productName !== "string") {
        throw new Error("Invalid product name.");
      }

      const slug = slugify(productName, { lower: true, strict: true });

      let brandId: mongoose.Types.ObjectId | undefined;

      if (brandName) {
        const existingBrand = await Brand.findOne({
          name: brandName,
          customerId: supplierId,
        }).session(session);

        if (!existingBrand) {
          const newBrand = new Brand({
            name: brandName,
            slug: slugify(brandName, { lower: true }),
            customerId: supplierId,
            image: DefaultImage.defaultImage,
            isActive: true,
          });

          await newBrand.save({ session });
          brandId = newBrand._id as mongoose.Types.ObjectId;
        } else {
          brandId = existingBrand._id as mongoose.Types.ObjectId;
        }
      }

      const product = new Product({
        supplierId: supplierId,
        name: productName,
        slug: slug,
        barCode: barcode || "default",
        sku: "default",
        customerId: supplierId,
        images: [DefaultImage.defaultImage],
        thirdPartyData: [
          {
            customerId: new mongoose.Types.ObjectId(supplierId),
            productId: basId,
            sectorName: sectorName,
            ...(business && { business: business }),
          },
        ],
        inCase: incase,
        isActive: false,
        priority: 0,
        isDeleted: false,
      });

      if (vendorId) {
        product.vendorId = vendorId;
      }

      if (brandId) {
        product.brandId = brandId;
      }

      if (capacity && capacity > 0) {
        product.attributes = product.attributes || [];

        product.attributes.push({
          id: new mongoose.Types.ObjectId("66ebb4370904055b002055c1"),
          name: "Хэмжээ",
          slug: "hemzhee",
          key: "size",
          value: capacity,
        });
      }

      if (splitSale) {
        product.splitSale = splitSale;
      }

      await product.save({ session });

      const productPrice = new ProductPrice({
        productId: product._id,
        type: "default",
        level: 1,
        entityReferences: [],
        prices: { price: 0, cost: 0 },
      });

      await productPrice.save({ session });

      await Product.findByIdAndUpdate(
        product._id,
        { $push: { prices: productPrice._id } },
        { session }
      );

      await new ProductCreatedPublisher(natsWrapper.client).publish({
        id: product.id,
        name: product.name,
        slug: product.slug,
        barCode: product.barCode,
        customerId: product.customerId.toString(),
        images: product.images || [],
        prices: product.prices.map((price: any) => price.toString()),
        inCase: product.inCase,
        isActive: product.isActive,
      });

      await session.commitTransaction();

      msg.ack();
    } catch (error: any) {
      console.error("Error processing BasNewProductEvent:", error);

      await session.abortTransaction();
      msg.ack();
    } finally {
      session.endSession();
    }
  }
}

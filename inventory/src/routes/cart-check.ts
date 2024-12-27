import express, { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import {
  Cart,
  CartEventSubjects,
  Inventory,
  IReturnFindWithAdjustedPrice,
  Product,
  BadRequestError,
  EventLog,
  Supplier,
} from "@ezdev/core";

const router = express.Router();

router.get("/cart-check", async (req: Request, res: Response) => {
  const { cartId } = req.query;

  if (!cartId || Array.isArray(cartId)) {
    return res.status(400).send({ error: "Invalid cartId" });
  }

  const subject = CartEventSubjects.CartConfirmed;
  const receivedAt = new Date();

  try {
    console.log("----------------------------");
    console.log("Cart check request received");
    console.log(`Cart ID: ${cartId}`);
    console.log("----------------------------");

    console.log("Creating initial event log...");

    const initialLog = await EventLog.build({
      cartId: new mongoose.Types.ObjectId(cartId as string),
      eventType: subject,
      receivedAt,
    }).save();

    const cart = await Cart.findById(cartId);

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

    const insufficientProducts = await checkInventory(
      products,
      supplierId,
      merchantId,
      isBasSupplier
    );

    const returnedAt = new Date();
    const processingTime = returnedAt.getTime() - receivedAt.getTime();

    initialLog.supplierId = supplierId;
    initialLog.merchantId = merchantId;
    initialLog.products = products;
    initialLog.returnedAt = returnedAt;
    initialLog.processingTime = processingTime;
    await initialLog.save();

    if (insufficientProducts.length > 0) {
      return res.status(200).send({
        status: "Insufficient stock",
        insufficientProducts,
      });
    }

    res.status(200).send({ status: "Sufficient stock" });
  } catch (error) {
    console.error("Error checking cart inventory:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});

async function checkInventory(
  products: any[],
  supplierId: mongoose.Types.ObjectId,
  merchantId: mongoose.Types.ObjectId,
  isBasSupplier: boolean
): Promise<string[]> {
  const insufficientProducts: string[] = [];

  for (const item of products) {
    if (isBasSupplier) {
      const merchantProducts = await fetchMerchantProducts(
        products,
        supplierId,
        merchantId
      );

      const merchantProduct = merchantProducts.find(
        (mp: any) => mp._id.toString() === item.id.toString()
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

async function fetchMerchantProducts(
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

export { router as cartCheckRouter };

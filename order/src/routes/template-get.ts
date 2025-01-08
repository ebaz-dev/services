import * as _ from "lodash";
import express, { Request, Response } from "express";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";
import {
  currentUser,
  requireAuth,
  validateRequest,
  OrderTemplate,
  OrderTemplateDoc,
  Customer,
  Product,
  Inventory,
  Promo,
} from "@ezdev/core";
import { Types } from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.get(
  "/template/get",
  [query("id").notEmpty().isString().withMessage("ID is required")],
  [
    query("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const orderTemplate = await OrderTemplate.findById(req.query.id);
    if (orderTemplate) {
      const data = await prepareTemplate(
        orderTemplate,
        new Types.ObjectId(req.query.merchantId as string)
      );
      res.status(StatusCodes.OK).send({ data });
    } else {
      throw new Error("Select: template not found");
    }
  }
);

const prepareTemplate = async (
  template: OrderTemplateDoc,
  merchantId: Types.ObjectId
): Promise<any> => {
  try {
    const promises = _.map(template.products, async (product, i) => {
      await Inventory.find({ totalStock: 100 });
      await Promo.findOne({});
      try {
        const productPrice = await Product.findOneWithAdjustedPrice({
          query: { _id: new Types.ObjectId(product.id) },
          merchant: { merchantId: merchantId, businessTypeId: merchantId },
        });

        const price = productPrice._adjustedPrice
          ? productPrice._adjustedPrice.price + productPrice._adjustedPrice.cost
          : 0;

        return {
          id: product.id,
          name: productPrice.name,
          images: productPrice.images,
          description: productPrice.description,
          quantity: product.quantity,
          basePrice: price,
          price,
          giftQuantity: 0,
          totalPrice: product.quantity * price,
          stock: productPrice.inventory?.availableStock,
          inCase: productPrice.inCase,
        };
      } catch (error) {
        console.log("error", error);
        throw new Error("product not found");
      }
    });
    const products = await Promise.all(promises);
    const merchant = await Customer.findById(merchantId);
    const supplier = await Customer.findById(template.supplierId);
    return {
      id: template.id,
      products,
      type: template.type,
      merchant: { id: merchant?.id, name: merchant?.name },
      supplier: { id: supplier?.id, name: supplier?.name },
      name: template.name,
      image: template.image,
      color: template.color,
    };
  } catch (error) {
    console.log("error", error);
  }
};
export { router as templateGetRouter, prepareTemplate };

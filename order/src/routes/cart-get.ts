import * as _ from "lodash";
import express, { Request, Response } from "express";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";
import {
  currentUser,
  requireAuth,
  validateRequest,
  Cart,
  CartDoc,
} from "@ezdev/core";
import { Product } from "@ebazdev/product";
import { Customer } from "@ebazdev/customer";
import { Inventory } from "@ebazdev/inventory";
import { Promo } from "@ebazdev/product/build/models/promo";
import { migrateProducts } from "../utils/migrateProducts";

const router = express.Router();

router.get(
  "/cart/get",
  [query("id").notEmpty().isString().withMessage("ID is required")],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const cart = await Cart.findOne({ _id: req.query.id });
    if (cart) {
      const data = await migrateProducts(cart);
      res.status(StatusCodes.OK).send({ data });
    } else {
      throw new Error("Select: not found");
    }
  }
);

const prepareCart = async (cart: CartDoc): Promise<any> => {
  const promises = _.map(cart.products, async (product, i) => {
    await Inventory.findOne({});
    await Promo.findOne({});
    const productPrice = await Product.findOneWithAdjustedPrice({
      query: { _id: product.id },
      merchant: {
        merchantId: cart.merchantId,
        businessTypeId: cart.merchantId,
      },
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
      productPrice,
    };
  });
  const products = await Promise.all(promises);
  const merchant = await Customer.findById(cart.merchantId);
  const supplier = await Customer.findById(cart.supplierId);
  return {
    id: cart.id,
    status: cart.status,
    userId: cart.userId,
    products,
    merchant: { id: merchant?.id, name: merchant?.name },
    supplier: { id: supplier?.id, name: supplier?.name },
  };
};
export { router as cartGetRouter, prepareCart };

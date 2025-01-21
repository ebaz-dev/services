import express, { Request, Response } from "express";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { Types } from "@ezdev/core/lib/mongoose";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  Order,
  CartProductDoc,
  OrderTemplate,
} from "@ezdev/core";
import { cartProductsAdd } from "../utils/cart-products-add";

const router = express.Router();

router.post(
  "/cart/products/add",
  [
    body("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Supplier ID is required"),
    body("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const userId = req.currentUser?.id;
    const data = req.body;
    let products: CartProductDoc[] = [];
    if (data.products) {
      products = data.products;
    } else if (data.refOrderId) {
      const order = await Order.findOne({
        _id: new Types.ObjectId(data.refOrderId as string),
        supplierId: new Types.ObjectId(data.supplierId as string),
      });

      if (!order) {
        throw new BadRequestError("Ref Order not found!");
      }

      products = order.products.map((product) => {
        return <CartProductDoc>{ id: product.id, quantity: product.quantity };
      });
    } else if (data.templateId) {
      const template = await OrderTemplate.findOne({
        _id: new Types.ObjectId(data.templateId as string),
        supplierId: new Types.ObjectId(data.supplierId as string),
      });

      if (!template) {
        throw new BadRequestError("Ref template not found!");
      }

      products = template.products;
    }
    const cart = await cartProductsAdd(
      new Types.ObjectId(data.supplierId as string),
      new Types.ObjectId(data.merchantId as string),
      new Types.ObjectId(userId as string),
      products,
      data.clearCart || false,
      new Types.ObjectId(data.refOrderId as string) || false
    );

    res.status(StatusCodes.OK).send({ data: cart });
  }
);

export { router as cartProductsAddRouter };

import express, { Request, Response } from "express";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { Types } from "@ezdev/core/lib/mongoose";
import {
  currentUser,
  requireAuth,
  validateRequest,
  CartProductDoc,
} from "@ezdev/core";
import { cartProductsAdd } from "../utils/cart-products-add";

const router = express.Router();

router.post(
  "/cart/product/add",
  [
    body("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Supplier ID is required"),
    body("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
    body("productId")
      .notEmpty()
      .isString()
      .withMessage("Product ID is required"),
    body("quantity").notEmpty().isNumeric().withMessage("Quantity is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { supplierId, merchantId, quantity, productId } = req.body;
    const userId = req.currentUser?.id;

    const cart = await cartProductsAdd(
      new Types.ObjectId(supplierId as string),
      new Types.ObjectId(merchantId as string),
      new Types.ObjectId(userId as string),
      [<CartProductDoc>{ id: productId, quantity }],
      false
    );
    res.status(StatusCodes.OK).send({ data: cart });
  }
);

export { router as cartProductAddRouter };

import express, { Request, Response } from "express";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";
import {
  currentUser,
  requireAuth,
  validateRequest,
  Cart,
  CartStatus,
} from "@ezdev/core";
import { migrateProducts } from "../utils/migrateProducts";

const router = express.Router();

router.get(
  "/cart/get/supplier",
  [
    query("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Supplier ID is required"),
  ],
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
    try {
      const cart = await Cart.findOne({
        supplierId: req.query.supplierId,
        merchantId: req.query.merchantId,
        userId: req.currentUser?.id,
        status: {
          $in: [CartStatus.Created, CartStatus.Pending, CartStatus.Returned],
        },
      });
      if (cart) {
        const data = await migrateProducts(cart);
        res.status(StatusCodes.OK).send({ data });
      } else {
        res.status(StatusCodes.OK).send({ data: {} });
      }
    } catch (error) {
      console.log(error);
      res.status(StatusCodes.OK).send({ data: {} });
    }
  }
);

export { router as cartGetSupplierRouter };

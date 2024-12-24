import express, { Request, Response } from "express";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  Cart,
  CartStatus,
} from "@ezdev/core";
const router = express.Router();

router.post(
  "/cart/product/remove",
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
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Cart.updateOne(
        {
          supplierId: req.body.supplierId,
          merchantId: req.body.merchantId,
          status: { $in: [CartStatus.Created, CartStatus.Returned] },
          "products.id": req.body.productId,
        },
        {
          $pull: {
            products: {
              id: req.body.productId,
            },
          },
        }
      ).session(session);
      await session.commitTransaction();
      res.status(StatusCodes.OK).send();
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Product remove operation failed", error);
      throw new BadRequestError("product remove operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as cartProductRemoveRouter };

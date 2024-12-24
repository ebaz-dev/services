import express, { Request, Response } from "express";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { natsWrapper } from "../nats-wrapper";
import {
  BadRequestError,
  NotFoundError,
  requireAuth,
  validateRequest,
  Cart,
  CartStatus,
} from "@ezdev/core";
import { CartConfirmedPublisher } from "../events/publisher/cart-confirmed-publisher";
import { migrateProducts } from "../utils/migrateProducts";

const router = express.Router();

router.post(
  "/cart/confirm",
  [
    body("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Supplier ID is required"),
  ],
  [
    body("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
  ],
  [
    body("deliveryDate")
      .notEmpty()
      .isString()
      .withMessage("Delivery date is required"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const cart = await Cart.findOne({
        supplierId: req.body.supplierId,
        merchantId: req.body.merchantId,
        userId: req.currentUser?.id,
        status: { $in: [CartStatus.Created, CartStatus.Returned] },
      }).session(session);

      if (!cart) {
        throw new NotFoundError();
      }

      cart.deliveryDate = req.body.deliveryDate;
      cart.status = CartStatus.Pending;

      const preparedCart = await migrateProducts(cart);
      if (preparedCart.products && preparedCart.products.length > 0) {
        await cart.save();
        const event = await new CartConfirmedPublisher(
          natsWrapper.client
        ).publish(cart);
        console.log("*************************** event", event, cart.id);
      } else {
        preparedCart.status = CartStatus.Created;
      }
      await session.commitTransaction();

      res.status(StatusCodes.OK).send({ data: preparedCart });
    } catch (error: any) {
      await session.abortTransaction();

      console.error("Cart confirm operation failed", error);
      throw new BadRequestError("Cart confirm operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as cartConfirmRouter };

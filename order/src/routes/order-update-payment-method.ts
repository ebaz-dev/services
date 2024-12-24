import express, { Request, Response } from "express";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { natsWrapper } from "../nats-wrapper";
import { OrderPaymentMethodUpdatedPublisher } from "../events/publisher/order-payment-method-updated-publisher";
import {
  BadRequestError,
  currentUser,
  NotFoundError,
  requireAuth,
  validateRequest,
  Order,
  OrderActions,
  OrderLog,
  OrderLogType,
} from "@ezdev/core";

const router = express.Router();

router.post(
  "/update/payment-method",
  [body("id").notEmpty().isString().withMessage("Order ID is required")],
  [
    body("paymentMethod")
      .notEmpty()
      .isString()
      .withMessage("Payment method is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await Order.findById(req.body.id).session(session);
      if (!order) {
        throw new NotFoundError();
      }
      await OrderLog.create({
        orderId: order.id,
        author: { id: req.currentUser?.id },
        type: OrderLogType.Payment,
        action: OrderActions.Updated,
        fields: [
          {
            key: "paymentMethod",
            oldValue: order.paymentMethod,
            newValue: req.body.paymentMethod,
          },
        ],
      });
      order.paymentMethod = req.body.paymentMethod;
      await order.save();
      await new OrderPaymentMethodUpdatedPublisher(natsWrapper.client).publish(
        order
      );
      await session.commitTransaction();
      res.status(StatusCodes.OK).send({ data: order });
    } catch (error: any) {
      await session.abortTransaction();

      console.error("order payment method update operation failed", error);
      throw new BadRequestError("order payment method update operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as orderUpdatePaymentMethodRouter };

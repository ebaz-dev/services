import express, { Request, Response } from "express";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";
import { natsWrapper } from "../../nats-wrapper";
import {
  BadRequestError,
  currentUser,
  NotFoundError,
  requireAuth,
  validateRequest,
  Order,
  OrderStatus,
  OrderActions,
  OrderLog,
  OrderLogType,
} from "@ezdev/core";
import { OrderCancelledPublisher } from "../../events/publisher/order-cancelled-publisher";

const router = express.Router();

router.post(
  "/cancel",
  [body("id").notEmpty().isString().withMessage("Order ID is required")],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await Order.findOne({
        _id: req.body.id,
      });
      if (!order) {
        throw new NotFoundError();
      }
      order.status = OrderStatus.Cancelled;
      await OrderLog.create({
        orderId: order.id,
        author: { id: req.currentUser?.id },
        type: OrderLogType.Status,
        action: OrderActions.Cancelled,
      });
      await order.save({ session });
      await new OrderCancelledPublisher(natsWrapper.client).publish(order);
      await session.commitTransaction();
      res.status(StatusCodes.OK).send({ data: order });
    } catch (error: any) {
      await session.abortTransaction();

      console.error("order cancel operation failed", error);
      throw new BadRequestError("order cancel operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as orderBoCancelRouter };

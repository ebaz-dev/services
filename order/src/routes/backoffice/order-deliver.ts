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
import { OrderDeliveredPublisher } from "../../events/publisher/order-delivered-publisher";

const router = express.Router();

router.post(
  "/deliver",
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
        status: OrderStatus.Confirmed,
      });
      if (!order) {
        throw new NotFoundError();
      }
      order.status = OrderStatus.Delivered;
      await OrderLog.create({
        orderId: order.id,
        author: { id: req.currentUser?.id },
        type: OrderLogType.Status,
        action: OrderActions.Delivered,
      });
      await order.save({ session });
      await new OrderDeliveredPublisher(natsWrapper.client).publish(order);
      await session.commitTransaction();
      res.status(StatusCodes.OK).send({ data: order });
    } catch (error: any) {
      await session.abortTransaction();

      console.error("order deliver operation failed", error);
      throw new BadRequestError("order deliver operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as orderBoDeliverRouter };

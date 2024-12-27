import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  Order,
  colaOrderStatuses,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { ColaOrderStatusPublisher } from "../events/publisher/cola-order-status-recieved-publisher";
import { natsWrapper } from "../nats-wrapper";
import { thirdPartyAuthenticate } from "../utils/middlewares/thirdPartyAuthenticate";

const router = express.Router();

router.post(
  "/cola/order-status",
  thirdPartyAuthenticate,
  [
    body("orderId").not().isEmpty().withMessage("Order ID is required."),
    body("status").not().isEmpty().withMessage("Status is required."),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { orderId, status } = req.body;

      if (!orderId) {
        throw new BadRequestError("Order ID is required.");
      }

      if (!status) {
        throw new BadRequestError("Status is required.");
      }

      const isColaOrderStatus = (status: any): status is colaOrderStatuses => {
        return Object.values(colaOrderStatuses).includes(status);
      };

      if (!isColaOrderStatus(status)) {
        throw new BadRequestError("Invalid status.");
      }

      const order = Order.findOne({ orderNo: orderId });

      if (!order) {
        throw new BadRequestError("Order not found.");
      }

      await new ColaOrderStatusPublisher(natsWrapper.client).publish({
        orderId: orderId,
        status: status,
      });

      return res.status(StatusCodes.OK).send({
        status: "success",
      });
    } catch (error: any) {
      console.error("Cola integration product list get error:", error);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        satus: "failure",
      });
    }
  }
);

export { router as basInboundorderStatusUpdateRouter };

import express, { Request, Response } from "express";
import {
  BadRequestError,
  currentUser,
  NotFoundError,
  requireAuth,
  validateRequest,
  Merchant,
} from "@ezdev/core";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";
import { SupplierCodeAddedPublisher } from "../events/publisher/supplier-code-added-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();

router.post(
  "/supplier/code/save",
  [
    body("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
    body("holdingKey")
      .notEmpty()
      .isString()
      .withMessage("Holding key is required"),
    body("tsId").notEmpty().isString().withMessage("Tradeshop ID is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const data = req.body;

    try {
      const merchant = await Merchant.findByIdAndUpdate(
        {
          _id: data.merchantId,
        },
        {
          $pull: { tradeShops: { holdingKey: data.holdingKey } },
        }
      ).session(session);
      if (!merchant) {
        throw new NotFoundError();
      }
      merchant.tradeShops?.push({
        tsId: data.tsId,
        holdingKey: data.holdingKey,
      });
      merchant.save();
      await new SupplierCodeAddedPublisher(natsWrapper.client).publish({
        merchantId: data.merchantId,
        holdingKey: data.holdingKey,
        tsId: data.tsId,
      });
      await session.commitTransaction();
      res.status(StatusCodes.OK).send({ data: merchant });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Update holding code operation failed", error);
      throw new BadRequestError("Update holding code operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as supplierCodeSaveRouter };

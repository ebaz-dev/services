import express, { Request, Response } from "express";
import {
  BadRequestError,
  validateRequest,
  CustomerDoc,
  Supplier,
  SupplierDoc,
  requireAuth,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";
import { CustomerUpdatedPublisher } from "../../../events/publisher/customer-updated-publisher";
import { natsWrapper } from "../../../nats-wrapper";
const router = express.Router();

router.put(
  "/supplier/:id",
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const updatedSupplier = await Supplier.updateOne(
        { _id: req.params.id },
        <SupplierDoc>req.body
      ).session(session);

      await new CustomerUpdatedPublisher(natsWrapper.client).publish(
        <CustomerDoc>req.body
      );
      await session.commitTransaction();
      res.status(StatusCodes.OK).send(updatedSupplier);
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Customer update operation failed", error);
      throw new BadRequestError("Customer update operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as boSupplierUpdateRouter };

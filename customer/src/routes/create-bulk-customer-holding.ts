import express, { Request, Response } from "express";
import { BadRequestError, validateRequest, CustomerHolding } from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.post(
  "/holding/create",
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const data = req.body;
      await CustomerHolding.insertMany(data);
      await session.commitTransaction();
      res.status(StatusCodes.CREATED).send();
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Customer holding create operation failed", error);
      throw new BadRequestError("Customer holding create operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as customerHoldingCreateRouter };

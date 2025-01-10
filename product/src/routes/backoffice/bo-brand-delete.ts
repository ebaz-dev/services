import express, { Request, Response } from "express";
import { param } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
  Brand,
  Product,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.delete(
  "/brand/:id",
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const brand = await Brand.findById(id).session(session);
      if (!brand) {
        throw new NotFoundError();
      }

      brand.isDeleted = true;
      await brand.save({ session });

      await Product.updateMany(
        { brandId: brand._id },
        { $set: { brandId: null } },
        { session }
      );

      await session.commitTransaction();

      res.status(StatusCodes.OK).send(brand);
    } catch (error) {
      await session.abortTransaction();

      console.error("Error updating brand:", error);
      throw new BadRequestError("Something went wrong.");
    } finally {
      session.endSession();
    }
  }
);

export { router as boBrandDeleteRouter };

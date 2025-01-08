import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
  Promo,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.put(
  "/promo/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid promo ID"),
    body("name").optional().isString().withMessage("Name must be a string"),
    body("supplierId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Supplier ID must be a valid ObjectId"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("Invalid isActive value"),
    body("startDate").optional().isISO8601().withMessage("Invalid start date"),
    body("endDate").optional().isISO8601().withMessage("Invalid end date"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, supplierId, isActive, startDate, endDate } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const promo = await Promo.findById(id).session(session);
      if (!promo) {
        throw new NotFoundError();
      }

      if (name) {
        promo.name = name;
      }
      if (supplierId) {
        promo.customerId = supplierId;
      }
      if (typeof isActive !== "undefined") {
        promo.isActive = isActive;
      }
      if (startDate) {
        promo.startDate = new Date(startDate);
      }
      if (endDate) {
        promo.endDate = new Date(endDate);
      }

      await promo.save({ session });

      await session.commitTransaction();

      res.status(StatusCodes.OK).send(promo);
    } catch (error) {
      await session.abortTransaction();

      console.error("Error updating promo:", error);
      throw new BadRequestError("Something went wrong.");
    } finally {
      session.endSession();
    }
  }
);

export { router as boPromoUpdateRouter };

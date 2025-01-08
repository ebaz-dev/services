import express, { Request, Response } from "express";
import { param } from "express-validator";
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

router.get(
  "/promo/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid promo ID"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const promo = await Promo.findById(id);
      if (!promo) {
        throw new NotFoundError();
      }

      res.status(StatusCodes.OK).send(promo);
    } catch (error) {
      console.error("Error fetching promo by ID:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boPromoGetByIdRouter };

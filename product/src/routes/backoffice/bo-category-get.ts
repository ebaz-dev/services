import express, { Request, Response } from "express";
import { param } from "express-validator";
import { StatusCodes } from "http-status-codes";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
  ProductCategory,
} from "@ezdev/core";
import mongoose from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.get(
  "/category/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid category ID"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const category = await ProductCategory.findById(id);
      if (!category) {
        throw new NotFoundError();
      }

      res.status(StatusCodes.OK).send(category);
    } catch (error) {
      console.error("Error fetching category by ID:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boCategoryGetByIdRouter };

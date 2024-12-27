import express, { Request, Response } from "express";
import { param } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
  Vendor,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

const router = express.Router();

router.get(
  "/vendor/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid vendor ID"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const vendor = await Vendor.findById(id);
      if (!vendor) {
        throw new NotFoundError();
      }

      res.status(StatusCodes.OK).send(vendor);
    } catch (error) {
      console.error("Error fetching vendor by ID:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boVendorGetByIdRouter };

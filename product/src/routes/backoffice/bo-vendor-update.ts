import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
  Vendor,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import mongoose from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.put(
  "/vendor/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid brand ID"),
    body("name").optional().isString().withMessage("Name must be a string"),
    body("supplierId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Supplier ID must be a valid ObjectId"),
    body("image").optional().isString().withMessage("Image must be a string"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    body("apiCompany")
      .optional()
      .isString()
      .withMessage("apiCompany must be a string"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, ...otherFields } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const vendor = await Vendor.findById(id).session(session);
      if (!vendor) {
        throw new NotFoundError();
      }

      if (name) {
        vendor.name = name;
        vendor.slug = slugify(name, { lower: true, strict: true });
      }

      Object.assign(vendor, otherFields);

      await vendor.save({ session });

      await session.commitTransaction();

      res.status(StatusCodes.OK).send(vendor);
    } catch (error) {
      await session.abortTransaction();

      console.error("Error updating vendor:", error);
      throw new BadRequestError("Something went wrong.");
    } finally {
      session.endSession();
    }
  }
);

export { router as boVendorUpdateRouter };

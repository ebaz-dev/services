import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
  Brand,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { DefaultImage } from "../../utils/default-image";
import slugify from "slugify";
import mongoose from "mongoose";

const router = express.Router();

router.put(
  "/brand/:id",
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
    body("vendorId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Vendor ID must be a string"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, supplierId, image, ...otherFields } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const brand = await Brand.findById(id).session(session);
      if (!brand) {
        throw new NotFoundError();
      }

      if (name) {
        brand.name = name;
        brand.slug = slugify(name, { lower: true, strict: true });
      }

      if (supplierId) {
        brand.customerId = supplierId;
      }

      if (image !== undefined) {
        brand.image = image === "" ? DefaultImage.defaultImage : image;
      }

      Object.assign(brand, otherFields);

      await brand.save({ session });

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

export { router as boBrandUpdateRouter };

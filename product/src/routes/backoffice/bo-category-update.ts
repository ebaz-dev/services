import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
  requireAuth,
  ProductCategory,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import mongoose from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.put(
  "/category/:id",
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
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, supplierId, ...otherFields } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const category = await ProductCategory.findById(id).session(session);
      if (!category) {
        throw new NotFoundError();
      }

      if (name) {
        category.name = name;
        category.slug = slugify(name, { lower: true, strict: true });
      }

      if (supplierId) {
        category.customerId = supplierId;
      }

      Object.assign(category, otherFields);

      await category.save({ session });

      await session.commitTransaction();

      res.status(StatusCodes.OK).send(category);
    } catch (error) {
      await session.abortTransaction();

      console.error("Error updating category:", error);
      throw new BadRequestError("Something went wrong.");
    } finally {
      session.endSession();
    }
  }
);

export { router as boCategoryUpdateRouter };

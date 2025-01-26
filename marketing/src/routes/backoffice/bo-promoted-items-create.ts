import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { body } from "express-validator";
import mongoose from "@ezdev/core/lib/mongoose";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  PromotedItems,
  PromotedItemTypes,
  Supplier,
  Product,
  Brand,
} from "@ezdev/core";

const router = express.Router();

// Route to create a new promoted item
router.post(
  "/bo/promoted-items",
  [
    body("supplierId")
      .notEmpty()
      .withMessage("Supplier ID is required")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Supplier ID must be a valid ObjectId"),
    body("type")
      .isString()
      .notEmpty()
      .withMessage("Type is required")
      .isIn(Object.values(PromotedItemTypes))
      .withMessage("Invalid type"),
    body("itemId")
      .notEmpty()
      .withMessage("Item ID is required")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Item ID must be a valid ObjectId"),
    body("startAt")
      .notEmpty()
      .withMessage("Start date is required")
      .isISO8601()
      .toDate()
      .withMessage("startAt must be a valid date"),
    body("endAt")
      .notEmpty()
      .withMessage("End date is required")
      .isISO8601()
      .toDate()
      .withMessage("endAt must be a valid date"),
    body("isActive")
      .notEmpty()
      .withMessage("IsActive is required")
      .isBoolean()
      .withMessage("IsActive must be a boolean"),
    body("priority")
      .notEmpty()
      .withMessage("Priority is required")
      .isInt({ min: 0 })
      .withMessage("Priority must be a non-negative integer"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { supplierId, type, itemId, startAt, endAt, isActive, priority } =
      req.body;

    // Check if the supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new BadRequestError("Supplier not found");
    }

    // Check if the item exists
    const item =
      type === PromotedItemTypes.Product
        ? await Product.findOne({ _id: itemId, customerId: supplierId })
        : type === PromotedItemTypes.Brand
        ? await Brand.findOne({ _id: itemId, customerId: supplierId })
        : null;
    if (!item) {
      throw new BadRequestError("Item not found");
    }

    // Check if the promoted item already exists
    const existingItem = await PromotedItems.findOne({
      supplierId,
      type,
      itemId,
    });

    if (existingItem) {
      throw new BadRequestError("Promoted item already exists");
    }

    try {
      // Create and save the new promoted item
      const promotedItem = PromotedItems.build({
        supplierId,
        type,
        itemId,
        startAt,
        endAt,
        isActive,
        priority,
      });

      await promotedItem.save();

      res.status(StatusCodes.CREATED).send({
        status: "success",
        message: "Promoted item created",
        data: { id: promotedItem._id },
      });
    } catch (error: any) {
      console.error(error);

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        status: "error",
        message: "Something went wrong.",
      });
    }
  }
);

export { router as boPromotedItemsCreateRouter };

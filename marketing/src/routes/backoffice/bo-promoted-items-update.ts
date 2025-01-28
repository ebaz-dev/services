import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { body, param } from "express-validator";
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

// Route to update a promoted item by ID
router.put(
  "/bo/promoted-items/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Promoted item ID must be a valid ObjectId"),
    body("supplierId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Supplier ID must be a valid ObjectId"),
    body("type")
      .optional()
      .isString()
      .isIn(Object.values(PromotedItemTypes))
      .withMessage("Invalid type"),
    body("itemId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Item ID must be a valid ObjectId"),
    body("image").optional().isString().withMessage("Images must be a string"),
    body("startAt")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("startAt must be a valid date"),
    body("endAt")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("endAt must be a valid date"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("IsActive must be a boolean"),
    body("priority")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Priority must be a non-negative integer"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
      // Find the promoted item by ID
      const promotedItem = await PromotedItems.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!promotedItem) {
        throw new BadRequestError("Promoted item not found");
      }

      if (updateData.itemId || updateData.type || updateData.supplierId) {
        if (updateData.supplierId) {
          const supplier = await Supplier.findById(updateData.supplierId);
          if (!supplier) {
            throw new BadRequestError("Supplier not found");
          }
        }

        const type = updateData.type || promotedItem.type;
        const supplierId = updateData.supplierId || promotedItem.supplierId;
        const itemId = updateData.itemId || promotedItem.itemId;

        const item =
          type === PromotedItemTypes.Product
            ? await Product.findOne({ _id: itemId, customerId: supplierId })
            : type === PromotedItemTypes.Brand
            ? await Brand.findOne({ _id: itemId, customerId: supplierId })
            : null;

        if (!item) {
          throw new BadRequestError("Item not found");
        }
      }

      // Update the promoted item with the new data
      Object.assign(promotedItem, updateData);

      await promotedItem.save();
      res.status(StatusCodes.OK).send({
        status: "success",
        message: "Promoted item updated successfully",
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

export { router as boPromotedItemsUpdateRouter };

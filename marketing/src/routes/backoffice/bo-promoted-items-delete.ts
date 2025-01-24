import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { param } from "express-validator";
import mongoose from "@ezdev/core/lib/mongoose";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  PromotedItems,
} from "@ezdev/core";

const router = express.Router();

// Route to delete a promoted item (set isDeleted to true)
router.delete(
  "/promoted-items/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Promoted item ID must be a valid ObjectId"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Find the promoted item by ID
    const promotedItem = await PromotedItems.findById(id);

    if (!promotedItem) {
      throw new BadRequestError("Promoted item not found");
    }

    // Set isDeleted to true
    promotedItem.isDeleted = true;

    try {
      await promotedItem.save();

      res
        .status(StatusCodes.OK)
        .send({ status: "success", message: "Promoted item deleted" });
    } catch (error: any) {
      console.error(error);

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        status: "error",
        message: "Something went wrong.",
      });
    }
  }
);

export { router as boPromotedItemsDeleteRouter };

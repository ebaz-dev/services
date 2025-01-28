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

// Route to get a promoted item by ID
router.get(
  "/app/promoted-items/:id",
  [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Promoted item ID must be a valid ObjectId"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      // Find the promoted item by ID
      const promotedItem = await PromotedItems.findOne({
        _id: id,
        isActive: true,
        isDeleted: false,
      });

      if (!promotedItem) {
        throw new BadRequestError("Promoted item not found");
      }

      res.status(StatusCodes.OK).send(promotedItem);
    } catch (error: any) {
      console.error(error);

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        status: "error",
        message: "Something went wrong.",
      });
    }
  }
);

export { router as appPromotedItemsGetRouter };

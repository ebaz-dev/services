import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { query } from "express-validator";
import mongoose from "@ezdev/core/lib/mongoose";
import { validateRequest, PromotedItems, requireAuth } from "@ezdev/core";

const router = express.Router();

// Route to get a list of promoted items
router.get(
  "/app/promoted-items/list",
  [
    query("supplierId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Supplier ID must be a valid ObjectId"),
    query("type").optional().isString().withMessage("Type must be a string"),
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage("IsActive must be a boolean"),
    query("ids")
      .optional()
      .isString()
      .custom((value: string) => {
        const ids = value.split(",");
        return ids.every((id) => mongoose.Types.ObjectId.isValid(id));
      })
      .withMessage("Each ID must be a valid ObjectId"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, supplierId, type, isActive, ids } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = limit === "all" ? 0 : parseInt(limit as string, 10);

    // Build the query object
    const queryObj: any = { isDeleted: false, isActive: true };
    if (supplierId) queryObj.supplierId = supplierId;
    if (type) queryObj.type = type;
    if (isActive !== undefined) queryObj.isActive = isActive === "true";

    if (ids && typeof ids === "string") {
      // Split the comma-separated list into an array and convert each item to ObjectId
      const idsArray = ids
        .split(",")
        .map((id) => new mongoose.Types.ObjectId(id));
      queryObj._id = { $in: idsArray };
    }

    try {
      // Get the total number of promoted items
      const total = await PromotedItems.countDocuments(queryObj);

      // Find the promoted items based on the query object
      const promotedItems = await PromotedItems.find(queryObj)
        .skip(limitNumber * (pageNumber - 1))
        .limit(limitNumber);

      res.status(StatusCodes.OK).send({
        data: promotedItems,
        total: total,
        totalPages: limit === "all" ? 1 : Math.ceil(total / limitNumber),
        currentPage: limit === "all" ? 1 : pageNumber,
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

export { router as appPromotedItemsListRouter };

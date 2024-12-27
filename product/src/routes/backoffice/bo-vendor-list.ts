import express, { Request, Response } from "express";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  Vendor,
} from "@ezdev/core";
import mongoose from "mongoose";

const router = express.Router();

interface BrandQuery {
  filter?: {
    ids?: string;
    name?: string;
    supplierId?: string;
    isActive?: string;
    vendorId?: string;
  };
  page?: string;
  limit?: string;
  sortKey?: string;
  sortValue?: "asc" | "desc";
}

router.get(
  "/vendors",
  [
    query("filter[ids]")
      .optional()
      .custom((value) => {
        const idsArray = value.split(",").map((id: string) => id.trim());
        return idsArray.every((id: string) =>
          mongoose.Types.ObjectId.isValid(id)
        );
      })
      .withMessage("Each ID must be a valid ObjectId"),
    query("filter[name]")
      .optional()
      .isString()
      .withMessage("Name must be a string"),
    query("filter[supplierId]")
      .optional()
      .custom((id) => mongoose.Types.ObjectId.isValid(id))
      .withMessage("Supplier ID must be a valid ObjectId"),
    query("filter[isActive]")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .custom((value) => value === "all" || parseInt(value, 10) > 0)
      .withMessage("Limit must be a positive integer or 'all'"),
    query("sortKey")
      .optional()
      .isString()
      .withMessage("Sort key must be a string"),
    query("sortValue")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("Sort value must be 'asc' or 'desc'"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request<{}, {}, {}, BrandQuery>, res: Response) => {
    try {
      const {
        filter = {},
        page = "1",
        limit = "10",
        sortKey,
        sortValue,
      } = req.query;

      const { ids, name, supplierId, isActive } = filter;

      const queryFilter: Record<string, any> = {
        ...(ids && {
          _id: {
            $in: ids
              .split(",")
              .map((id) => id.trim())
              .filter((id) => mongoose.Types.ObjectId.isValid(id)),
          },
        }),
        ...(name && {
          $or: [
            { name: new RegExp(name, "i") },
            { slug: new RegExp(name, "i") },
          ],
        }),
        ...(supplierId && { customerId: supplierId }),
        ...(isActive && { isActive: isActive === "true" }),
      };

      const pageNumber = Number(page);
      const limitNumber = limit === "all" ? 0 : Number(limit);
      const skip = limit === "all" ? 0 : (pageNumber - 1) * limitNumber;

      const sort: Record<string, 1 | -1> | undefined =
        sortKey && sortValue
          ? { [sortKey]: sortValue === "asc" ? 1 : -1 }
          : undefined;

      const [vendors, total] = await Promise.all([
        Vendor.find(queryFilter)
          .sort(sort as any)
          .skip(skip)
          .limit(limitNumber),
        Vendor.countDocuments(queryFilter),
      ]);

      res.status(StatusCodes.OK).send({
        data: vendors,
        total,
        totalPages: limit === "all" ? 1 : Math.ceil(total / limitNumber),
        currentPage: limit === "all" ? 1 : pageNumber,
      });
    } catch (error) {
      console.error("Error fetching vendors:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boVendorsRouter };

import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  Vendor,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";
import slugify from "slugify";

const router = express.Router();

router.post(
  "/vendor",
  [
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("apiCompany")
      .isString()
      .notEmpty()
      .withMessage("API Company is required"),
    body("supplierId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Supplier ID must be a valid ObjectId"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { name, apiCompany, supplierId } = req.body;

    const existingVendor = await Vendor.findOne({
      name,
      supplierId,
      apiCompany,
    });

    if (existingVendor) {
      throw new BadRequestError("Vendor already exists");
    }

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const vendor = new Vendor({
        name,
        slug,
        apiCompany,
        supplierId,
        isActive: true,
      });

      await vendor.save();
      res.status(StatusCodes.CREATED).send(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boVendorCreateRouter };

import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  Brand,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { DefaultImage } from "../../utils/default-image";
import slugify from "slugify";
import mongoose  from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.post(
  "/brand",
  [
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("supplierId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .notEmpty()
      .withMessage("Supplier ID must be a valid ObjectId"),
    body("image").isString().optional().withMessage("Image must be a string"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    body("vendorId")
      .optional()
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Vendor ID must be a valid ObjectId"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { name, supplierId, image, isActive, vendorId } = req.body;

    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
      throw new BadRequestError("Brand already exists");
    }

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const finalImage = image === "" ? DefaultImage.defaultImage : image;

      const brand = new Brand({
        name,
        slug,
        customerId: supplierId,
        image: finalImage,
        isActive,
      });

      if (vendorId) brand.vendorId = vendorId;

      await brand.save();
      res.status(StatusCodes.CREATED).send(brand);
    } catch (error) {
      console.error("Error creating brand:", error);
      throw new BadRequestError("Something went wrong.");
    }
  }
);

export { router as boBrandCreateRouter };

import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { body } from "express-validator";
import mongoose from "mongoose";
import slugify from "slugify";
import {
  validateRequest,
  BadRequestError,
  requireAuth,
  Brand,
} from "@ezdev/core";

const router = express.Router();

router.post(
  "/brand",
  [
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("customerId")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Customer ID must be a valid ObjectId"),
    body("image").isString().notEmpty().withMessage("Image is required"),
  ],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { name, customerId, image } = req.body;

    const existingBrand = await Brand.findOne({ name });

    if (existingBrand) {
      throw new BadRequestError("Brand already exists");
    }

    try {
      const slug = slugify(name, { lower: true, strict: true });

      const brand = new Brand({
        name,
        slug,
        customerId,
        image,
      });

      await brand.save();
      res.status(StatusCodes.CREATED).send(brand);
    } catch (error: any) {
      console.error(error);

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        throw new BadRequestError(`Validation Error: ${messages.join(", ")}`);
      }

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
);

export { router as brandCreateRouter };

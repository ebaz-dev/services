import express, { Request, Response } from "express";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  OrderTemplate,
} from "@ezdev/core";

const router = express.Router();

router.post(
  "/template/create",
  [
    body("type")
      .notEmpty()
      .matches(/\b(?:supplier|merchant)\b/)
      .isString()
      .withMessage("Type is required"),
    body("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Supplier ID is required"),
    body("products").notEmpty().isArray().withMessage("Products are required"),
    body("name").notEmpty().isString().withMessage("Name is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const { type, supplierId, merchantId, products, image, name, color } =
        req.body;
      const orderTemplate = new OrderTemplate({
        type,
        supplierId,
        merchantId,
        products,
        image,
        name,
        color,
      });
      await orderTemplate.save({ session });
      await session.commitTransaction();
      res.status(StatusCodes.CREATED).send(orderTemplate);
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Order template create operation failed", error);
      throw new BadRequestError("Order template create operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as templateCreateRouter };

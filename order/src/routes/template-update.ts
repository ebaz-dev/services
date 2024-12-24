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
  "/template/update",
  [
    body("id")
      .notEmpty()
      .isString()
      .withMessage("Order Template ID is required"),
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
      const { id, type, supplierId, merchantId, products, image, name, color } =
        req.body;
      const orderTemplate = await OrderTemplate.findById(id);
      if (!orderTemplate) {
        throw new Error("template not found");
      }
      orderTemplate.type = type;
      orderTemplate.supplierId = supplierId;
      orderTemplate.merchantId = merchantId;
      orderTemplate.products = products;
      orderTemplate.image = image;
      orderTemplate.name = name;
      orderTemplate.color = color;

      await orderTemplate.save({ session });
      await session.commitTransaction();
      res.status(StatusCodes.OK).send({ data: orderTemplate });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Order template update operation failed", error);
      throw new BadRequestError("Order template update operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as templateUpdateRouter };

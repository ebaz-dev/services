import {
  BadRequestError,
  currentUser,
  NotFoundError,
  validateRequest,
  Supplier,
} from "@ezdev/core";
import express, { Request, Response } from "express";
import { body } from "express-validator";

// deprecated
const router = express.Router();

router.post(
  "/holding/create",
  currentUser,
  body("customer_id")
    .isMongoId()
    .notEmpty()
    .withMessage("customer_id must be provided"),
  body("regNo")
    .notEmpty()
    .isString()
    .withMessage("register number is required"),
  body("tsId").notEmpty().isString().withMessage("trade shop id is required"),
  validateRequest,
  async (req: Request, res: Response) => {
    const { customer_id, regNo, tsId } = req.body;

    const supplier = await Supplier.findById(customer_id);

    if (!supplier) {
      throw new NotFoundError();
    }

    if (!supplier.holdingKey) {
      throw new BadRequestError("This supplier is not configured on holding");
    }
  }
);

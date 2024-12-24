import express, { Request, Response } from "express";
import {
  BadRequestError,
  validateRequest,
  CustomerCategory,
  CustomerCategoryDoc,
} from "@ezdev/core";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.post(
  "/category/create",
  [
    body("type")
      .notEmpty()
      .matches(/\b(?:supplier|merchant)\b/)
      .isString()
      .withMessage("Type is required"),
    body("name").notEmpty().isString().withMessage("Name is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { parentId, name, type } = <CustomerCategoryDoc>req.body;
      const newCategory = new CustomerCategory({ parentId, name, type });
      await newCategory.save({ session });
      await session.commitTransaction();
      res.status(StatusCodes.CREATED).send({ data: newCategory });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Customer category create operation failed", error);
      throw new BadRequestError("Customer category create operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as categoryCreateRouter };

import express, { Request, Response } from "express";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  Employee,
  Customer,
  User,
} from "@ezdev/core";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose, { Types } from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.post(
  "/employee",
  [
    body("userId").notEmpty().isString().withMessage("User ID is required"),
    body("customerId")
      .notEmpty()
      .isString()
      .withMessage("Customer ID is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { userId, customerId, role } = req.body;
      const user = await User.findById(userId);
      const customer = await Customer.findById(customerId);
      if (!user || !customer) {
        throw new BadRequestError("Customer or User not found");
      }
      const employeeExist = await Employee.find({ userId, customerId });
      if (employeeExist.length > 0) {
        throw new BadRequestError("Employee already assigned");
      }

      const newEmployee = new Employee({
        userId: new Types.ObjectId(userId as string),
        customerId: new Types.ObjectId(customerId as string),
        role,
      });
      await newEmployee.save({ session });
      await session.commitTransaction();
      res.status(StatusCodes.CREATED).send({ data: newEmployee });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Employee create operation failed", error);
      throw new BadRequestError(error.message);
    } finally {
      session.endSession();
    }
  }
);

export { router as employeeAssignRouter };

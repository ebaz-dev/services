import express, { Request, Response } from "express";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  Employee,
  Customer,
  User,
  Merchant,
  EmployeeRoles,
} from "@ezdev/core";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose, { Types } from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.post(
  "/merchant/employee/assign",
  [
    body("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { merchantId } = req.body;
      const userId = req.currentUser?.id;
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        throw new BadRequestError("Merchant not found");
      }
      const employeeExist = await Employee.findOne({
        userId,
        customerId: merchantId,
      });
      if (employeeExist) {
        throw new BadRequestError("Employee already assigned");
      }
      const ownerExist = await Employee.findOne({
        customerId: merchantId,
        role: EmployeeRoles.Owner,
      });

      const newEmployee = new Employee({
        userId: new Types.ObjectId(userId as string),
        customerId: new Types.ObjectId(merchantId as string),
        role: ownerExist ? EmployeeRoles.Admin : EmployeeRoles.Owner,
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

export { router as merchantEmployeeAssignRouter };

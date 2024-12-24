import express, { Request, Response } from "express";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  CustomerCode,
  CustomerType,
  Supplier,
  SupplierDoc,
  Merchant,
  MerchantDoc,
  Employee,
  EmployeeRoles,
} from "@ezdev/core";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { natsWrapper } from "../nats-wrapper";
import { CustomerCreatedPublisher } from "../events/publisher/customer-created-publisher";
import { getCustomerNumber } from "../utils/customer-number-generate";

const router = express.Router();

router.post(
  "/create",
  [
    body("type")
      .notEmpty()
      .matches(/\b(?:supplier|merchant)\b/)
      .isString()
      .withMessage("Type is required"),
    body("name").notEmpty().isString().withMessage("Name is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let customer: any;
      const data = req.body;
      data.userId = req.currentUser?.id;
      if (data.type === "supplier") {
        data.type = CustomerType.Supplier;
        data.customerNo = await getCustomerNumber(CustomerCode.Supplier);
        customer = new Supplier(<SupplierDoc>data);
      } else {
        data.type = CustomerType.Merchant;
        data.customerNo = await getCustomerNumber(CustomerCode.Merchant);
        customer = new Merchant(<MerchantDoc>data);
      }
      await customer.save({ session });
      const employee = new Employee({
        userId: req.currentUser?.id,
        customerId: customer.id,
        role: EmployeeRoles.Admin,
      });
      await employee.save({ session });
      await new CustomerCreatedPublisher(natsWrapper.client).publish(customer);
      await session.commitTransaction();
      res.status(StatusCodes.CREATED).send({ data: customer });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Customer create operation failed", error);
      throw new BadRequestError("Customer create operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as createRouter };

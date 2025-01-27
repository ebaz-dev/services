import express, { Request, Response } from "express";
import {
  BadRequestError,
  validateRequest,
  CustomerCode,
  CustomerType,
  Employee,
  Merchant,
  MerchantDoc,
  EmployeeRoles,
  requireAuth,
} from "@ezdev/core";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";
import { getCustomerNumber } from "../../../utils/customer-number-generate";
import { CustomerCreatedPublisher } from "../../../events/publisher/customer-created-publisher";
import { natsWrapper } from "../../../nats-wrapper";

const router = express.Router();

router.post(
  "/merchant",
  [body("name").notEmpty().isString().withMessage("Name is required")],
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const data = req.body;
      data.type = CustomerType.Merchant;
      data.customerNo = await getCustomerNumber(CustomerCode.Merchant);
      const customer = new Merchant(<MerchantDoc>data);
      await customer.save({ session });
      const employee = new Employee({
        userId: req.currentUser?.id,
        customerId: customer.id,
        role: EmployeeRoles.Owner,
      });
      await employee.save({ session });
      await new CustomerCreatedPublisher(natsWrapper.client).publish(customer);
      await session.commitTransaction();
      res.status(StatusCodes.CREATED).send({ data: customer });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Customer create operation failed", error);
      throw new BadRequestError(error.message);
    } finally {
      session.endSession();
    }
  }
);

export { router as boMerchantCreateRouter };

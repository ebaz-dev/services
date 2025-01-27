import express, { Request, Response } from "express";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  Merchant,
  MerchantDoc,
  CustomerCode,
  Employee,
  EmployeeRoles,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";
import { getCustomerNumber } from "../utils/customer-number-generate";

const router = express.Router();

router.post(
  "/merchant/create",
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const { business: businessData, branch: branchData } = req.body;
      const existingMerchant = await Merchant.findOne({
        regNo: businessData.regNo,
      });
      if (existingMerchant) {
        throw new BadRequestError("regNo_already_registered");
      }
      businessData.userId = req.currentUser?.id;
      branchData.userId = req.currentUser?.id;
      const insertData = <MerchantDoc>branchData;
      insertData.businessName = businessData.name;
      insertData.regNo = businessData.regNo;
      insertData.customerNo = await getCustomerNumber(CustomerCode.Merchant);
      const merchant = new Merchant(insertData);
      await merchant.save({ session });
      const employee = new Employee({
        userId: req.currentUser?.id,
        customerId: merchant.id,
        role: EmployeeRoles.Owner,
      });
      await employee.save({ session });
      await session.commitTransaction();
      res.status(StatusCodes.CREATED).send({
        data: {
          id: merchant.id,
          name: merchant.businessName,
          regNo: merchant.regNo,
          branches: [merchant],
        },
      });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Merchant create operation failed", error);
      throw new BadRequestError(error.message);
    } finally {
      session.endSession();
    }
  }
);

export { router as merchantCreateRouter };

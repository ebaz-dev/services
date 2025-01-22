import express, { Request, Response } from "express";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  CustomerCode,
  CustomerHolding,
  Employee,
  HoldingSupplierCodes,
  Merchant,
  Supplier,
  EmployeeRoles,
} from "@ezdev/core";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "@ezdev/core/lib/mongoose";
import { SupplierCodeAddedPublisher } from "../events/publisher/supplier-code-added-publisher";
import { natsWrapper } from "../nats-wrapper";
import { getCustomerNumber } from "../utils/customer-number-generate";

const router = express.Router();

router.post(
  "/holding/signin",
  [
    body("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Holding key is required"),
    body("tsId").notEmpty().isString().withMessage("Tradeshop ID is required"),
    body("regNo").notEmpty().isString().withMessage("Register is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const data = req.body;

    try {
      const existingMerchant = await Merchant.findOne({ regNo: data.regNo });
      if (existingMerchant) {
        throw new Error("regNo_already_registered");
      }
      const supplier = await Supplier.findById(data.supplierId);
      if (!supplier) {
        throw new Error("supplier_not_found");
      }
      if (!supplier.holdingKey) {
        throw new Error("supplier_holding_key_not_applied");
      }

      const customerHolding = await CustomerHolding.findOne({
        supplierId: data.supplierId,
        tradeShopId: data.tsId,
        regNo: data.regNo,
      });

      if (!customerHolding) {
        throw new Error("holding_customer_not_found");
      }
      // if (customerHolding.merchantId) {
      //   throw new Error("holding_customer_synced_with_another_merchant");
      // }

      const customerNo = await getCustomerNumber(CustomerCode.Merchant);

      const tradeShops = [
        {
          holdingKey: supplier.holdingKey,
          tsId: customerHolding.tradeShopId,
        },
      ];

      if (supplier.holdingKey === HoldingSupplierCodes.TotalDistribution) {
        tradeShops.push({
          holdingKey: HoldingSupplierCodes.CocaCola,
          tsId: customerHolding.tradeShopId,
        });

        tradeShops.push({
          holdingKey: HoldingSupplierCodes.AnunGoo,
          tsId: customerHolding.tradeShopId,
        });

        tradeShops.push({
          holdingKey: HoldingSupplierCodes.MarketGate,
          tsId: customerHolding.tradeShopId,
        });
      }

      if (supplier.holdingKey === HoldingSupplierCodes.AnunGoo) {
        tradeShops.push({
          holdingKey: HoldingSupplierCodes.MarketGate,
          tsId: customerHolding.tradeShopId,
        });
      }
      if (supplier.holdingKey === HoldingSupplierCodes.MarketGate) {
        tradeShops.push({
          holdingKey: HoldingSupplierCodes.AnunGoo,
          tsId: customerHolding.tradeShopId,
        });
      }

      const merchant = new Merchant({
        customerNo,
        businessName: customerHolding.tradeShopName,
        name: customerHolding.tradeShopName,
        regNo: customerHolding.regNo,
        address: customerHolding.address,
        phone: customerHolding.phone,
        userId: req.currentUser?.id,
        tradeShops,
      });
      await merchant.save({ session });
      const employee = new Employee({
        userId: req.currentUser?.id,
        customerId: merchant.id,
        role: EmployeeRoles.Admin,
      });
      await employee.save({ session });

      // customerHolding.merchantId = merchant.id;
      // await customerHolding.save();
      const publishData = {
        merchantId: merchant.id,
        holdingKey: supplier.holdingKey,
        tsId: data.tsId,
      };
      await new SupplierCodeAddedPublisher(natsWrapper.client).publish(
        publishData
      );
      await session.commitTransaction();
      res.status(StatusCodes.OK).send({
        data: {
          id: merchant.id,
          name: merchant.businessName,
          regNo: merchant.regNo,
          branches: [merchant],
        },
      });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Update holding code operation failed", error);
      throw new BadRequestError(error.message);
    } finally {
      session.endSession();
    }
  }
);

export { router as holdingSigninRouter };

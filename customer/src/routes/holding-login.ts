import express, { Request, Response } from "express";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
  CustomerCode,
  CustomerHolding,
  Merchant,
  Supplier,
} from "@ezdev/core";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { getCustomerNumber } from "../utils/customer-number-generate";

const router = express.Router();

router.post(
  "/holding/login",
  [
    body("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
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
      const supplier = await Supplier.findById(data.supplierId);
      if (!supplier) {
        throw new Error("supplier_not_found");
      }
      if (!supplier.holdingKey) {
        throw new Error("supplier_holding_key_not_applied");
      }
      const merchant = await Merchant.findById(data.merchantId);
      if (!merchant) {
        throw new Error("merchant_not_found");
      }

      if (!merchant.parentId) {
        throw new Error("merchant_does_not_have_parent");
      }

      const parent = await Merchant.findById(merchant.parentId);

      if (!parent) {
        throw new Error("merchant_does_not_have_parent");
      }

      if (parent.regNo != data.regNo) {
        throw new Error("register_does_not_match");
      }

      const customerHolding = await CustomerHolding.findOne({
        supplierId: data.supplierId,
        tradeShopId: data.tsId,
        regNo: data.regNo,
      });

      if (!customerHolding) {
        throw new Error("holding_customer_not_found");
      }
      if (customerHolding.merchantId) {
        throw new Error("holding_customer_synced_with_another_merchant");
      }

      if (merchant.tradeShops) {
        const foundTradeShop = merchant.tradeShops.find(
          (tradesShop) => tradesShop.holdingKey === supplier.holdingKey
        );
        if (foundTradeShop) {
          throw new Error("holding_tradeshop_already_synced");
        }

        merchant.tradeShops?.push({
          tsId: data.tsId,
          holdingKey: supplier.holdingKey,
        });
      } else {
        merchant.tradeShops = [
          {
            tsId: data.tsId,
            holdingKey: supplier.holdingKey,
          },
        ];
      }
      merchant.customerNo = await getCustomerNumber(CustomerCode.Merchant);

      await merchant.save();
      customerHolding.merchantId = merchant.id;
      await customerHolding.save();
      await session.commitTransaction();
      res.status(StatusCodes.OK).send({ data: merchant });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Update holding code operation failed", error);
      throw new BadRequestError(error.message);
    } finally {
      session.endSession();
    }
  }
);

export { router as holdingLoginRouter };

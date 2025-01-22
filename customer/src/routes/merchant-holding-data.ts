import express, { Request, Response } from "express";
import {
  currentUser,
  requireAuth,
  validateRequest,
  CustomerHolding,
  HoldingSupplierCodes,
  Supplier,
  Merchant,
} from "@ezdev/core";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

router.get(
  "/holding/merchant",
  [
    query("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Holding key is required"),
    query("tsId").notEmpty().isString().withMessage("Tradeshop ID is required"),
    query("regNo").notEmpty().isString().withMessage("Register is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const data = req.query;
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

    const merchant = {
      businessName: customerHolding.tradeShopName,
      name: customerHolding.tradeShopName,
      regNo: customerHolding.regNo,
      address: customerHolding.address,
      phone: customerHolding.phone,
      tradeShops,
    };

    res.status(StatusCodes.OK).send({
      data: merchant,
    });
  }
);

export { router as holdingSigninDataRouter };

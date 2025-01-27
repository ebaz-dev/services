import express, { Request, Response } from "express";
import {
  currentUser,
  requireAuth,
  validateRequest,
  CustomerHolding,
  HoldingSupplierCodes,
  Supplier,
  Merchant,
  BadRequestError,
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
    const supplier = await Supplier.findById(data.supplierId);
    if (!supplier) {
      throw new BadRequestError("supplier_not_found");
    }
    if (!supplier.holdingKey) {
      throw new BadRequestError("supplier_holding_key_not_applied");
    }

    const existingMerchant = await Merchant.findOne({
      regNo: data.regNo,
      tradeShops: {
        $elemMatch: {
          tsId: data.tsId,
          holdingKey: supplier.holdingKey,
        },
      },
    });

    if (existingMerchant) {
      res.status(StatusCodes.OK).send({
        data: {
          exists: true,
          merchant: existingMerchant,
        },
      });
    }

    const customerHolding = await CustomerHolding.findOne({
      holdingKey: supplier.holdingKey,
      tradeShopId: data.tsId,
      regNo: data.regNo,
    });

    if (!customerHolding) {
      throw new BadRequestError("holding_customer_not_found");
    }

    const tradeShops = [
      {
        holdingKey: supplier.holdingKey,
        tsId: customerHolding.tradeShopId,
        channel: customerHolding.team,
      },
    ];

    if (supplier.holdingKey === HoldingSupplierCodes.TotalDistribution) {
      tradeShops.push({
        holdingKey: HoldingSupplierCodes.CocaCola,
        tsId: customerHolding.tradeShopId,
        channel: customerHolding.team,
      });

      tradeShops.push({
        holdingKey: HoldingSupplierCodes.AnunGoo,
        tsId: customerHolding.tradeShopId,
        channel: customerHolding.team,
      });

      tradeShops.push({
        holdingKey: HoldingSupplierCodes.MarketGate,
        tsId: customerHolding.tradeShopId,
        channel: customerHolding.team,
      });
    }

    if (supplier.holdingKey === HoldingSupplierCodes.AnunGoo) {
      tradeShops.push({
        holdingKey: HoldingSupplierCodes.MarketGate,
        tsId: customerHolding.tradeShopId,
        channel: customerHolding.team,
      });
    }
    if (supplier.holdingKey === HoldingSupplierCodes.MarketGate) {
      tradeShops.push({
        holdingKey: HoldingSupplierCodes.AnunGoo,
        tsId: customerHolding.tradeShopId,
        channel: customerHolding.team,
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
      data: { exists: false, merchant },
    });
  }
);

export { router as holdingSigninDataRouter };

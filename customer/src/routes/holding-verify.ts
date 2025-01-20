import express, { Request, Response } from "express";
import {
  currentUser,
  requireAuth,
  validateRequest,
  BadRequestError,
} from "@ezdev/core";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { HoldingSupplierCodes, Supplier } from "@ezdev/core";
import { HoldingAPIClient } from "../utils/HoldingApiClient";

const router = express.Router();

router.get(
  "/holding/merchant",
  [
    query("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Supplier ID is required"),
    query("tsId").notEmpty().isString().withMessage("Tradeshop ID is required"),
    query("regNo").notEmpty().isString().withMessage("Register is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const { supplierId, tsId, regNo } = req.query;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier || !supplier.holdingKey) {
      throw new BadRequestError("supplier_not_found");
    }

    const holdingClient = HoldingAPIClient.getClient();
    let merchantInfo;

    try {
      // For AG or MG, first try with AG
      if (
        supplier.holdingKey === HoldingSupplierCodes.AnunGoo ||
        supplier.holdingKey === HoldingSupplierCodes.MarketGate
      ) {
        try {
          merchantInfo = await holdingClient.getMerchantInfo(
            tsId as string,
            regNo as string,
            HoldingSupplierCodes.AnunGoo
          );
        } catch (error) {
          // If AG fails, try with TD
          merchantInfo = await holdingClient.getMerchantInfo(
            tsId as string,
            regNo as string,
            HoldingSupplierCodes.TotalDistribution
          );
        }
      } else if (
        supplier.holdingKey !== HoldingSupplierCodes.TotalDistribution
      ) {
        // For other suppliers (except TD), try with their key first
        try {
          merchantInfo = await holdingClient.getMerchantInfo(
            tsId as string,
            regNo as string,
            supplier.holdingKey
          );
        } catch (error) {
          // If their key fails, try with TD
          merchantInfo = await holdingClient.getMerchantInfo(
            tsId as string,
            regNo as string,
            HoldingSupplierCodes.TotalDistribution
          );
        }
      } else {
        // For TD, just use TD
        merchantInfo = await holdingClient.getMerchantInfo(
          tsId as string,
          regNo as string,
          supplier.holdingKey
        );
      }
    } catch (error) {
      throw new BadRequestError("holding_customer_not_found");
    }

    const merchant = {
      businessName: merchantInfo.data.customer.customer_name,
      name: merchantInfo.data.customer.customer_name,
      regNo: merchantInfo.data.customer.reg_num,
      address: merchantInfo.data.trade_shop.full_address,
      phone: merchantInfo.data.customer.phone_number,
      province_city: merchantInfo.data.trade_shop.province_city,
      district_subcity: merchantInfo.data.trade_shop.district_subcity,
      sub_district_block: merchantInfo.data.trade_shop.sub_district_block,
      tradeShops: merchantInfo.data.supplier.map((shop) => ({
        holdingKey: shop.supplier,
        tsId: shop.trade_shop_id.toString(),
      })),
    };

    res.status(StatusCodes.OK).send({ data: merchant });
  }
);

export { router as holdingVerifyRouter };

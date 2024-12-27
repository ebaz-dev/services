import express, { Request, Response } from "express";
import axios from "axios";
import { StatusCodes } from "http-status-codes";
import {
  Merchant,
  Supplier,
  AnungooAPIClient,
  ColaAPIClient,
  TotalAPIClient,
} from "@ezdev/core";
import { fetchProfileData, filterResponseData } from "../utils/profile-utils";

const router = express.Router();

router.get("/bas/profile-data", async (req: Request, res: Response) => {
  try {
    const { tradeshopId, supplierId } = req.query;

    if (!tradeshopId || !supplierId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "Parameter is missing",
        data: [],
      });
    }

    const merchant = await Merchant.findById(tradeshopId).select("tradeShops");

    if (!merchant || !merchant.tradeShops) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: "Merchant data not found",
        data: [],
      });
    }

    const supplier = await Supplier.findById(supplierId).select(
      "holdingKey vendorKey business businessType"
    );

    if (!supplier || !supplier.holdingKey) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: "Supplier data not found",
        data: [],
      });
    }

    let isTotalMerchant = merchant.tradeShops.some(
      (item) => item.holdingKey === "TD"
    );

    const holdingKey = supplier.holdingKey;
    const supplierTag = supplier.business;
    const businessType = supplier.businessType;

    const merchantBasId = merchant.tradeShops.find(
      (item) => item.holdingKey === holdingKey
    )?.tsId;

    if (!merchantBasId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "Merchant BAS ID not found",
        data: [],
      });
    }

    let responseData: any[] | null = null;

    if (isTotalMerchant) {
      responseData = await fetchProfileData(TotalAPIClient.getClient(), {
        tradeshopid: parseInt(merchantBasId),
        company: supplierTag,
      });
    } else {
      switch (supplierTag) {
        case "Anungoo":
        case "MarketGate":
          responseData = await fetchProfileData(AnungooAPIClient.getClient(), {
            tradeshopid: parseInt(merchantBasId),
          });

          if (responseData) {
            responseData = filterResponseData(
              responseData,
              businessType as string
            );
          }

          break;
        case "Coca Cola":
          responseData = await fetchProfileData(ColaAPIClient.getClient(), {
            tradeshopid: parseInt(merchantBasId),
          });
          break;
        default:
          return res.status(StatusCodes.BAD_REQUEST).send({
            message: "Invalid supplier tag",
          });
      }
    }

    return res.status(StatusCodes.OK).send({
      message: "success",
      data: responseData,
    });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: "Bas error: " + error.response?.data.err_msg,
        basError: true,
        data: [],
      });
    } else {
      console.error("Bas integration cola merchant profile get error:", error);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
        data: [],
      });
    }
  }
});

export { router as basProfileRouter };

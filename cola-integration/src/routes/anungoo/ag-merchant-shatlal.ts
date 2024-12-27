import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AnungooAPIClient, Merchant } from "@ezdev/core";
import axios from "axios";

const router = express.Router();

router.get("/anungoo/merchant-shatlal", async (req: Request, res: Response) => {
  try {
    const tradeshopid = req.query.tradeshopid as string;
    const type = req.query.type as string;

    if (!tradeshopid) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "tradeshopid is required",
      });
    }

    if (!type) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "type is required",
      });
    }

    const merchantData = await Merchant.findById(tradeshopid);
    if (!merchantData) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: "Merchant not found",
      });
    }

    const tsId = merchantData.tradeShops?.find(
      (item: any) => item.holdingKey === "AG"
    )?.tsId;

    if (!tsId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "HoldingKey not found",
      });
    }

    const productsResponse = await AnungooAPIClient.getClient().post(
      `/api/ebazaar/productremains`,
      {
        tradeshopid: parseInt(tsId),
      }
    );

    const merchantShatlal = productsResponse?.data?.shatlal || [];

    const filteredList = merchantShatlal.filter((item: any) => {
      if (type === "food") {
        return item.business === "AG_FOOD";
      } else if (type === "nonFood") {
        return item.business === "AG_NONFOOD";
      } else {
        return false;
      }
    });

    return res.status(StatusCodes.OK).send({
      data: filteredList,
      total: filteredList.length,
      totalPages: 1,
      currentPage: 1,
    });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return res.status(StatusCodes.OK).send({
        data: [],
        total: 0,
        totalPages: 1,
        currentPage: 1,
        message: "Bas error: " + error.response?.data.err_msg,
      });
    } else {
      console.error(
        "Bas integration anungoo merchant shatlal get error:",
        error
      );

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
});

export { router as agMerchantShatlalRouter };

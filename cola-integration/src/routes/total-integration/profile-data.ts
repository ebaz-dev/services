import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Merchant, TotalAPIClient } from "@ezdev/core";
import axios from "axios";

const router = express.Router();

router.get("/total/profile-data", async (req: Request, res: Response) => {
  try {
    console.log("Total profile data fetch started.");
    const { tradeshopId } = req.query;
    if (!tradeshopId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "tradeshopId required",
        data: [],
      });
    }

    const merchant = await Merchant.findById(tradeshopId);
    if (!merchant) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "merchant not found",
        data: [],
      });
    }

    if (!merchant.tradeShops) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "total merchant not registered",
        data: [],
      });
    }

    const integrationData = merchant.tradeShops;

    const totalId = integrationData.find(
      (item) => item.holdingKey === "TD"
    )?.tsId;

    if (!totalId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "total merchant not registered",
        data: [],
      });
    }

    const profileResponse = await TotalAPIClient.getClient().post(
      "/api/ebazaar/getdataprofile",
      { tradeshopid: totalId }
    );

    const profileData = profileResponse?.data?.data ?? [];
    if (profileData.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: "Profile data not found",
        data: [],
      });
    }

    return res
      .status(StatusCodes.OK)
      .send({ message: "succes", data: profileData });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: "Bas error: " + error.response?.data.err_msg,
        basError: true,
        data: [],
      });
    } else {
      console.error("Total profile data get error:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Internal server error",
        basError: false,
        data: [],
      });
    }
  }
});
export { router as totalProfileRouter };

import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ColaAPIClient, Merchant } from "@ezdev/core";
import axios from "axios";

const router = express.Router();

router.get("/cola/profile-data", async (req: Request, res: Response) => {
  try {
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
        message: "cola merchant not registered",
        data: [],
      });
    }

    const integrationData = merchant.tradeShops;

    const colaId = integrationData.find(
      (item) => item.holdingKey === "MCSCC"
    )?.tsId;

    if (!colaId) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "cola merchant not registered",
        data: [],
      });
    }

    const profileResponse = await ColaAPIClient.getClient().post(
      "/api/ebazaar/getdataprofile",
      { tradeshopid: colaId }
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
      console.error("Cola profile data get error:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Internal server error",
        basError: false,
        data: [],
      });
    }
  }
});
export { router as colaProfileRouter };

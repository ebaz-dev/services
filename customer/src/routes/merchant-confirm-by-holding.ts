import express, { Request, Response } from "express";
import {
  requireAuth,
  validateRequest,
  HoldingSupplierCodes,
} from "@ezdev/core";
import { StatusCodes } from "http-status-codes";
import { body } from "express-validator";
import { HoldingAPIClient } from "../utils/HoldingApiClient";

const router = express.Router();

router.post(
  "/merchant/holding/confirm",
  [
    body("tradeShopId")
      .notEmpty()
      .isString()
      .withMessage(" register number must be defined"),
    body("register_number")
      .notEmpty()
      .isString()
      .withMessage(" register number must be defined"),
    body("holdingKey")
      .custom((value) => {
        if (!Object.values(HoldingSupplierCodes).includes(value)) {
          return false;
        }
        return true;
      })
      .withMessage(
        "Invalid holdingKey. Must be one of the predefined enum values."
      ),
  ],
  validateRequest,
  requireAuth,
  async (req: Request, res: Response) => {
    const { tradeShopId, register_number, holdingKey } = req.body as {
      tradeShopId: string;
      register_number: string;
      holdingKey: HoldingSupplierCodes;
    };
    console.log(register_number);

    const resp = await HoldingAPIClient.getClient().getMerchantInfo(
      tradeShopId,
      register_number,
      holdingKey
    );

    const data = {
      name: resp.data.customer.customer_name,
      regNo: resp.data.customer.reg_num,
      phone: resp.data.customer.phone_number,
    };

    res.status(StatusCodes.OK).send({ data });
  }
);

export { router as merchantConfirmByHolding };

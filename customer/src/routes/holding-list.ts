import express, { Request, Response } from "express";
import { validateRequest, CustomerHolding } from "@ezdev/core";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

router.get(
  "/holding/list",
  validateRequest,
  async (req: Request, res: Response) => {
    const criteria: any = {};
    if (req.query.phone) {
      criteria.phone = {
        $regex: req.query.phone,
        $options: "i",
      };
    }
    if (req.query.regNo) {
      criteria.regNo = {
        $regex: req.query.regNo,
        $options: "i",
      };
    }

    if (req.query.supplierId) {
      criteria.supplierId = req.query.supplierId;
    }
    if (req.query.tradeShopId) {
      criteria.tradeShopId = req.query.tradeShopId;
    }
    if (req.query.tradeShopName) {
      criteria.tradeShopName = {
        $regex: req.query.tradeShopName,
        $options: "i",
      };
    }
    if (req.query.merchantId) {
      criteria.merchantId = req.query.merchantId;
    }
    const data = await CustomerHolding.find(criteria);
    res.status(StatusCodes.OK).send({ data });
  }
);

export { router as holdingListRouter };

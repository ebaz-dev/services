import { colaMerchantPayments } from "@ebazdev/cola-integration";
import { HoldingSupplierCodes, Merchant } from "@ezdev/core";
import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "@ezdev/core/lib/mongoose";

const router = express.Router();

router.get("/merchant/debt", async (req: Request, res: Response) => {
  try {
    const data = await checkMerchantDebt(req.query.merchantId as string);

    return res.status(StatusCodes.OK).send({ data });
  } catch (error) {
    console.log("err", error);
    return res.status(StatusCodes.BAD_REQUEST).send({
      status: "failure",
    });
  }
});

const checkMerchantDebt = async (merchantId: string) => {
  const merchant = await Merchant.findById(new Types.ObjectId(merchantId));

  if (!merchant) {
    console.log("Merchant not found");
    throw new Error("Merchant not found");
  }

  const tradeshop = merchant.tradeShops?.find(
    (ts: any) => ts.holdingKey === HoldingSupplierCodes.CocaCola
  );

  if (!tradeshop) {
    console.log("Tradeshop not found");
    throw new Error("Tradeshop not found");
  }

  return colaMerchantPayments(tradeshop.tsId);
};

export { router as merchantDebtRouter };

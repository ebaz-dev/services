import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { basCheckMerchantDebt } from "../../utils/bas-merchant-debt";

const router = express.Router();

router.get("/anungoo/merchant/debt", async (req: Request, res: Response) => {
  try {
    const { merchantId, type } = req.query;

    const newType = type === "food" ? "ag_food" : "ag_nonfood";

    const data = await basCheckMerchantDebt(
      merchantId as string,
      newType as string,
      "AG"
    );

    return res.status(StatusCodes.OK).send({ data });
  } catch (error) {
    console.log("err", error);
    return res.status(StatusCodes.BAD_REQUEST).send({
      status: "failure",
    });
  }
});

export { router as agMerchantDebtRouter };

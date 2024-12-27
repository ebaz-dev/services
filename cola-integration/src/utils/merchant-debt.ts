import {
  HoldingSupplierCodes,
  Merchant,
  colaMerchantPayments,
} from "@ezdev/core";
import { Types } from "mongoose";

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

export { checkMerchantDebt };

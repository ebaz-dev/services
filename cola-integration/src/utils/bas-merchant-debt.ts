import {
  HoldingSupplierCodes,
  Merchant,
  basMerchantPayments,
} from "@ezdev/core";
import { Types } from "@ezdev/core/lib/mongoose";

const basCheckMerchantDebt = async (
  merchantId: string,
  type: string,
  supplier: string
) => {
  const merchant = await Merchant.findById(new Types.ObjectId(merchantId));

  if (!merchant) {
    console.log("Merchant not found");
    throw new Error("Merchant not found");
  }

  const tradeshop = merchant.tradeShops?.find(
    (ts: any) => ts.holdingKey === supplier
  );

  if (!tradeshop) {
    console.log("Tradeshop not found");
    throw new Error("Tradeshop not found");
  }

  return basMerchantPayments(tradeshop.tsId, type, supplier);
};

export { basCheckMerchantDebt };

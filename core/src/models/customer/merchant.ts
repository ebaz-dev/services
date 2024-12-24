import { Schema } from "mongoose";
import { Customer, CustomerDoc } from "./customer";
import { HoldingSupplierCodes } from "../../types/holding-supplier-codes";

interface tradeShop {
  tsId: string;
  holdingKey: HoldingSupplierCodes;
}
interface MerchantDoc extends CustomerDoc {
  businessName: string;
  businessStartDate?: Date;
  tradeShops?: tradeShop[];
  test: boolean;
}

const Merchant = Customer.discriminator<MerchantDoc>(
  "merchant",
  new Schema({
    businessName: {
      type: String,
      required: false,
    },
    businessStartDate: {
      type: Date,
      required: false,
    },
    tradeShops: [
      {
        tsId: String,
        holdingKey: {
          type: String,
          enum: Object.values(HoldingSupplierCodes),
        },
      },
    ],
    test: { type: Boolean, default: false },
  })
);

export { MerchantDoc, Merchant };

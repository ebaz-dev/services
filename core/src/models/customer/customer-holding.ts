import { Document, Schema, Types, model } from "../../lib/mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface CustomerHoldingDoc extends Document {
  supplierId: Types.ObjectId;
  regNo: string;
  phone: string;
  tradeShopName: string;
  tradeShopId: string;
  ownerId?: string;
  ownerName?: string;
  team?: string;
  salesman?: string;
  mngr?: string;
  address?: string;

  merchantId?: Types.ObjectId;
}

const customerHoldingSchema = new Schema<CustomerHoldingDoc>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    regNo: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    tradeShopName: {
      type: String,
      required: true,
    },
    tradeShopId: {
      type: String,
      required: true,
    },
    ownerId: {
      type: String,
      required: false,
    },
    ownerName: {
      type: String,
      required: false,
    },
    team: {
      type: String,
      required: false,
    },
    salesman: {
      type: String,
      required: false,
    },
    mngr: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Customer",
    },
  },
  {
    discriminatorKey: "type",
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

customerHoldingSchema.set("versionKey", "version");
customerHoldingSchema.plugin(updateIfCurrentPlugin);

const CustomerHolding = model<CustomerHoldingDoc>(
  "CustomerHolding",
  customerHoldingSchema
);

export { CustomerHoldingDoc, CustomerHolding };

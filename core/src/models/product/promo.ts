import { Document, Schema, model, Types, Model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { PromoTypeNames, PromoTypes } from "./promoType";

interface thirdPartyData {
  thirdPartyPromoName: string;
  thirdPartyPromoId: number;
  thirdPartyPromoNo: string;
  thirdPartyPromoTypeId: number;
  thirdPartyPromoType: string;
  thirdPartyPromoTypeCode: string;
}
interface PromoDoc extends Document {
  id: Types.ObjectId;
  customerId: Types.ObjectId;
  vendorId?: Types.ObjectId;
  name: string;
  slug: string;
  startDate: Date;
  endDate: Date;
  promoNo?: string;
  tresholdAmount: number;
  thresholdQuantity: number;
  promoPercent: number;
  giftQuantity: number;
  isActive: boolean;
  promoTypeId: number;
  promoTypeName: PromoTypeNames;
  promoType: PromoTypes;
  products: Types.ObjectId[];
  giftProducts: Types.ObjectId[];
  giftProductPackages: object[];
  tradeshops: number[];
  thirdPartyData?: thirdPartyData;
}

interface PromoModel extends Model<PromoDoc> {}

const promoSchema = new Schema<PromoDoc>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Vendor",
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    promoNo: {
      type: String,
      required: false,
    },
    tresholdAmount: {
      type: Number,
      required: true,
    },
    thresholdQuantity: {
      type: Number,
      required: true,
    },
    promoPercent: {
      type: Number,
      required: false,
    },
    giftQuantity: {
      type: Number,
      required: false,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    promoTypeId: {
      type: Number,
      required: true,
    },
    promoTypeName: {
      type: String,
      required: true,
    },
    promoType: {
      type: String,
      required: true,
    },
    products: {
      type: [Schema.Types.ObjectId],
      required: true,
      ref: "Product",
    },
    giftProducts: {
      type: [Schema.Types.ObjectId],
      required: true,
      ref: "Product",
    },
    giftProductPackages: {
      type: [Object],
      required: true,
    },
    tradeshops: {
      type: [Number],
      required: true,
    },
    thirdPartyData: {
      thirdPartyPromoName: {
        type: String,
        required: false,
      },
      thirdPartyPromoId: {
        type: Number,
        required: false,
      },
      thirdPartyPromoNo: {
        type: String,
        required: false,
      },
      thirdPartyPromoTypeId: {
        type: Number,
        required: false,
      },
      thirdPartyPromoType: {
        type: String,
        required: false,
      },
      thirdPartyPromoTypeCode: {
        type: String,
        required: false,
      },
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    timestamps: true,
  }
);

promoSchema.plugin(updateIfCurrentPlugin);

const Promo = model<PromoDoc, PromoModel>("Promo", promoSchema);

export { Promo, PromoDoc };

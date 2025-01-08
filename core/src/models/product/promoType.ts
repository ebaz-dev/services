import { Document, Schema, model, Types, Model } from "../../lib/mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum PromoTypes {
  PromoGiftItself = "x+x",
  PromoGiftOther = "x+y",
  PromoDiscount = "z>x%",
  PromoTargetDicount = "Z$>x%",
  PromoTarget = "z>x",
  PromoTargetShatlal = "Z>(*x,*y)",
}

export enum PromoTypeNames {
  PromoGiftItself = "Gift Itself",
  PromoGiftOther = "Gift Other",
  PromoDiscount = "Discount",
  PromoTargetDicount = "Target Discount",
  PromoTarget = "Target",
  PromoTargetShatlal = "Target Shatlal",
}

export enum PromoTypeIds {
  PromoGiftItself = 1,
  PromoGiftOther = 2,
  PromoDiscount = 3,
  PromoTargetDicount = 4,
  PromoTarget = 5,
  PromoTargetShatlal = 6,
}

interface PromoTypeDoc extends Document {
  name: PromoTypeNames;
  type: PromoTypes;
  typeId: number;
}

interface PromoTypeModel extends Model<PromoTypeDoc> {}

const promoTypeSchema = new Schema<PromoTypeDoc>(
  {
    name: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: true,
    },
    typeId: {
      type: Number,
      required: true,
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

promoTypeSchema.plugin(updateIfCurrentPlugin);

const PromoType = model<PromoTypeDoc, PromoTypeModel>(
  "PromoType",
  promoTypeSchema
);

export { PromoType };

import mongoose, {
  Document,
  Schema,
  model,
  Types,
  Model,
} from "../../lib/mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum PromotedItemTypes {
  Brand = "brand",
  Product = "product",
}

interface PromotedItemAttrs {
  supplierId: Types.ObjectId;
  type: PromotedItemTypes;
  itemId: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  priority: number;
  isDeleted?: boolean;
}

interface PromotedItemsDoc extends Document {
  id: Types.ObjectId;
  supplierId: Types.ObjectId;
  type: PromotedItemTypes;
  itemId: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  priority: number;
  isDeleted?: boolean;
}

interface PromotedItemsModel extends Model<PromotedItemsDoc> {
  build(attrs: PromotedItemAttrs): PromotedItemsDoc;
}

const promotedItemsSchema = new Schema<PromotedItemsDoc>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(PromotedItemTypes),
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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

promotedItemsSchema.plugin(updateIfCurrentPlugin);

promotedItemsSchema.statics.build = (attrs: PromotedItemAttrs) => {
  return new PromotedItems(attrs);
};

const PromotedItems = model<PromotedItemsDoc, PromotedItemsModel>(
  "PromotedItems",
  promotedItemsSchema
);

export { PromotedItemsDoc, PromotedItems };

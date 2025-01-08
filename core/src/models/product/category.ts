import { Document, Schema, model, Types, Model } from "../../lib/mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface ProductCategoryDoc extends Document {
  id: Types.ObjectId;
  parentId?: Types.ObjectId;
  name: string;
  slug: string;
  customerId: Types.ObjectId;
  isActive: boolean;
  vendorId?: Types.ObjectId;
}

interface ProductCategoryModel extends Model<ProductCategoryDoc> {}

const productCategorySchema = new Schema<ProductCategoryDoc>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      required: false,
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

productCategorySchema.plugin(updateIfCurrentPlugin);

const ProductCategory = model<ProductCategoryDoc, ProductCategoryModel>(
  "ProductCategory",
  productCategorySchema
);

export { ProductCategory };

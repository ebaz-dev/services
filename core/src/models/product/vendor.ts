import { Document, Schema, model, Types } from "../../lib/mongoose";

interface VendorDoc extends Document {
  supplierId: Types.ObjectId;
  originSupplierId: Types.ObjectId;
  businessType: string;
  name: string;
  slug: string;
  apiCompany: string;
  isActive: boolean;
}

const VendorSchema = new Schema<VendorDoc>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Supplier",
    },
    originSupplierId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Supplier",
    },
    businessType: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    apiCompany: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
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

const Vendor = model<VendorDoc>("Vendor", VendorSchema);

export { Vendor };

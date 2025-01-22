import { Schema, Types } from "../../lib/mongoose";
import { Customer, CustomerDoc } from "./customer";
import {
  HoldingBusinessCodes,
  HoldingBusinessTypeCodes,
  HoldingSupplierCodes,
} from "../../types/holding-supplier-codes";
import { VendorCodes } from "../../types/vendor-codes";
import { IntegrationKeys } from "../../types/integration-keys";

interface BannerDoc extends Document {
  file: string;
  type: number;
  id: Types.ObjectId;
}
const bannerSchema = new Schema<BannerDoc>({
  file: {
    type: String,
    required: true,
  },
  type: {
    type: Number,
    required: true,
  },
  id: {
    type: Schema.Types.ObjectId,
    require: true,
  },
});

interface BrandDoc extends Document {
  url: string;
}
const brandSchema = new Schema<BrandDoc>(
  {
    url: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);
interface ProductQueryDoc extends Document {
  limit?: number;
  page?: number;
  brands?: string;
}
const productQuerySchema = new Schema<ProductQueryDoc>(
  {
    limit: {
      type: Number,
      required: false,
    },
    page: {
      type: Number,
      required: false,
    },
    brands: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);
interface PromoBannerDoc extends Document {
  id: Types.ObjectId;
  url: string;
}
const promoBannerSchema = new Schema<PromoBannerDoc>(
  {
    id: {
      type: Schema.Types.ObjectId,
      require: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret._id;
      },
    },
  }
);

interface SupplierDoc extends CustomerDoc {
  orderMin: number;
  stockMin: number;
  deliveryDays: number[];
  holdingKey?: HoldingSupplierCodes;
  code: string;
  banners: BannerDoc[];
  productQuery?: ProductQueryDoc;
  productBanner?: string;
  infoBanner?: string;
  brands: BrandDoc[];
  vendorKey?: VendorCodes;
  integrationKey?: IntegrationKeys;
  business?: string;
  businessType?: string;
  appData?: any;
  promoBanners?: PromoBannerDoc[];
  orderScheduleTime?: string;
  termOfService: string;
  showOnHome: boolean;
  linked: boolean;
  refId: Types.ObjectId;
}
const supplierSchema = new Schema<SupplierDoc>(
  {
    orderMin: { type: Number, required: false },
    stockMin: { type: Number, required: false },
    deliveryDays: { type: [Number], enum: [1, 2, 3, 4, 5, 6, 7] },
    holdingKey: { type: String, enum: Object.values(HoldingSupplierCodes) },
    code: { type: String },
    banners: [bannerSchema], // Assuming bannerSchema is predefined
    productQuery: productQuerySchema, // Assuming productQuerySchema is predefined
    productBanner: { type: String, required: false },
    infoBanner: { type: String, required: false },
    brands: [brandSchema], // Assuming brandSchema is predefined
    vendorKey: {
      type: String,
      enum: Object.values(VendorCodes),
      required: false,
    },
    integrationKey: {
      type: String,
      enum: Object.values(IntegrationKeys),
      required: false,
    },
    business: {
      type: String,
      required: false,
    },
    businessType: {
      type: String,
      required: false,
    },
    appData: { type: Schema.Types.Mixed }, // Mixed allows for dynamic structure
    promoBanners: [promoBannerSchema], // Assuming promoBannerSchema is predefined
    orderScheduleTime: { type: String, required: false },
    termOfService: { type: String, required: false },
    showOnHome: { type: Boolean, required: false, default: false },
    linked: { type: Boolean, required: false, default: false },
    refId: {
      type: Schema.Types.ObjectId,
      ref: "Customer", // Reference the base model
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

supplierSchema.virtual("refSupplier", {
  ref: "Customer",
  localField: "refId",
  foreignField: "_id",
  justOne: true,
});

const Supplier = Customer.discriminator<SupplierDoc>(
  "supplier",
  supplierSchema
);

export { SupplierDoc, Supplier };

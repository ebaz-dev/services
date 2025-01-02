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
}
const bannerSchema = new Schema<BannerDoc>(
  {
    file: {
      type: String,
      required: true,
    },
    type: {
      type: Number,
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
  business?: HoldingBusinessCodes;
  businessType?: HoldingBusinessTypeCodes;
  appData?: any;
  promoBanners?: PromoBannerDoc[];
  orderScheduleTime?: string;
  termOfService: string;
  showOnHome: boolean;
}

const Supplier = Customer.discriminator<SupplierDoc>(
  "supplier",
  new Schema({
    orderMin: Number,
    stockMin: Number,
    deliveryDays: { type: [Number], enum: [1, 2, 3, 4, 5, 6, 7] },
    holdingKey: { type: String, enum: Object.values(HoldingSupplierCodes) },
    code: String,
    banners: [bannerSchema],
    productQuery: productQuerySchema,
    productBanner: { type: String, require: false },
    infoBanner: { type: String, require: false },
    brands: [brandSchema],
    vendorKey: {
      type: String,
      enum: Object.values(VendorCodes),
      require: false,
    },
    integrationKey: {
      type: String,
      enum: Object.values(IntegrationKeys),
      require: false,
    },
    business: {
      type: String,
      enum: Object.values(HoldingBusinessCodes),
      require: false,
    },
    businessType: {
      type: String,
      enum: Object.values(HoldingBusinessTypeCodes),
      require: false,
    },
    appData: Object,
    promoBanners: [promoBannerSchema],
    orderScheduleTime: { type: String, require: false },
    termOfService: {
      type: String,
      require: false,
    },
    showOnHome: { type: Boolean, require: false, default: false },
  })
);

export { SupplierDoc, Supplier };

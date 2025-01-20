import { Document, Schema, Types, model } from "../../lib/mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum CustomerType {
  Supplier = "supplier",
  Merchant = "merchant",
}

export enum CustomerCode {
  Supplier = "SEB",
  Merchant = "MEB",
}

interface BankAccountDoc extends Document {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankId: Types.ObjectId;
}

const bankAccountSchema = new Schema<BankAccountDoc>(
  {
    accountNumber: {
      type: String,
      required: true,
    },
    accountName: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    bankId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Bank",
    },
  },
  { _id: false }
);

interface CustomerDoc extends Document {
  customerNo?: string;
  parentId?: Types.ObjectId;
  type: CustomerType;
  name: string;
  regNo?: string;
  categoryId?: Types.ObjectId;
  userId?: Types.ObjectId;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  bankAccounts?: BankAccountDoc[];
  cityId?: Types.ObjectId;
  districtId?: Types.ObjectId;
  subDistrictId?: Types.ObjectId;
  inactive?: boolean;
}

const customerSchema = new Schema<CustomerDoc>(
  {
    customerNo: {
      type: String,
      required: false,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Customer",
    },
    name: {
      type: String,
      required: true,
    },
    regNo: {
      type: String,
      required: false,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "CustomerCategory",
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    address: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    logo: { type: String, required: false },
    bankAccounts: [bankAccountSchema],
    cityId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Location",
    },
    districtId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Location",
    },
    subDistrictId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Location",
    },
    inactive: { type: Boolean, required: false, default: false },
  },
  {
    discriminatorKey: "type",
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

customerSchema.virtual("category", {
  ref: "CustomerCategory",
  localField: "categoryId",
  foreignField: "_id",
  justOne: true,
});
customerSchema.virtual("city", {
  ref: "Location",
  localField: "cityId",
  foreignField: "_id",
  justOne: true,
});
customerSchema.virtual("district", {
  ref: "Location",
  localField: "districtId",
  foreignField: "_id",
  justOne: true,
});
customerSchema.virtual("subDistrict", {
  ref: "Location",
  localField: "subDistrictId",
  foreignField: "_id",
  justOne: true,
});

customerSchema.set("versionKey", "version");
customerSchema.plugin(updateIfCurrentPlugin);

const Customer = model<CustomerDoc>("Customer", customerSchema);

export { CustomerDoc, Customer };

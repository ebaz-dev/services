import { Document, Schema, Types, model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
export enum CartStatus {
  Created = "created",
  Pending = "pending",
  Returned = "returned",
  Ordered = "ordered",
  Cancelled = "cancelled",
}

interface CartProductDoc extends Document {
  id: Types.ObjectId;
  quantity: number;
  name?: string;
  price?: number;
  totalPrice?: number;
  inCase?: number;
}
const cartProductSchema = new Schema<CartProductDoc>(
  {
    id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

interface CartDoc extends Document {
  status: CartStatus;
  supplierId: Types.ObjectId;
  merchantId: Types.ObjectId;
  userId: Types.ObjectId;
  products: CartProductDoc[];
  orderedAt: Date;
  deliveryDate: Date;
  returnedProducts?: string[];
}

const cartSchema = new Schema<CartDoc>(
  {
    status: { type: String, enum: Object.values(CartStatus), required: true },
    supplierId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    products: [cartProductSchema],
    orderedAt: Date,
    deliveryDate: Date,
    returnedProducts: [String]
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

cartSchema.set("versionKey", "version");
cartSchema.plugin(updateIfCurrentPlugin);

const Cart = model<CartDoc>("Cart", cartSchema);

export { CartDoc, Cart, CartProductDoc };

import { Document, Schema, Types, model } from "../../lib/mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum OrderStatus {
  Created = "created",
  Pending = "pending",
  Confirmed = "confirmed",
  Delivered = "delivered",
  Cancelled = "cancelled",
  Returned = "returned",
  ReOrdered = "reordered",
}

export enum PaymentMethods {
  Cash = "cash",
  QPay = "qpay",
  MBank = "mbank",
}

interface OrderProductDoc extends Document {
  id: Types.ObjectId;
  name: string;
  description?: string;
  images?: string[];
  price: number;
  basePrice?: number;
  quantity: number;
  giftQuantity?: number;
  inCase?: number;
  thirdPartyData: { customerId: Types.ObjectId; productId: number }[];
  promoId?: number;
  totalPrice?: number;
  splitSale: boolean;
  tierDiscountPrice?: number;
}
const orderProductSchema = new Schema<OrderProductDoc>(
  {
    id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    name: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
        required: false,
      },
    ],
    price: {
      type: Number,
      required: true,
    },
    basePrice: {
      type: Number,
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
    },
    giftQuantity: {
      type: Number,
      required: false,
    },
    inCase: {
      type: Number,
      required: false,
    },
    thirdPartyData: [
      {
        customerId: {
          type: Schema.Types.ObjectId,
          required: false,
          ref: "Customer",
        },
        productId: {
          type: Number,
          required: false,
        },
      },
    ],
    promoId: {
      type: Number,
      required: false,
    },
    splitSale: {
      type: Boolean,
      required: false,
    },
    tierDiscountPrice: {
      type: Number,
      required: false,
    },
  },
  { _id: false }
);

interface OrderThirdPartyDataDoc extends Document {
  thirdPartyId: string;
  updatedAt: Date;
  response: any[];
}

const orderThirdpartyDataSchema = new Schema<OrderThirdPartyDataDoc>(
  {
    thirdPartyId: { type: String, required: false },
    updatedAt: { type: Date, required: false },
    response: [Object],
  },
  {
    _id: false,
  }
);
// interface OrderPromoDoc extends Document {
//   id: string;
//   name: string;
//   startDate: string;
//   endDate: string;
//   promoNo: string;
//   tresholdAmount: number;
//   thresholdQuantity: number;
//   promoPercent: number;
//   giftQuantity: number;
//   isActive: boolean;
//   promoTypeId: number;
//   promoTypeName: string;
//   promoType: string;
//   giftProducts: any[];
//   giftProductPackages: any[];
// }

// const orderPromoSchema = new Schema<OrderPromoDoc>(
//   {
//     id: {
//       type: String,
//       required: true,
//     },
//     name: { type: String, required: true },
//     startDate: { type: String, required: false },
//     endDate: { type: String, required: false },
//     promoNo: { type: String, required: false },
//     tresholdAmount: { type: Number, required: false },
//     thresholdQuantity: { type: Number, required: false },
//     promoPercent: { type: Number, required: false },
//     giftQuantity: { type: Number, required: false },
//     isActive: { type: Boolean, required: false },
//     promoTypeId: { type: Number, required: false },
//     promoTypeName: { type: String, required: false },
//     promoType: { type: String, required: false },
//     giftProducts: [
//       { type: Schema.Types.ObjectId, ref: "Product", required: false },
//     ],
//     giftProductPackages: [{ type: Object, required: false }],
//   },
//   {
//     _id: false,
//   }
// );

interface OrderDoc extends Document {
  orderNo?: string;
  status: OrderStatus;
  supplierId: Types.ObjectId;
  merchantId: Types.ObjectId;
  userId: Types.ObjectId;
  cartId: Types.ObjectId;
  products: OrderProductDoc[];
  giftProducts: OrderProductDoc[];
  orderedAt: Date;
  deliveryDate: Date;
  deliveredAt: Date;
  paymentMethod: PaymentMethods;
  thirdPartyId: string;
  merchantDebt: number;
  thirdPartyData: OrderThirdPartyDataDoc;
  totalPrice?: number;
  tierDiscountPercent?: number;
  qualifiedPromos?: any[];
  tierDiscount?: any;
  refOrderId?: Types.ObjectId;
}

const orderSchema = new Schema<OrderDoc>(
  {
    orderNo: { type: String, required: false },
    status: { type: String, enum: Object.values(OrderStatus), required: true },
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
    cartId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Cart",
    },
    products: [orderProductSchema],
    giftProducts: [orderProductSchema],
    orderedAt: Date,
    deliveryDate: Date,
    deliveredAt: Date,
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethods),
      required: false,
    },
    thirdPartyId: { type: String, required: false },
    merchantDebt: {
      type: Number,
      required: false,
    },
    thirdPartyData: orderThirdpartyDataSchema,
    tierDiscountPercent: { type: Number, required: false, default: 0 },
    qualifiedPromos: [{ type: Object }],
    tierDiscount: Object,
    refOrderId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Order",
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
orderSchema.virtual("merchant", {
  ref: "Customer",
  localField: "merchantId",
  foreignField: "_id",
  justOne: true,
});
orderSchema.virtual("supplier", {
  ref: "Customer",
  localField: "supplierId",
  foreignField: "_id",
  justOne: true,
});

orderSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

orderSchema.virtual("cart", {
  ref: "Cart",
  localField: "cartId",
  foreignField: "_id",
  justOne: true,
});

orderSchema.virtual("productDetails", {
  ref: "Product",
  localField: "products.id",
  foreignField: "_id",
});

orderSchema.virtual("giftProductDetails", {
  ref: "Product",
  localField: "giftProducts.id",
  foreignField: "_id",
});

orderSchema.virtual("merchantCategory", {
  ref: "CustomerCategory",
  localField: "cartId",
  foreignField: "_id",
  justOne: true,
});

orderSchema.virtual("logs", {
  ref: "OrderLog",
  localField: "_id",
  foreignField: "orderId",
});

orderSchema.set("versionKey", "version");
orderSchema.plugin(updateIfCurrentPlugin);

const Order = model<OrderDoc>("Order", orderSchema);

export { OrderDoc, Order, OrderProductDoc, OrderThirdPartyDataDoc };

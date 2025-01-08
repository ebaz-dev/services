import { Document, Schema, model, Types } from "../../lib/mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
export interface InventoryProduct {
  id: Types.ObjectId;
  quantity: number;
}

enum CartStatus {
  Created = "created",
  Pending = "pending",
  Ordered = "ordered",
  Cancelled = "cancelled",
}

enum OrderStatus {
  Created = "created",
  Pending = "pending",
  Confirmed = "confirmed",
  Delivered = "delivered",
  Cancelled = "cancelled",
}

interface OrderInventoryDoc extends Document {
  _id: Types.ObjectId;
  supplierId?: Types.ObjectId;
  merchantId?: Types.ObjectId;
  cartId: Types.ObjectId;
  cartStatus?: CartStatus;
  orderId?: Types.ObjectId;
  orderStatus?: OrderStatus;
  products: InventoryProduct[];
}

const itemSchema = new Schema<InventoryProduct>(
  {
    id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderInventorySchema = new Schema<OrderInventoryDoc>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Customer",
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Customer",
    },
    cartId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Cart",
    },
    cartStatus: {
      type: String,
      required: false,
      enum: Object.values(CartStatus),
    },
    orderId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Order",
    },
    orderStatus: {
      type: String,
      required: false,
      enum: Object.values(OrderStatus),
    },
    products: {
      type: [itemSchema],
      validate: {
        validator: (value: InventoryProduct[]) => value.length > 0,
        message: "At least one item must be included in the order.",
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

orderInventorySchema.set("versionKey", "version");
orderInventorySchema.plugin(updateIfCurrentPlugin);

const OrderInventory = model<OrderInventoryDoc>(
  "OrderInventory",
  orderInventorySchema
);

export { OrderInventory };

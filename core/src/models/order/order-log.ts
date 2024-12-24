import { Document, Schema, Types, model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum OrderLogType {
  Status = "status",
  Payment = "payment",
  Supplier = "supplier",
}
export enum OrderActions {
  Created = "created",
  Updated = "updated",
  Confirmed = "confirmed",
  Delivered = "delivered",
  Cancelled = "cancelled",
}

interface OrderLogDoc extends Document {
  orderId: Types.ObjectId;
  author: {
    id?: Types.ObjectId;
    name?: string;
    phone?: string;
    email?: string;
  };
  type: OrderLogType;
  action: OrderActions;
  fields: { key: string; oldValue: string; newValue: string }[];
  description?: string;
}

const orderLogSchema = new Schema<OrderLogDoc>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Order",
    },
    author: {
      id: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: "User",
      },
      name: {
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
    },
    type: { type: String, enum: Object.values(OrderLogType), required: true },
    action: { type: String, enum: Object.values(OrderActions), required: true },
    fields: [
      {
        key: String,
        oldValue: String,
        newValue: String,
      },
    ],

    description: {
      type: String,
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
orderLogSchema.virtual("user", {
  ref: "User",
  localField: "author.id",
  foreignField: "_id",
  justOne: true,
});

orderLogSchema.set("versionKey", "version");
orderLogSchema.plugin(updateIfCurrentPlugin);

const OrderLog = model<OrderLogDoc>("OrderLog", orderLogSchema);

export { OrderLogDoc, OrderLog };
